export interface FixtureIdentity {
  date: string;
  homeTeam: string;
  awayTeam: string;
}

export interface FixtureExclusion {
  fixture_url: string;
  fixture_date: string;
  home_team: string;
  away_team: string;
}

const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ")
  .replace(/&amp;/g, "&").replace(/&#0?39;|&apos;|&rsquo;/g, "'");

export function isFixtureExcluded(fixture: FixtureIdentity, url: string, exclusions: FixtureExclusion[]) {
  return exclusions.some((e) => e.fixture_url === url
    && normalize(e.fixture_date) === normalize(fixture.date)
    && normalize(e.home_team) === normalize(fixture.homeTeam)
    && normalize(e.away_team) === normalize(fixture.awayTeam));
}