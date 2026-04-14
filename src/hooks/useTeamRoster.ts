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
  "u6s": "U6", "u7s": "U7", "u8s-black": "U8 Black", "u8s-gold": "U8 Gold",
  "u9s": "U9", "u10s": "U10", "u11s-black": "U11 Black",
  "u11s-gold": "U11 Gold", "u13s-black": "U13 Black", "u13s-gold": "U13 Gold",
  "u14s": "U14",
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
