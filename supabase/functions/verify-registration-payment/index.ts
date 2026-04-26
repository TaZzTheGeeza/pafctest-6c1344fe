import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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

// Statuses on a GoCardless billing request that mean the parent has completed
// the mandate setup and authorised the payment.
const COMPLETED_STATUSES = new Set([
  "fulfilled",
  "fulfilling",
]);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const gcToken = Deno.env.get("GOCARDLESS_ACCESS_TOKEN");
    if (!gcToken) throw new Error("GOCARDLESS_ACCESS_TOKEN not set");

    const { registrationId } = await req.json();
    if (!registrationId) {
      return new Response(JSON.stringify({ error: "registrationId required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: reg, error: regError } = await supabase
      .from("player_registrations")
      .select("id, payment_status, gocardless_billing_request_id")
      .eq("id", registrationId)
      .maybeSingle();

    if (regError) throw regError;
    if (!reg) {
      return new Response(JSON.stringify({ error: "Registration not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    if (reg.payment_status === "paid") {
      return new Response(JSON.stringify({ status: "paid" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!reg.gocardless_billing_request_id) {
      return new Response(JSON.stringify({ status: reg.payment_status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Look up the billing request in GoCardless to confirm payment was authorised.
    const br = await gcGet(`/billing_requests/${reg.gocardless_billing_request_id}`, gcToken);
    const status = br?.billing_requests?.status as string | undefined;

    if (status && COMPLETED_STATUSES.has(status)) {
      await supabase
        .from("player_registrations")
        .update({ payment_status: "paid", paid_at: new Date().toISOString() })
        .eq("id", registrationId);

      return new Response(JSON.stringify({ status: "paid" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ status: status || "pending" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
