// Default 48-team list for World Cup 2026.
// Admin can edit any of these. Groups (A-L) and flags pre-filled with sensible defaults;
// actual qualifiers will be confirmed by FIFA in March 2026.
export interface DefaultTeam {
  country_name: string;
  flag_emoji: string;
  group_letter: string;
}

// Host nations + likely qualifiers as placeholders. Admin must verify in March 2026.
export const DEFAULT_WORLD_CUP_2026_TEAMS: DefaultTeam[] = [
  // Hosts
  { country_name: "Canada", flag_emoji: "🇨🇦", group_letter: "A" },
  { country_name: "Mexico", flag_emoji: "🇲🇽", group_letter: "A" },
  { country_name: "USA", flag_emoji: "🇺🇸", group_letter: "D" },
  // UEFA
  { country_name: "France", flag_emoji: "🇫🇷", group_letter: "A" },
  { country_name: "England", flag_emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", group_letter: "B" },
  { country_name: "Spain", flag_emoji: "🇪🇸", group_letter: "B" },
  { country_name: "Germany", flag_emoji: "🇩🇪", group_letter: "C" },
  { country_name: "Portugal", flag_emoji: "🇵🇹", group_letter: "C" },
  { country_name: "Netherlands", flag_emoji: "🇳🇱", group_letter: "D" },
  { country_name: "Italy", flag_emoji: "🇮🇹", group_letter: "E" },
  { country_name: "Belgium", flag_emoji: "🇧🇪", group_letter: "E" },
  { country_name: "Croatia", flag_emoji: "🇭🇷", group_letter: "F" },
  { country_name: "Switzerland", flag_emoji: "🇨🇭", group_letter: "F" },
  { country_name: "Denmark", flag_emoji: "🇩🇰", group_letter: "G" },
  { country_name: "Austria", flag_emoji: "🇦🇹", group_letter: "G" },
  { country_name: "Scotland", flag_emoji: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", group_letter: "H" },
  { country_name: "Wales", flag_emoji: "🏴󠁧󠁢󠁷󠁬󠁳󠁿", group_letter: "H" },
  { country_name: "Poland", flag_emoji: "🇵🇱", group_letter: "I" },
  { country_name: "Norway", flag_emoji: "🇳🇴", group_letter: "I" },
  { country_name: "Sweden", flag_emoji: "🇸🇪", group_letter: "J" },
  { country_name: "Türkiye", flag_emoji: "🇹🇷", group_letter: "J" },
  { country_name: "Serbia", flag_emoji: "🇷🇸", group_letter: "K" },
  { country_name: "Ukraine", flag_emoji: "🇺🇦", group_letter: "K" },
  { country_name: "Republic of Ireland", flag_emoji: "🇮🇪", group_letter: "L" },
  // CONMEBOL
  { country_name: "Argentina", flag_emoji: "🇦🇷", group_letter: "B" },
  { country_name: "Brazil", flag_emoji: "🇧🇷", group_letter: "C" },
  { country_name: "Uruguay", flag_emoji: "🇺🇾", group_letter: "D" },
  { country_name: "Colombia", flag_emoji: "🇨🇴", group_letter: "E" },
  { country_name: "Ecuador", flag_emoji: "🇪🇨", group_letter: "F" },
  { country_name: "Paraguay", flag_emoji: "🇵🇾", group_letter: "G" },
  // CAF
  { country_name: "Morocco", flag_emoji: "🇲🇦", group_letter: "H" },
  { country_name: "Senegal", flag_emoji: "🇸🇳", group_letter: "I" },
  { country_name: "Egypt", flag_emoji: "🇪🇬", group_letter: "J" },
  { country_name: "Nigeria", flag_emoji: "🇳🇬", group_letter: "K" },
  { country_name: "Algeria", flag_emoji: "🇩🇿", group_letter: "L" },
  { country_name: "Ivory Coast", flag_emoji: "🇨🇮", group_letter: "L" },
  // AFC
  { country_name: "Japan", flag_emoji: "🇯🇵", group_letter: "A" },
  { country_name: "South Korea", flag_emoji: "🇰🇷", group_letter: "B" },
  { country_name: "Iran", flag_emoji: "🇮🇷", group_letter: "C" },
  { country_name: "Australia", flag_emoji: "🇦🇺", group_letter: "D" },
  { country_name: "Saudi Arabia", flag_emoji: "🇸🇦", group_letter: "E" },
  { country_name: "Qatar", flag_emoji: "🇶🇦", group_letter: "F" },
  // CONCACAF
  { country_name: "Costa Rica", flag_emoji: "🇨🇷", group_letter: "G" },
  { country_name: "Panama", flag_emoji: "🇵🇦", group_letter: "H" },
  { country_name: "Jamaica", flag_emoji: "🇯🇲", group_letter: "I" },
  // OFC
  { country_name: "New Zealand", flag_emoji: "🇳🇿", group_letter: "J" },
  // Inter-confederation play-offs
  { country_name: "Play-off Winner 1", flag_emoji: "🏆", group_letter: "K" },
  { country_name: "Play-off Winner 2", flag_emoji: "🏆", group_letter: "L" },
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
