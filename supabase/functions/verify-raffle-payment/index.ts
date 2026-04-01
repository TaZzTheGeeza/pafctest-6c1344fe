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

    const { billingRequestId } = await req.json();
    if (!billingRequestId) throw new Error("Missing billingRequestId");

    // Check billing request status
    const res = await fetch(`${GC_API}/billing_requests/${billingRequestId}`, {
      headers: {
        Authorization: `Bearer ${gcToken}`,
        "GoCardless-Version": "2015-07-06",
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data));

    const br = data.billing_requests;
    const status = br.status; // pending, ready_to_fulfil, fulfilling, fulfilled, cancelled

    if (status === "fulfilled" || status === "ready_to_fulfil") {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      // Find tickets linked to this billing request
      const { data: tickets } = await supabaseAdmin
        .from("raffle_tickets")
        .select("id")
        .eq("stripe_payment_intent_id", billingRequestId)
        .eq("payment_status", "pending");

      if (tickets && tickets.length > 0) {
        for (const ticket of tickets) {
          await supabaseAdmin
            .from("raffle_tickets")
            .update({ payment_status: "paid" })
            .eq("id", ticket.id);
        }
      }

      return new Response(JSON.stringify({ status: "paid" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ status: status === "cancelled" ? "cancelled" : "pending" }), {
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
