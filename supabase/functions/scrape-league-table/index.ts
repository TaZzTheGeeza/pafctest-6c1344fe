import { createClient } from "npm:@supabase/supabase-js@2";
import { fetchFaHtml } from "../_shared/faFetch.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface LeagueRow {
  position: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
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

  const isAllowedFaUrl = (u: string) => {
    try {
      const parsed = new URL(u);
      return parsed.protocol === 'https:' && parsed.hostname === 'fulltime.thefa.com';
    } catch {
      return false;
    }
  };

  const fetchFaPage = async (u: string): Promise<{ ok: true; html: string } | { ok: false; status: number; reason?: string }> => {
    try {
      // Routed through Firecrawl (same as fixtures) - the FA site 403s plain server requests.
      return { ok: true, html: await fetchFaHtml(u, { budgetMs: 90_000 }) };
    } catch (e) {
      const reason = e instanceof Error ? e.message : String(e);
      console.warn(`FA fetch failed for ${u}: ${reason}`);
      return { ok: false, status: 502, reason };
    }
  };

  try {
    const { divisionSeason, tableUrl, fixtureUrl, discoverOnly } = await req.json();

    if (!divisionSeason && !tableUrl && !fixtureUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'divisionSeason, tableUrl or fixtureUrl is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let resolvedTableUrl = tableUrl;

    // Discover the division table from the team's fixture page - the same URL
    // used for fixtures carries a link to its league table, so tables and
    // fixtures always share one source.
    if (!resolvedTableUrl && !divisionSeason && fixtureUrl) {
      if (!isAllowedFaUrl(fixtureUrl)) {
        return new Response(
          JSON.stringify({ success: false, error: 'Only https://fulltime.thefa.com URLs are allowed' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.log('Discovering league table from fixture page:', fixtureUrl);
      const fixturePage = await fetchFaPage(fixtureUrl);
      if (!fixturePage.ok) {
        return new Response(
          JSON.stringify({ success: false, error: `FA site returned ${fixturePage.status}${fixturePage.reason ? ` (${fixturePage.reason})` : ''}` }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const tableLink = fixturePage.html.match(/href="([^"]*table\.html[^"]*)"/i);
      if (!tableLink) {
        return new Response(
          JSON.stringify({ success: false, error: 'Could not find a league table link on the fixture page' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      resolvedTableUrl = tableLink[1]
        .replace(/&amp;/g, '&')
        .replace(/&#0?39;|&apos;/g, "'")
        .replace(/&quot;/g, '"');
      if (resolvedTableUrl.startsWith('/')) {
        resolvedTableUrl = `https://fulltime.thefa.com${resolvedTableUrl}`;
      }
      console.log('Discovered table URL:', resolvedTableUrl);
    }

    const url = resolvedTableUrl || `https://fulltime.thefa.com/table.html?divisionseason=${divisionSeason}`;

    // SSRF guard - only allow scraping the FA Full-Time host over HTTPS.
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:' || parsed.hostname !== 'fulltime.thefa.com') {
        return new Response(
          JSON.stringify({ success: false, error: 'Only https://fulltime.thefa.com URLs are allowed' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Scraping league table from:', url);

    const tablePage = await fetchFaPage(url);
    if (!tablePage.ok) {
      return new Response(
        JSON.stringify({ success: false, error: 'The FA site is not responding right now - please try again shortly' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = tablePage.html;

    // Extract division name from title
    const titleMatch = html.match(/<title>Table \| ([^|]+)/);
    const divisionName = titleMatch ? titleMatch[1].trim() : 'League Table';

    // Extract table data between <table class="cell-dividers"> and </table>
    const tableMatch = html.match(/<table class="cell-dividers">([\s\S]*?)<\/table>/);
    if (!tableMatch) {
      return new Response(
        JSON.stringify({ success: false, error: 'Could not find league table on page' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tableHtml = tableMatch[1];

    // Parse rows
    const rows: LeagueRow[] = [];
    const rowRegex = /<tr[^>]*>\s*([\s\S]*?)\s*<\/tr>/g;
    let rowMatch;

    while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
      const rowContent = rowMatch[1];
      const cellRegex = /<td[^>]*>\s*([\s\S]*?)\s*<\/td>/g;
      const cells: string[] = [];
      let cellMatch;

      while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
        // Strip HTML tags and trim
        const text = cellMatch[1].replace(/<[^>]+>/g, '').trim();
        cells.push(text);
      }

      if (cells.length >= 6) {
        const pos = parseInt(cells[0]);
        if (!isNaN(pos)) {
          rows.push({
            position: pos,
            team: cells[1],
            played: parseInt(cells[2]) || 0,
            won: parseInt(cells[3]) || 0,
            drawn: parseInt(cells[4]) || 0,
            lost: parseInt(cells[5]) || 0,
            points: parseInt(cells[6]) || 0,
          });
        }
      }
    }

    console.log(`Parsed ${rows.length} teams from ${divisionName}`);

    return new Response(
      JSON.stringify({ success: true, divisionName, standings: rows }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error scraping league table:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Failed to scrape' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
