export interface FAFixtureConfig {
  team: string;
  slug: string;
  fixtureUrl: string;
  resultUrl?: string;
}

const season = "585452548";
const base = "https://fulltime.thefa.com";
const CLUB = "726869064";

function buildUrl(
  page: "fixtures" | "results",
  ageGroup: string,
  teamId: string,
  seasonId: string = season,
): string {
  const params: Record<string, string> = {
    selectedSeason: seasonId,
    selectedFixtureGroupAgeGroup: ageGroup,
    selectedFixtureGroupKey: "",
    selectedDateCode: "all",
    selectedClub: CLUB,
    selectedTeam: teamId,
    selectedRelatedFixtureOption: "3",
    selectedFixtureDateStatus: "",
    selectedFixtureStatus: "",
    previousSelectedFixtureGroupAgeGroup: ageGroup,
    previousSelectedFixtureGroupKey: "",
    previousSelectedClub: CLUB,
    itemsPerPage: "100",
  };
  const qs = Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  return `${base}/${page}.html?${qs}`;
}

function team(
  name: string,
  slug: string,
  ageGroup: string,
  teamId: string,
  seasonId: string = season,
): FAFixtureConfig {
  return {
    team: name,
    slug,
    fixtureUrl: buildUrl("fixtures", ageGroup, teamId, seasonId),
    resultUrl: buildUrl("results", ageGroup, teamId, seasonId),
  };
}

export const faTeamConfigs: FAFixtureConfig[] = [
  { team: "U6", slug: "u6s", fixtureUrl: "" },
  // U7 is club-wide (no individual team ID on FA Full-Time)
  team("U7", "u7s", "16", ""),
  team("U8 Black", "u8s-black", "15", "345191842"),
  team("U8 Gold", "u8s-gold", "15", "56750923"),
  team("U9 Black", "u9s-black", "14", "451067648"),
  team("U9 Gold", "u9s-gold", "14", "665211326"),
  team("U10", "u10s", "13", "795452180"),
  team("U11", "u11s", "12", "522060339"),
  team("U12 Black", "u12s-black", "11", "335339841"),
  team("U12 Gold", "u12s-gold", "11", "50394118"),
  team("U12 White", "u12s-white", "11", "560859193"),
  team("U13", "u13s", "10", "104052800"),
  team("U14 Black", "u14s-black", "9", "979694431"),
  team("U14 Gold", "u14s-gold", "9", "997093003"),
  // U15 — league uses a different FA season ID and no club filter
  {
    team: "U15",
    slug: "u15s",
    fixtureUrl:
      "https://fulltime.thefa.com/fixtures.html?selectedSeason=816327485&selectedFixtureGroupAgeGroup=8&selectedFixtureGroupKey=&selectedDateCode=all&selectedClub=&selectedTeam=796957227&selectedRelatedFixtureOption=3&selectedFixtureDateStatus=&selectedFixtureStatus=&previousSelectedFixtureGroupAgeGroup=8&previousSelectedFixtureGroupKey=&previousSelectedClub=&itemsPerPage=100",
    resultUrl:
      "https://fulltime.thefa.com/results.html?selectedSeason=816327485&selectedFixtureGroupAgeGroup=8&selectedFixtureGroupKey=&selectedDateCode=all&selectedClub=&selectedTeam=796957227&selectedRelatedFixtureOption=3&selectedFixtureDateStatus=&selectedFixtureStatus=&previousSelectedFixtureGroupAgeGroup=8&previousSelectedFixtureGroupKey=&previousSelectedClub=&itemsPerPage=100",
  },
];
