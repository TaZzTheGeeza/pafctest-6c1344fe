import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GC_API = "https://api.gocardless.com";

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

    const { email, childName, registrationId } = await req.json();
    if (!email || !childName) {
      return new Response(JSON.stringify({ error: "Email and child name are required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const origin = req.headers.get("origin") || "https://pafc.lovable.app";

    // Create GoCardless Billing Request for £40 one-off payment
    const brResponse = await gcPost("/billing_requests", {
      billing_requests: {
        payment_request: {
          description: `Player Registration 2026/27 - ${childName}`,
          amount: 4000, // £40 in pence
          currency: "GBP",
          metadata: {
            child_name: childName,
            type: "player_registration",
            registration_id: registrationId || "",
          },
        },
      },
    }, gcToken);

    const billingRequestId = brResponse.billing_requests.id;

    // Persist the billing request id on the registration so we can verify it later.
    if (registrationId) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      await supabase
        .from("player_registrations")
        .update({ gocardless_billing_request_id: billingRequestId })
        .eq("id", registrationId);
    }

    // Create Billing Request Flow — include registration id in the redirect so we can verify on return.
    const successUrl = registrationId
      ? `${origin}/register?status=success&rid=${registrationId}`
      : `${origin}/register?status=success`;
    const cancelUrl = registrationId
      ? `${origin}/register?status=cancelled&rid=${registrationId}`
      : `${origin}/register?status=cancelled`;

    const brfResponse = await gcPost("/billing_request_flows", {
      billing_request_flows: {
        redirect_uri: successUrl,
        exit_uri: cancelUrl,
        prefilled_customer: {
          email,
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
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
