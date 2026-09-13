export interface LeagueTableConfig {
  divisionSeason?: string;
  tableUrl?: string;
  faUrl: string;
  highlightTeams: string[];
}

/**
 * FA Full-Time league table config per team slug (canonical CLUB_TEAMS slugs).
 * Only teams whose age group plays competitive league football (U12+) have tables.
 */
export const LEAGUE_TABLE_CONFIG: Record<string, LeagueTableConfig> = {
  u13s: {
    divisionSeason: "189349138",
    faUrl: "https://fulltime.thefa.com/table.html?divisionseason=189349138",
    highlightTeams: ["Peterborough Ath U13"],
  },
  "u14s-black": {
    tableUrl: "https://fulltime.thefa.com/table.html?selectedSeason=233257866&selectedDivision=682264182&activeTab=1",
    faUrl: "https://fulltime.thefa.com/table.html?selectedSeason=233257866&selectedDivision=682264182&activeTab=1",
    highlightTeams: ["Peterborough Ath U14 Black"],
  },
  "u14s-gold": {
    tableUrl: "https://fulltime.thefa.com/table.html?selectedSeason=233257866&selectedDivision=682264182&activeTab=1",
    faUrl: "https://fulltime.thefa.com/table.html?selectedSeason=233257866&selectedDivision=682264182&activeTab=1",
    highlightTeams: ["Peterborough Ath U14 Gold"],
  },
};
