import { createClient } from "npm:@supabase/supabase-js@2";
import { fetchFaHtml } from "../_shared/faFetch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CLUB_NAME = "Peterborough Ath";
const ALLOWED_HOST = "fulltime.thefa.com";

interface FAFixture {
  date: string; // dd/mm/yy
  time: string; // HH:MM
  homeTeam: string;
  awayTeam: string;
  venue: string;
  competition: string;
}

interface TeamInput {
  team: string;
  slug: string;
  fixtureUrl: string;
}

function parseFixturesPage(html: string): FAFixture[] {
  const fixtures: FAFixture[] = [];
  const tableMatch = html.match(
    /<div class="fixtures-table[^"]*"[^>]*>[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/,
  );
  if (!tableMatch) return fixtures;

  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
  let rowMatch;
  while ((rowMatch = rowRegex.exec(tableMatch[1])) !== null) {
    const row = rowMatch[1];
    const dateTimeMatch = row.match(
      /<td class="left cell-divider">[\s\S]*?<span>([^<]+)<\/span>\s*<span[^>]*>([^<]+)<\/span>/,
    );
    if (!dateTimeMatch) continue;
    const homeMatch = row.match(
      /<td class="home-team right">[\s\S]*?<a[^>]*>\s*([\s\S]*?)\s*<\/a>/,
    );
    const awayMatch = row.match(
      /<td class="road-team left cell-divider">[\s\S]*?<a[^>]*>\s*([\s\S]*?)\s*<\/a>/,
    );
    if (!homeMatch || !awayMatch) continue;

    const cellDividerRegex = /<td class="left cell-divider">([\s\S]*?)<\/td>/g;
    const cells: string[] = [];
    let cellMatch;
    while ((cellMatch = cellDividerRegex.exec(row)) !== null) {
      cells.push(cellMatch[1].replace(/<[^>]+>/g, "").trim());
    }

    fixtures.push({
      date: dateTimeMatch[1].trim(),
      time: dateTimeMatch[2].trim(),
      homeTeam: homeMatch[1].replace(/<[^>]+>/g, "").trim(),
      awayTeam: awayMatch[1].replace(/<[^>]+>/g, "").trim(),
      venue: cells.length >= 2 ? cells[1] : "",
      competition: cells.length >= 3 ? cells[2] : "",
    });
  }
  return fixtures;
}

/** Convert a UK local date/time (dd/mm/yy + HH:MM) into a UTC Date. */
function ukLocalToUtc(date: string, time: string): Date | null {
  const dm = date.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (!dm) return null;
  const dd = Number(dm[1]);
  const mm = Number(dm[2]);
  const yy = Number(dm[3]) < 100 ? 2000 + Number(dm[3]) : Number(dm[3]);
  let hh = 10, mi = 30;
  const tm = time?.match(/(\d{1,2}):(\d{2})/);
  if (tm) {
    hh = Number(tm[1]);
    mi = Number(tm[2]);
  }
  // Start from the naive UTC instant, then correct by the London offset at that moment.
  const naive = Date.UTC(yy, mm - 1, dd, hh, mi, 0);
  const guess = new Date(naive);
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(guess).filter((p) => p.type !== "literal").map((p) => [p.type, Number(p.value)]),
  ) as Record<string, number>;
  const asLondon = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
  const offset = asLondon - naive; // ms London is ahead of UTC
  return new Date(naive - offset);
}

function formatForAge(slug: string): "5v5" | "7v7" | "9v9" | "11v11" | null {
  const s = slug.toLowerCase();
  if (s.startsWith("u8") || s.startsWith("u9")) return "5v5";
  if (s.startsWith("u10") || s.startsWith("u11")) return "7v7";
  if (s.startsWith("u12") || s.startsWith("u13")) return "9v9";
  if (s.startsWith("u14") || s.startsWith("u15")) return "11v11";
  return null; // U6 / U7 excluded
}

function durationMinutes(format: string): number {
  return format === "9v9" || format === "11v11" ? 90 : 60;
}

/** Mirrors public.pitch_numbers_overlap */
function numbersOverlap(a: number, b: number): boolean {
  if (a === b) return true;
  const nested = [7, 8, 9];
  if (nested.includes(a) && nested.includes(b)) return true;
  const legacyBig = [5, 6];
  const legacyAll = [1, 2, 3, 4, 5, 6];
  if (legacyBig.includes(a) && legacyAll.includes(b)) return true;
  if (legacyBig.includes(b) && legacyAll.includes(a)) return true;
  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const token = authHeader.replace("Bearer ", "");
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
  const userId = claims?.claims?.sub as string | undefined;
  if (claimsErr || !userId) {
    return new Response(JSON.stringify({ success: false, error: "Invalid token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: roles } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  const allowed = (roles || []).some((r: { role: string }) =>
    r.role === "admin" || r.role === "fixture_secretary"
  );
  if (!allowed) {
    return new Response(JSON.stringify({ success: false, error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const teams: TeamInput[] = Array.isArray(body?.teams) ? body.teams : [];
    const dryRun = Boolean(body?.dryRun);

    // Manual booking mode: the admin picked pitches / times in the UI
    if (body?.action === "book" && Array.isArray(body?.items)) {
      const admin2 = admin;
      const booked: any[] = [];
      const failed: any[] = [];
      for (const it of body.items) {
        if (!it?.pitchId || !it?.startIso || !it?.endIso) {
          failed.push({ faId: it?.faId, reason: "Missing pitch or time" });
          continue;
        }
        const { error: insErr } = await admin2.from("pitch_bookings").insert({
          pitch_id: it.pitchId,
          requested_by: userId,
          start_time: it.startIso,
          end_time: it.endIso,
          purpose: "match",
          age_group: it.team,
          team_slug: it.slug,
          opponent: it.opponent,
          notes: `Auto-synced from FA Full-Time${it.competition ? ` — ${it.competition}` : ""}`,
          fa_fixture_id: it.faId,
        });
        if (insErr) failed.push({ faId: it.faId, team: it.team, opponent: it.opponent, reason: insErr.message });
        else booked.push({ faId: it.faId, team: it.team, opponent: it.opponent });
      }
      return new Response(JSON.stringify({ success: true, action: "book", booked, failed }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (teams.length === 0) {
      return new Response(JSON.stringify({ success: false, error: "teams is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    for (const t of teams) {
      if (!t.fixtureUrl) continue;
      try {
        const u = new URL(t.fixtureUrl);
        if (u.protocol !== "https:" || u.hostname !== ALLOWED_HOST) {
          return new Response(
            JSON.stringify({ success: false, error: `Only https://${ALLOWED_HOST} URLs are allowed` }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
      } catch {
        return new Response(JSON.stringify({ success: false, error: "Invalid fixtureUrl" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Load pitches
    const { data: pitches, error: pitchErr } = await admin
      .from("pitches")
      .select("id, number, name, format, active")
      .eq("active", true)
      .order("number");
    if (pitchErr) throw pitchErr;

    // Load existing live bookings (from now on) as occupancy
    const now = new Date();
    const { data: existing, error: existingErr } = await admin
      .from("pitch_bookings")
      .select("id, pitch_id, start_time, end_time, status, fa_fixture_id, age_group, opponent")
      .gte("start_time", now.toISOString())
      .in("status", ["pending", "approved"]);
    if (existingErr) throw existingErr;

    const pitchNumber = new Map<string, number>(
      (pitches || []).map((p: any) => [p.id as string, p.number as number]),
    );
    const occupancy: { number: number; start: number; end: number; label: string }[] =
      (existing || []).map((b: any) => ({
        number: pitchNumber.get(b.pitch_id) ?? -1,
        start: new Date(b.start_time).getTime(),
        end: new Date(b.end_time).getTime(),
        label: `${b.age_group || "Booking"}${b.opponent ? ` vs ${b.opponent}` : ""} (${b.status})`,
      }));
    const existingFaIds = new Set(
      (existing || []).map((b: any) => b.fa_fixture_id).filter(Boolean),
    );

    // Candidate pitches per format — prefer standalone pitches over the nested 1/2/3 space
    const candidatesFor = (format: string) => {
      const list = (pitches || []).filter((p: any) => p.format === format);
      return list.sort((a: any, b: any) => {
        const nested = (n: number) => ([7, 8, 9].includes(n) ? 1 : 0);
        return nested(a.number) - nested(b.number) || a.number - b.number;
      });
    };

    // Scrape each team — sequentially with retries; FA Full-Time throttles bursts of parallel hits
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    const fetchTeam = async (t: TeamInput) => {
      if (!t.fixtureUrl) return { t, fixtures: [] as FAFixture[], error: null as string | null };
      let lastError = "fetch failed";
      for (let attempt = 0; attempt < 2; attempt++) {
        if (attempt > 0) await sleep(800 * attempt);
        try {
          const html = await fetchFaHtml(t.fixtureUrl);
          const fixtures = parseFixturesPage(html);
          if (fixtures.length === 0 && !/fixtures-table/.test(html)) {
            lastError = "FA page had no fixtures table (blocked or empty)";
            continue;
          }
          return { t, fixtures, error: null };
        } catch (e) {
          lastError = e instanceof Error ? e.message : "fetch failed";
        }
      }

      return { t, fixtures: [] as FAFixture[], error: lastError };
    };

    const scraped: { t: TeamInput; fixtures: FAFixture[]; error: string | null }[] = [];
    for (const t of teams) {
      scraped.push(await fetchTeam(t));
      // Pace requests — Firecrawl enforces a per-minute rate limit across all teams.
      await sleep(3000);
    }


    interface Candidate {
      team: string;
      slug: string;
      faId: string;
      opponent: string;
      format: string;
      start: Date;
      end: Date;
      competition: string;
    }

    const candidates: Candidate[] = [];
    const skipped: { team: string; reason: string; detail?: string }[] = [];

    for (const s of scraped) {
      if (s.error) {
        skipped.push({ team: s.t.team, reason: "FA fetch failed", detail: s.error });
        continue;
      }
      const format = formatForAge(s.t.slug);
      if (!format) {
        continue; // U6 / U7 excluded from pitch bookings
      }
      for (const f of s.fixtures) {
        const isHome = f.homeTeam.includes(CLUB_NAME);
        if (!isHome) continue;
        const start = ukLocalToUtc(f.date, f.time);
        if (!start) {
          skipped.push({ team: s.t.team, reason: "Unreadable date", detail: `${f.date} ${f.time}` });
          continue;
        }
        if (start.getTime() < now.getTime()) continue;
        const end = new Date(start.getTime() + durationMinutes(format) * 60000);
        candidates.push({
          team: s.t.team,
          slug: s.t.slug,
          faId: `${s.t.slug}|${f.date}|${f.time}|${f.awayTeam}`.slice(0, 200),
          opponent: f.awayTeam,
          format,
          start,
          end,
          competition: f.competition,
        });
      }
    }

    candidates.sort((a, b) => a.start.getTime() - b.start.getTime());

    const created: any[] = [];
    const alreadySynced: any[] = [];
    const clashes: any[] = [];

    for (const c of candidates) {
      if (existingFaIds.has(c.faId)) {
        alreadySynced.push({ team: c.team, opponent: c.opponent, kickOff: c.start.toISOString() });
        continue;
      }

      const options = candidatesFor(c.format);
      if (options.length === 0) {
        clashes.push({
          team: c.team,
          opponent: c.opponent,
          kickOff: c.start.toISOString(),
          format: c.format,
          reason: `No active ${c.format} pitch configured`,
          conflictsWith: [],
          faId: c.faId,
          slug: c.slug,
          startIso: c.start.toISOString(),
          durationMins: durationMinutes(c.format),
          competition: c.competition,
        });
        continue;
      }

      let chosen: any = null;
      const conflictLabels: string[] = [];
      for (const p of options) {
        const conflicting = occupancy.filter(
          (o) =>
            numbersOverlap(p.number, o.number) &&
            o.start < c.end.getTime() &&
            o.end > c.start.getTime(),
        );
        if (conflicting.length === 0) {
          chosen = p;
          break;
        }
        conflictLabels.push(...conflicting.map((o) => o.label));
      }

      if (!chosen) {
        clashes.push({
          team: c.team,
          opponent: c.opponent,
          kickOff: c.start.toISOString(),
          format: c.format,
          reason: "No free pitch of the required size at this kick-off time",
          conflictsWith: Array.from(new Set(conflictLabels)),
          faId: c.faId,
          slug: c.slug,
          startIso: c.start.toISOString(),
          durationMins: durationMinutes(c.format),
          competition: c.competition,
        });
        continue;
      }

      if (dryRun) {
        created.push({
          team: c.team,
          opponent: c.opponent,
          kickOff: c.start.toISOString(),
          pitch: chosen.name,
          format: c.format,
          faId: c.faId,
          slug: c.slug,
          pitchId: chosen.id,
          startIso: c.start.toISOString(),
          endIso: c.end.toISOString(),
          durationMins: durationMinutes(c.format),
          competition: c.competition,
        });
        occupancy.push({
          number: chosen.number,
          start: c.start.getTime(),
          end: c.end.getTime(),
          label: `${c.team} vs ${c.opponent} (planned)`,
        });
        continue;
      }

      const { error: insertErr } = await admin.from("pitch_bookings").insert({
        pitch_id: chosen.id,
        requested_by: userId,
        start_time: c.start.toISOString(),
        end_time: c.end.toISOString(),
        purpose: "match",
        age_group: c.team,
        team_slug: c.slug,
        opponent: c.opponent,
        notes: `Auto-synced from FA Full-Time${c.competition ? ` — ${c.competition}` : ""}`,
        fa_fixture_id: c.faId,
      });

      if (insertErr) {
        clashes.push({
          team: c.team,
          opponent: c.opponent,
          kickOff: c.start.toISOString(),
          format: c.format,
          reason: insertErr.message,
          conflictsWith: [],
        });
        continue;
      }

      created.push({
        team: c.team,
        opponent: c.opponent,
        kickOff: c.start.toISOString(),
        pitch: chosen.name,
        format: c.format,
        faId: c.faId,
        slug: c.slug,
        pitchId: chosen.id,
        startIso: c.start.toISOString(),
        endIso: c.end.toISOString(),
      });
      occupancy.push({
        number: chosen.number,
        start: c.start.getTime(),
        end: c.end.getTime(),
        label: `${c.team} vs ${c.opponent} (pending)`,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        dryRun,
        homeFixturesFound: candidates.length,
        created,
        alreadySynced,
        clashes,
        skipped,
        pitches: pitches || [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("sync-fa-pitch-bookings failed:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Sync failed",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
