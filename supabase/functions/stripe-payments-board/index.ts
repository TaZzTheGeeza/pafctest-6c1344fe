import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GC_API = "https://api.gocardless.com";

async function gcGet(path: string, token: string) {
  const res = await fetch(`${GC_API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "GoCardless-Version": "2015-07-06",
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");

    // Check if user has admin or treasurer role
    const { data: roles } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id);
    
    const userRoles = roles?.map((r: any) => r.role) || [];
    if (!userRoles.includes("admin") && !userRoles.includes("treasurer")) {
      throw new Error("Unauthorized: admin or treasurer role required");
    }

    const gcToken = Deno.env.get("GOCARDLESS_ACCESS_TOKEN");
    if (!gcToken) throw new Error("GOCARDLESS_ACCESS_TOKEN not set");

    // Fetch customers
    const customersData = await gcGet("/customers?limit=500", gcToken);
    const allCustomers = customersData.customers || [];

    // Fetch subscriptions (active + cancelled)
    const activeSubsData = await gcGet("/subscriptions?status=active&limit=500", gcToken);
    const cancelledSubsData = await gcGet("/subscriptions?status=cancelled&limit=500", gcToken);
    const allSubscriptions = [
      ...(activeSubsData.subscriptions || []),
      ...(cancelledSubsData.subscriptions || []),
    ];

    // Fetch recent payments (last 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const paymentsData = await gcGet(`/payments?created_at[gte]=${ninetyDaysAgo}&limit=500`, gcToken);
    const allPayments = paymentsData.payments || [];

    // Build customer map
    const customerMap: Record<string, any> = {};
    for (const c of allCustomers) {
      customerMap[c.id] = { id: c.id, email: c.email, name: `${c.given_name || ""} ${c.family_name || ""}`.trim() };
    }

    // Build subscription data
    const subscriptions = allSubscriptions.map((s: any) => ({
      id: s.id,
      customer_id: s.links?.customer,
      customer_email: customerMap[s.links?.customer]?.email || null,
      customer_name: customerMap[s.links?.customer]?.name || null,
      status: s.status,
      current_period_start: s.start_date,
      current_period_end: s.upcoming_payments?.[0]?.charge_date || null,
      cancel_at_period_end: false,
      amount_cents: s.amount,
      currency: s.currency || "gbp",
      interval: s.interval_unit,
      product_name: s.name || null,
      created: s.created_at,
    }));

    // Build payment data
    const payments = allPayments.map((p: any) => ({
      id: p.id,
      amount_cents: p.amount,
      currency: p.currency || "gbp",
      status: p.status === "confirmed" || p.status === "paid_out" ? "succeeded" : p.status,
      customer_email: customerMap[p.links?.customer]?.email || null,
      customer_name: customerMap[p.links?.customer]?.name || null,
      description: p.description,
      created: p.created_at,
    }));

    // Summary stats
    const activeSubCount = subscriptions.filter((s) => s.status === "active").length;
    const pastDueCount = subscriptions.filter((s) => s.status === "past_due").length;
    const canceledCount = subscriptions.filter((s) => s.status === "cancelled").length;
    const totalRevenue = payments
      .filter((p) => p.status === "succeeded")
      .reduce((sum, p) => sum + p.amount_cents, 0);

    return new Response(
      JSON.stringify({
        summary: {
          active_subscriptions: activeSubCount,
          past_due: pastDueCount,
          canceled: canceledCount,
          total_customers: allCustomers.length,
          revenue_last_90_days_cents: totalRevenue,
          currency: "gbp",
        },
        subscriptions,
        payments,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: error instanceof Error && msg.includes("Unauthorized") ? 403 : 500,
    });
  }
});
