import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2025-08-27.basil",
  });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    let event: Stripe.Event;
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      event = JSON.parse(body);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const ticketIds = session.metadata?.ticket_ids?.split(",") || [];
      const raffleId = session.metadata?.raffle_id;

      for (const ticketId of ticketIds) {
        await supabaseAdmin
          .from("raffle_tickets")
          .update({
            payment_status: "paid",
            stripe_payment_intent_id: session.payment_intent as string,
          })
          .eq("id", ticketId.trim());
      }

      // Check for auto-draw when sold out
      if (raffleId) {
        const { data: raffle } = await supabaseAdmin
          .from("raffles")
          .select("auto_draw_when_sold_out, number_range, status")
          .eq("id", raffleId)
          .single();

        if (raffle?.auto_draw_when_sold_out && raffle.number_range && raffle.status === "active") {
          const { data: paidTickets } = await supabaseAdmin
            .from("raffle_tickets")
            .select("id, ticket_number, buyer_name")
            .eq("raffle_id", raffleId)
            .eq("payment_status", "paid");

          if (paidTickets && paidTickets.length >= raffle.number_range) {
            // All numbers sold — auto-draw a winner
            const winnerIdx = Math.floor(Math.random() * paidTickets.length);
            const winner = paidTickets[winnerIdx];

            await supabaseAdmin
              .from("raffles")
              .update({
                status: "drawn",
                winner_name: winner.buyer_name,
                winner_ticket_id: winner.id,
                drawn_ticket_number: winner.ticket_number,
                draw_started_at: new Date().toISOString(),
              })
              .eq("id", raffleId);

            console.log(`Auto-draw complete for raffle ${raffleId}: winner ticket #${winner.ticket_number}`);
          }
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
