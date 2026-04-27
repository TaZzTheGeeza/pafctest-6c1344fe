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

  const { data, error } = await supabase.functions.invoke("scrape-fixtures", {
    body: {
      team: config.team,
      fixtureUrl: config.fixtureUrl,
      resultUrl,
    },
  });

  if (error) {
    console.error("Error fetching fixtures for", slug, error);
    throw error;
  }

  if (!data?.success) {
    throw new Error(data?.error || "Failed to fetch fixtures");
  }

  return {
    team: config.team,
    fixtures: data.fixtures || [],
    results: data.results || [],
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
