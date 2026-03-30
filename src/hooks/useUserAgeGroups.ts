import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { faTeamConfigs } from "@/lib/faFixtureConfig";

// Build a reverse map: team_slug → age_group label
const SLUG_TO_AGE_GROUP: Record<string, string> = {};
faTeamConfigs.forEach((c) => { SLUG_TO_AGE_GROUP[c.slug] = c.team; });

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
