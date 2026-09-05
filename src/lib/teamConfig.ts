export interface ClubTeam {
  slug: string;
  name: string;
  ageGroup: string;
}

/**
 * Authoritative list of teams shown in the PAFC Hub.
 * Keep team UI sourced from this catalogue rather than recreating local lists.
 */
export const CLUB_TEAMS: readonly ClubTeam[] = [
  { slug: "u6s", name: "U6", ageGroup: "Under 6" },
  { slug: "u7s", name: "U7", ageGroup: "Under 7" },
  { slug: "u8s-black", name: "U8 Black", ageGroup: "Under 8" },
  { slug: "u8s-gold", name: "U8 Gold", ageGroup: "Under 8" },
  { slug: "u9s-black", name: "U9 Black", ageGroup: "Under 9" },
  { slug: "u9s-gold", name: "U9 Gold", ageGroup: "Under 9" },
  { slug: "u10s", name: "U10", ageGroup: "Under 10" },
  { slug: "u11s", name: "U11", ageGroup: "Under 11" },
  { slug: "u12s-black", name: "U12 Black", ageGroup: "Under 12" },
  { slug: "u12s-gold", name: "U12 Gold", ageGroup: "Under 12" },
  { slug: "u12s-white", name: "U12 White", ageGroup: "Under 12" },
  { slug: "u13s", name: "U13", ageGroup: "Under 13" },
  { slug: "u14s-black", name: "U14 Black", ageGroup: "Under 14" },
  { slug: "u14s-gold", name: "U14 Gold", ageGroup: "Under 14" },
  { slug: "u15s", name: "U15", ageGroup: "Under 15" },
] as const;

const LEGACY_TEAM_SLUGS: Record<string, readonly string[]> = {
  u6: ["u6s"],
  u7: ["u7s"],
  u8: ["u8s-black", "u8s-gold"],
  u8s: ["u8s-black", "u8s-gold"],
  "u8-black": ["u8s-black"],
  "u8-gold": ["u8s-gold"],
  u9: ["u9s-black", "u9s-gold"],
  u9s: ["u9s-black", "u9s-gold"],
  "u9-black": ["u9s-black"],
  "u9-gold": ["u9s-gold"],
  u10: ["u10s"],
  u11: ["u11s"],
  u12: ["u12s-black", "u12s-gold", "u12s-white"],
  u12s: ["u12s-black", "u12s-gold", "u12s-white"],
  "u12-black": ["u12s-black"],
  "u12-gold": ["u12s-gold"],
  "u12-white": ["u12s-white"],
  u13: ["u13s"],
  u14: ["u14s-black", "u14s-gold"],
  u14s: ["u14s-black", "u14s-gold"],
  "u14-black": ["u14s-black"],
  "u14-gold": ["u14s-gold"],
  u15: ["u15s"],
};

export const ALL_CLUB_TEAM_SLUGS = CLUB_TEAMS.map((team) => team.slug);

export function normalizeClubTeamSlugs(slugs: readonly string[]): string[] {
  const allowed = new Set(ALL_CLUB_TEAM_SLUGS);
  const order = new Map(ALL_CLUB_TEAM_SLUGS.map((slug, index) => [slug, index]));
  const normalized = slugs.flatMap((slug) => LEGACY_TEAM_SLUGS[slug] ?? [slug]);

  return [...new Set(normalized)]
    .filter((slug) => allowed.has(slug))
    .sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0));
}
const LEGACY_TEAM_NAMES: Record<string, readonly string[]> = {
  U6: ["U6"],
  U7: ["U7"],
  U8: ["U8 Black", "U8 Gold"],
  "U8 Black": ["U8 Black"],
  "U8 Gold": ["U8 Gold"],
  U9: ["U9 Black", "U9 Gold"],
  "U9 Black": ["U9 Black"],
  "U9 Gold": ["U9 Gold"],
  U10: ["U10"],
  U11: ["U11"],
  U12: ["U12 Black", "U12 Gold", "U12 White"],
  "U12 Black": ["U12 Black"],
  "U12 Gold": ["U12 Gold"],
  "U12 White": ["U12 White"],
  U13: ["U13"],
  U14: ["U14 Black", "U14 Gold"],
  "U14 Black": ["U14 Black"],
  "U14 Gold": ["U14 Gold"],
  U15: ["U15"],
};

/**
 * Normalize stored display names (which may be legacy values like "U8")
 * into the canonical CLUB_TEAMS names, in Hub order.
 */
export function normalizeClubTeamNames(names: readonly string[]): string[] {
  const allowed = new Set(CLUB_TEAMS.map((t) => t.name));
  const order = new Map(CLUB_TEAMS.map((t, i) => [t.name, i]));
  const normalized = names.flatMap((name) => LEGACY_TEAM_NAMES[name] ?? [name]);

  return [...new Set(normalized)]
    .filter((name) => allowed.has(name))
    .sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0));
}
