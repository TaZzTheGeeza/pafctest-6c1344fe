import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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

    const { type, amountPence, donorName, donorEmail } = await req.json();

    if (!type || !["one_off", "monthly"].includes(type)) {
      throw new Error("type must be 'one_off' or 'monthly'");
    }
    if (!amountPence || amountPence < 100) {
      throw new Error("Minimum donation is £1.00");
    }
    if (!donorEmail) {
      throw new Error("Email is required");
    }

    const origin = req.headers.get("origin") || "https://pafc.lovable.app";

    const metadata: Record<string, string> = {
      type: type === "monthly" ? "donation_monthly" : "donation_one_off",
      donor_name: (donorName || "").slice(0, 50),
    };

    const billingRequestBody: Record<string, unknown> =
      type === "monthly"
        ? {
            billing_requests: {
              mandate_request: {
                scheme: "bacs",
                currency: "GBP",
                metadata: { ...metadata, amount_pence: String(amountPence) },
              },
            },
          }
        : {
            billing_requests: {
              payment_request: {
                description: `Donation to Peterborough Athletic FC`,
                amount: amountPence,
                currency: "GBP",
                metadata,
              },
            },
          };

    const brResponse = await gcPost("/billing_requests", billingRequestBody, gcToken);
    const billingRequestId = brResponse.billing_requests.id;

    const brfResponse = await gcPost(
      "/billing_request_flows",
      {
        billing_request_flows: {
          redirect_uri: `${origin}/?donation=success&type=${type}`,
          exit_uri: `${origin}/?donation=cancelled`,
          prefilled_customer: {
            email: donorEmail,
            ...(donorName ? { given_name: donorName.split(" ")[0], family_name: donorName.split(" ").slice(1).join(" ") || donorName.split(" ")[0] } : {}),
          },
          links: { billing_request: billingRequestId },
        },
      },
      gcToken
    );

    return new Response(
      JSON.stringify({ url: brfResponse.billing_request_flows.authorisation_url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Donation checkout error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
