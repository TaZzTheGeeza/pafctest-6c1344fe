import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GC_API = "https://api.gocardless.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const gcToken = Deno.env.get("GOCARDLESS_ACCESS_TOKEN");
    if (!gcToken) throw new Error("GOCARDLESS_ACCESS_TOKEN not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");

    // Search GoCardless customers by email
    const custRes = await fetch(`${GC_API}/customers?email=${encodeURIComponent(user.email)}`, {
      headers: {
        Authorization: `Bearer ${gcToken}`,
        "GoCardless-Version": "2015-07-06",
      },
    });
    const custData = await custRes.json();
    if (!custRes.ok) throw new Error(JSON.stringify(custData));

    const customers = custData.customers || [];
    if (customers.length === 0) throw new Error("No payment account found");

    const customerId = customers[0].id;

    // Get active subscriptions for this customer
    const subRes = await fetch(`${GC_API}/subscriptions?customer=${customerId}&status=active`, {
      headers: {
        Authorization: `Bearer ${gcToken}`,
        "GoCardless-Version": "2015-07-06",
      },
    });
    const subData = await subRes.json();
    if (!subRes.ok) throw new Error(JSON.stringify(subData));

    const subscriptions = subData.subscriptions || [];

    // GoCardless doesn't have a hosted portal like Stripe.
    // We return subscription details so the frontend can display them,
    // and provide a cancel action if needed.
    return new Response(JSON.stringify({
      customer_id: customerId,
      subscriptions: subscriptions.map((s: any) => ({
        id: s.id,
        amount: s.amount,
        currency: s.currency,
        status: s.status,
        name: s.name,
        interval: `${s.interval_unit}`,
        start_date: s.start_date,
        upcoming_payments: s.upcoming_payments?.slice(0, 3) || [],
      })),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
