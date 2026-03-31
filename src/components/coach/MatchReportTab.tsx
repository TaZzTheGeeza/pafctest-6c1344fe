import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTeamRoster, getAgeGroup, type RosterPlayer } from "@/hooks/useTeamRoster";
import type { FAFixture } from "@/hooks/useTeamFixtures";

interface GoalEntry { playerId: string; count: number; }
interface AssistEntry { playerId: string; count: number; }

export function MatchReportTab({
  teamSlug, teamName, opponent, fixture, isHome,
}: {
  teamSlug: string; teamName: string; opponent: string;
  fixture: FAFixture; isHome: boolean;
}) {
  const { data: roster = [] } = useTeamRoster(teamSlug);
  const queryClient = useQueryClient();

  const parseMatchDate = () => {
    const [d, m, y] = fixture.date.split("/");
    return y.length === 4 ? `${y}-${m}-${d}` : `20${y}-${m}-${d}`;
  };

  const dbDate = parseMatchDate();

  // Load existing report if one exists
  const { data: existingReport } = useQuery({
    queryKey: ["existing-match-report", teamName, opponent, dbDate],
    queryFn: async () => {
      const { data } = await supabase
        .from("match_reports")
        .select("*")
        .eq("team_name", teamName)
        .eq("opponent", opponent)
        .eq("match_date", dbDate)
        .maybeSingle();
      return data;
    },
  });

  // Load existing match player stats
  const { data: existingStats } = useQuery({
    queryKey: ["existing-match-stats", teamSlug, opponent, dbDate],
    queryFn: async () => {
      const { data } = await supabase
        .from("match_player_stats")
        .select("player_stat_id, goals, assists")
        .eq("team_slug", teamSlug)
        .eq("opponent", opponent)
        .eq("match_date", dbDate);
      return data || [];
    },
  });

  const [homeScore, setHomeScore] = useState(fixture.homeScore?.toString() || "0");
  const [awayScore, setAwayScore] = useState(fixture.awayScore?.toString() || "0");
  const [goalEntries, setGoalEntries] = useState<GoalEntry[]>([]);
  const [assistEntries, setAssistEntries] = useState<AssistEntry[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Pre-fill form with existing data
  useEffect(() => {
    if (loaded) return;
    if (existingReport) {
      setHomeScore(existingReport.home_score?.toString() || "0");
      setAwayScore(existingReport.away_score?.toString() || "0");
      setNotes(existingReport.notes || "");
      setLoaded(true);
    }
    if (existingStats && existingStats.length > 0 && roster.length > 0) {
      const goals: GoalEntry[] = existingStats
        .filter(s => s.goals > 0)
        .map(s => ({ playerId: s.player_stat_id, count: s.goals }));
      const assists: AssistEntry[] = existingStats
        .filter(s => s.assists > 0)
        .map(s => ({ playerId: s.player_stat_id, count: s.assists }));
      if (goals.length > 0) setGoalEntries(goals);
      if (assists.length > 0) setAssistEntries(assists);
      setLoaded(true);
    }
  }, [existingReport, existingStats, roster, loaded]);

  const addGoalEntry = () => setGoalEntries([...goalEntries, { playerId: "", count: 1 }]);
  const addAssistEntry = () => setAssistEntries([...assistEntries, { playerId: "", count: 1 }]);

  const removeGoalEntry = (i: number) => setGoalEntries(goalEntries.filter((_, idx) => idx !== i));
  const removeAssistEntry = (i: number) => setAssistEntries(assistEntries.filter((_, idx) => idx !== i));

  const updateGoalEntry = (i: number, field: keyof GoalEntry, val: string | number) => {
    const next = [...goalEntries];
    next[i] = { ...next[i], [field]: val };
    setGoalEntries(next);
  };

  const updateAssistEntry = (i: number, field: keyof AssistEntry, val: string | number) => {
    const next = [...assistEntries];
    next[i] = { ...next[i], [field]: val };
    setAssistEntries(next);
  };


  const handleSave = async () => {
    setSaving(true);
    try {
      const matchDate = dbDate;
      const ageGroup = getAgeGroup(teamSlug);

      // Build goal scorer text for match_reports table
      const goalText = goalEntries
        .filter(e => e.playerId)
        .map(e => {
          const p = roster.find(r => r.id === e.playerId);
          return p ? `${p.first_name}${e.count > 1 ? ` x${e.count}` : ""}` : "";
        })
        .filter(Boolean)
        .join(", ");

      const assistText = assistEntries
        .filter(e => e.playerId)
        .map(e => {
          const p = roster.find(r => r.id === e.playerId);
          return p ? `${p.first_name}${e.count > 1 ? ` x${e.count}` : ""}` : "";
        })
        .filter(Boolean)
        .join(", ");

      // Check if report already exists for this match
      const { data: existingReport } = await supabase
        .from("match_reports")
        .select("id")
        .eq("team_name", teamName)
        .eq("opponent", opponent)
        .eq("match_date", matchDate)
        .maybeSingle();

      if (existingReport) {
        // Update existing report
        const { error: reportError } = await supabase.from("match_reports")
          .update({
            home_score: parseInt(homeScore) || 0,
            away_score: parseInt(awayScore) || 0,
            goal_scorers: goalText || null,
            assists: assistText || null,
            notes: notes || null,
          })
          .eq("id", existingReport.id);
        if (reportError) throw reportError;
      } else {
        // Insert new report
        const { error: reportError } = await supabase.from("match_reports").insert({
          team_name: teamName,
          age_group: ageGroup,
          opponent,
          home_score: parseInt(homeScore) || 0,
          away_score: parseInt(awayScore) || 0,
          goal_scorers: goalText || null,
          assists: assistText || null,
          notes: notes || null,
          match_date: matchDate,
        });
        if (reportError) throw reportError;
      }

      // Save per-match player stats (goals & assists)
      const playerMap = new Map<string, { goals: number; assists: number }>();

      for (const entry of goalEntries.filter(e => e.playerId)) {
        const existing = playerMap.get(entry.playerId) || { goals: 0, assists: 0 };
        existing.goals += entry.count;
        playerMap.set(entry.playerId, existing);
      }

      for (const entry of assistEntries.filter(e => e.playerId)) {
        const existing = playerMap.get(entry.playerId) || { goals: 0, assists: 0 };
        existing.assists += entry.count;
        playerMap.set(entry.playerId, existing);
      }

      if (playerMap.size > 0) {
        const matchStats = Array.from(playerMap.entries()).map(([playerId, stats]) => ({
          player_stat_id: playerId,
          team_slug: teamSlug,
          match_date: matchDate,
          opponent,
          goals: stats.goals,
          assists: stats.assists,
          appeared: false,
          potm: false,
        }));

        console.log("Saving match_player_stats:", matchStats);
        const { error: statsError } = await supabase
          .from("match_player_stats")
          .upsert(matchStats, { onConflict: "player_stat_id,match_date,opponent" });
        if (statsError) {
          console.error("match_player_stats upsert error:", statsError);
          throw statsError;
        }
        console.log("match_player_stats saved successfully");
      } else {
        console.warn("No player entries to save - playerMap is empty");
      }

      queryClient.invalidateQueries({ queryKey: ["team-roster"] });
      queryClient.invalidateQueries({ queryKey: ["team-stats"] });
      toast.success("Match report saved with player stats!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save report");
    } finally {
      setSaving(false);
    }
  };

  const availableForGoals = (currentId: string) =>
    roster.filter(r => !goalEntries.some(e => e.playerId === r.id && e.playerId !== currentId));

  const availableForAssists = (currentId: string) =>
    roster.filter(r => !assistEntries.some(e => e.playerId === r.id && e.playerId !== currentId));

  return (
    <div className="space-y-4 pt-2">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">{isHome ? teamName : opponent} (Home)</Label>
          <Input type="number" min="0" value={homeScore} onChange={(e) => setHomeScore(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">{isHome ? opponent : teamName} (Away)</Label>
          <Input type="number" min="0" value={awayScore} onChange={(e) => setAwayScore(e.target.value)} />
        </div>
      </div>

      {/* Goal Scorers */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs">Goal Scorers</Label>
          <Button size="sm" variant="ghost" onClick={addGoalEntry} className="h-7 text-xs gap-1">
            <Plus className="h-3 w-3" />Add
          </Button>
        </div>
        {goalEntries.length === 0 && (
          <p className="text-xs text-muted-foreground italic">No goals scored — click Add to log scorers</p>
        )}
        <div className="space-y-2">
          {goalEntries.map((entry, i) => (
            <div key={i} className="flex items-center gap-2">
              <Select value={entry.playerId} onValueChange={(v) => updateGoalEntry(i, "playerId", v)}>
                <SelectTrigger className="h-8 text-sm flex-1">
                  <SelectValue placeholder="Select player" />
                </SelectTrigger>
                <SelectContent>
                  {roster.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.shirt_number ? `#${p.shirt_number} ` : ""}{p.first_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number" min="1" value={entry.count}
                onChange={(e) => updateGoalEntry(i, "count", parseInt(e.target.value) || 1)}
                className="h-8 w-16 text-sm text-center"
              />
              <Button size="sm" variant="ghost" onClick={() => removeGoalEntry(i)} className="h-8 w-8 p-0">
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Assists */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs">Assists</Label>
          <Button size="sm" variant="ghost" onClick={addAssistEntry} className="h-7 text-xs gap-1">
            <Plus className="h-3 w-3" />Add
          </Button>
        </div>
        {assistEntries.length === 0 && (
          <p className="text-xs text-muted-foreground italic">No assists — click Add to log</p>
        )}
        <div className="space-y-2">
          {assistEntries.map((entry, i) => (
            <div key={i} className="flex items-center gap-2">
              <Select value={entry.playerId} onValueChange={(v) => updateAssistEntry(i, "playerId", v)}>
                <SelectTrigger className="h-8 text-sm flex-1">
                  <SelectValue placeholder="Select player" />
                </SelectTrigger>
                <SelectContent>
                  {roster.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.shirt_number ? `#${p.shirt_number} ` : ""}{p.first_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number" min="1" value={entry.count}
                onChange={(e) => updateAssistEntry(i, "count", parseInt(e.target.value) || 1)}
                className="h-8 w-16 text-sm text-center"
              />
              <Button size="sm" variant="ghost" onClick={() => removeAssistEntry(i)} className="h-8 w-8 p-0">
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-xs">Match Notes</Label>
        <Textarea placeholder="How did the team play? Key moments..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
      </div>

      {roster.length === 0 && (
        <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 rounded-md p-2">
          ⚠️ No players in roster yet. Add players via the Coach Panel first to track individual stats.
        </p>
      )}

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
        Save Match Report
      </Button>
    </div>
  );
}
