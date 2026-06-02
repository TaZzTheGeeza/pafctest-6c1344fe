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
  "u6s": "U6", "u7s": "U7", "u8s": "U8",
  "u9s-black": "U9 Black", "u9s-gold": "U9 Gold",
  "u10s": "U10", "u11s": "U11",
  "u12s-black": "U12 Black", "u12s-gold": "U12 Gold",
  "u14s-black": "U14 Black", "u14s-gold": "U14 Gold",
  "u15s": "U15",
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
