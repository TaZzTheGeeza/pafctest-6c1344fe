import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useUserAgeGroups() {
  const { user, isAdmin } = useAuth();

  const { data: assignedGroups = [], isLoading } = useQuery({
    queryKey: ["user-age-groups", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_age_groups")
        .select("age_group")
        .eq("user_id", user.id);
      if (error) throw error;
      return data.map((r) => r.age_group);
    },
    enabled: !!user,
  });

  // Admins see all age groups, coaches only see their assigned ones
  return { assignedGroups, isLoading, isAdmin };
}
