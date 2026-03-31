import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Fetch all customers
    const allCustomers: any[] = [];
    let hasMore = true;
    let startingAfter: string | undefined;
    while (hasMore) {
      const params: any = { limit: 100 };
      if (startingAfter) params.starting_after = startingAfter;
      const batch = await stripe.customers.list(params);
      allCustomers.push(...batch.data);
      hasMore = batch.has_more;
      if (batch.data.length > 0) startingAfter = batch.data[batch.data.length - 1].id;
    }

    // Fetch all subscriptions (active, past_due, canceled, trialing)
    const allSubscriptions: any[] = [];
    hasMore = true;
    startingAfter = undefined;
    for (const status of ["active", "past_due", "canceled", "trialing", "unpaid"] as const) {
      hasMore = true;
      startingAfter = undefined;
      while (hasMore) {
        const params: any = { limit: 100, status, expand: ["data.items.data.price"] };
        if (startingAfter) params.starting_after = startingAfter;
        const batch = await stripe.subscriptions.list(params);
        allSubscriptions.push(...batch.data);
        hasMore = batch.has_more;
        if (batch.data.length > 0) startingAfter = batch.data[batch.data.length - 1].id;
      }
    }

    // Fetch recent payments (last 90 days)
    const ninetyDaysAgo = Math.floor((Date.now() - 90 * 24 * 60 * 60 * 1000) / 1000);
    const allPayments: any[] = [];
    hasMore = true;
    startingAfter = undefined;
    while (hasMore) {
      const params: any = { limit: 100, created: { gte: ninetyDaysAgo } };
      if (startingAfter) params.starting_after = startingAfter;
      const batch = await stripe.paymentIntents.list(params);
      allPayments.push(...batch.data);
      hasMore = batch.has_more;
      if (batch.data.length > 0) startingAfter = batch.data[batch.data.length - 1].id;
    }

    // Build customer map
    const customerMap: Record<string, any> = {};
    for (const c of allCustomers) {
      customerMap[c.id] = { id: c.id, email: c.email, name: c.name };
    }

    // Build subscription data
    const subscriptions = allSubscriptions.map((s) => {
      console.log(`[SUB] id=${s.id} period_end=${s.current_period_end}`);
      return {
        id: s.id,
        customer_id: s.customer,
        customer_email: customerMap[s.customer as string]?.email || null,
        customer_name: customerMap[s.customer as string]?.name || null,
        status: s.status,
        current_period_start: s.current_period_start ? new Date(s.current_period_start * 1000).toISOString() : null,
        current_period_end: s.current_period_end ? new Date(s.current_period_end * 1000).toISOString() : null,
        cancel_at_period_end: s.cancel_at_period_end,
        amount_cents: s.items?.data?.[0]?.price?.unit_amount || 0,
        currency: s.items?.data?.[0]?.price?.currency || "gbp",
        interval: s.items?.data?.[0]?.price?.recurring?.interval || null,
        product_name: s.items?.data?.[0]?.price?.product || null,
        created: new Date(s.created * 1000).toISOString(),
      };
    });

    // Build payment data
    const payments = allPayments.map((p) => ({
      id: p.id,
      amount_cents: p.amount,
      currency: p.currency,
      status: p.status,
      customer_email: p.receipt_email || customerMap[p.customer as string]?.email || null,
      customer_name: customerMap[p.customer as string]?.name || null,
      description: p.description,
      created: new Date(p.created * 1000).toISOString(),
    }));

    // Summary stats
    const activeSubCount = subscriptions.filter((s) => s.status === "active").length;
    const pastDueCount = subscriptions.filter((s) => s.status === "past_due").length;
    const canceledCount = subscriptions.filter((s) => s.status === "canceled").length;
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
