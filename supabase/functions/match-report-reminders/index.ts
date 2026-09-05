import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// slug -> display name used on match_reports.team_name
const TEAMS: Record<string, string> = {
  "u6s": "U6",
  "u7s": "U7",
  "u8s-black": "U8 Black",
  "u8s-gold": "U8 Gold",
  "u9s-black": "U9 Black",
  "u9s-gold": "U9 Gold",
  "u10s": "U10",
  "u11s": "U11",
  "u12s-black": "U12 Black",
  "u12s-gold": "U12 Gold",
  "u12s-white": "U12 White",
  "u13s": "U13",
  "u14s-black": "U14 Black",
  "u14s-gold": "U14 Gold",
  "u15s": "U15",
};

/** Offset (minutes) of Europe/London at a given UTC instant. */
function londonOffsetMinutes(utc: Date): number {
  const tz = new Date(utc.toLocaleString("en-US", { timeZone: "Europe/London" }));
  const utcRef = new Date(utc.toLocaleString("en-US", { timeZone: "UTC" }));
  return Math.round((tz.getTime() - utcRef.getTime()) / 60000);
}

/** Parse dd/mm/yyyy + HH:MM as UK local time into a UTC Date. */
function parseKickoff(date: string, time: string): { iso: string; at: Date } | null {
  const [d, m, y] = (date || "").split("/");
  if (!d || !m || !y) return null;
  const year = y.length === 4 ? y : `20${y}`;
  const hhmm = /^\d{1,2}:\d{2}$/.test(time || "") ? time : "10:00";
  const [hh, mi] = hhmm.split(":");
  const naive = Date.UTC(+year, +m - 1, +d, +hh, +mi);
  const offset = londonOffsetMinutes(new Date(naive));
  return {
    iso: `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`,
    at: new Date(naive - offset * 60000),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const cronSecret = Deno.env.get("CRON_SECRET");
  const authHeader = req.headers.get("Authorization") || "";
  const bearer = authHeader.replace("Bearer ", "").trim();

  const isCron = !!cronSecret && bearer === cronSecret;
  const isServiceRole = !!serviceKey && bearer === serviceKey;
  if (!isCron && !isServiceRole) {
    if (!bearer) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims } = await userClient.auth.getClaims(bearer);
    const uid = claims?.claims?.sub as string | undefined;
    let isAdmin = false;
    if (uid) {
      const adm = createClient(supabaseUrl, serviceKey);
      const { data: roles } = await adm.from("user_roles").select("role").eq("user_id", uid);
      isAdmin = !!roles?.some((r: any) => r.role === "admin");
    }
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  try {
    const admin = createClient(supabaseUrl, serviceKey);
    const now = Date.now();

    const { data: cache } = await admin.from("fa_fixture_cache").select("team, fixtures, results");
    const { data: coaches } = await admin
      .from("team_members")
      .select("user_id, team_slug")
      .eq("role", "coach");
    const { data: reports } = await admin
      .from("match_reports")
      .select("team_name, opponent, match_date")
      .gte("match_date", new Date(now - 7 * 86400000).toISOString().slice(0, 10));

    const reportSet = new Set(
      (reports || []).map((r) => `${r.team_name}::${r.opponent}::${r.match_date}`),
    );

    const dayAgo = new Date(now - 24 * 3600 * 1000).toISOString();
    const { data: recent } = await admin
      .from("hub_notifications")
      .select("user_id, title")
      .eq("type", "match_report_reminder")
      .gte("created_at", dayAgo);
    const recentSet = new Set((recent || []).map((n) => `${n.user_id}::${n.title}`));

    // team display name -> slug
    const nameToSlug = new Map(Object.entries(TEAMS).map(([slug, name]) => [name, slug]));

    let sent = 0;
    const pushBatches: { userIds: string[]; title: string; message: string }[] = [];

    for (const row of cache || []) {
      const slug = nameToSlug.get(row.team as string);
      if (!slug) continue;
      const teamName = row.team as string;
      const entries = [
        ...((row.fixtures as any[]) || []),
        ...((row.results as any[]) || []),
      ];

      const teamCoaches = (coaches || []).filter((c) => c.team_slug === slug);
      if (teamCoaches.length === 0) continue;

      const seen = new Set<string>();
      for (const f of entries) {
        const parsed = parseKickoff(f?.date, f?.time);
        if (!parsed) continue;
        const elapsed = now - parsed.at.getTime();
        // Nudge from 2 hours after kick-off, for up to 8 hours (hourly cron).
        if (elapsed < 2 * 3600 * 1000 || elapsed > 10 * 3600 * 1000) continue;

        const isHome = String(f.homeTeam || "").includes("Peterborough Ath");
        const opponent = isHome ? f.awayTeam : f.homeTeam;
        if (!opponent) continue;
        const key = `${opponent}::${parsed.iso}`;
        if (seen.has(key)) continue;
        seen.add(key);

        if (reportSet.has(`${teamName}::${opponent}::${parsed.iso}`)) continue;

        const title = `Match report due: ${teamName} vs ${opponent}`;
        const message =
          `Your fixture against ${opponent} finished earlier today. ` +
          `Please submit the match report and Player of the Match in the Hub.`;

        const targets = teamCoaches
          .map((c) => c.user_id)
          .filter((uid) => !recentSet.has(`${uid}::${title}`));
        if (targets.length === 0) continue;

        const { error } = await admin.from("hub_notifications").insert(
          targets.map((uid) => ({
            user_id: uid,
            title,
            message,
            type: "match_report_reminder",
            team_slug: slug,
            link: `/hub?team=${slug}&tab=availability`,
          })),
        );
        if (error) {
          console.error("notification insert failed", error);
          continue;
        }
        targets.forEach((uid) => recentSet.add(`${uid}::${title}`));
        sent += targets.length;
        pushBatches.push({ userIds: targets, title, message });
      }
    }

    for (const batch of pushBatches) {
      try {
        await admin.functions.invoke("send-push-notification", {
          body: {
            userIds: batch.userIds,
            title: batch.title,
            message: batch.message,
            link: "/hub",
            tag: "match-report-reminder",
          },
        });
      } catch (err) {
        console.error("push failed", err);
      }
    }

    return new Response(JSON.stringify({ success: true, notificationsSent: sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("match-report-reminders failed:", err?.message || err);
    return new Response(JSON.stringify({ error: err?.message || "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
