import { describe, it, expect } from "vitest";
import { isFixtureExcluded } from "../../supabase/functions/_shared/fixtureExclusions";

describe("admin fixture exclusions", () => {
  const fixture = { date: "07/11/26", homeTeam: "Peterborough Athletic U12 Gold", awayTeam: "Oundle Town" };
  const exclusions = [{ fixture_url: "https://fulltime.thefa.com/fixtures.html?selectedTeam=12", fixture_date: fixture.date, home_team: fixture.homeTeam, away_team: fixture.awayTeam }];
  const url = exclusions[0].fixture_url;
  it("keeps a deleted league fixture excluded after a fresh scrape, even if kickoff changes", () => {
    expect(isFixtureExcluded({ ...fixture, time: "11:00" } as typeof fixture, url, exclusions)).toBe(true);
  });
  it("does not remove another date, team feed or opponent", () => {
    expect(isFixtureExcluded({ ...fixture, date: "14/11/26" }, url, exclusions)).toBe(false);
    expect(isFixtureExcluded(fixture, `${url}0`, exclusions)).toBe(false);
    expect(isFixtureExcluded({ ...fixture, awayTeam: "Ketton" }, url, exclusions)).toBe(false);
  });
});