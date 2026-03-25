import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RosterPlayer {
  id: string;
  first_name: string;
  shirt_number: number | null;
  age_group: string;
  team_name: string;
}

const ageGroupMap: Record<string, string> = {
  "u7s": "Under 7", "u8s-black": "Under 8", "u8s-gold": "Under 8",
  "u9s": "Under 9", "u10s": "Under 10", "u11s-black": "Under 11",
  "u11s-gold": "Under 11", "u13s-black": "Under 13", "u13s-gold": "Under 13",
  "u14s": "Under 14",
};

export function getAgeGroup(teamSlug: string): string {
  return ageGroupMap[teamSlug] || teamSlug;
}

export function useTeamRoster(teamSlug: string) {
  const ageGroup = getAgeGroup(teamSlug);

  return useQuery<RosterPlayer[]>({
    queryKey: ["team-roster", teamSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("player_stats")
        .select("id, first_name, shirt_number, age_group, team_name")
        .eq("age_group", ageGroup)
        .order("shirt_number", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data || [];
    },
  });
}
