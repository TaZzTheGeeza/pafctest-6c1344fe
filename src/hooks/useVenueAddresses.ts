import { useEffect, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const normalise = (v: string) => v.replace(/\s+/g, " ").trim().toUpperCase();

/**
 * FA Full-Time only publishes a venue *name* (e.g. "WESTRAY PARK"), which sends
 * Google Maps to similarly named places in other towns. This hook resolves each
 * venue to a full postal address (with postcode), stored once in
 * `venue_address_overrides` and reused everywhere directions are offered.
 */
export function useVenueAddresses(venues: (string | null | undefined)[]) {
  const queryClient = useQueryClient();
  const requested = useRef<Set<string>>(new Set());

  const uniqueVenues = useMemo(() => {
    const set = new Set<string>();
    for (const v of venues) {
      const clean = (v ?? "").replace(/\s+/g, " ").trim();
      if (clean.length >= 3) set.add(clean);
    }
    return [...set].sort();
  }, [venues]);

  const { data: overrides = [] } = useQuery({
    queryKey: ["venue-overrides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("venue_address_overrides")
        .select("venue_name, full_address");
      if (error) throw error;
      return (data ?? []) as { venue_name: string; full_address: string }[];
    },
    staleTime: 1000 * 60 * 60,
  });

  const addressMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const o of overrides) {
      if (o.full_address) map[normalise(o.venue_name)] = o.full_address;
    }
    return map;
  }, [overrides]);

  useEffect(() => {
    const missing = uniqueVenues.filter(
      (v) => !addressMap[normalise(v)] && !requested.current.has(normalise(v)),
    );
    if (missing.length === 0) return;
    missing.forEach((v) => requested.current.add(normalise(v)));

    let cancelled = false;
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return;
      const { data, error } = await supabase.functions.invoke("resolve-venue-addresses", {
        body: { venues: missing },
      });
      if (cancelled || error) return;
      if (data?.addresses && Object.keys(data.addresses).length > 0) {
        queryClient.invalidateQueries({ queryKey: ["venue-overrides"] });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uniqueVenues, addressMap, queryClient]);

  const getDirectionsAddress = (venue: string | null | undefined) => {
    const clean = (venue ?? "").replace(/\s+/g, " ").trim();
    if (!clean) return "";
    return addressMap[normalise(clean)] || `${clean}, UK`;
  };

  return { addressMap, getDirectionsAddress };
}
