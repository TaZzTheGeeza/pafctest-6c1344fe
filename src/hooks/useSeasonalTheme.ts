import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SeasonalTheme = "off" | "halloween" | "christmas";
export const parseSeasonalTheme = (value: unknown): SeasonalTheme =>
  value === "halloween" || value === "christmas" ? value : "off";

export function useSeasonalTheme() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["seasonal-theme"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings")
        .select("value").eq("key", "seasonal_theme").maybeSingle();
      if (error) throw error;
      return parseSeasonalTheme(data?.value);
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
  const mutation = useMutation({
    mutationFn: async (theme: SeasonalTheme) => {
      const { error } = await supabase.from("site_settings").upsert({
        key: "seasonal_theme", value: theme, updated_at: new Date().toISOString(),
      }, { onConflict: "key" });
      if (error) throw error;
      return theme;
    },
    onSuccess: (theme) => queryClient.setQueryData(["seasonal-theme"], theme),
  });
  return { theme: query.data ?? "off", loading: query.isPending, error: query.isError,
    saving: mutation.isPending, setTheme: mutation.mutateAsync, refetch: query.refetch };
}