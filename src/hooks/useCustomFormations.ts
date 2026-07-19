import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { FormationFormat, SlotDef } from "@/lib/formations";

export interface CustomFormation {
  id: string;
  user_id: string;
  team_slug: string | null;
  name: string;
  format: FormationFormat;
  slots: SlotDef[];
}

export function useCustomFormations(teamSlug: string, format: FormationFormat) {
  return useQuery({
    queryKey: ["custom-formations", teamSlug, format],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_formations")
        .select("*")
        .eq("format", format)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as CustomFormation[];
    },
  });
}

export function useInvalidateCustomFormations() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["custom-formations"] });
}
