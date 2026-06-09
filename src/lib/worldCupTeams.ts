// Default 48-team list for World Cup 2026.
// Admin can edit any of these. Groups (A-L) and flags pre-filled with sensible defaults;
// actual qualifiers will be confirmed by FIFA in March 2026.
export interface DefaultTeam {
  country_name: string;
  flag_emoji: string;
  group_letter: string;
}

// Confirmed FIFA World Cup 2026 final draw (April 2026).
// 12 groups of 4 — host nations Mexico (A), Canada (B), USA (D).
export const DEFAULT_WORLD_CUP_2026_TEAMS: DefaultTeam[] = [
  // Group A
  { country_name: "Mexico", flag_emoji: "🇲🇽", group_letter: "A" },
  { country_name: "South Korea", flag_emoji: "🇰🇷", group_letter: "A" },
  { country_name: "South Africa", flag_emoji: "🇿🇦", group_letter: "A" },
  { country_name: "Czechia", flag_emoji: "🇨🇿", group_letter: "A" },
  // Group B
  { country_name: "Canada", flag_emoji: "🇨🇦", group_letter: "B" },
  { country_name: "Switzerland", flag_emoji: "🇨🇭", group_letter: "B" },
  { country_name: "Qatar", flag_emoji: "🇶🇦", group_letter: "B" },
  { country_name: "Bosnia-Herzegovina", flag_emoji: "🇧🇦", group_letter: "B" },
  // Group C
  { country_name: "Brazil", flag_emoji: "🇧🇷", group_letter: "C" },
  { country_name: "Morocco", flag_emoji: "🇲🇦", group_letter: "C" },
  { country_name: "Scotland", flag_emoji: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", group_letter: "C" },
  { country_name: "Haiti", flag_emoji: "🇭🇹", group_letter: "C" },
  // Group D
  { country_name: "USA", flag_emoji: "🇺🇸", group_letter: "D" },
  { country_name: "Paraguay", flag_emoji: "🇵🇾", group_letter: "D" },
  { country_name: "Australia", flag_emoji: "🇦🇺", group_letter: "D" },
  { country_name: "Türkiye", flag_emoji: "🇹🇷", group_letter: "D" },
  // Group E
  { country_name: "Germany", flag_emoji: "🇩🇪", group_letter: "E" },
  { country_name: "Ecuador", flag_emoji: "🇪🇨", group_letter: "E" },
  { country_name: "Ivory Coast", flag_emoji: "🇨🇮", group_letter: "E" },
  { country_name: "Curaçao", flag_emoji: "🇨🇼", group_letter: "E" },
  // Group F
  { country_name: "Netherlands", flag_emoji: "🇳🇱", group_letter: "F" },
  { country_name: "Japan", flag_emoji: "🇯🇵", group_letter: "F" },
  { country_name: "Tunisia", flag_emoji: "🇹🇳", group_letter: "F" },
  { country_name: "Sweden", flag_emoji: "🇸🇪", group_letter: "F" },
  // Group G
  { country_name: "Belgium", flag_emoji: "🇧🇪", group_letter: "G" },
  { country_name: "Iran", flag_emoji: "🇮🇷", group_letter: "G" },
  { country_name: "Egypt", flag_emoji: "🇪🇬", group_letter: "G" },
  { country_name: "New Zealand", flag_emoji: "🇳🇿", group_letter: "G" },
  // Group H
  { country_name: "Spain", flag_emoji: "🇪🇸", group_letter: "H" },
  { country_name: "Uruguay", flag_emoji: "🇺🇾", group_letter: "H" },
  { country_name: "Saudi Arabia", flag_emoji: "🇸🇦", group_letter: "H" },
  { country_name: "Cape Verde", flag_emoji: "🇨🇻", group_letter: "H" },
  // Group I
  { country_name: "France", flag_emoji: "🇫🇷", group_letter: "I" },
  { country_name: "Senegal", flag_emoji: "🇸🇳", group_letter: "I" },
  { country_name: "Norway", flag_emoji: "🇳🇴", group_letter: "I" },
  { country_name: "Iraq", flag_emoji: "🇮🇶", group_letter: "I" },
  // Group J
  { country_name: "Argentina", flag_emoji: "🇦🇷", group_letter: "J" },
  { country_name: "Austria", flag_emoji: "🇦🇹", group_letter: "J" },
  { country_name: "Algeria", flag_emoji: "🇩🇿", group_letter: "J" },
  { country_name: "Jordan", flag_emoji: "🇯🇴", group_letter: "J" },
  // Group K
  { country_name: "Portugal", flag_emoji: "🇵🇹", group_letter: "K" },
  { country_name: "Colombia", flag_emoji: "🇨🇴", group_letter: "K" },
  { country_name: "Uzbekistan", flag_emoji: "🇺🇿", group_letter: "K" },
  { country_name: "DR Congo", flag_emoji: "🇨🇩", group_letter: "K" },
  // Group L
  { country_name: "England", flag_emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", group_letter: "L" },
  { country_name: "Croatia", flag_emoji: "🇭🇷", group_letter: "L" },
  { country_name: "Panama", flag_emoji: "🇵🇦", group_letter: "L" },
  { country_name: "Ghana", flag_emoji: "🇬🇭", group_letter: "L" },
];


export const SWEEPSTAKE_STATUSES = [
  { value: "active", label: "In Tournament", color: "bg-foreground/10 text-foreground" },
  { value: "advanced", label: "Advanced ⬆", color: "bg-green-500/20 text-green-400" },
  { value: "eliminated", label: "Eliminated ✕", color: "bg-red-500/20 text-red-400" },
  { value: "third", label: "3rd Place 🥉", color: "bg-amber-700/20 text-amber-500" },
  { value: "runner_up", label: "Runner-up 🥈", color: "bg-slate-400/20 text-slate-300" },
  { value: "champion", label: "Champion 🏆", color: "bg-primary/30 text-primary" },
  { value: "golden_boot", label: "Golden Boot ⚽", color: "bg-yellow-500/20 text-yellow-400" },
] as const;

export type SweepstakeStatus = typeof SWEEPSTAKE_STATUSES[number]["value"];
