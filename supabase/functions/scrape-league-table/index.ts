import { createClient } from "npm:@supabase/supabase-js@2";

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

  try {
    const { divisionSeason, tableUrl } = await req.json();

    if (!divisionSeason && !tableUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'divisionSeason or tableUrl is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = tableUrl || `https://fulltime.thefa.com/table.html?divisionseason=${divisionSeason}`;

    // SSRF guard — only allow scraping the FA Full-Time host over HTTPS.
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

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ success: false, error: `FA site returned ${response.status}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = await response.text();

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
