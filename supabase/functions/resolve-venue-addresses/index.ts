import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

// Restrict venue lookups to the club's catchment area (Peterborough, South Lincs,
// Cambs, Rutland, Northants) so similarly named places elsewhere are never matched.
const SEARCH_AREA = {
  low: { latitude: 52.0, longitude: -1.3 },
  high: { latitude: 53.3, longitude: 0.6 },
};

const norm = (s: string) => s.replace(/\s+/g, " ").trim().toUpperCase();

interface PlaceResult {
  formattedAddress?: string;
  shortFormattedAddress?: string;
  displayName?: { text?: string };
}

async function searchPlace(query: string, lovableKey: string, mapsKey: string): Promise<string | null> {
  const res = await fetch(`${GATEWAY_URL}/places/v1/places:searchText`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": mapsKey,
      "Content-Type": "application/json",
      "X-Goog-FieldMask": "places.formattedAddress,places.shortFormattedAddress,places.displayName",
    },
    body: JSON.stringify({
      textQuery: query,
      regionCode: "GB",
      maxResultCount: 1,
      locationRestriction: { rectangle: SEARCH_AREA },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`Places lookup failed for "${query}" [${res.status}]: ${body.slice(0, 300)}`);
    return null;
  }

  const json = await res.json();
  const place: PlaceResult | undefined = json?.places?.[0];
  const address = place?.formattedAddress || place?.shortFormattedAddress;
  if (!address) return null;

  const name = place?.displayName?.text?.trim();
  // Prefix the place name when the address doesn't already carry it — keeps
  // "Itter Park" style ground names attached to the postal address.
  return name && !address.toUpperCase().includes(name.toUpperCase())
    ? `${name}, ${address}`
    : address;
}

/** How much of the venue name appears in a candidate address (0-1). */
function matchScore(venue: string, candidate: string): number {
  const words = venue.toUpperCase().match(/[A-Z]{3,}/g) ?? [];
  if (!words.length) return 0;
  const hay = candidate.toUpperCase();
  const hits = words.filter((w) => hay.includes(w.replace(/S$/, ""))).length;
  return hits / words.length;
}

async function lookupAddress(venue: string): Promise<string | null> {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const mapsKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
  if (!lovableKey || !mapsKey) return null;

  // Try a sports-context query and a plain one, then keep whichever result
  // matches the venue name best — sports context finds grounds, the plain
  // query wins for named schools and parks.
  const [sporty, plain] = await Promise.all([
    searchPlace(`${venue} football ground`, lovableKey, mapsKey),
    searchPlace(`${venue}, United Kingdom`, lovableKey, mapsKey),
  ]);
  if (!sporty) return plain;
  if (!plain) return sporty;
  return matchScore(venue, plain) > matchScore(venue, sporty) ? plain : sporty;
}



Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: claims, error: claimsErr } = await userClient.auth.getClaims(
    authHeader.replace("Bearer ", ""),
  );
  if (claimsErr || !claims?.claims?.sub) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const raw = Array.isArray(body?.venues) ? body.venues : [];
    const venues = [...new Set(
      raw
        .filter((v: unknown): v is string => typeof v === "string")
        .map((v: string) => v.replace(/\s+/g, " ").trim())
        .filter((v: string) => v.length >= 3 && v.length <= 200),
    )].slice(0, 40);

    if (venues.length === 0) {
      return new Response(JSON.stringify({ addresses: {} }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: existing } = await admin
      .from("venue_address_overrides")
      .select("venue_name, full_address");

    const known = new Map<string, string>();
    for (const row of existing ?? []) {
      if (row.full_address) known.set(norm(row.venue_name), row.full_address);
    }

    const addresses: Record<string, string> = {};
    const missing: string[] = [];
    for (const v of venues) {
      const hit = known.get(norm(v));
      if (hit) addresses[v] = hit;
      else missing.push(v);
    }

    for (const venue of missing) {
      try {
        const resolved = await lookupAddress(venue);
        if (!resolved) continue;
        addresses[venue] = resolved;
        await admin.from("venue_address_overrides").upsert(
          {
            venue_name: venue,
            full_address: resolved,
            source: "auto",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "venue_name" },
        );
      } catch (e) {
        console.error(`Failed resolving venue "${venue}":`, e);
      }
    }

    return new Response(JSON.stringify({ addresses }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("resolve-venue-addresses error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
