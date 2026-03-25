import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { FileText, Star, Loader2, ChevronDown, ChevronUp, Trophy, Target, Users } from "lucide-react";

// ─── Main Component ───

interface FixtureGroup {
  key: string;
  teamName: string;
  opponent: string;
  ageGroup: string;
  date: string;
  report: any;
  potmAwards: any[];
}

export function ManageSubmissionsForm({ allowedAgeGroups }: { allowedAgeGroups?: string[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ["all-match-reports", allowedAgeGroups],
    queryFn: async () => {
      let query = supabase
        .from("match_reports")
        .select("*")
        .order("match_date", { ascending: false })
        .limit(50);
      if (allowedAgeGroups && allowedAgeGroups.length > 0) {
        query = query.in("age_group", allowedAgeGroups);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: potmAwards = [], isLoading: potmLoading } = useQuery({
    queryKey: ["all-potm-awards", allowedAgeGroups],
    queryFn: async () => {
      let query = supabase
        .from("player_of_the_match")
        .select("*")
        .order("award_date", { ascending: false })
        .limit(50);
      if (allowedAgeGroups && allowedAgeGroups.length > 0) {
        query = query.in("age_group", allowedAgeGroups);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const fixtureGroups = useMemo(() => {
    const groupMap = new Map<string, FixtureGroup>();

    // Add match reports
    for (const r of reports) {
      const key = `${r.team_name}::${r.opponent}::${r.match_date}`;
      groupMap.set(key, {
        key,
        teamName: r.team_name,
        opponent: r.opponent,
        ageGroup: r.age_group,
        date: r.match_date,
        report: r,
        potmAwards: [],
      });
    }

    // Add POTM awards — match to existing groups or create new fixture groups
    for (const p of potmAwards) {
      const opponent = (p.match_description || "").replace(/^vs\s+/i, "").trim();
      // Try matching by team + date (with or without opponent)
      let matched = false;
      for (const [, group] of groupMap) {
        if (group.teamName === p.team_name && group.date === p.award_date) {
          group.potmAwards.push(p);
          matched = true;
          break;
        }
      }
      if (!matched) {
        const key = `${p.team_name}::${opponent}::${p.award_date}`;
        const existing = groupMap.get(key);
        if (existing) {
          existing.potmAwards.push(p);
        } else {
          groupMap.set(key, {
            key,
            teamName: p.team_name,
            opponent: opponent || "Unknown",
            ageGroup: p.age_group,
            date: p.award_date,
            report: null,
            potmAwards: [p],
          });
        }
      }
    }

    return [...groupMap.values()].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [reports, potmAwards]);

  const isLoading = reportsLoading || potmLoading;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <FileText className="h-5 w-5 text-primary" />
        <h3 className="font-display text-lg font-bold text-foreground">Submissions</h3>
        <span className="text-xs text-muted-foreground">({fixtureGroups.length} fixtures)</span>
      </div>

      {isLoading ? (
        <div className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" /></div>
      ) : fixtureGroups.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8 bg-card border border-border rounded-xl">No submissions yet.</p>
      ) : (
        <div className="space-y-3">
          {fixtureGroups.map((group) => {
            const isExpanded = expandedId === group.key;
            return (
              <FixtureGroupCard
                key={group.key}
                group={group}
                isExpanded={isExpanded}
                onToggle={() => setExpandedId(isExpanded ? null : group.key)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Fixture Group Card (read-only) ───

function FixtureGroupCard({ group, isExpanded, onToggle }: {
  group: FixtureGroup; isExpanded: boolean;
  onToggle: () => void;
}) {
  const r = group.report;
  const hasReport = !!r;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 hover:bg-secondary/50 transition-colors text-left"
      >
        {hasReport ? (
          <FileText className="h-4 w-4 text-primary shrink-0" />
        ) : (
          <Trophy className="h-4 w-4 text-yellow-500 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-display text-foreground truncate">
            {group.teamName} <span className="text-muted-foreground font-body font-normal">vs</span> {group.opponent}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {hasReport ? `${r.home_score}-${r.away_score} · ` : ""}{group.ageGroup} · {format(new Date(group.date), "dd MMM yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {group.potmAwards.length > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] font-display text-primary bg-primary/10 px-1.5 py-0.5 rounded">
              <Star className="h-2.5 w-2.5" /> {group.potmAwards.length} POTM
            </span>
          )}
          {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-border px-4 py-3 space-y-3">
          {hasReport && (
            <>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-display font-bold text-foreground">{r.home_score} - {r.away_score}</span>
              </div>

              {r.goal_scorers && (
                <div className="flex items-start gap-2">
                  <Target className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-display uppercase tracking-wider text-muted-foreground mb-0.5">Goals</p>
                    <p className="text-sm text-foreground">{r.goal_scorers}</p>
                  </div>
                </div>
              )}

              {r.assists && (
                <div className="flex items-start gap-2">
                  <Users className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-display uppercase tracking-wider text-muted-foreground mb-0.5">Assists</p>
                    <p className="text-sm text-foreground">{r.assists}</p>
                  </div>
                </div>
              )}

              {r.notes && (
                <div className="flex items-start gap-2">
                  <FileText className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-display uppercase tracking-wider text-muted-foreground mb-0.5">Coach's Report</p>
                    <p className="text-sm text-foreground whitespace-pre-line">{r.notes}</p>
                  </div>
                </div>
              )}
            </>
          )}

          {group.potmAwards.length > 0 && (
            <div className="flex items-start gap-2">
              <Trophy className="h-3.5 w-3.5 text-yellow-500 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-display uppercase tracking-wider text-muted-foreground mb-1">
                  Player{group.potmAwards.length > 1 ? "s" : ""} of the Match
                </p>
                <div className="space-y-2">
                  {group.potmAwards.map((potm: any) => (
                    <div key={potm.id} className="flex items-center gap-2">
                      {potm.photo_url && (
                        <img src={potm.photo_url} alt={potm.player_name} className="w-8 h-8 rounded-full object-cover border border-primary/30" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {potm.shirt_number ? `#${potm.shirt_number} ` : ""}{potm.player_name}
                        </p>
                        {potm.reason && (
                          <p className="text-xs text-muted-foreground">{potm.reason}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
