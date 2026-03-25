export interface FAFixtureConfig {
  team: string;
  slug: string;
  fixtureUrl: string;
  resultUrl: string;
}

const season = "233257866";
const base = "https://fulltime.thefa.com";

function buildUrl(page: "fixtures" | "results", params: Record<string, string>): string {
  const defaults: Record<string, string> = {
    selectedSeason: season,
    selectedDateCode: "all",
    selectedRelatedFixtureOption: "3",
    selectedFixtureDateStatus: "",
    selectedFixtureStatus: "",
    itemsPerPage: "100",
  };
  const merged = { ...defaults, ...params };
  const qs = Object.entries(merged)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  return `${base}/${page}.html?${qs}`;
}

export const faTeamConfigs: FAFixtureConfig[] = [
  {
    team: "U7s",
    slug: "u7s",
    fixtureUrl: buildUrl("fixtures", {
      selectedFixtureGroupAgeGroup: "0",
      selectedFixtureGroupKey: "1_496367219",
      selectedClub: "726869064",
      selectedTeam: "",
      previousSelectedFixtureGroupAgeGroup: "",
      previousSelectedFixtureGroupKey: "1_496367219",
      previousSelectedClub: "",
    }),
    resultUrl: buildUrl("results", {
      selectedFixtureGroupAgeGroup: "0",
      selectedFixtureGroupKey: "1_496367219",
      selectedClub: "726869064",
      selectedTeam: "",
      previousSelectedFixtureGroupAgeGroup: "",
      previousSelectedFixtureGroupKey: "1_496367219",
      previousSelectedClub: "",
    }),
  },
  {
    team: "U8s Black",
    slug: "u8s-black",
    fixtureUrl: buildUrl("fixtures", {
      selectedFixtureGroupAgeGroup: "15",
      selectedFixtureGroupKey: "",
      selectedClub: "",
      selectedTeam: "451067648",
      previousSelectedFixtureGroupAgeGroup: "15",
      previousSelectedFixtureGroupKey: "",
      previousSelectedClub: "726869064",
    }),
    resultUrl: buildUrl("results", {
      selectedFixtureGroupAgeGroup: "15",
      selectedFixtureGroupKey: "",
      selectedClub: "",
      selectedTeam: "451067648",
      previousSelectedFixtureGroupAgeGroup: "15",
      previousSelectedFixtureGroupKey: "",
      previousSelectedClub: "726869064",
    }),
  },
  {
    team: "U8s Gold",
    slug: "u8s-gold",
    fixtureUrl: buildUrl("fixtures", {
      selectedFixtureGroupAgeGroup: "15",
      selectedFixtureGroupKey: "",
      selectedClub: "",
      selectedTeam: "665211326",
      previousSelectedFixtureGroupAgeGroup: "15",
      previousSelectedFixtureGroupKey: "",
      previousSelectedClub: "726869064",
    }),
    resultUrl: buildUrl("results", {
      selectedFixtureGroupAgeGroup: "15",
      selectedFixtureGroupKey: "",
      selectedClub: "",
      selectedTeam: "665211326",
      previousSelectedFixtureGroupAgeGroup: "15",
      previousSelectedFixtureGroupKey: "",
      previousSelectedClub: "726869064",
    }),
  },
  {
    team: "U9s",
    slug: "u9s",
    fixtureUrl: buildUrl("fixtures", {
      selectedFixtureGroupAgeGroup: "14",
      selectedFixtureGroupKey: "",
      selectedClub: "",
      selectedTeam: "795452180",
      previousSelectedFixtureGroupAgeGroup: "14",
      previousSelectedFixtureGroupKey: "",
      previousSelectedClub: "726869064",
    }),
    resultUrl: buildUrl("results", {
      selectedFixtureGroupAgeGroup: "14",
      selectedFixtureGroupKey: "",
      selectedClub: "",
      selectedTeam: "795452180",
      previousSelectedFixtureGroupAgeGroup: "14",
      previousSelectedFixtureGroupKey: "",
      previousSelectedClub: "726869064",
    }),
  },
  {
    team: "U10s",
    slug: "u10s",
    fixtureUrl: buildUrl("fixtures", {
      selectedFixtureGroupAgeGroup: "13",
      selectedFixtureGroupKey: "",
      selectedClub: "",
      selectedTeam: "522060339",
      previousSelectedFixtureGroupAgeGroup: "13",
      previousSelectedFixtureGroupKey: "",
      previousSelectedClub: "726869064",
    }),
    resultUrl: buildUrl("results", {
      selectedFixtureGroupAgeGroup: "13",
      selectedFixtureGroupKey: "",
      selectedClub: "",
      selectedTeam: "522060339",
      previousSelectedFixtureGroupAgeGroup: "13",
      previousSelectedFixtureGroupKey: "",
      previousSelectedClub: "726869064",
    }),
  },
  {
    team: "U11s Gold",
    slug: "u11s-gold",
    fixtureUrl: buildUrl("fixtures", {
      selectedFixtureGroupAgeGroup: "12",
      selectedFixtureGroupKey: "",
      selectedClub: "",
      selectedTeam: "50394118",
      previousSelectedFixtureGroupAgeGroup: "12",
      previousSelectedFixtureGroupKey: "",
      previousSelectedClub: "726869064",
    }),
    resultUrl: buildUrl("results", {
      selectedFixtureGroupAgeGroup: "12",
      selectedFixtureGroupKey: "",
      selectedClub: "",
      selectedTeam: "50394118",
      previousSelectedFixtureGroupAgeGroup: "12",
      previousSelectedFixtureGroupKey: "",
      previousSelectedClub: "726869064",
    }),
  },
  {
    team: "U11s Black",
    slug: "u11s-black",
    fixtureUrl: buildUrl("fixtures", {
      selectedFixtureGroupAgeGroup: "12",
      selectedFixtureGroupKey: "",
      selectedClub: "",
      selectedTeam: "335339841",
      previousSelectedFixtureGroupAgeGroup: "12",
      previousSelectedFixtureGroupKey: "",
      previousSelectedClub: "726869064",
    }),
    resultUrl: buildUrl("results", {
      selectedFixtureGroupAgeGroup: "12",
      selectedFixtureGroupKey: "",
      selectedClub: "",
      selectedTeam: "335339841",
      previousSelectedFixtureGroupAgeGroup: "12",
      previousSelectedFixtureGroupKey: "",
      previousSelectedClub: "726869064",
    }),
  },
  {
    team: "U13s Gold",
    slug: "u13s-gold",
    fixtureUrl: buildUrl("fixtures", {
      selectedFixtureGroupAgeGroup: "10",
      selectedFixtureGroupKey: "",
      selectedClub: "",
      selectedTeam: "997093003",
      previousSelectedFixtureGroupAgeGroup: "10",
      previousSelectedFixtureGroupKey: "",
      previousSelectedClub: "726869064",
    }),
    resultUrl: buildUrl("results", {
      selectedFixtureGroupAgeGroup: "10",
      selectedFixtureGroupKey: "",
      selectedClub: "",
      selectedTeam: "997093003",
      previousSelectedFixtureGroupAgeGroup: "10",
      previousSelectedFixtureGroupKey: "",
      previousSelectedClub: "726869064",
    }),
  },
  {
    team: "U13s Black",
    slug: "u13s-black",
    fixtureUrl: buildUrl("fixtures", {
      selectedFixtureGroupAgeGroup: "10",
      selectedFixtureGroupKey: "",
      selectedClub: "",
      selectedTeam: "979694431",
      previousSelectedFixtureGroupAgeGroup: "10",
      previousSelectedFixtureGroupKey: "",
      previousSelectedClub: "726869064",
    }),
    resultUrl: buildUrl("results", {
      selectedFixtureGroupAgeGroup: "10",
      selectedFixtureGroupKey: "",
      selectedClub: "",
      selectedTeam: "979694431",
      previousSelectedFixtureGroupAgeGroup: "10",
      previousSelectedFixtureGroupKey: "",
      previousSelectedClub: "726869064",
    }),
  },
  {
    team: "U14s",
    slug: "u14s",
    fixtureUrl: buildUrl("fixtures", {
      selectedFixtureGroupAgeGroup: "9",
      selectedFixtureGroupKey: "",
      selectedClub: "",
      selectedTeam: "65147458",
      previousSelectedFixtureGroupAgeGroup: "9",
      previousSelectedFixtureGroupKey: "",
      previousSelectedClub: "726869064",
    }),
    resultUrl: buildUrl("results", {
      selectedFixtureGroupAgeGroup: "9",
      selectedFixtureGroupKey: "",
      selectedClub: "",
      selectedTeam: "65147458",
      previousSelectedFixtureGroupAgeGroup: "9",
      previousSelectedFixtureGroupKey: "",
      previousSelectedClub: "726869064",
    }),
  },
];
