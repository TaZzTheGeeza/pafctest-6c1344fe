import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Trophy, Star, ChevronDown, ChevronUp, Pencil, Target, Sparkles, FileText, ZoomIn } from "lucide-react";

export interface MatchReport {
  id: string;
  team_name: string;
  age_group: string;
  opponent: string;
  home_score: number;
  away_score: number;
  match_date: string;
  goal_scorers: string | null;
  assists: string | null;
  notes: string | null;
}

export interface POTMAward {
  id: string;
  player_name: string;
  team_name: string;
  age_group: string;
  award_date: string;
  reason: string | null;
  photo_url: string | null;
  shirt_number: number | null;
  match_description: string | null;
}

export const parseStatEntries = (raw: string | null): { name: string; count: number | null }[] =>
  (raw || "")
    .split(/[,;]\s*/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      const m = entry.match(/^(.*?)\s*[x×]\s*(\d+)$/i);
      return m ? { name: m[1].trim(), count: parseInt(m[2], 10) } : { name: entry, count: null };
    });

export function MatchReportCard({
  report,
  potmPlayers,
  expanded,
  onToggle,
  canEdit = false,
  onEdit,
}: {
  report: MatchReport;
  potmPlayers: POTMAward[];
  expanded: boolean;
  onToggle: () => void;
  canEdit?: boolean;
  onEdit?: (report: MatchReport) => void;
}) {
  const isWin = report.home_score > report.away_score;
  const isDraw = report.home_score === report.away_score;

  const matchDate = new Date(report.match_date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const scorers = parseStatEntries(report.goal_scorers);
  const assists = parseStatEntries(report.assists);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className="cursor-pointer overflow-hidden rounded-2xl border-border/60 hover:border-primary/40 transition-colors"
        onClick={onToggle}
      >
        {/* Broadcast-style header */}
        <div className="bg-gradient-to-b from-secondary/60 to-card px-5 py-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isWin ? "bg-green-500" : isDraw ? "bg-yellow-500" : "bg-red-500"
                }`}
              />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                {isWin ? "Victory" : isDraw ? "Draw" : "Defeat"} · Full Time
              </span>
              {potmPlayers.length > 0 && (
                <Star className="h-3 w-3 text-primary fill-primary" />
              )}
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              {matchDate}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="font-display text-foreground font-bold text-base md:text-lg leading-tight uppercase truncate">
                {report.team_name}
              </h2>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                vs {report.opponent}
              </p>
              <span className="inline-block mt-1.5 px-2 py-0.5 bg-secondary rounded text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                {report.age_group}
              </span>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-baseline gap-2 font-display">
                <span
                  className={`text-4xl font-bold tabular-nums ${
                    !isWin && !isDraw ? "text-muted-foreground/40" : "text-foreground"
                  }`}
                >
                  {report.home_score}
                </span>
                <span className="text-xl font-bold text-muted-foreground/30">-</span>
                <span
                  className={`text-4xl font-bold tabular-nums ${
                    isWin ? "text-muted-foreground/40" : "text-foreground"
                  }`}
                >
                  {report.away_score}
                </span>
              </div>
              {canEdit && onEdit && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(report);
                  }}
                  title="Edit match report"
                  className="p-1.5 rounded-md hover:bg-primary/10 text-primary border border-primary/30"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
              {expanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </div>

        {/* Expanded match report */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <CardContent className="p-5 space-y-6 border-t border-border/50">
                {(scorers.length > 0 || assists.length > 0) && (
                  <div className="grid grid-cols-2 gap-4">
                    {scorers.length > 0 && (
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 flex items-center justify-center rounded-md bg-secondary">
                            <Target className="w-3 h-3 text-muted-foreground" />
                          </div>
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                            Scorers
                          </span>
                        </div>
                        <div className="space-y-1">
                          {scorers.map((s, i) => (
                            <p key={i} className="text-sm text-foreground font-bold">
                              {s.name}
                              {s.count !== null && (
                                <span className="text-primary font-semibold ml-1.5 text-xs">
                                  x{s.count}
                                </span>
                              )}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                    {assists.length > 0 && (
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 flex items-center justify-center rounded-md bg-secondary">
                            <Sparkles className="w-3 h-3 text-muted-foreground" />
                          </div>
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                            Assists
                          </span>
                        </div>
                        <div className="space-y-1">
                          {assists.map((s, i) => (
                            <p key={i} className="text-sm text-foreground font-bold">
                              {s.name}
                              {s.count !== null && (
                                <span className="text-primary font-semibold ml-1.5 text-xs">
                                  x{s.count}
                                </span>
                              )}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {report.notes && (
                  <div className="relative p-4 bg-secondary/30 rounded-r-2xl border-l-2 border-primary">
                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                      <FileText className="w-3 h-3" />
                      Coach's Report
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed italic whitespace-pre-wrap">
                      "{report.notes}"
                    </p>
                  </div>
                )}

                {potmPlayers.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1.5">
                        <Trophy className="h-3 w-3" />
                        Player{potmPlayers.length > 1 ? "s" : ""} of the Match
                      </span>
                      <div className="h-px flex-1 bg-primary/20 ml-4" />
                    </div>
                    <div className="grid gap-2.5">
                      {potmPlayers.map((p, i) => (
                        <div
                          key={p.id}
                          className={`flex items-center gap-3.5 p-3 rounded-2xl ${
                            i === 0
                              ? "bg-gradient-to-r from-primary/15 to-transparent border border-primary/25"
                              : "bg-secondary/40 border border-border/60"
                          }`}
                        >
                          {p.photo_url ? (
                            <img
                              src={p.photo_url}
                              alt={p.player_name}
                              className={`w-20 h-20 rounded-xl object-cover shrink-0 ring-2 ${
                                i === 0 ? "ring-primary/40" : "ring-border"
                              }`}
                            />
                          ) : (
                            <div
                              className={`w-20 h-20 rounded-xl shrink-0 ring-2 flex items-center justify-center bg-secondary ${
                                i === 0 ? "ring-primary/40" : "ring-border"
                              }`}
                            >
                              <span className="font-display text-2xl font-bold text-primary/50">
                                {p.shirt_number || p.player_name.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-black text-foreground uppercase">
                              {p.player_name}
                              {p.shirt_number && (
                                <span
                                  className={`ml-1.5 ${
                                    i === 0 ? "text-primary" : "text-muted-foreground"
                                  }`}
                                >
                                  #{p.shirt_number}
                                </span>
                              )}
                            </h4>
                            {p.reason && (
                              <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                                {p.reason}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {canEdit && onEdit && (
                  <div className="pt-1 flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(report);
                      }}
                      className="gap-1.5"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit Report
                    </Button>
                  </div>
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
