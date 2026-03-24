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
    const { session_id, team_id } = await req.json();
    if (!session_id || !team_id) throw new Error("session_id and team_id are required");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ success: false, error: "Payment not completed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Verify metadata matches
    if (session.metadata?.team_id !== team_id) {
      throw new Error("Payment metadata mismatch");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get the team's age_group_id
    const { data: team, error: teamError } = await supabaseAdmin
      .from("tournament_teams")
      .select("age_group_id, status")
      .eq("id", team_id)
      .single();

    if (teamError || !team) throw new Error("Team not found");

    // Already confirmed? Skip
    if (team.status === "confirmed") {
      return new Response(JSON.stringify({ success: true, already_confirmed: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get available groups for this age group
    const { data: groups, error: groupsError } = await supabaseAdmin
      .from("tournament_groups")
      .select("id")
      .eq("age_group_id", team.age_group_id);

    let assignedGroupId: string | null = null;

    if (groups && groups.length > 0) {
      // Count teams per group to find the one with fewest teams
      const groupCounts = await Promise.all(
        groups.map(async (g) => {
          const { count } = await supabaseAdmin
            .from("tournament_teams")
            .select("id", { count: "exact", head: true })
            .eq("group_id", g.id)
            .eq("status", "confirmed");
          return { id: g.id, count: count || 0 };
        })
      );

      // Find groups with the minimum number of teams
      const minCount = Math.min(...groupCounts.map(g => g.count));
      const candidates = groupCounts.filter(g => g.count === minCount);

      // Pick a random one from the candidates with fewest teams
      assignedGroupId = candidates[Math.floor(Math.random() * candidates.length)].id;
    }

    // Update team: confirm and assign group
    const { error: updateError } = await supabaseAdmin
      .from("tournament_teams")
      .update({
        status: "confirmed",
        group_id: assignedGroupId,
      })
      .eq("id", team_id);

    if (updateError) throw new Error("Failed to update team status");

    return new Response(JSON.stringify({ success: true, group_id: assignedGroupId }), {
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
