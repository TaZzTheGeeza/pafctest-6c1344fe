import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { faTeamConfigs } from "@/lib/faFixtureConfig";

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

async function fetchTeamFixtures(slug: string): Promise<FATeamData | null> {
  const config = faTeamConfigs.find((c) => c.slug === slug);
  if (!config) return null;

  const { data, error } = await supabase.functions.invoke("scrape-fixtures", {
    body: {
      team: config.team,
      fixtureUrl: config.fixtureUrl,
      resultUrl: config.resultUrl,
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

export function useTeamFixtures(slug: string | undefined) {
  return useQuery({
    queryKey: ["fa-fixtures", slug],
    queryFn: () => fetchTeamFixtures(slug!),
    enabled: !!slug,
    staleTime: 1000 * 60 * 30, // 30 minutes cache
    retry: 1,
  });
}
