import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { faTeamConfigs } from "@/lib/faFixtureConfig";
import { ExternalLink, Loader2, Trophy } from "lucide-react";

interface Row {
  position: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalDiff: number | null;
  points: number;
}

/** True when a team is old enough (U12+) to play in a league with a published table. */
export function hasLeagueTable(teamSlug: string | null | undefined) {
  const age = parseInt(teamSlug?.match(/\d+/)?.[0] || "0", 10);
  return age >= 12 && !!faTeamConfigs.find((c) => c.slug === teamSlug)?.fixtureUrl;
}

const isOurs = (name: string) => /peterborough athletic/i.test(name);

export function LeagueTable({ teamSlug }: { teamSlug: string }) {
  const config = faTeamConfigs.find((c) => c.slug === teamSlug);
  const [rows, setRows] = useState<Row[]>([]);
  const [division, setDivision] = useState<string | null>(null);
  const [tableUrl, setTableUrl] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const polls = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    polls.current = 0;
    setRows([]);
    setDivision(null);
    setLoading(true);
    setError(null);

    const load = async () => {
      if (!config?.fixtureUrl) return;
      const { data, error } = await supabase.functions.invoke("scrape-league-table", {
        body: { fixtureUrl: config.fixtureUrl },
      });
      if (cancelled) return;
      if (error || !data?.success) {
        setError("Couldn't load the league table right now.");
        setLoading(false);
        return;
      }
      if (data.failed) setError("FA Full-Time isn't letting us read this table right now. We'll keep trying in the background.");
      setRows(data.standings || []);
      setDivision(data.divisionName);
      setTableUrl(data.tableUrl);
      setUpdatedAt(data.updatedAt);
      setRefreshing(!!data.refreshing);
      setLoading(false);
      // While a background refresh runs, check back a few times.
      if (data.refreshing && polls.current < 8) {
        polls.current += 1;
        timer = setTimeout(load, 20_000);
      }
    };
    load();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [teamSlug, config?.fixtureUrl]);

  const faLink = tableUrl || config?.fixtureUrl;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="py-10 text-center space-y-3">
        <Trophy className="h-10 w-10 text-muted-foreground mx-auto" />
        <p className="font-display text-sm font-bold uppercase tracking-wider">
          {error ? "League table unavailable" : refreshing ? "Fetching the latest table" : "No table yet"}
        </p>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          {error
            ? error
            : refreshing
              ? "We're collecting the standings from FA Full-Time. This can take a minute - it will appear here automatically."
              : "The FA hasn't published a table for this division yet."}
        </p>
        {refreshing && !error && <Loader2 className="h-4 w-4 animate-spin text-primary mx-auto" />}
        {faLink && (
          <a href={faLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
            View on FA Full-Time <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    );
  }

  const showGd = rows.some((r) => r.goalDiff !== null && r.goalDiff !== undefined);

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-display tracking-widest text-primary uppercase">League Table</p>
          <h3 className="font-display text-lg font-bold uppercase leading-tight">{division}</h3>
        </div>
        {faLink && (
          <a href={faLink} target="_blank" rel="noopener noreferrer" className="shrink-0 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
            FA Full-Time <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-[10px] font-display tracking-widest text-muted-foreground uppercase">
              <th className="text-left py-2 pr-2 w-8">#</th>
              <th className="text-left py-2 pr-2">Team</th>
              <th className="text-center py-2 px-1.5">P</th>
              <th className="text-center py-2 px-1.5">W</th>
              <th className="text-center py-2 px-1.5">D</th>
              <th className="text-center py-2 px-1.5">L</th>
              {showGd && <th className="text-center py-2 px-1.5">GD</th>}
              <th className="text-center py-2 pl-1.5">Pts</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const ours = isOurs(r.team);
              return (
                <tr key={`${r.position}-${r.team}`} className={`border-b border-border/40 last:border-0 ${ours ? "bg-primary/10" : ""}`}>
                  <td className={`py-2.5 pr-2 font-mono text-xs ${ours ? "text-primary font-bold" : "text-muted-foreground"}`}>{r.position}</td>
                  <td className={`py-2.5 pr-2 ${ours ? "text-primary font-bold" : ""}`}>{r.team}</td>
                  <td className="text-center py-2.5 px-1.5">{r.played}</td>
                  <td className="text-center py-2.5 px-1.5">{r.won}</td>
                  <td className="text-center py-2.5 px-1.5">{r.drawn}</td>
                  <td className="text-center py-2.5 px-1.5">{r.lost}</td>
                  {showGd && <td className="text-center py-2.5 px-1.5">{r.goalDiff ?? "-"}</td>}
                  <td className="text-center py-2.5 pl-1.5 font-bold">{r.points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {updatedAt && (
        <p className="text-[10px] text-muted-foreground text-right">
          Updated {new Date(updatedAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          {refreshing ? " - refreshing..." : ""}
        </p>
      )}
    </div>
  );
}
