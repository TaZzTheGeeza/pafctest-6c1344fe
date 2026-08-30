// Fetches FA Full-Time pages. The FA site sits behind Cloudflare bot protection and
// returns 403 to plain server-side requests, so we route through Firecrawl (gateway-backed).
const FIRECRAWL_GATEWAY = "https://connector-gateway.lovable.dev/firecrawl/v2";

interface FetchOpts {
  /** Hard time budget in ms. Once exceeded we stop retrying and throw. */
  budgetMs?: number;
}

export async function fetchFaHtml(url: string, opts: FetchOpts = {}): Promise<string> {
  const budgetMs = opts.budgetMs ?? 120_000;
  const deadline = Date.now() + budgetMs;

  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!lovableKey || !firecrawlKey) {
    throw new Error("Fixture scraping is not configured (missing Firecrawl connection)");
  }

  let lastError = "fetch failed";
  const MAX_ATTEMPTS = 5;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (Date.now() >= deadline) break;
    if (attempt > 0) await new Promise((r) => setTimeout(r, 1000));
    try {
      const remaining = deadline - Date.now();
      if (remaining <= 0) break;
      const res = await fetch(`${FIRECRAWL_GATEWAY}/scrape`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${lovableKey}`,
          "X-Connection-Api-Key": firecrawlKey,
        },
        body: JSON.stringify({
          url,
          formats: ["html"],
          onlyMainContent: false,
          waitFor: 2000,
        }),
        signal: AbortSignal.timeout(Math.max(5_000, Math.min(remaining, 45_000))),
      });

      const raw = await res.text();
      if (res.status === 429) {
        // Firecrawl rate limit — wait for the advertised window and retry, but never past the deadline.
        const headerWait = Number(res.headers.get("retry-after"));
        const bodyWait = Number(raw.match(/retry after (\d+)/i)?.[1]);
        const waitSec = Number.isFinite(headerWait) && headerWait > 0
          ? headerWait
          : Number.isFinite(bodyWait) && bodyWait > 0
            ? bodyWait
            : 20;
        lastError = `Firecrawl rate limit — retrying in ${waitSec}s`;
        console.warn(`Rate limited fetching ${url}; advertised wait ${waitSec}s`);
        // Honour the advertised rate-limit window (capped), but never sleep past
        // the deadline or without enough time left to perform the retry fetch.
        const waitMs = Math.min((waitSec + 2) * 1000, 45_000, Math.max(0, deadline - Date.now()));
        if (attempt >= MAX_ATTEMPTS - 1) break;
        if (deadline - Date.now() < waitMs + 5_000) break;
        await new Promise((r) => setTimeout(r, waitMs));
        continue;

      }
      if (!res.ok) {
        lastError = `Firecrawl returned ${res.status}: ${raw.slice(0, 200)}`;
        continue;
      }
      const json = JSON.parse(raw);
      const html: string | undefined = json?.data?.html ?? json?.html;
      if (!html) {
        lastError = "Firecrawl returned no HTML";
        continue;
      }
      return html;
    } catch (e) {
      lastError = e instanceof Error ? e.message : "fetch failed";
    }
  }
  throw new Error(lastError);
}
