import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GC_API = "https://api.gocardless.com";

const TIER_AMOUNTS: Record<string, { amount: number; name: string }> = {
  standard: { amount: 3000, name: "PAFC Standard Subscription" },
  sibling: { amount: 5000, name: "PAFC Sibling Subscription" },
  coach: { amount: 2000, name: "PAFC Coach Subscription" },
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

  try {
    const gcToken = Deno.env.get("GOCARDLESS_ACCESS_TOKEN");
    if (!gcToken) throw new Error("GOCARDLESS_ACCESS_TOKEN not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    const { br_id, tier } = await req.json();
    if (!br_id) throw new Error("br_id is required");

    const tierConfig = TIER_AMOUNTS[tier || "standard"];
    if (!tierConfig) throw new Error("Invalid tier");

    // Get the billing request to find the mandate
    const brRes = await fetch(`${GC_API}/billing_requests/${br_id}`, {
      headers: {
        Authorization: `Bearer ${gcToken}`,
        "GoCardless-Version": "2015-07-06",
      },
    });
    const brData = await brRes.json();
    if (!brRes.ok) throw new Error(JSON.stringify(brData));

    const br = brData.billing_requests;
    if (br.status !== "fulfilled") {
      throw new Error("Mandate setup not yet completed");
    }

    const mandateId = br.links?.mandate;
    if (!mandateId) throw new Error("No mandate found on billing request");

    // Check if subscription already exists for this mandate
    const existSubRes = await fetch(`${GC_API}/subscriptions?mandate=${mandateId}&status=active`, {
      headers: {
        Authorization: `Bearer ${gcToken}`,
        "GoCardless-Version": "2015-07-06",
      },
    });
    const existSubData = await existSubRes.json();
    if (existSubData.subscriptions?.length > 0) {
      return new Response(JSON.stringify({ success: true, already_exists: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Anchor to 1st of next month
    const now = new Date();
    const nextFirst = new Date(Date.UTC(
      now.getUTCMonth() === 11 ? now.getUTCFullYear() + 1 : now.getUTCFullYear(),
      now.getUTCMonth() === 11 ? 0 : now.getUTCMonth() + 1,
      1
    ));
    const startDate = nextFirst.toISOString().split("T")[0];

    // Create the subscription
    const subResponse = await gcPost("/subscriptions", {
      subscriptions: {
        amount: tierConfig.amount,
        currency: "GBP",
        name: tierConfig.name,
        interval_unit: "monthly",
        day_of_month: 1,
        start_date: startDate,
        metadata: {
          user_id: user.id,
          tier,
        },
        links: {
          mandate: mandateId,
        },
      },
    }, gcToken);

    return new Response(JSON.stringify({ success: true, subscription_id: subResponse.subscriptions.id }), {
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
