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

function parseFixturesPage(html: string): Fixture[] {
  const fixtures: Fixture[] = [];

  // Fixtures page uses <table> inside .fixtures-table
  const tableMatch = html.match(/<div class="fixtures-table[^"]*"[^>]*>[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/);
  if (!tableMatch) return fixtures;

  const tbody = tableMatch[1];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
  let rowMatch;

  while ((rowMatch = rowRegex.exec(tbody)) !== null) {
    const row = rowMatch[1];

    // Extract date/time
    const dateTimeMatch = row.match(/<td class="left cell-divider">[\s\S]*?<span>([^<]+)<\/span>\s*<span[^>]*>([^<]+)<\/span>/);
    if (!dateTimeMatch) continue;

    // Extract home team
    const homeMatch = row.match(/<td class="home-team right">[\s\S]*?<a[^>]*>\s*([\s\S]*?)\s*<\/a>/);
    // Extract away team
    const awayMatch = row.match(/<td class="road-team left cell-divider">[\s\S]*?<a[^>]*>\s*([\s\S]*?)\s*<\/a>/);

    if (homeMatch && awayMatch) {
      const home = homeMatch[1].replace(/<[^>]+>/g, '').trim();
      const away = awayMatch[1].replace(/<[^>]+>/g, '').trim();

      // Extract all left cell-divider td contents
      const cellDividerRegex = /<td class="left cell-divider">([\s\S]*?)<\/td>/g;
      const cells: string[] = [];
      let cellMatch;
      while ((cellMatch = cellDividerRegex.exec(row)) !== null) {
        cells.push(cellMatch[1].replace(/<[^>]+>/g, '').trim());
      }

      // cells[0] = date/time, cells[1] = venue, cells[2] = competition
      const venue = cells.length >= 2 ? cells[1] : '';
      const competition = cells.length >= 3 ? cells[2] : '';

      fixtures.push({
        date: dateTimeMatch[1].trim(),
        time: dateTimeMatch[2].trim(),
        homeTeam: home,
        awayTeam: away,
        venue,
        competition,
        type: 'fixture',
      });
    }
  }

  return fixtures;
}

function parseResultsPage(html: string): Fixture[] {
  const results: Fixture[] = [];

  // Results page uses div-based layout
  const fixtureRegex = /<div id="fixture-[^"]*"[^>]*>[\s\S]*?<div class="flex middle">([\s\S]*?)<\/div>\s*(?:<\/div>\s*){2,4}<\/div>\s*(?=<div id="fixture-|<\/div>\s*<div class="paging)/g;

  // Simpler approach: find each fixture block
  const blockRegex = /<div class="datetime-col">[\s\S]*?<span>([^<]+)<\/span>\s*<span[^>]*>([^<]+)<\/span>[\s\S]*?<div class="home-team-col[\s\S]*?<div class="team-name">[\s\S]*?<a[^>]*>\s*([\s\S]*?)\s*<\/a>[\s\S]*?<div class="score-col">\s*([\s\S]*?)\s*<\/div>[\s\S]*?<div class="road-team-col[\s\S]*?<div class="team-name">[\s\S]*?<a[^>]*>\s*([\s\S]*?)\s*<\/a>[\s\S]*?<div class="fg-col">[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/g;

  let match;
  while ((match = blockRegex.exec(html)) !== null) {
    const date = match[1].trim();
    const time = match[2].trim();
    const homeTeam = match[3].replace(/<[^>]+>/g, '').trim();
    const scoreRaw = match[4].replace(/<[^>]+>/g, '').trim();
    const awayTeam = match[5].replace(/<[^>]+>/g, '').trim();
    const competition = match[6].replace(/<[^>]+>/g, '').trim();

    const scoreMatch = scoreRaw.match(/(\d+)\s*-\s*(\d+)/);

    results.push({
      date,
      time,
      homeTeam,
      awayTeam,
      venue: '',
      competition,
      type: 'result',
      homeScore: scoreMatch ? parseInt(scoreMatch[1]) : undefined,
      awayScore: scoreMatch ? parseInt(scoreMatch[2]) : undefined,
    });
  }

  return results;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fixtureUrl, resultUrl, team } = await req.json();

    if (!fixtureUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'fixtureUrl is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fetchOpts = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
    };

    // Fetch fixtures and results in parallel
    const [fixtureRes, resultRes] = await Promise.all([
      fetch(fixtureUrl, fetchOpts),
      resultUrl ? fetch(resultUrl, fetchOpts) : Promise.resolve(null),
    ]);

    if (!fixtureRes.ok) {
      return new Response(
        JSON.stringify({ success: false, error: `FA site returned ${fixtureRes.status}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fixtureHtml = await fixtureRes.text();
    const fixtures = parseFixturesPage(fixtureHtml);

    let results: Fixture[] = [];
    if (resultRes && resultRes.ok) {
      const resultHtml = await resultRes.text();
      results = parseResultsPage(resultHtml);
    }

    console.log(`Parsed ${fixtures.length} fixtures and ${results.length} results for ${team || 'unknown'}`);

    return new Response(
      JSON.stringify({ success: true, team, fixtures, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error scraping fixtures:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Failed to scrape' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
