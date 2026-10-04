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
  goalDiff: number | null;
  points: number;
}

// Cached standings are served instantly. When stale (or missing) the FA page is
// fetched in the background with a long budget, so visitors never wait on the FA site.
const FRESH_MS = 6 * 60 * 60 * 1000;
const RETRY_MS = 10 * 60 * 1000; // don't hammer the FA site while a refresh is failing

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const isAllowedFaUrl = (u: string) => {
  try {
    const p = new URL(u);
    return p.protocol === 'https:' && p.hostname === 'fulltime.thefa.com';
  } catch {
    return false;
  }
};

const decode = (s: string) =>
  s.replace(/&amp;/g, '&').replace(/&#0?39;|&apos;|&rsquo;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').trim();

function parseTable(html: string): { divisionName: string; rows: LeagueRow[] } {
  const titleMatch = html.match(/<title>\s*Table \| ([^|<]+)/);
  const divisionName = titleMatch ? decode(titleMatch[1]) : 'League Table';
  const tableMatch = html.match(/<table class="cell-dividers"[^>]*>([\s\S]*?)<\/table>/);
  const rows: LeagueRow[] = [];
  if (!tableMatch) return { divisionName, rows };

  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
  let rm;
  while ((rm = rowRegex.exec(tableMatch[1])) !== null) {
    const cells: string[] = [];
    const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
    let cm;
    while ((cm = cellRegex.exec(rm[1])) !== null) cells.push(decode(cm[1].replace(/<[^>]+>/g, '')));
    const pos = parseInt(cells[0]);
    if (cells.length < 7 || isNaN(pos)) continue;
    // FA layout: Pos, Team, P, W, D, L, [F, A, GD,] Pts
    const nums = cells.slice(2).map((c) => parseInt(c));
    const points = nums[nums.length - 1] || 0;
    const goalDiff = nums.length >= 8 ? nums[nums.length - 2] : null;
    rows.push({
      position: pos,
      team: cells[1],
      played: nums[0] || 0,
      won: nums[1] || 0,
      drawn: nums[2] || 0,
      lost: nums[3] || 0,
      goalDiff: Number.isFinite(goalDiff as number) ? goalDiff : null,
      points,
    });
  }
  return { divisionName, rows };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) return json({ success: false, error: 'Unauthorized' }, 401);
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: claims, error: claimsErr } = await userClient.auth.getClaims(authHeader.replace('Bearer ', ''));
  if (claimsErr || !claims?.claims?.sub) return json({ success: false, error: 'Invalid token' }, 401);

  try {
    const { fixtureUrl, force } = await req.json();
    if (!fixtureUrl || !isAllowedFaUrl(fixtureUrl)) {
      return json({ success: false, error: 'A https://fulltime.thefa.com fixtureUrl is required' }, 400);
    }

    const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    // Cache is keyed by the team's fixture URL, so tables and fixtures share one source.
    const cacheKey = `fixture:${fixtureUrl}`;
    const { data: saved } = await admin
      .from('league_tables')
      .select('division_name, standings, updated_at')
      .eq('table_url', cacheKey)
      .maybeSingle();

    const standings = (saved?.standings as any) ?? null;
    const rows: LeagueRow[] = Array.isArray(standings) ? standings : (standings?.rows ?? []);
    const meta = Array.isArray(standings) ? {} : (standings?.meta ?? {});
    const age = saved?.updated_at ? Date.now() - new Date(saved.updated_at).getTime() : Infinity;
    const lastAttempt = meta.lastAttempt ? Date.now() - Number(meta.lastAttempt) : Infinity;
    const needsRefresh = (age >= FRESH_MS || rows.length === 0 || force) && lastAttempt >= RETRY_MS;

    const refresh = async () => {
      // Mark the attempt first so parallel visitors don't start duplicate scrapes.
      await admin.from('league_tables').upsert({
        table_url: cacheKey,
        division_name: saved?.division_name ?? '',
        standings: { rows, meta: { ...meta, lastAttempt: Date.now(), tableUrl: meta.tableUrl } },
        updated_at: saved?.updated_at ?? new Date(0).toISOString(),
      }, { onConflict: 'table_url' });

      let tableUrl: string | undefined = meta.tableUrl;
      if (!tableUrl) {
        const page = await fetchFaHtml(fixtureUrl, { budgetMs: 60_000, waitFor: 0 });
        const link = page.match(/href="([^"]*table\.html[^"]*)"/i);
        if (!link) throw new Error('No league table link on the fixture page');
        tableUrl = decode(link[1]);
        if (tableUrl.startsWith('/')) tableUrl = `https://fulltime.thefa.com${tableUrl}`;
      }
      if (!isAllowedFaUrl(tableUrl)) throw new Error('Unexpected table URL');

      const html = await fetchFaHtml(tableUrl, { budgetMs: 140_000, waitFor: 0 });
      const parsed = parseTable(html);
      console.log(`Parsed ${parsed.rows.length} teams from ${parsed.divisionName}`);
      if (!parsed.rows.length) throw new Error('No standings found on table page');
      await admin.from('league_tables').upsert({
        table_url: cacheKey,
        division_name: parsed.divisionName,
        standings: { rows: parsed.rows, meta: { tableUrl, lastAttempt: Date.now() } },
        updated_at: new Date().toISOString(),
      }, { onConflict: 'table_url' });
    };

    if (needsRefresh) {
      // @ts-ignore EdgeRuntime is provided by the edge runtime
      EdgeRuntime.waitUntil(refresh().catch((e) => console.warn('League table refresh failed:', e?.message ?? e)));
    }

    return json({
      success: true,
      divisionName: saved?.division_name || null,
      standings: rows,
      tableUrl: meta.tableUrl ?? null,
      updatedAt: rows.length ? saved?.updated_at : null,
      refreshing: needsRefresh || lastAttempt < 3 * 60 * 1000,
    });
  } catch (error) {
    console.error('Error loading league table:', error);
    return json({ success: false, error: error instanceof Error ? error.message : 'Failed' }, 500);
  }
});
