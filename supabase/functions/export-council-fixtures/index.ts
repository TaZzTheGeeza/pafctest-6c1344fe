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

const season = "233257866";
const base = "https://fulltime.thefa.com";

function buildUrl(page: "fixtures" | "results", params: Record<string, string>): string {
  const defaults: Record<string, string> = {
    selectedSeason: season,
    selectedDateCode: "all",
    selectedRelatedFixtureOption: "3",
    selectedFixtureDateStatus: "",
    selectedFixtureStatus: "",
    itemsPerPage: "100",
  };
  const merged = { ...defaults, ...params };
  const qs = Object.entries(merged).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
  return `${base}/${page}.html?${qs}`;
}

const faTeamConfigs: TeamConfig[] = [
  { team: "U7", slug: "u7s", fixtureUrl: buildUrl("fixtures", { selectedFixtureGroupAgeGroup: "0", selectedFixtureGroupKey: "1_496367219", selectedClub: "726869064", selectedTeam: "", previousSelectedFixtureGroupAgeGroup: "", previousSelectedFixtureGroupKey: "1_496367219", previousSelectedClub: "" }) },
  { team: "U8 Black", slug: "u8s-black", fixtureUrl: buildUrl("fixtures", { selectedFixtureGroupAgeGroup: "15", selectedFixtureGroupKey: "", selectedClub: "", selectedTeam: "451067648", previousSelectedFixtureGroupAgeGroup: "15", previousSelectedFixtureGroupKey: "", previousSelectedClub: "726869064" }) },
  { team: "U8 Gold", slug: "u8s-gold", fixtureUrl: buildUrl("fixtures", { selectedFixtureGroupAgeGroup: "15", selectedFixtureGroupKey: "", selectedClub: "", selectedTeam: "665211326", previousSelectedFixtureGroupAgeGroup: "15", previousSelectedFixtureGroupKey: "", previousSelectedClub: "726869064" }) },
  { team: "U9", slug: "u9s", fixtureUrl: buildUrl("fixtures", { selectedFixtureGroupAgeGroup: "14", selectedFixtureGroupKey: "", selectedClub: "", selectedTeam: "795452180", previousSelectedFixtureGroupAgeGroup: "14", previousSelectedFixtureGroupKey: "", previousSelectedClub: "726869064" }) },
  { team: "U10", slug: "u10s", fixtureUrl: buildUrl("fixtures", { selectedFixtureGroupAgeGroup: "13", selectedFixtureGroupKey: "", selectedClub: "", selectedTeam: "522060339", previousSelectedFixtureGroupAgeGroup: "13", previousSelectedFixtureGroupKey: "", previousSelectedClub: "726869064" }) },
  { team: "U11 Gold", slug: "u11s-gold", fixtureUrl: buildUrl("fixtures", { selectedFixtureGroupAgeGroup: "12", selectedFixtureGroupKey: "", selectedClub: "", selectedTeam: "50394118", previousSelectedFixtureGroupAgeGroup: "12", previousSelectedFixtureGroupKey: "", previousSelectedClub: "726869064" }) },
  { team: "U11 Black", slug: "u11s-black", fixtureUrl: buildUrl("fixtures", { selectedFixtureGroupAgeGroup: "12", selectedFixtureGroupKey: "", selectedClub: "", selectedTeam: "335339841", previousSelectedFixtureGroupAgeGroup: "12", previousSelectedFixtureGroupKey: "", previousSelectedClub: "726869064" }) },
  { team: "U13 Gold", slug: "u13s-gold", fixtureUrl: buildUrl("fixtures", { selectedFixtureGroupAgeGroup: "10", selectedFixtureGroupKey: "", selectedClub: "", selectedTeam: "997093003", previousSelectedFixtureGroupAgeGroup: "10", previousSelectedFixtureGroupKey: "", previousSelectedClub: "726869064" }), resultUrl: buildUrl("results", { selectedFixtureGroupAgeGroup: "10", selectedFixtureGroupKey: "", selectedClub: "", selectedTeam: "997093003", previousSelectedFixtureGroupAgeGroup: "10", previousSelectedFixtureGroupKey: "", previousSelectedClub: "726869064" }) },
  { team: "U13 Black", slug: "u13s-black", fixtureUrl: buildUrl("fixtures", { selectedFixtureGroupAgeGroup: "10", selectedFixtureGroupKey: "", selectedClub: "", selectedTeam: "979694431", previousSelectedFixtureGroupAgeGroup: "10", previousSelectedFixtureGroupKey: "", previousSelectedClub: "726869064" }), resultUrl: buildUrl("results", { selectedFixtureGroupAgeGroup: "10", selectedFixtureGroupKey: "", selectedClub: "", selectedTeam: "979694431", previousSelectedFixtureGroupAgeGroup: "10", previousSelectedFixtureGroupKey: "", previousSelectedClub: "726869064" }) },
  { team: "U14", slug: "u14s", fixtureUrl: buildUrl("fixtures", { selectedFixtureGroupAgeGroup: "9", selectedFixtureGroupKey: "", selectedClub: "", selectedTeam: "65147458", previousSelectedFixtureGroupAgeGroup: "9", previousSelectedFixtureGroupKey: "", previousSelectedClub: "726869064" }), resultUrl: buildUrl("results", { selectedFixtureGroupAgeGroup: "9", selectedFixtureGroupKey: "", selectedClub: "", selectedTeam: "65147458", previousSelectedFixtureGroupAgeGroup: "9", previousSelectedFixtureGroupKey: "", previousSelectedClub: "726869064" }) },
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
