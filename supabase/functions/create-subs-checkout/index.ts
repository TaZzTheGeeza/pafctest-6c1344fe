import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GC_API = "https://api.gocardless.com";

// Monthly amounts in pence
const TIER_AMOUNTS: Record<string, { amount: number; label: string }> = {
  standard: { amount: 3000, label: "Standard Subscription (£30/month)" },
  sibling: { amount: 5000, label: "Sibling Subscription (£50/month)" },
  coach: { amount: 2000, label: "Coach Subscription (£20/month)" },
};

async function gcPost(path: string, body: Record<string, unknown>, token: string) {
  const res = await fetch(`${GC_API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "GoCardless-Version": "2015-07-06",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

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
    const gcToken = Deno.env.get("GOCARDLESS_ACCESS_TOKEN");
    if (!gcToken) throw new Error("GOCARDLESS_ACCESS_TOKEN not set");

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    const body = await req.json().catch(() => ({}));
    const tier = body.tier || "standard";
    const tierConfig = TIER_AMOUNTS[tier];
    if (!tierConfig) throw new Error(`Invalid subscription tier: ${tier}`);

    // Server-side eligibility checks
    if (tier === "coach") {
      const { data: hasCoach } = await supabaseAdmin.rpc("has_role", { _user_id: user.id, _role: "coach" });
      const { data: hasAdmin } = await supabaseAdmin.rpc("has_role", { _user_id: user.id, _role: "admin" });
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

    const origin = req.headers.get("origin") || "https://pafc.lovable.app";

    // Create a Billing Request to set up a Direct Debit mandate for recurring payments
    const brResponse = await gcPost("/billing_requests", {
      billing_requests: {
        mandate_request: {
          scheme: "bacs",
          currency: "GBP",
          metadata: {
            user_id: user.id,
            tier,
            type: "monthly_subscription",
          },
        },
      },
    }, gcToken);

    const billingRequestId = brResponse.billing_requests.id;

    // Create Billing Request Flow
    const brfResponse = await gcPost("/billing_request_flows", {
      billing_request_flows: {
        redirect_uri: `${origin}/hub?tab=payments&subscription=success&br_id=${billingRequestId}&tier=${tier}`,
        exit_uri: `${origin}/hub?tab=payments`,
        prefilled_customer: {
          email: user.email,
        },
        links: {
          billing_request: billingRequestId,
        },
      },
    }, gcToken);

    return new Response(JSON.stringify({ url: brfResponse.billing_request_flows.authorisation_url }), {
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
