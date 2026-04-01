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

    const { br_id, team_id } = await req.json();
    if (!br_id || !team_id) throw new Error("br_id and team_id are required");

    // Check billing request status
    const res = await fetch(`${GC_API}/billing_requests/${br_id}`, {
      headers: {
        Authorization: `Bearer ${gcToken}`,
        "GoCardless-Version": "2015-07-06",
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data));

    const br = data.billing_requests;

    if (br.status !== "fulfilled" && br.status !== "ready_to_fulfil") {
      return new Response(JSON.stringify({ success: false, error: "Payment not completed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Verify metadata matches
    const meta = br.payment_request?.metadata || {};
    if (meta.team_id !== team_id) {
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

    if (team.status === "confirmed") {
      return new Response(JSON.stringify({ success: true, already_confirmed: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get available groups for this age group
    const { data: groups } = await supabaseAdmin
      .from("tournament_groups")
      .select("id")
      .eq("age_group_id", team.age_group_id);

    let assignedGroupId: string | null = null;

    if (groups && groups.length > 0) {
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

      const minCount = Math.min(...groupCounts.map(g => g.count));
      const candidates = groupCounts.filter(g => g.count === minCount);
      assignedGroupId = candidates[Math.floor(Math.random() * candidates.length)].id;
    }

    const { error: updateError } = await supabaseAdmin
      .from("tournament_teams")
      .update({ status: "confirmed", group_id: assignedGroupId })
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
