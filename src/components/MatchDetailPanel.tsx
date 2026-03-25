import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Target, Users, FileText, Star, Image } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MatchDetailPanelProps {
  teamSlug: string;
  teamName: string;
  opponent: string;
  matchDate: string; // "DD/MM/YY" format from FA
}

function parseMatchDate(dateStr: string): string {
  const [d, m, y] = dateStr.split("/");
  return `20${y}-${m}-${d}`;
}

export function MatchDetailPanel({ teamSlug, teamName, opponent, matchDate }: MatchDetailPanelProps) {
  const dbDate = parseMatchDate(matchDate);

  const { data: report, isLoading: reportLoading } = useQuery({
    queryKey: ["match-report-detail", teamName, opponent, dbDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("match_reports")
        .select("*")
        .eq("team_name", teamName)
        .eq("opponent", opponent)
        .eq("match_date", dbDate)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: potm } = useQuery({
    queryKey: ["potm-detail", teamName, dbDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("player_of_the_match")
        .select("*")
        .eq("team_name", teamName)
        .eq("award_date", dbDate)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: matchStats } = useQuery({
    queryKey: ["match-stats-detail", teamSlug, opponent, dbDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("match_player_stats")
        .select("*, player_stats(first_name, shirt_number)")
        .eq("team_slug", teamSlug)
        .eq("opponent", opponent)
        .eq("match_date", dbDate);
      if (error) throw error;
      return data;
    },
  });

  const goalScorers = matchStats?.filter((s) => s.goals > 0) || [];
  const assistMakers = matchStats?.filter((s) => s.assists > 0) || [];
  const appearances = matchStats?.filter((s) => s.appeared) || [];

  const hasData = report || potm || (matchStats && matchStats.length > 0);

  if (reportLoading) {
    return (
      <div className="px-6 py-4 text-xs text-muted-foreground animate-pulse">
        Loading match details...
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="px-6 py-4 text-xs text-muted-foreground italic">
        No match report submitted yet for this game.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden"
    >
      <div className="px-6 py-4 bg-muted/30 border-t border-border space-y-3">
        {/* Goal Scorers */}
        {(goalScorers.length > 0 || report?.goal_scorers) && (
          <div className="flex items-start gap-2">
            <Target className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] font-display uppercase tracking-wider text-muted-foreground mb-0.5">Goals</p>
              <p className="text-sm text-foreground">
                {goalScorers.length > 0
                  ? goalScorers.map((s) => {
                      const name = (s as any).player_stats?.first_name || "Unknown";
                      const num = (s as any).player_stats?.shirt_number;
                      return `${num ? `#${num} ` : ""}${name}${s.goals > 1 ? ` ×${s.goals}` : ""}`;
                    }).join(", ")
                  : report?.goal_scorers}
              </p>
            </div>
          </div>
        )}

        {/* Assists */}
        {(assistMakers.length > 0 || report?.assists) && (
          <div className="flex items-start gap-2">
            <Users className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] font-display uppercase tracking-wider text-muted-foreground mb-0.5">Assists</p>
              <p className="text-sm text-foreground">
                {assistMakers.length > 0
                  ? assistMakers.map((s) => {
                      const name = (s as any).player_stats?.first_name || "Unknown";
                      const num = (s as any).player_stats?.shirt_number;
                      return `${num ? `#${num} ` : ""}${name}${s.assists > 1 ? ` ×${s.assists}` : ""}`;
                    }).join(", ")
                  : report?.assists}
              </p>
            </div>
          </div>
        )}

        {/* POTM */}
        {potm && (
          <div className="flex items-start gap-2">
            <Star className="h-3.5 w-3.5 text-yellow-500 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-display uppercase tracking-wider text-muted-foreground mb-0.5">Player of the Match</p>
              <div className="flex items-center gap-2">
                {potm.photo_url && (
                  <img
                    src={potm.photo_url}
                    alt={potm.player_name}
                    className="w-8 h-8 rounded-full object-cover border border-primary/30"
                  />
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
            </div>
          </div>
        )}

        {/* Appearances */}
        {appearances.length > 0 && (
          <div className="flex items-start gap-2">
            <Users className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] font-display uppercase tracking-wider text-muted-foreground mb-0.5">Squad ({appearances.length})</p>
              <div className="flex flex-wrap gap-1">
                {appearances.map((s) => {
                  const name = (s as any).player_stats?.first_name || "Unknown";
                  const num = (s as any).player_stats?.shirt_number;
                  return (
                    <Badge key={s.id} variant="secondary" className="text-[10px] py-0">
                      {num ? `#${num} ` : ""}{name}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Match Notes */}
        {report?.notes && (
          <div className="flex items-start gap-2">
            <FileText className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] font-display uppercase tracking-wider text-muted-foreground mb-0.5">Coach's Report</p>
              <p className="text-sm text-foreground whitespace-pre-line">{report.notes}</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
