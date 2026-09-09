import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CLUB_TEAMS } from "@/lib/teamConfig";
import { faTeamConfigs } from "@/lib/faFixtureConfig";
import { CheckCircle2, XCircle, ChevronDown, ClipboardCheck, RefreshCw } from "lucide-react";

interface CachedFixture {
  date: string; // "DD/MM/YY"
  time: string;
  homeTeam: string;
  awayTeam: string;
  type: "fixture" | "result";
}

interface PlayedMatch {
  teamSlug: string;
  teamName: string;
  dateISO: string; // yyyy-mm-dd
  displayDate: string;
  opponent: string;
}

function parseFaDate(d: string): string | null {
  const m = d.match(/^(\d{2})\/(\d{2})\/(\d{2})$/);
  if (!m) return null;
  return `20${m[3]}-${m[2]}-${m[1]}`;
}

export function ReportTracker() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [missingOnly, setMissingOnly] = useState(true);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["report-tracker"],
    queryFn: async () => {
      const [{ data: cacheRows, error: cacheErr }, { data: reports, error: repErr }] = await Promise.all([
        supabase.from("fa_fixture_cache").select("team, fixtures, results"),
        supabase.from("match_reports").select("id, team_name, age_group, match_date, opponent"),
      ]);
      if (cacheErr) throw cacheErr;
      if (repErr) throw repErr;
      return { cacheRows: cacheRows || [], reports: reports || [] };
    },
    staleTime: 1000 * 60 * 5,
  });

  const teams = useMemo(() => {
    if (!data) return [];
    const today = new Date().toISOString().slice(0, 10);

    // Index reports by date for quick lookup
    const reportsByDate = new Map<string, typeof data.reports>();
    for (const r of data.reports) {
      const list = reportsByDate.get(r.match_date) || [];
      list.push(r);
      reportsByDate.set(r.match_date, list);
    }

    return CLUB_TEAMS
      .filter((t) => t.slug !== "u6s") // no FA fixtures for U6
      .map((team) => {
        const config = faTeamConfigs.find((c) => c.slug === team.slug);
        const cache = data.cacheRows.find((r: any) => r.team === config?.team) as any;
        const fixtures: CachedFixture[] = [
          ...((cache?.fixtures as CachedFixture[]) || []),
          ...((cache?.results as CachedFixture[]) || []),
        ];

        // Deduplicate by date+opponent, keep only played matches
        const seen = new Set<string>();
        const played: PlayedMatch[] = [];
        for (const f of fixtures) {
          const iso = parseFaDate(f.date);
          if (!iso || iso >= today) continue;
          const isHome = f.homeTeam.includes("Peterborough Ath");
          const opponent = isHome ? f.awayTeam : f.homeTeam;
          const key = `${iso}|${opponent}`;
          if (seen.has(key)) continue;
          seen.add(key);
          played.push({
            teamSlug: team.slug,
            teamName: team.name,
            dateISO: iso,
            displayDate: new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            }),
            opponent,
          });
        }
        played.sort((a, b) => b.dateISO.localeCompare(a.dateISO));

        const nameLower = team.name.toLowerCase();
        const legacyName = team.slug.toUpperCase().replace(/-/g, " ").toLowerCase();

        const matches = played.map((m) => {
          const dayReports = reportsByDate.get(m.dateISO) || [];
          const report = dayReports.find((r: any) => {
            const tn = (r.team_name || "").toLowerCase();
            const ag = (r.age_group || "").toLowerCase();
            return ag === nameLower || tn.includes(nameLower) || tn.includes(legacyName);
          });
          return { ...m, submitted: !!report };
        });

        return {
          slug: team.slug,
          name: team.name,
          matches,
          submitted: matches.filter((m) => m.submitted).length,
          missing: matches.filter((m) => !m.submitted),
        };
      });
  }, [data]);

  const totals = useMemo(() => {
    const all = teams.flatMap((t) => t.matches);
    return {
      played: all.length,
      submitted: all.filter((m) => m.submitted).length,
      outstanding: all.filter((m) => !m.submitted).length,
    };
  }, [teams]);

  const visibleTeams = missingOnly ? teams.filter((t) => t.missing.length > 0) : teams;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-5 border-b border-border flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-display tracking-wider uppercase text-foreground flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-primary" /> Match Report Tracker
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Which teams have submitted match reports for played fixtures
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-10">Checking reports…</p>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 divide-x divide-border border-b border-border text-center">
            <div className="py-3">
              <p className="text-xl font-display font-bold text-foreground">{totals.played}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Played</p>
            </div>
            <div className="py-3">
              <p className="text-xl font-display font-bold text-green-500">{totals.submitted}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Submitted</p>
            </div>
            <div className="py-3">
              <p className="text-xl font-display font-bold text-red-400">{totals.outstanding}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Outstanding</p>
            </div>
          </div>

          {/* Filter */}
          <div className="px-5 py-3 border-b border-border flex gap-2">
            <button
              onClick={() => setMissingOnly(true)}
              className={`text-xs font-display tracking-wider px-3 py-1.5 rounded-lg border transition-all ${
                missingOnly
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              Outstanding ({teams.filter((t) => t.missing.length > 0).length})
            </button>
            <button
              onClick={() => setMissingOnly(false)}
              className={`text-xs font-display tracking-wider px-3 py-1.5 rounded-lg border transition-all ${
                !missingOnly
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              All Teams ({teams.length})
            </button>
          </div>

          {visibleTeams.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">
              🎉 Every played fixture has a match report submitted.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {visibleTeams.map((team) => {
                const open = expanded === team.slug;
                const allDone = team.missing.length === 0;
                return (
                  <div key={team.slug}>
                    <button
                      onClick={() => setExpanded(open ? null : team.slug)}
                      className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-accent/30 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {allDone ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                        )}
                        <span className="font-display text-sm tracking-wide text-foreground truncate">
                          {team.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {team.submitted}/{team.matches.length} reports
                        </span>
                        {!allDone && (
                          <span className="text-[10px] font-display tracking-wider uppercase bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full">
                            {team.missing.length} missing
                          </span>
                        )}
                        <ChevronDown
                          className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
                        />
                      </div>
                    </button>
                    {open && (
                      <div className="px-5 pb-4 space-y-1.5">
                        {team.matches.map((m) => (
                          <div
                            key={`${m.dateISO}-${m.opponent}`}
                            className="flex items-center justify-between text-xs rounded-lg bg-accent/20 px-3 py-2"
                          >
                            <span className="text-foreground truncate">
                              vs {m.opponent}
                              <span className="text-muted-foreground"> · {m.displayDate}</span>
                            </span>
                            {m.submitted ? (
                              <span className="flex items-center gap-1 text-green-500 shrink-0 ml-2">
                                <CheckCircle2 className="h-3 w-3" /> Submitted
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-red-400 shrink-0 ml-2">
                                <XCircle className="h-3 w-3" /> Not submitted
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
