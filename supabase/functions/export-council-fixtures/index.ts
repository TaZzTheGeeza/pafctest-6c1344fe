import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface Fixture {
  date: string;
  time: string;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  competition: string;
  type: 'fixture' | 'result';
  homeScore?: number;
  awayScore?: number;
}

interface TeamConfig {
  team: string;
  slug: string;
  fixtureUrl: string;
  resultUrl?: string;
}

const season = "585452548";
const base = "https://fulltime.thefa.com";
const CLUB = "726869064";

function buildUrl(page: "fixtures" | "results", ageGroup: string, teamId: string, seasonId: string = season): string {
  const params: Record<string, string> = {
    selectedSeason: seasonId,
    selectedFixtureGroupAgeGroup: ageGroup,
    selectedFixtureGroupKey: "",
    selectedDateCode: "all",
    selectedClub: CLUB,
    selectedTeam: teamId,
    selectedRelatedFixtureOption: "3",
    selectedFixtureDateStatus: "",
    selectedFixtureStatus: "",
    previousSelectedFixtureGroupAgeGroup: ageGroup,
    previousSelectedFixtureGroupKey: "",
    previousSelectedClub: CLUB,
    itemsPerPage: "100",
  };
  const qs = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
  return `${base}/${page}.html?${qs}`;
}

function team(name: string, slug: string, ageGroup: string, teamId: string, seasonId: string = season): TeamConfig {
  return {
    team: name,
    slug,
    fixtureUrl: buildUrl("fixtures", ageGroup, teamId, seasonId),
    resultUrl: buildUrl("results", ageGroup, teamId, seasonId),
  };
}

const faTeamConfigs: TeamConfig[] = [
  team("U7", "u7s", "16", ""),
  team("U8 Black", "u8s-black", "15", "345191842"),
  team("U8 Gold", "u8s-gold", "15", "56750923"),
  team("U9 Black", "u9s-black", "14", "451067648"),
  team("U9 Gold", "u9s-gold", "14", "665211326"),
  team("U10", "u10s", "13", "795452180"),
  team("U11", "u11s", "12", "522060339"),
  team("U12 Black", "u12s-black", "11", "335339841"),
  team("U12 Gold", "u12s-gold", "11", "50394118"),
  team("U12 White", "u12s-white", "11", "560859193"),
  team("U13", "u13s", "10", "104052800"),
  team("U14 Black", "u14s-black", "9", "979694431"),
  team("U14 Gold", "u14s-gold", "9", "997093003"),
  // U15 — league uses a different FA season ID and no club filter
  {
    team: "U15",
    slug: "u15s",
    fixtureUrl:
      "https://fulltime.thefa.com/fixtures.html?selectedSeason=816327485&selectedFixtureGroupAgeGroup=8&selectedFixtureGroupKey=&selectedDateCode=all&selectedClub=&selectedTeam=796957227&selectedRelatedFixtureOption=3&selectedFixtureDateStatus=&selectedFixtureStatus=&previousSelectedFixtureGroupAgeGroup=8&previousSelectedFixtureGroupKey=&previousSelectedClub=&itemsPerPage=100",
    resultUrl:
      "https://fulltime.thefa.com/results.html?selectedSeason=816327485&selectedFixtureGroupAgeGroup=8&selectedFixtureGroupKey=&selectedDateCode=all&selectedClub=&selectedTeam=796957227&selectedRelatedFixtureOption=3&selectedFixtureDateStatus=&selectedFixtureStatus=&previousSelectedFixtureGroupAgeGroup=8&previousSelectedFixtureGroupKey=&previousSelectedClub=&itemsPerPage=100",
  },
];


function parseFixturesPage(html: string): Fixture[] {
  const fixtures: Fixture[] = [];
  const tableMatch = html.match(/<div class="fixtures-table[^"]*"[^>]*>[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/);
  if (!tableMatch) return fixtures;
  const tbody = tableMatch[1];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
  let rowMatch;
  while ((rowMatch = rowRegex.exec(tbody)) !== null) {
    const row = rowMatch[1];
    const dateTimeMatch = row.match(/<td class="left cell-divider">[\s\S]*?<span>([^<]+)<\/span>\s*<span[^>]*>([^<]+)<\/span>/);
    if (!dateTimeMatch) continue;
    const homeMatch = row.match(/<td class="home-team right">[\s\S]*?<a[^>]*>\s*([\s\S]*?)\s*<\/a>/);
    const awayMatch = row.match(/<td class="road-team left cell-divider">[\s\S]*?<a[^>]*>\s*([\s\S]*?)\s*<\/a>/);
    if (homeMatch && awayMatch) {
      const home = homeMatch[1].replace(/<[^>]+>/g, '').trim();
      const away = awayMatch[1].replace(/<[^>]+>/g, '').trim();
      const cellDividerRegex = /<td class="left cell-divider">([\s\S]*?)<\/td>/g;
      const cells: string[] = [];
      let cellMatch;
      while ((cellMatch = cellDividerRegex.exec(row)) !== null) {
        cells.push(cellMatch[1].replace(/<[^>]+>/g, '').trim());
      }
      fixtures.push({
        date: dateTimeMatch[1].trim(),
        time: dateTimeMatch[2].trim(),
        homeTeam: home,
        awayTeam: away,
        venue: cells.length >= 2 ? cells[1] : '',
        competition: cells.length >= 3 ? cells[2] : '',
        type: 'fixture',
      });
    }
  }
  return fixtures;
}

function parseResultsPage(html: string): Fixture[] {
  const results: Fixture[] = [];
  const blockRegex = /<div class="datetime-col">[\s\S]*?<span>([^<]+)<\/span>\s*<span[^>]*>([^<]+)<\/span>[\s\S]*?<div class="home-team-col[\s\S]*?<div class="team-name">[\s\S]*?<a[^>]*>\s*([\s\S]*?)\s*<\/a>[\s\S]*?<div class="score-col">\s*([\s\S]*?)\s*<\/div>[\s\S]*?<div class="road-team-col[\s\S]*?<div class="team-name">[\s\S]*?<a[^>]*>\s*([\s\S]*?)\s*<\/a>[\s\S]*?<div class="fg-col">[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/g;
  let match;
  while ((match = blockRegex.exec(html)) !== null) {
    const scoreRaw = match[4].replace(/<[^>]+>/g, '').trim();
    const scoreMatch = scoreRaw.match(/(\d+)\s*-\s*(\d+)/);
    results.push({
      date: match[1].trim(),
      time: match[2].trim(),
      homeTeam: match[3].replace(/<[^>]+>/g, '').trim(),
      awayTeam: match[5].replace(/<[^>]+>/g, '').trim(),
      venue: '',
      competition: match[6].replace(/<[^>]+>/g, '').trim(),
      type: 'result',
      homeScore: scoreMatch ? parseInt(scoreMatch[1]) : undefined,
      awayScore: scoreMatch ? parseInt(scoreMatch[2]) : undefined,
    });
  }
  return results;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // --- Auth gate: require valid JWT + admin or coach role ---
  const authHeader = req.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const token = authHeader.replace('Bearer ', '');
  const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
  if (claimsErr || !claims?.claims?.sub) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const admin = createClient(supabaseUrl, serviceKey);
  const { data: roles } = await admin.from('user_roles').select('role').eq('user_id', claims.claims.sub as string);
  const allowed = new Set(['admin', 'coach', 'fixture_secretary']);
  if (!roles?.some((r: any) => allowed.has(r.role))) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const fetchOpts = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
    };

    // Fetch all teams in parallel
    const allPromises = faTeamConfigs.map(async (config) => {
      try {
        const [fixtureRes, resultRes] = await Promise.all([
          fetch(config.fixtureUrl, fetchOpts),
          config.resultUrl ? fetch(config.resultUrl, fetchOpts) : Promise.resolve(null),
        ]);

        let fixtures: Fixture[] = [];
        let results: Fixture[] = [];

        if (fixtureRes.ok) {
          const html = await fixtureRes.text();
          fixtures = parseFixturesPage(html);
        }
        if (resultRes && resultRes.ok) {
          const html = await resultRes.text();
          results = parseResultsPage(html);
        }

        return { team: config.team, fixtures, results };
      } catch (e) {
        console.error(`Error fetching ${config.team}:`, e);
        return { team: config.team, fixtures: [], results: [] };
      }
    });

    const allTeamData = await Promise.all(allPromises);

    // Combine all fixtures and results
    const combined: Array<{
      team: string;
      date: string;
      time: string;
      homeTeam: string;
      awayTeam: string;
      venue: string;
      competition: string;
      type: string;
      score?: string;
    }> = [];

    for (const td of allTeamData) {
      for (const f of [...td.fixtures, ...td.results]) {
        combined.push({
          team: td.team,
          date: f.date,
          time: f.time,
          homeTeam: f.homeTeam,
          awayTeam: f.awayTeam,
          venue: f.venue,
          competition: f.competition,
          type: f.type,
          score: f.type === 'result' && f.homeScore !== undefined ? `${f.homeScore}-${f.awayScore}` : undefined,
        });
      }
    }

    console.log(`Council export: ${combined.length} total fixtures/results across ${allTeamData.length} teams`);

    return new Response(JSON.stringify({ success: true, fixtures: combined }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in council export:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Failed to export' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
