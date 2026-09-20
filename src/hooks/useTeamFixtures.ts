import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { faTeamConfigs } from "@/lib/faFixtureConfig";

interface UseTeamFixturesOptions {
  includeHistory?: boolean;
}

export interface FAFixture {
  date: string;
  time: string;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  competition: string;
  type: "fixture" | "result";
  homeScore?: number;
  awayScore?: number;
  /** Set when a coach has manually changed the time/venue for this fixture. */
  overrideNote?: string;
  isOverridden?: boolean;
}

export interface FATeamData {
  team: string;
  fixtures: FAFixture[];
  results: FAFixture[];
}

function deriveResultUrl(fixtureUrl: string) {
  return fixtureUrl.includes("/fixtures.html")
    ? fixtureUrl.replace("/fixtures.html", "/results.html")
    : undefined;
}

async function fetchTeamFixtures(
  slug: string,
  options?: UseTeamFixturesOptions,
): Promise<FATeamData | null> {
  const config = faTeamConfigs.find((c) => c.slug === slug);
  if (!config) return null;

  // Skip teams with no FA fixtures URL configured (e.g. U6)
  if (!config.fixtureUrl) {
    return { team: config.team, fixtures: [], results: [] };
  }

  const resultUrl = options?.includeHistory
    ? config.resultUrl ?? deriveResultUrl(config.fixtureUrl)
    : config.resultUrl;

  const invocation = supabase.functions.invoke("scrape-fixtures", {
    body: {
      team: config.team,
      fixtureUrl: config.fixtureUrl,
      resultUrl,
    },
  });

  // Hard client timeout - better to show an error than buffer indefinitely.
  const { data, error } = await Promise.race([
    invocation,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Fixtures are taking too long to load. Please try again.")), 45000),
    ),
  ]);

  if (error) {
    console.error("Error fetching fixtures for", slug, error);
    throw error;
  }


  if (!data?.success) {
    throw new Error(data?.error || "Failed to fetch fixtures");
  }

  const fixtures: FAFixture[] = data.fixtures || [];
  const results: FAFixture[] = data.results || [];

  // Coaches can override kick-off time / venue for last minute changes.
  const { data: overrides } = await supabase
    .from("fa_fixture_overrides")
    .select("fixture_date, opponent, kickoff_time, venue, note")
    .eq("team_slug", slug);

  const applyOverrides = (list: FAFixture[]) =>
    list.map((f) => {
      const isHome = f.homeTeam.includes("Peterborough Ath");
      const opponent = isHome ? f.awayTeam : f.homeTeam;
      const o = (overrides ?? []).find(
        (x) => x.fixture_date === f.date && x.opponent === opponent,
      );
      if (!o) return f;
      return {
        ...f,
        time: o.kickoff_time || f.time,
        venue: o.venue || f.venue,
        overrideNote: o.note || undefined,
        isOverridden: true,
      } as FAFixture;
    });

  return {
    team: config.team,
    fixtures: applyOverrides(fixtures),
    results: applyOverrides(results),
  };
}

export function useTeamFixtures(
  slug: string | undefined,
  options?: UseTeamFixturesOptions,
) {
  return useQuery({
    queryKey: ["fa-fixtures", slug, options?.includeHistory ? "history" : "live"],
    queryFn: () => fetchTeamFixtures(slug!, options),
    enabled: !!slug,
    staleTime: 1000 * 60 * 30, // 30 minutes cache
    retry: 1,
  });
}
