import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";

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
              {filtered.map((report) => (
                <MatchReportCard
                  key={report.id}
                  report={report}
                  potmPlayers={findPOTM(report)}
                  expanded={expandedId === report.id}
                  onToggle={() => setExpandedId(expandedId === report.id ? null : report.id)}
                  canEdit={canEdit}
                  onEdit={openEdit}
                />
              ))}
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
