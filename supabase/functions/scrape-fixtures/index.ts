import { createClient } from "npm:@supabase/supabase-js@2";
import { fetchFaHtml } from "../_shared/faFetch.ts";

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

  // --- Auth gate: require any valid authenticated user ---
  const authHeader = req.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const token = authHeader.replace('Bearer ', '');
  const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
  if (claimsErr || !claims?.claims?.sub) {
    return new Response(JSON.stringify({ success: false, error: 'Invalid token' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { fixtureUrl, resultUrl, team } = await req.json();

    if (!fixtureUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'fixtureUrl is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SSRF guard — only allow scraping the FA Full-Time host over HTTPS.
    const ALLOWED_HOST = 'fulltime.thefa.com';
    const isAllowed = (u: string | undefined): boolean => {
      if (!u) return true;
      try {
        const parsed = new URL(u);
        return parsed.protocol === 'https:' && parsed.hostname === ALLOWED_HOST;
      } catch {
        return false;
      }
    };
    if (!isAllowed(fixtureUrl) || !isAllowed(resultUrl)) {
      return new Response(
        JSON.stringify({ success: false, error: `Only https://${ALLOWED_HOST} URLs are allowed` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey);
    const cacheKey = `${fixtureUrl}::${resultUrl ?? ''}`;
    const FRESH_MS = 1000 * 60 * 60 * 6; // 6 hours

    const { data: cached } = await admin
      .from('fa_fixture_cache')
      .select('fixtures, results, updated_at')
      .eq('cache_key', cacheKey)
      .maybeSingle();

    const cacheAge = cached?.updated_at ? Date.now() - new Date(cached.updated_at).getTime() : Infinity;

    const refresh = async (budgetMs: number) => {
      const started = Date.now();
      let fixtures: Fixture[] = [];
      let fixturesFailed = false;
      try {
        fixtures = parseFixturesPage(await fetchFaHtml(fixtureUrl, { budgetMs }));
      } catch (e) {
        fixturesFailed = true;
        console.warn(`Fixtures fetch failed for ${team || 'unknown'}: ${e instanceof Error ? e.message : e}`);
      }

      let results: Fixture[] = [];
      let resultsFailed = false;
      if (resultUrl) {
        const remaining = budgetMs - (Date.now() - started);
        if (remaining > 5_000) {
          try {
            results = parseResultsPage(await fetchFaHtml(resultUrl, { budgetMs: remaining }));
          } catch (e) {
            resultsFailed = true;
            console.warn(`Results fetch failed for ${team || 'unknown'}: ${e instanceof Error ? e.message : e}`);
          }
        } else {
          // Ran out of budget before results — treat as "not fetched", never as empty.
          resultsFailed = true;
        }
      }

      // Never overwrite good cached data with an empty array from a failed/skipped fetch.
      const cachedFixtures = (cached?.fixtures as Fixture[] | null) ?? [];
      const cachedResults = (cached?.results as Fixture[] | null) ?? [];
      const nextFixtures = fixturesFailed && fixtures.length === 0 ? cachedFixtures : fixtures;
      const nextResults = resultsFailed && results.length === 0 ? cachedResults : results;

      if (!fixturesFailed || !resultsFailed || fixtures.length > 0 || results.length > 0) {
        await admin.from('fa_fixture_cache').upsert({
          cache_key: cacheKey,
          team: team ?? null,
          fixtures: nextFixtures,
          results: nextResults,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'cache_key' });
      }

      console.log(`Parsed ${fixtures.length} fixtures and ${results.length} results for ${team || 'unknown'}`);
      return { fixtures: nextFixtures, results: nextResults, fetchFailed: fixturesFailed || resultsFailed };
    };


    // Any cached copy is served instantly. If it is stale we refresh in the
    // background so the user never waits on the FA site / Firecrawl.
    if (cached) {
      const stale = cacheAge >= FRESH_MS;
      if (stale) {
        // @ts-ignore EdgeRuntime is provided by the edge runtime
        EdgeRuntime.waitUntil(refresh(60_000).catch((e) => console.warn('Background refresh failed:', e)));
      }
      return new Response(
        JSON.stringify({ success: true, team, fixtures: cached.fixtures ?? [], results: cached.results ?? [], cached: true, stale }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // No cache at all — scrape inline with a tight budget so the UI never hangs.
    const { fixtures, results } = await refresh(30_000);

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

