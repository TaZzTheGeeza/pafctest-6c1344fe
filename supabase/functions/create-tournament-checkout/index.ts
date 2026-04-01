import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

    const entryFeeCents = team.tournament_age_groups?.tournaments?.entry_fee_cents || 4000;
    const tournamentName = team.tournament_age_groups?.tournaments?.name || "Tournament";

    const origin = req.headers.get("origin") || "https://pafc.lovable.app";

    // Create GoCardless Billing Request
    const brResponse = await gcPost("/billing_requests", {
      billing_requests: {
        payment_request: {
          description: `${tournamentName} Entry - ${team.team_name}`,
          amount: entryFeeCents,
          currency: "GBP",
          metadata: {
            team_id,
            type: "tournament_entry",
          },
        },
      },
    }, gcToken);

    const billingRequestId = brResponse.billing_requests.id;

    // Create Billing Request Flow
    const brfResponse = await gcPost("/billing_request_flows", {
      billing_request_flows: {
        redirect_uri: `${origin}/tournament?payment=success&team_id=${team_id}&br_id=${billingRequestId}`,
        exit_uri: `${origin}/tournament?payment=cancelled`,
        prefilled_customer: {
          email: team.manager_email,
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
