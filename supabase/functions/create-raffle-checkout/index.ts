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

  try {
    const { raffleId, quantity, buyerName, buyerEmail, buyerPhone } = await req.json();

    if (!raffleId || !quantity || !buyerName || !buyerEmail) {
      throw new Error("Missing required fields: raffleId, quantity, buyerName, buyerEmail");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get the raffle details
    const { data: raffle, error: raffleError } = await supabaseAdmin
      .from("raffles")
      .select("*")
      .eq("id", raffleId)
      .eq("status", "active")
      .single();

    if (raffleError || !raffle) {
      throw new Error("Raffle not found or not active");
    }

    // Check ticket availability
    const { count: soldCount } = await supabaseAdmin
      .from("raffle_tickets")
      .select("*", { count: "exact", head: true })
      .eq("raffle_id", raffleId)
      .eq("payment_status", "paid");

    if (raffle.max_tickets && (soldCount || 0) + quantity > raffle.max_tickets) {
      throw new Error("Not enough tickets available");
    }

    // Get next ticket numbers
    const { data: lastTicket } = await supabaseAdmin
      .from("raffle_tickets")
      .select("ticket_number")
      .eq("raffle_id", raffleId)
      .order("ticket_number", { ascending: false })
      .limit(1);

    const startNumber = (lastTicket && lastTicket.length > 0 ? lastTicket[0].ticket_number : 0) + 1;

    // Create pending tickets
    const tickets = [];
    for (let i = 0; i < quantity; i++) {
      tickets.push({
        raffle_id: raffleId,
        buyer_name: buyerName,
        buyer_email: buyerEmail,
        buyer_phone: buyerPhone || null,
        ticket_number: startNumber + i,
        payment_status: "pending",
      });
    }

    const { data: insertedTickets, error: insertError } = await supabaseAdmin
      .from("raffle_tickets")
      .insert(tickets)
      .select();

    if (insertError) throw new Error("Failed to create tickets: " + insertError.message);

    // Create Stripe checkout
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const totalAmount = raffle.ticket_price_cents * quantity;

    const session = await stripe.checkout.sessions.create({
      customer_email: buyerEmail,
      line_items: [
        {
          price_data: {
            currency: raffle.currency || "gbp",
            product_data: {
              name: `${raffle.title} - Raffle Ticket${quantity > 1 ? "s" : ""}`,
              description: `${quantity} ticket${quantity > 1 ? "s" : ""} (Numbers: ${startNumber}-${startNumber + quantity - 1})`,
            },
            unit_amount: raffle.ticket_price_cents,
          },
          quantity: quantity,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/raffle?success=true&raffle=${raffleId}`,
      cancel_url: `${req.headers.get("origin")}/raffle?cancelled=true`,
      metadata: {
        raffle_id: raffleId,
        ticket_ids: insertedTickets!.map((t: any) => t.id).join(","),
      },
    });

    // Store the payment intent reference
    if (session.payment_intent) {
      for (const ticket of insertedTickets!) {
        await supabaseAdmin
          .from("raffle_tickets")
          .update({ stripe_payment_intent_id: session.id })
          .eq("id", ticket.id);
      }
    }

    return new Response(JSON.stringify({ url: session.url, ticketNumbers: tickets.map(t => t.ticket_number) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
