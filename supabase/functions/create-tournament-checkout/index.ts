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
    const { team_id } = await req.json();
    if (!team_id) throw new Error("team_id is required");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch team details
    const { data: team, error: teamError } = await supabaseAdmin
      .from("tournament_teams")
      .select("*, tournament_age_groups(tournament_id, age_group, tournaments(name, entry_fee_cents))")
      .eq("id", team_id)
      .single();

    if (teamError || !team) throw new Error("Team not found");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const origin = req.headers.get("origin") || "https://id-preview--c7af7566-8e05-4dbb-bbff-7d75c302c9e9.lovable.app";

    const session = await stripe.checkout.sessions.create({
      customer_email: team.manager_email,
      line_items: [
        {
          price: "price_1TEeV8C5z9v3Zf3be2soHQqF",
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/tournament?payment=success&team_id=${team_id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/tournament?payment=cancelled`,
      metadata: {
        team_id,
        type: "tournament_entry",
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
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
