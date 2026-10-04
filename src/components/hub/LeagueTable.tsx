import { faTeamConfigs } from "@/lib/faFixtureConfig";
import { ExternalLink, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * FA Full-Time league table pages per team. The FA blocks automated reading of
 * these pages, so the Hub links straight to them instead of showing standings.
 */
const LEAGUE_TABLE_URLS: Record<string, string> = {
  "u12s-gold":
    "https://fulltime.thefa.com/table.html?league=1137979&selectedSeason=585452548&selectedDivision=355072415&selectedCompetition=0&selectedFixtureGroupKey=1_645328238",
};

/** True when a team is old enough (U12+) to play in a league with a published table. */
export function hasLeagueTable(teamSlug: string | null | undefined) {
  const age = parseInt(teamSlug?.match(/\d+/)?.[0] || "0", 10);
  return age >= 12 && !!(LEAGUE_TABLE_URLS[teamSlug || ""] || faTeamConfigs.find((c) => c.slug === teamSlug)?.fixtureUrl);
}

export function LeagueTable({ teamSlug }: { teamSlug: string }) {
  const config = faTeamConfigs.find((c) => c.slug === teamSlug);
  const tableUrl = LEAGUE_TABLE_URLS[teamSlug];
  const href = tableUrl || config?.fixtureUrl;

  return (
    <div className="py-12 text-center space-y-4">
      <Trophy className="h-10 w-10 text-primary mx-auto" />
      <div className="space-y-1">
        <p className="font-display text-lg font-bold uppercase tracking-wider">{config?.team || "Team"} League Table</p>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          {tableUrl
            ? "See the latest standings for our division on FA Full-Time."
            : "See our latest fixtures, results and division on FA Full-Time."}
        </p>
      </div>
      {href && (
        <Button asChild>
          <a href={href} target="_blank" rel="noopener noreferrer">
            {tableUrl ? "View league table" : "View on FA Full-Time"} <ExternalLink className="h-4 w-4 ml-1" />
          </a>
        </Button>
      )}
    </div>
  );
}
