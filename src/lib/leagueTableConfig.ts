import { faTeamConfigs } from "./faFixtureConfig";

export interface LeagueTableConfig {
  divisionSeason?: string;
  tableUrl?: string;
  fixtureUrl?: string;
  faUrl: string;
  highlightTeams: string[];
}

/**
 * League table config per team slug (canonical CLUB_TEAMS slugs).
 *
 * Explicit entries below pin a known FA table URL. Every other U12+ team is
 * derived automatically from the same FA Full-Time fixture links used for
 * fixtures - the edge function discovers the division's table from the
 * fixture page itself, so fixtures and tables always share one source.
 */
const EXPLICIT: Record<string, LeagueTableConfig> = {
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
  // Discovered from each team's FA fixture page (same links as fixtures) -
  // all three U12 squads play in the same division.
  "u12s-black": {
    tableUrl: "https://fulltime.thefa.com/table.html?league=1137979&selectedSeason=585452548&selectedFixtureGroupAgeGroup=11&previousSelectedFixtureGroupAgeGroup=11&selectedDivision=232674486&selectedCompetition=0&selectedFixtureGroupKey=1_745511588",
    faUrl: "https://fulltime.thefa.com/table.html?league=1137979&selectedSeason=585452548&selectedFixtureGroupAgeGroup=11&previousSelectedFixtureGroupAgeGroup=11&selectedDivision=232674486&selectedCompetition=0&selectedFixtureGroupKey=1_745511588",
    highlightTeams: ["Peterborough Ath U12 Black"],
  },
  "u12s-gold": {
    tableUrl: "https://fulltime.thefa.com/table.html?league=1137979&selectedSeason=585452548&selectedFixtureGroupAgeGroup=11&previousSelectedFixtureGroupAgeGroup=11&selectedDivision=232674486&selectedCompetition=0&selectedFixtureGroupKey=1_745511588",
    faUrl: "https://fulltime.thefa.com/table.html?league=1137979&selectedSeason=585452548&selectedFixtureGroupAgeGroup=11&previousSelectedFixtureGroupAgeGroup=11&selectedDivision=232674486&selectedCompetition=0&selectedFixtureGroupKey=1_745511588",
    highlightTeams: ["Peterborough Ath U12 Gold"],
  },
  "u12s-white": {
    tableUrl: "https://fulltime.thefa.com/table.html?league=1137979&selectedSeason=585452548&selectedFixtureGroupAgeGroup=11&previousSelectedFixtureGroupAgeGroup=11&selectedDivision=232674486&selectedCompetition=0&selectedFixtureGroupKey=1_745511588",
    faUrl: "https://fulltime.thefa.com/table.html?league=1137979&selectedSeason=585452548&selectedFixtureGroupAgeGroup=11&previousSelectedFixtureGroupAgeGroup=11&selectedDivision=232674486&selectedCompetition=0&selectedFixtureGroupKey=1_745511588",
    highlightTeams: ["Peterborough Ath U12 White"],
  },
  u15s: {
    tableUrl: "https://fulltime.thefa.com/table.html?league=6486466&selectedSeason=816327485&selectedFixtureGroupAgeGroup=8&previousSelectedFixtureGroupAgeGroup=8&selectedDivision=738996122&selectedCompetition=0&selectedFixtureGroupKey=1_445949539",
    faUrl: "https://fulltime.thefa.com/table.html?league=6486466&selectedSeason=816327485&selectedFixtureGroupAgeGroup=8&previousSelectedFixtureGroupAgeGroup=8&selectedDivision=738996122&selectedCompetition=0&selectedFixtureGroupKey=1_445949539",
    highlightTeams: ["Peterborough Ath U15"],
  },
};

// FA age-group IDs: U12 = 11, U13 = 10, U14 = 9, U15 = 8. Competitive league
// football (and therefore league tables) starts at U12.
function ageGroupId(fixtureUrl: string): number | null {
  const m = fixtureUrl.match(/selectedFixtureGroupAgeGroup=(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

const derived: Record<string, LeagueTableConfig> = {};
for (const cfg of faTeamConfigs) {
  if (EXPLICIT[cfg.slug] || !cfg.fixtureUrl) continue;
  const age = ageGroupId(cfg.fixtureUrl);
  if (age === null || age > 11) continue; // younger than U12 - no league table
  derived[cfg.slug] = {
    fixtureUrl: cfg.fixtureUrl,
    faUrl: cfg.fixtureUrl,
    highlightTeams: [`Peterborough Ath ${cfg.team}`],
  };
}

export const LEAGUE_TABLE_CONFIG: Record<string, LeagueTableConfig> = {
  ...derived,
  ...EXPLICIT,
};
