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
  "u7s": "U7s", "u8s-black": "U8s Black", "u8s-gold": "U8s Gold",
  "u9s": "U9s", "u10s": "U10s", "u11s-black": "U11s Black",
  "u11s-gold": "U11s Gold", "u13s-black": "U13s Black", "u13s-gold": "U13s Gold",
  "u14s": "U14s",
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
