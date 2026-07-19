export type FormationFormat = "5v5" | "7v7" | "9v9" | "11v11";

export interface SlotDef {
  id: string; // unique within formation
  label: string; // e.g. "GK", "LB", "CM"
  x: number; // 0-100 (left→right)
  y: number; // 0-100 (0=own goal, 100=opp goal)
}

export interface Formation {
  name: string;
  format: FormationFormat;
  slots: SlotDef[];
}

const gk = (): SlotDef => ({ id: "gk", label: "GK", x: 50, y: 8 });

export const FORMATIONS: Formation[] = [
  // ============ 5v5 (GK + 4 outfield) ============
  { name: "1-2-1", format: "5v5", slots: [
    gk(),
    { id: "d",   label: "DEF", x: 50, y: 28 },
    { id: "ml",  label: "MID", x: 28, y: 55 },
    { id: "mr",  label: "MID", x: 72, y: 55 },
    { id: "f",   label: "FWD", x: 50, y: 82 },
  ]},
  { name: "2-1-1", format: "5v5", slots: [
    gk(),
    { id: "dl",  label: "DEF", x: 30, y: 28 },
    { id: "dr",  label: "DEF", x: 70, y: 28 },
    { id: "m",   label: "MID", x: 50, y: 55 },
    { id: "f",   label: "FWD", x: 50, y: 82 },
  ]},
  { name: "1-1-2", format: "5v5", slots: [
    gk(),
    { id: "d",   label: "DEF", x: 50, y: 28 },
    { id: "m",   label: "MID", x: 50, y: 55 },
    { id: "fl",  label: "FWD", x: 32, y: 82 },
    { id: "fr",  label: "FWD", x: 68, y: 82 },
  ]},

  // ============ 7v7 (GK + 6 outfield) ============
  { name: "2-3-1", format: "7v7", slots: [
    gk(),
    { id: "dl",  label: "DEF", x: 30, y: 26 },
    { id: "dr",  label: "DEF", x: 70, y: 26 },
    { id: "ml",  label: "MID", x: 20, y: 55 },
    { id: "mc",  label: "MID", x: 50, y: 55 },
    { id: "mr",  label: "MID", x: 80, y: 55 },
    { id: "f",   label: "FWD", x: 50, y: 84 },
  ]},
  { name: "3-2-1", format: "7v7", slots: [
    gk(),
    { id: "dl",  label: "DEF", x: 22, y: 26 },
    { id: "dc",  label: "DEF", x: 50, y: 26 },
    { id: "dr",  label: "DEF", x: 78, y: 26 },
    { id: "ml",  label: "MID", x: 35, y: 55 },
    { id: "mr",  label: "MID", x: 65, y: 55 },
    { id: "f",   label: "FWD", x: 50, y: 84 },
  ]},
  { name: "2-2-2", format: "7v7", slots: [
    gk(),
    { id: "dl",  label: "DEF", x: 30, y: 26 },
    { id: "dr",  label: "DEF", x: 70, y: 26 },
    { id: "ml",  label: "MID", x: 30, y: 55 },
    { id: "mr",  label: "MID", x: 70, y: 55 },
    { id: "fl",  label: "FWD", x: 35, y: 84 },
    { id: "fr",  label: "FWD", x: 65, y: 84 },
  ]},

  // ============ 9v9 (GK + 8 outfield) ============
  { name: "3-2-3", format: "9v9", slots: [
    gk(),
    { id: "dl",  label: "DEF", x: 22, y: 25 },
    { id: "dc",  label: "DEF", x: 50, y: 25 },
    { id: "dr",  label: "DEF", x: 78, y: 25 },
    { id: "ml",  label: "MID", x: 35, y: 52 },
    { id: "mr",  label: "MID", x: 65, y: 52 },
    { id: "fl",  label: "FWD", x: 22, y: 80 },
    { id: "fc",  label: "FWD", x: 50, y: 82 },
    { id: "fr",  label: "FWD", x: 78, y: 80 },
  ]},
  { name: "3-3-2", format: "9v9", slots: [
    gk(),
    { id: "dl",  label: "DEF", x: 22, y: 25 },
    { id: "dc",  label: "DEF", x: 50, y: 25 },
    { id: "dr",  label: "DEF", x: 78, y: 25 },
    { id: "ml",  label: "MID", x: 25, y: 52 },
    { id: "mc",  label: "MID", x: 50, y: 52 },
    { id: "mr",  label: "MID", x: 75, y: 52 },
    { id: "fl",  label: "FWD", x: 38, y: 82 },
    { id: "fr",  label: "FWD", x: 62, y: 82 },
  ]},
  { name: "2-4-2", format: "9v9", slots: [
    gk(),
    { id: "dl",  label: "DEF", x: 30, y: 25 },
    { id: "dr",  label: "DEF", x: 70, y: 25 },
    { id: "mll", label: "MID", x: 18, y: 52 },
    { id: "mcl", label: "MID", x: 42, y: 52 },
    { id: "mcr", label: "MID", x: 58, y: 52 },
    { id: "mrr", label: "MID", x: 82, y: 52 },
    { id: "fl",  label: "FWD", x: 38, y: 82 },
    { id: "fr",  label: "FWD", x: 62, y: 82 },
  ]},

  // ============ 11v11 (GK + 10 outfield) ============
  { name: "4-3-3", format: "11v11", slots: [
    gk(),
    { id: "lb", label: "DEF", x: 18, y: 22 },
    { id: "lcb", label: "DEF", x: 40, y: 22 },
    { id: "rcb", label: "DEF", x: 60, y: 22 },
    { id: "rb", label: "DEF", x: 82, y: 22 },
    { id: "lcm", label: "MID", x: 30, y: 50 },
    { id: "cm",  label: "MID", x: 50, y: 50 },
    { id: "rcm", label: "MID", x: 70, y: 50 },
    { id: "lw",  label: "FWD", x: 22, y: 80 },
    { id: "st",  label: "FWD", x: 50, y: 82 },
    { id: "rw",  label: "FWD", x: 78, y: 80 },
  ]},
  { name: "4-4-2", format: "11v11", slots: [
    gk(),
    { id: "lb", label: "DEF", x: 18, y: 22 },
    { id: "lcb", label: "DEF", x: 40, y: 22 },
    { id: "rcb", label: "DEF", x: 60, y: 22 },
    { id: "rb", label: "DEF", x: 82, y: 22 },
    { id: "lm", label: "MID", x: 18, y: 50 },
    { id: "lcm", label: "MID", x: 40, y: 50 },
    { id: "rcm", label: "MID", x: 60, y: 50 },
    { id: "rm", label: "MID", x: 82, y: 50 },
    { id: "sl", label: "FWD", x: 38, y: 82 },
    { id: "sr", label: "FWD", x: 62, y: 82 },
  ]},
  { name: "3-5-2", format: "11v11", slots: [
    gk(),
    { id: "lcb", label: "DEF", x: 28, y: 22 },
    { id: "cb",  label: "DEF", x: 50, y: 22 },
    { id: "rcb", label: "DEF", x: 72, y: 22 },
    { id: "lwb", label: "MID", x: 12, y: 50 },
    { id: "lcm", label: "MID", x: 34, y: 50 },
    { id: "cm",  label: "MID", x: 50, y: 50 },
    { id: "rcm", label: "MID", x: 66, y: 50 },
    { id: "rwb", label: "MID", x: 88, y: 50 },
    { id: "sl",  label: "FWD", x: 38, y: 82 },
    { id: "sr",  label: "FWD", x: 62, y: 82 },
  ]},
];

export function formatForTeam(teamSlug: string): FormationFormat {
  const s = (teamSlug || "").toLowerCase();
  if (/(^|-)(u6|u6s|u7|u7s|u8|u8s|u8s-black|u8s-gold)($|-)/.test(s) || s === "u6" || s === "u7" || s === "u8" || s.startsWith("u6") || s.startsWith("u7") || s.startsWith("u8")) return "5v5";
  if (s.startsWith("u9") || s.startsWith("u10")) return "7v7";
  if (s.startsWith("u11") || s.startsWith("u12")) return "9v9";
  return "11v11";
}

export function getFormationsForFormat(fmt: FormationFormat): Formation[] {
  return FORMATIONS.filter((f) => f.format === fmt);
}

export function findFormation(name: string, fmt: FormationFormat): Formation | undefined {
  return FORMATIONS.find((f) => f.format === fmt && f.name === name);
}
