import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Returns whether the Tournament feature is enabled site-wide.
 * Controlled by site_settings.key = 'tournament_enabled'.
 * Admins can toggle from the Dashboard.
 */
export function useTournamentEnabled() {
  const [enabled, setEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("site_settings" as any)
        .select("value")
        .eq("key", "tournament_enabled")
        .maybeSingle();
      if (!cancelled) {
        setEnabled((data as any)?.value === "true");
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { enabled, loading };
}
