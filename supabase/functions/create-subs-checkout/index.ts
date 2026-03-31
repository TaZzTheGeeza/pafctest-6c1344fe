import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRICE_IDS: Record<string, string> = {
  standard: "price_1TGmyECLdtMESt0qp7LHFeIF",   // £30/month
  sibling:  "price_1TH8xfCLdtMESt0q6WVBbswR",    // £50/month (2 children)
  coach:    "price_1TH8xgCLdtMESt0qjzzLyWez",    // £20/month
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    const body = await req.json().catch(() => ({}));
    const tier = body.tier || "standard";
    const priceId = PRICE_IDS[tier];
    if (!priceId) throw new Error(`Invalid subscription tier: ${tier}`);

    // ── Server-side eligibility checks ──
    if (tier === "coach") {
      const { data: hasCoach } = await supabaseAdmin.rpc("has_role", {
        _user_id: user.id,
        _role: "coach",
      });
      const { data: hasAdmin } = await supabaseAdmin.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      if (!hasCoach && !hasAdmin) {
        return new Response(
          JSON.stringify({ error: "Coach discount is only available to coaches" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
        );
      }
    }

    if (tier === "sibling") {
      const { count } = await supabaseAdmin
        .from("guardians")
        .select("*", { count: "exact", head: true })
        .eq("parent_user_id", user.id)
        .eq("status", "active");
      if ((count ?? 0) < 2) {
        return new Response(
          JSON.stringify({ error: "Sibling discount requires 2 or more children registered at the club" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
        );
      }
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });

    // Check for existing customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;

      // Check if already subscribed
      const subs = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 1 });
      if (subs.data.length > 0) {
        return new Response(JSON.stringify({ error: "You already have an active subscription" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
    }

    // Anchor all subscriptions to the 1st of each month
    const now = new Date();
    const nextFirst = new Date(Date.UTC(
      now.getUTCMonth() === 11 ? now.getUTCFullYear() + 1 : now.getUTCFullYear(),
      now.getUTCMonth() === 11 ? 0 : now.getUTCMonth() + 1,
      1, 0, 0, 0
    ));
    const billingAnchor = Math.floor(nextFirst.getTime() / 1000);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      subscription_data: {
        billing_cycle_anchor: billingAnchor,
        proration_behavior: "create_prorations",
      },
      success_url: `${req.headers.get("origin")}/hub?tab=payments&subscription=success`,
      cancel_url: `${req.headers.get("origin")}/hub?tab=payments`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
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
