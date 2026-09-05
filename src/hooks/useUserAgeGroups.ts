import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { faTeamConfigs } from "@/lib/faFixtureConfig";
import { normalizeClubTeamNames } from "@/lib/teamConfig";

// Build a reverse map: team_slug → age_group label (including common non-canonical variants)
const SLUG_TO_AGE_GROUP: Record<string, string> = {};
faTeamConfigs.forEach((c) => { SLUG_TO_AGE_GROUP[c.slug] = c.team; });
// Add non-canonical slug variants that exist in team_members
const SLUG_VARIANTS: Record<string, string> = {
  "u6": "U6", "u7": "U7", "u8": "U8",
  "u9-black": "U9 Black", "u9-gold": "U9 Gold",
  "u10": "U10", "u11": "U11",
  "u12-black": "U12 Black", "u12-gold": "U12 Gold", "u12-white": "U12 White", "u12s-white": "U12 White",
  "u13": "U13", "u13s": "U13",
  "u14-black": "U14 Black", "u14-gold": "U14 Gold",
  "u15": "U15",
};
Object.entries(SLUG_VARIANTS).forEach(([slug, ag]) => {
  if (!SLUG_TO_AGE_GROUP[slug]) SLUG_TO_AGE_GROUP[slug] = ag;
});

export function useUserAgeGroups() {
  const { user, isAdmin } = useAuth();

  const { data: assignedGroups = [], isLoading } = useQuery({
    queryKey: ["user-age-groups", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // First check user_age_groups table
      const { data: uagData } = await supabase
        .from("user_age_groups")
        .select("age_group")
        .eq("user_id", user.id);

      const ageGroups = new Set((uagData || []).map((r) => r.age_group));

      // Also check team_members for any team assignments (covers coaches without user_age_groups entries)
      const { data: tmData } = await supabase
        .from("team_members")
        .select("team_slug")
        .eq("user_id", user.id);

      if (tmData) {
        for (const tm of tmData) {
          const ag = SLUG_TO_AGE_GROUP[tm.team_slug];
          if (ag) ageGroups.add(ag);
        }
      }

      return Array.from(ageGroups);
    },
    enabled: !!user,
  });

  // Admins see all age groups, coaches only see their assigned ones
  return { assignedGroups, isLoading, isAdmin };
}
