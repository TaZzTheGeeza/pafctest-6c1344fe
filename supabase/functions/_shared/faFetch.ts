// Fetches FA Full-Time pages. The FA site sits behind Cloudflare bot protection and
// returns 403 to plain server-side requests, so we route through Firecrawl (gateway-backed).
const FIRECRAWL_GATEWAY = "https://connector-gateway.lovable.dev/firecrawl/v2";

export async function fetchFaHtml(url: string): Promise<string> {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!lovableKey || !firecrawlKey) {
    throw new Error("Fixture scraping is not configured (missing Firecrawl connection)");
  }

  let lastError = "fetch failed";
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 1000));
    try {
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
      });

      const raw = await res.text();
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
