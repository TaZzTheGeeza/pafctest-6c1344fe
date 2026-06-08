import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { z } from "npm:zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const playerSchema = z.object({
  player_name: z.string().trim().min(1).max(100),
  date_of_birth: z.string().trim().min(4).max(20),
});

const bodySchema = z.object({
  age_group_id: z.string().uuid(),
  team_name: z.string().trim().min(1).max(120),
  manager_name: z.string().trim().min(1).max(120),
  manager_email: z.string().trim().email().max(255),
  manager_phone: z.string().trim().max(40).nullable().optional(),
  club_name: z.string().trim().min(1).max(160),
  county: z.string().trim().min(1).max(80),
  club_org_id: z.string().trim().max(80).nullable().optional(),
  secretary_name: z.string().trim().max(120).nullable().optional(),
  secretary_email: z.string().trim().email().max(255).nullable().optional().or(z.literal("")),
  secretary_phone: z.string().trim().max(40).nullable().optional(),
  league_division: z.string().trim().max(120).nullable().optional(),
  team_category: z.string().trim().max(40).nullable().optional(),
  whatsapp_contacts: z
    .array(z.object({ name: z.string().trim().max(120), number: z.string().trim().max(40) }))
    .max(5)
    .optional(),
  consent_rules: z.boolean(),
  consent_photography: z.boolean(),
  players: z.array(playerSchema).max(25),
});

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input", details: parsed.error.flatten() }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const data = parsed.data;
    if (!data.consent_rules || !data.consent_photography) {
      return new Response(JSON.stringify({ error: "Consent required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Verify age group exists & tournament is accepting entries
    const { data: ageGroup, error: agErr } = await admin
      .from("tournament_age_groups")
      .select("id, tournament_id, tournaments(status, entries_open)")
      .eq("id", data.age_group_id)
      .maybeSingle();
    if (agErr || !ageGroup) {
      return new Response(JSON.stringify({ error: "Invalid age group" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const tournamentRow: any = (ageGroup as any).tournaments;
    if (tournamentRow && tournamentRow.entries_open === false) {
      return new Response(JSON.stringify({ error: "Tournament entries are closed" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const players = data.players.filter((p) => p.player_name && p.date_of_birth);

    const { data: team, error: teamErr } = await admin
      .from("tournament_teams")
      .insert({
        age_group_id: data.age_group_id,
        team_name: data.team_name,
        manager_name: data.manager_name,
        manager_email: data.manager_email,
        manager_phone: data.manager_phone || null,
        player_count: players.length,
        status: "pending",
        club_name: data.club_name,
        county: data.county,
        club_org_id: data.club_org_id || null,
        secretary_name: data.secretary_name || null,
        secretary_email: data.secretary_email || null,
        secretary_phone: data.secretary_phone || null,
        league_division: data.league_division || null,
        team_category: data.team_category || null,
        whatsapp_contacts: data.whatsapp_contacts ?? [],
        consent_rules: data.consent_rules,
        consent_photography: data.consent_photography,
      })
      .select("id")
      .single();

    if (teamErr || !team) {
      return new Response(JSON.stringify({ error: teamErr?.message || "Failed to register team" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (players.length > 0) {
      const { error: playerErr } = await admin
        .from("tournament_team_players")
        .insert(players.map((p) => ({ team_id: team.id, player_name: p.player_name, date_of_birth: p.date_of_birth })));
      if (playerErr) console.error("player insert failed:", playerErr);
    }

    return new Response(JSON.stringify({ success: true, team_id: team.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("register-tournament-team error", err);
    return new Response(JSON.stringify({ error: (err as Error).message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
