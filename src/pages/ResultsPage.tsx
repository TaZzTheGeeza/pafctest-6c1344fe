import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, ChevronDown, ChevronUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface MatchReport {
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

interface POTMAward {
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

const ResultsPage = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterTeam, setFilterTeam] = useState<string>("all");
  const [filterTeam, setFilterTeam] = useState<string>("all");

  const { data: reports, isLoading } = useQuery({
    queryKey: ["match-reports-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("match_reports")
        .select("*")
        .order("match_date", { ascending: false });
      if (error) throw error;
      return data as MatchReport[];
    },
  });

  const { data: potmAwards } = useQuery({
    queryKey: ["potm-awards-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("player_of_the_match")
        .select("*");
      if (error) throw error;
      return data as POTMAward[];
    },
  });

  const teamNames = [...new Set(reports?.map((r) => r.team_name) || [])].sort();
  const filtered = filterTeam === "all"
    ? reports
    : reports?.filter((r) => r.team_name === filterTeam);

  const findPOTM = (report: MatchReport) =>
    potmAwards?.filter(
      (p) =>
        p.age_group === report.age_group &&
        p.award_date === report.match_date
    ) || [];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            <span className="text-gold-gradient">Match</span> Results
          </h1>
          <p className="text-muted-foreground mb-8">Season 2025/26</p>

          {/* Team filter */}
          <div className="mb-6">
            <Select value={filterTeam} onValueChange={setFilterTeam}>
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="Team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {teamNames.map((tn) => (
                  <SelectItem key={tn} value={tn}>{tn}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <p className="text-muted-foreground text-center py-12">Loading results...</p>
          ) : !filtered?.length ? (
            <p className="text-muted-foreground text-center py-12">No results submitted yet.</p>
          ) : (
            <div className="space-y-3">
              {filtered.map((report) => {
                const isExpanded = expandedId === report.id;
                const potmPlayers = findPOTM(report);
                const isWin = report.home_score > report.away_score;
                const isDraw = report.home_score === report.away_score;
                const resultLabel = isWin ? "W" : isDraw ? "D" : "L";
                const resultColor = isWin
                  ? "bg-green-600"
                  : isDraw
                  ? "bg-yellow-600"
                  : "bg-red-600";

                return (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card
                      className="cursor-pointer hover:border-primary/40 transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : report.id)}
                    >
                      <CardContent className="p-4">
                        {/* Main result row */}
                        <div className="flex items-center gap-3">
                          <span
                            className={`${resultColor} text-white text-xs font-bold w-7 h-7 flex items-center justify-center rounded shrink-0`}
                          >
                            {resultLabel}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-display text-sm md:text-base font-semibold text-foreground truncate">
                                  {report.team_name}{" "}
                                  <span className="font-mono font-bold">
                                    {report.home_score} - {report.away_score}
                                  </span>{" "}
                                  {report.opponent}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <Badge variant="outline" className="text-[10px]">
                                    {report.age_group}
                                  </Badge>
                                  <span className="text-[11px] text-muted-foreground">
                                    {new Date(report.match_date).toLocaleDateString("en-GB", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                  </span>
                                  {potmPlayers.length > 0 && (
                                    <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                                  )}
                                </div>
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Expanded details */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-4 pt-4 border-t border-border space-y-3">
                                {report.goal_scorers && (
                                  <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                                      ⚽ Goal Scorers
                                    </p>
                                    <p className="text-sm text-foreground">{report.goal_scorers}</p>
                                  </div>
                                )}
                                {report.assists && (
                                  <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                                      🅰️ Assists
                                    </p>
                                    <p className="text-sm text-foreground">{report.assists}</p>
                                  </div>
                                )}
                                {report.notes && (
                                  <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                                      📝 Match Report
                                    </p>
                                    <p className="text-sm text-foreground whitespace-pre-wrap">
                                      {report.notes}
                                    </p>
                                  </div>
                                )}
                                {potmPlayers.length > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                      <Trophy className="h-3.5 w-3.5 inline mr-1 text-yellow-500" />
                                      Player of the Match
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      {potmPlayers.map((p) => (
                                        <div
                                          key={p.id}
                                          className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2"
                                        >
                                          {p.photo_url && (
                                            <img
                                              src={p.photo_url}
                                              alt={p.player_name}
                                              className="h-8 w-8 rounded-full object-cover"
                                            />
                                          )}
                                          <div>
                                            <p className="text-sm font-semibold text-foreground">
                                              {p.player_name}
                                              {p.shirt_number && (
                                                <span className="text-muted-foreground ml-1">
                                                  #{p.shirt_number}
                                                </span>
                                              )}
                                            </p>
                                            {p.reason && (
                                              <p className="text-[11px] text-muted-foreground">
                                                {p.reason}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ResultsPage;
