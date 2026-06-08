import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Returns whether Player Registration is currently open.
 * Controlled by site_settings.key = 'registration_open'.
 * Admins toggle from the Dashboard.
 */
export function useRegistrationOpen() {
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("site_settings" as any)
        .select("value")
        .eq("key", "registration_open")
        .maybeSingle();
      if (!cancelled) {
        setOpen((data as any)?.value === "true");
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { open, loading };
}
