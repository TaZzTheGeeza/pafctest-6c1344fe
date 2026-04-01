import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GC_API = "https://api.gocardless.com";

async function gcGet(path: string, token: string, params?: Record<string, string>) {
  const url = new URL(`${GC_API}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      "GoCardless-Version": "2015-07-06",
    },
  });
  const data = await res.json();
  if (!res.ok) {
    console.error("GoCardless API error:", path, JSON.stringify(data));
    throw new Error(JSON.stringify(data));
  }
  return data;
}

/** Paginate through all records for a given endpoint */
async function gcGetAll(path: string, token: string, key: string, params?: Record<string, string>): Promise<any[]> {
  const all: any[] = [];
  let after: string | undefined;
  while (true) {
    const p: Record<string, string> = { limit: "500", ...params };
    if (after) p.after = after;
    const data = await gcGet(path, token, p);
    const items = data[key] || [];
    all.push(...items);
    if (!data.meta?.cursors?.after || items.length === 0) break;
    after = data.meta.cursors.after;
  }
  return all;
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

    // Fetch all customers, mandates, subscriptions, and payments in parallel
    const [allCustomers, allMandates, activeSubscriptions, cancelledSubscriptions] = await Promise.all([
      gcGetAll("/customers", gcToken, "customers"),
      gcGetAll("/mandates", gcToken, "mandates"),
      gcGetAll("/subscriptions", gcToken, "subscriptions", { status: "active" }),
      gcGetAll("/subscriptions", gcToken, "subscriptions", { status: "cancelled" }),
    ]);

    const allSubscriptions = [...activeSubscriptions, ...cancelledSubscriptions];

    // Fetch payments for last 90 days
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const allPayments = await gcGetAll("/payments", gcToken, "payments", {
      "created_at[gte]": ninetyDaysAgo,
    });

    // Fetch payouts
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    let allPayouts: any[] = [];
    try {
      allPayouts = await gcGetAll("/payouts", gcToken, "payouts", {
        "created_at[gte]": thirtyDaysAgo,
      });
    } catch {
      // payouts endpoint may not be available
    }

    // Build customer map: id -> { email, name }
    const customerMap: Record<string, { email: string; name: string }> = {};
    for (const c of allCustomers) {
      customerMap[c.id] = {
        email: c.email || "",
        name: `${c.given_name || ""} ${c.family_name || ""}`.trim(),
      };
    }

    // Build mandate -> customer map
    const mandateCustomerMap: Record<string, string> = {};
    for (const m of allMandates) {
      if (m.links?.customer) {
        mandateCustomerMap[m.id] = m.links.customer;
      }
    }

    // Helper to resolve customer from various link types
    function resolveCustomer(links: any): { email: string | null; name: string | null } {
      let custId = links?.customer;
      if (!custId && links?.mandate) {
        custId = mandateCustomerMap[links.mandate];
      }
      if (custId && customerMap[custId]) {
        return { email: customerMap[custId].email, name: customerMap[custId].name };
      }
      return { email: null, name: null };
    }

    // Build subscription data
    const subscriptions = allSubscriptions.map((s: any) => {
      const cust = resolveCustomer(s.links);
      return {
        id: s.id,
        customer_id: s.links?.customer,
        customer_email: cust.email,
        customer_name: cust.name,
        status: s.status,
        current_period_start: s.start_date,
        current_period_end: s.upcoming_payments?.[0]?.charge_date || null,
        cancel_at_period_end: false,
        amount_cents: s.amount,
        currency: s.currency || "GBP",
        interval: s.interval_unit,
        product_name: s.name || null,
        created: s.created_at,
      };
    });

    // Build payment data with proper status mapping and customer resolution
    const payments = allPayments.map((p: any) => {
      const cust = resolveCustomer(p.links);
      return {
        id: p.id,
        amount_cents: p.amount,
        currency: p.currency || "GBP",
        status: p.status,
        customer_email: cust.email,
        customer_name: cust.name,
        description: p.description,
        created: p.created_at,
        charge_date: p.charge_date || null,
      };
    });

    // Compute financial summary stats
    const activeSubCount = subscriptions.filter((s) => s.status === "active").length;
    const pastDueCount = subscriptions.filter((s) => s.status === "past_due").length;
    const canceledCount = subscriptions.filter((s) => s.status === "cancelled").length;

    // Payment status breakdowns
    const pendingPayments = allPayments
      .filter((p: any) => ["pending_submission", "submitted", "pending_customer_approval"].includes(p.status))
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

    const confirmedPayments = allPayments
      .filter((p: any) => p.status === "confirmed")
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

    const paidOutPayments = allPayments
      .filter((p: any) => p.status === "paid_out")
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

    const failedPayments = allPayments.filter((p: any) =>
      ["failed", "cancelled", "customer_approval_denied", "charged_back"].includes(p.status)
    );

    const totalRevenue = allPayments
      .filter((p: any) => ["confirmed", "paid_out"].includes(p.status))
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

    // Payouts summary
    const pendingPayouts = allPayouts
      .filter((p: any) => p.status === "pending")
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

    // Collected payments by day (last 30 days) for chart
    // Use charge_date (the date GC actually collects) to match GoCardless dashboard
    const thirtyDaysAgoDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgoKey = thirtyDaysAgoDate.toISOString().slice(0, 10);
    const dailyCollected: Record<string, number> = {};
    for (const p of allPayments) {
      // GoCardless "collected" = confirmed or paid_out
      if (["confirmed", "paid_out"].includes(p.status)) {
        // Use charge_date if available, fall back to created_at
        const key = p.charge_date || new Date(p.created_at).toISOString().slice(0, 10);
        if (key >= thirtyDaysAgoKey) {
          dailyCollected[key] = (dailyCollected[key] || 0) + (p.amount || 0);
        }
      }
    }

    // Also compute the collected total for the chart header to match GC dashboard
    const collectedTotal = Object.values(dailyCollected).reduce((a, b) => a + b, 0);

    // Fill in missing days
    const chartData: { date: string; amount_cents: number }[] = [];
    for (let i = 30; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      chartData.push({ date: key, amount_cents: dailyCollected[key] || 0 });
    }

    return new Response(
      JSON.stringify({
        summary: {
          active_subscriptions: activeSubCount,
          past_due: pastDueCount,
          canceled: canceledCount,
          total_customers: allCustomers.length,
          revenue_last_90_days_cents: totalRevenue,
          collected_last_30_days_cents: collectedTotal,
          pending_payments_cents: pendingPayments,
          confirmed_funds_cents: confirmedPayments,
          paid_out_cents: paidOutPayments,
          pending_payouts_cents: pendingPayouts,
          failed_payment_count: failedPayments.length,
          failed_payment_total_cents: failedPayments.reduce((s: number, p: any) => s + (p.amount || 0), 0),
          currency: "GBP",
        },
        subscriptions,
        payments,
        chart_data: chartData,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("stripe-payments-board error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: error instanceof Error && msg.includes("Unauthorized") ? 403 : 500,
    });
  }
});
