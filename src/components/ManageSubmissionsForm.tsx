import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { FileText, Star, Loader2, ChevronDown, ChevronUp, Trophy, Target, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// ─── Main Component ───

interface MatchGroup {
  report: any;
  potmAwards: any[];
}

export function ManageSubmissionsForm({ allowedAgeGroups }: { allowedAgeGroups?: string[] }) {
  const queryClient = useQueryClient();
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

  const matchGroups: MatchGroup[] = reports.map((r: any) => {
    const linked = potmAwards.filter(
      (p: any) => p.team_name === r.team_name && p.award_date === r.match_date
    );
    return { report: r, potmAwards: linked };
  });

  const linkedPotmIds = new Set(matchGroups.flatMap((g) => g.potmAwards.map((p: any) => p.id)));
  const orphanedPotm = potmAwards.filter((p: any) => !linkedPotmIds.has(p.id));
  const isLoading = reportsLoading || potmLoading;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <FileText className="h-5 w-5 text-primary" />
        <h3 className="font-display text-lg font-bold text-foreground">Submitted Matches</h3>
        <span className="text-xs text-muted-foreground">({reports.length} reports, {potmAwards.length} POTM awards)</span>
      </div>

      {isLoading ? (
        <div className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" /></div>
      ) : matchGroups.length === 0 && orphanedPotm.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8 bg-card border border-border rounded-xl">No submissions yet.</p>
      ) : (
        <>
          {matchGroups.map((group) => {
            const r = group.report;
            const isExpanded = expandedId === r.id;

            return (
              <MatchGroupCard
                key={r.id}
                group={group}
                isExpanded={isExpanded}
                onToggle={() => setExpandedId(isExpanded ? null : r.id)}
              />
            );
          })}

          {orphanedPotm.length > 0 && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-3 border-b border-border">
                <p className="text-sm font-display text-foreground flex items-center gap-2">
                  <Star className="h-4 w-4 text-primary" />
                  Unlinked POTM Awards
                  <span className="text-xs text-muted-foreground font-body">({orphanedPotm.length})</span>
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">These awards aren't matched to a report — submit a match report for the same team &amp; date to link them.</p>
              </div>
              <div className="px-3 py-2 space-y-2">
                {orphanedPotm.map((p: any) => (
                  <div key={p.id} className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
                    {p.photo_url ? (
                      <img src={p.photo_url} alt={p.player_name} className="h-8 w-8 rounded-full object-cover border border-primary/30 shrink-0" />
                    ) : (
                      <Star className="h-4 w-4 text-primary shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-display text-foreground truncate">
                        {p.shirt_number ? `#${p.shirt_number} ` : ""}{p.player_name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {p.team_name} · {p.age_group} · {p.match_description || "No match"} · {format(new Date(p.award_date), "dd MMM yyyy")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Match Group Card with Tabs ───

function MatchGroupCard({ group, isExpanded, onToggle }: {
  group: MatchGroup; isExpanded: boolean;
  onToggle: () => void;
}) {
  const r = group.report;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Match header row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 hover:bg-secondary/50 transition-colors text-left"
      >
        <FileText className="h-4 w-4 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-display text-foreground truncate">
            {r.team_name} <span className="text-muted-foreground font-body font-normal">vs</span> {r.opponent}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {r.home_score}-{r.away_score} · {r.age_group} · {format(new Date(r.match_date), "dd MMM yyyy")}
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

      {/* Expanded tabbed content */}
      {isExpanded && (
        <div className="border-t border-border px-4 py-3 space-y-3">
          {/* Score */}
          <div className="flex items-center gap-2 text-sm">
            <span className="font-display font-bold text-foreground">{r.home_score} - {r.away_score}</span>
          </div>

          {/* Goal Scorers */}
          {r.goal_scorers && (
            <div className="flex items-start gap-2">
              <Target className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-display uppercase tracking-wider text-muted-foreground mb-0.5">Goals</p>
                <p className="text-sm text-foreground">{r.goal_scorers}</p>
              </div>
            </div>
          )}

          {/* Assists */}
          {r.assists && (
            <div className="flex items-start gap-2">
              <Users className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-display uppercase tracking-wider text-muted-foreground mb-0.5">Assists</p>
                <p className="text-sm text-foreground">{r.assists}</p>
              </div>
            </div>
          )}

          {/* Match Notes */}
          {r.notes && (
            <div className="flex items-start gap-2">
              <FileText className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-display uppercase tracking-wider text-muted-foreground mb-0.5">Coach's Report</p>
                <p className="text-sm text-foreground whitespace-pre-line">{r.notes}</p>
              </div>
            </div>
          )}

          {/* Linked POTM awards */}
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
