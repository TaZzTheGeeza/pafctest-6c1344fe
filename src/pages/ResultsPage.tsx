import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trophy, Star, ChevronDown, ChevronUp, Pencil, Loader2, Save, Target, Sparkles, FileText } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { SEO } from "@/components/SEO";

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

const CURRENT_SEASON = "2026/27";

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
  const [season, setSeason] = useState<string>(CURRENT_SEASON);
  const { isCoach, isAdmin } = useAuth();
  const canEdit = (isCoach || isAdmin) && season === CURRENT_SEASON;
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState<MatchReport | null>(null);
  const [editHome, setEditHome] = useState("0");
  const [editAway, setEditAway] = useState("0");
  const [editScorers, setEditScorers] = useState("");
  const [editAssists, setEditAssists] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const openEdit = (report: MatchReport) => {
    setEditing(report);
    setEditHome(String(report.home_score ?? 0));
    setEditAway(String(report.away_score ?? 0));
    setEditScorers(report.goal_scorers ?? "");
    setEditAssists(report.assists ?? "");
    setEditNotes(report.notes ?? "");
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    setSavingEdit(true);
    try {
      const { error } = await supabase
        .from("match_reports")
        .update({
          home_score: parseInt(editHome) || 0,
          away_score: parseInt(editAway) || 0,
          goal_scorers: editScorers.trim() || null,
          assists: editAssists.trim() || null,
          notes: editNotes.trim() || null,
        })
        .eq("id", editing.id);
      if (error) throw error;
      toast.success("Match report updated");
      queryClient.invalidateQueries({ queryKey: ["match-reports-public"] });
      setEditing(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to update report");
    } finally {
      setSavingEdit(false);
    }
  };

  const { data: reports, isLoading } = useQuery({
    queryKey: ["match-reports-public", season],
    queryFn: async () => {
      if (season === CURRENT_SEASON) {
        const { data, error } = await supabase
          .from("match_reports")
          .select("*")
          .order("match_date", { ascending: false });
        if (error) throw error;
        return data as MatchReport[];
      }
      const { data, error } = await supabase
        .from("match_reports_history")
        .select("*")
        .eq("season", season)
        .order("match_date", { ascending: false });
      if (error) throw error;
      return data as MatchReport[];
    },
  });

  const { data: archivedSeasons } = useQuery({
    queryKey: ["match-reports-seasons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("match_reports_history")
        .select("season");
      if (error) throw error;
      const unique = [...new Set((data || []).map((r: any) => r.season as string))];
      return unique.sort().reverse();
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

  const parseStatEntries = (raw: string | null): { name: string; count: number | null }[] =>
    (raw || "")
      .split(/[,;]\s*/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((entry) => {
        const m = entry.match(/^(.*?)\s*[x×]\s*(\d+)$/i);
        return m ? { name: m[1].trim(), count: parseInt(m[2], 10) } : { name: entry, count: null };
      });

  return (
    <div className="min-h-screen flex flex-col">
      <SEO title="Results & Match Reports | Peterborough Athletic FC" description="Latest match results, reports and Player of the Match awards from Peterborough Athletic FC teams U6–U16." keywords="Peterborough Athletic FC results, PAFC match reports, Peterborough junior football results, player of the match Peterborough" path="/results" />
      <Navbar />
      <main className="flex-1 pt-28 pb-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            <span className="text-gold-gradient">Match</span> Results
          </h1>
          <p className="text-muted-foreground mb-8">Season {season}</p>

          {/* Filters */}
          <div className="mb-6 flex flex-wrap gap-3">
            <Select value={season} onValueChange={setSeason}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Season" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={CURRENT_SEASON}>{CURRENT_SEASON} (Current)</SelectItem>
                {archivedSeasons?.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <p className="text-muted-foreground text-center py-12">
              {season === CURRENT_SEASON
                ? "No results submitted yet for this season."
                : `No results archived for ${season}.`}
            </p>
          ) : (
            <div className="space-y-3">
              {filtered.map((report) => {
                const isExpanded = expandedId === report.id;
                const potmPlayers = findPOTM(report);
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
                    key={report.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card
                      className="cursor-pointer overflow-hidden rounded-2xl border-border/60 hover:border-primary/40 transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : report.id)}
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
                            {canEdit && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEdit(report);
                                }}
                                title="Edit match report"
                                className="p-1.5 rounded-md hover:bg-primary/10 text-primary border border-primary/30"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded match report */}
                      <AnimatePresence>
                        {isExpanded && (
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
                                            className={`w-12 h-12 rounded-xl object-cover shrink-0 ring-2 ${
                                              i === 0 ? "ring-primary/40" : "ring-border"
                                            }`}
                                          />
                                        ) : (
                                          <div
                                            className={`w-12 h-12 rounded-xl shrink-0 ring-2 flex items-center justify-center bg-secondary ${
                                              i === 0 ? "ring-primary/40" : "ring-border"
                                            }`}
                                          >
                                            <span className="font-display text-lg font-bold text-primary/50">
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

                              {canEdit && (
                                <div className="pt-1 flex justify-end">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openEdit(report);
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
              })}
            </div>
          )}
        </div>
      </main>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Match Report</DialogTitle>
            <DialogDescription>
              {editing && (
                <>
                  {editing.team_name} vs {editing.opponent} —{" "}
                  {new Date(editing.match_date).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{editing?.team_name} Score</Label>
                <Input
                  type="number"
                  min="0"
                  value={editHome}
                  onChange={(e) => setEditHome(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">{editing?.opponent} Score</Label>
                <Input
                  type="number"
                  min="0"
                  value={editAway}
                  onChange={(e) => setEditAway(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Goal Scorers</Label>
              <Input
                value={editScorers}
                onChange={(e) => setEditScorers(e.target.value)}
                placeholder="e.g. Sophie x2, Mia"
              />
            </div>

            <div>
              <Label className="text-xs">Assists</Label>
              <Input
                value={editAssists}
                onChange={(e) => setEditAssists(e.target.value)}
                placeholder="e.g. Lily, Ava"
              />
            </div>

            <div>
              <Label className="text-xs">Match Notes</Label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={4}
                placeholder="Match summary, key moments..."
              />
            </div>

            <p className="text-[11px] text-muted-foreground">
              Note: This edits the public report only. To change individual player stats (goals/assists per player), use the Coach Panel.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)} disabled={savingEdit}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={savingEdit}>
              {savingEdit ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default ResultsPage;
