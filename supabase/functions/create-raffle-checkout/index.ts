import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

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

    const { raffleId, quantity, buyerName, buyerEmail, buyerPhone, chosenNumbers } = await req.json();

    if (!raffleId || !buyerName || !buyerEmail) {
      throw new Error("Missing required fields: raffleId, buyerName, buyerEmail");
    }

    const ticketCount = chosenNumbers?.length || quantity;
    if (!ticketCount || ticketCount < 1) {
      throw new Error("Must provide chosenNumbers or quantity");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get raffle details
    const { data: raffle, error: raffleError } = await supabaseAdmin
      .from("raffles")
      .select("*")
      .eq("id", raffleId)
      .eq("status", "active")
      .single();

    if (raffleError || !raffle) throw new Error("Raffle not found or not active");

    // Validate chosen numbers
    if (chosenNumbers && chosenNumbers.length > 0) {
      const range = raffle.number_range || raffle.max_tickets || 100;
      for (const num of chosenNumbers) {
        if (num < 1 || num > range) {
          throw new Error(`Number ${num} is outside the valid range (1-${range})`);
        }
      }

      const { data: existingTickets } = await supabaseAdmin
        .from("raffle_tickets")
        .select("ticket_number")
        .eq("raffle_id", raffleId)
        .in("payment_status", ["paid", "pending"])
        .in("ticket_number", chosenNumbers);

      if (existingTickets && existingTickets.length > 0) {
        const taken = existingTickets.map(t => t.ticket_number).join(", ");
        throw new Error(`Numbers already taken: ${taken}`);
      }
    }

    // Check ticket availability
    const { count: soldCount } = await supabaseAdmin
      .from("raffle_tickets")
      .select("*", { count: "exact", head: true })
      .eq("raffle_id", raffleId)
      .eq("payment_status", "paid");

    if (raffle.max_tickets && (soldCount || 0) + ticketCount > raffle.max_tickets) {
      throw new Error("Not enough tickets available");
    }

    // Determine ticket numbers
    let ticketNumbers: number[];
    if (chosenNumbers && chosenNumbers.length > 0) {
      ticketNumbers = chosenNumbers;
    } else {
      const { data: lastTicket } = await supabaseAdmin
        .from("raffle_tickets")
        .select("ticket_number")
        .eq("raffle_id", raffleId)
        .order("ticket_number", { ascending: false })
        .limit(1);

      const startNumber = (lastTicket && lastTicket.length > 0 ? lastTicket[0].ticket_number : 0) + 1;
      ticketNumbers = Array.from({ length: ticketCount }, (_, i) => startNumber + i);
    }

    // Create pending tickets
    const tickets = ticketNumbers.map(num => ({
      raffle_id: raffleId,
      buyer_name: buyerName,
      buyer_email: buyerEmail,
      buyer_phone: buyerPhone || null,
      ticket_number: num,
      payment_status: "pending",
    }));

    const { data: insertedTickets, error: insertError } = await supabaseAdmin
      .from("raffle_tickets")
      .insert(tickets)
      .select();

    if (insertError) throw new Error("Failed to create tickets: " + insertError.message);

    const totalAmountPence = raffle.ticket_price_cents * ticketCount;
    const numbersLabel = ticketNumbers.join(", ");
    const origin = req.headers.get("origin") || "https://pafc.lovable.app";

    // Create GoCardless Billing Request for one-off payment
    const brResponse = await gcPost("/billing_requests", {
      billing_requests: {
        payment_request: {
          description: `${raffle.title} - Ticket${ticketCount > 1 ? "s" : ""} (${numbersLabel})`,
          amount: totalAmountPence,
          currency: (raffle.currency || "gbp").toUpperCase(),
          metadata: {
            raffle_id: raffleId,
            ticket_ids: insertedTickets!.map((t: any) => t.id).join(","),
            type: "raffle",
          },
        },
      },
    }, gcToken);

    const billingRequestId = brResponse.billing_requests.id;

    // Create Billing Request Flow (hosted checkout page)
    const brfResponse = await gcPost("/billing_request_flows", {
      billing_request_flows: {
        redirect_uri: `${origin}/raffle?success=true&raffle=${raffleId}&br=${billingRequestId}`,
        exit_uri: `${origin}/raffle?cancelled=true`,
        links: {
          billing_request: billingRequestId,
        },
      },
    }, gcToken);

    const checkoutUrl = brfResponse.billing_request_flows.authorisation_url;

    // Store the billing request ID on tickets for later verification
    for (const ticket of insertedTickets!) {
      await supabaseAdmin
        .from("raffle_tickets")
        .update({ stripe_payment_intent_id: billingRequestId })
        .eq("id", ticket.id);
    }

    return new Response(JSON.stringify({ url: checkoutUrl, ticketNumbers }), {
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
