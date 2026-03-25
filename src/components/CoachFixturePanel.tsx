import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ClipboardList, Trophy, Users, FileText, Save, Loader2, X, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FAFixture } from "@/hooks/useTeamFixtures";

interface CoachFixturePanelProps {
  open: boolean;
  onClose: () => void;
  fixture: FAFixture;
  teamSlug: string;
  teamName: string;
}

export function CoachFixturePanel({ open, onClose, fixture, teamSlug, teamName }: CoachFixturePanelProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isResult = fixture.type === "result";
  const isHome = fixture.homeTeam.includes("Peterborough Ath");
  const opponent = isHome ? fixture.awayTeam : fixture.homeTeam;
  const fixtureKey = `${teamSlug}-${fixture.date}-${opponent}`;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">
            <span className="text-primary">{teamName}</span> vs {opponent}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">{fixture.date} · {fixture.time} · {fixture.venue || "TBC"}</p>
        </DialogHeader>

        <Tabs defaultValue={isResult ? "report" : "selection"} className="mt-2">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="report" className="text-xs gap-1">
              <ClipboardList className="h-3 w-3" />Report
            </TabsTrigger>
            <TabsTrigger value="potm" className="text-xs gap-1">
              <Trophy className="h-3 w-3" />POTM
            </TabsTrigger>
            <TabsTrigger value="selection" className="text-xs gap-1">
              <Users className="h-3 w-3" />Squad
            </TabsTrigger>
            <TabsTrigger value="notes" className="text-xs gap-1">
              <FileText className="h-3 w-3" />Notes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="report">
            <MatchReportTab
              teamSlug={teamSlug}
              teamName={teamName}
              opponent={opponent}
              fixture={fixture}
              isHome={isHome}
            />
          </TabsContent>

          <TabsContent value="potm">
            <POTMTab teamName={teamName} opponent={opponent} fixture={fixture} />
          </TabsContent>

          <TabsContent value="selection">
            <TeamSelectionTab
              teamSlug={teamSlug}
              opponent={opponent}
              fixture={fixture}
            />
          </TabsContent>

          <TabsContent value="notes">
            <TrainingNotesTab
              teamSlug={teamSlug}
              opponent={opponent}
              fixture={fixture}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

/* ── Match Report Tab ──────────────────────────────────────── */
function MatchReportTab({
  teamSlug, teamName, opponent, fixture, isHome,
}: {
  teamSlug: string; teamName: string; opponent: string;
  fixture: FAFixture; isHome: boolean;
}) {
  const [homeScore, setHomeScore] = useState(fixture.homeScore?.toString() || "0");
  const [awayScore, setAwayScore] = useState(fixture.awayScore?.toString() || "0");
  const [goalScorers, setGoalScorers] = useState("");
  const [assists, setAssists] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const ageGroupMap: Record<string, string> = {
    "u7s": "Under 7", "u8s-black": "Under 8", "u8s-gold": "Under 8",
    "u9s": "Under 9", "u10s": "Under 10", "u11s-black": "Under 11",
    "u11s-gold": "Under 11", "u13s-black": "Under 13", "u13s-gold": "Under 13",
    "u14s": "Under 14",
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const [d, m, y] = fixture.date.split("/");
      const matchDate = `20${y}-${m}-${d}`;

      const { error } = await supabase.from("match_reports").insert({
        team_name: teamName,
        age_group: ageGroupMap[teamSlug] || teamName,
        opponent,
        home_score: parseInt(homeScore) || 0,
        away_score: parseInt(awayScore) || 0,
        goal_scorers: goalScorers || null,
        assists: assists || null,
        notes: notes || null,
        match_date: matchDate,
      });

      if (error) throw error;
      toast.success("Match report saved!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save report");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">{isHome ? teamName : opponent} (Home)</Label>
          <Input
            type="number" min="0" value={homeScore}
            onChange={(e) => setHomeScore(e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs">{isHome ? opponent : teamName} (Away)</Label>
          <Input
            type="number" min="0" value={awayScore}
            onChange={(e) => setAwayScore(e.target.value)}
          />
        </div>
      </div>
      <div>
        <Label className="text-xs">Goal Scorers</Label>
        <Input
          placeholder="e.g. J. Smith x2, T. Jones"
          value={goalScorers}
          onChange={(e) => setGoalScorers(e.target.value)}
        />
      </div>
      <div>
        <Label className="text-xs">Assists</Label>
        <Input
          placeholder="e.g. A. Brown, M. Wilson"
          value={assists}
          onChange={(e) => setAssists(e.target.value)}
        />
      </div>
      <div>
        <Label className="text-xs">Match Notes</Label>
        <Textarea
          placeholder="How did the team play? Key moments..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>
      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
        Save Match Report
      </Button>
    </div>
  );
}

/* ── POTM Tab ──────────────────────────────────────────────── */
function POTMTab({
  teamName, opponent, fixture,
}: {
  teamName: string; opponent: string; fixture: FAFixture;
}) {
  const [playerName, setPlayerName] = useState("");
  const [shirtNumber, setShirtNumber] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!playerName.trim()) { toast.error("Player name is required"); return; }
    setSaving(true);
    try {
      const [d, m, y] = fixture.date.split("/");
      const awardDate = `20${y}-${m}-${d}`;

      const { error } = await supabase.from("player_of_the_match").insert({
        player_name: playerName,
        team_name: teamName,
        age_group: teamName,
        shirt_number: shirtNumber ? parseInt(shirtNumber) : null,
        match_description: `vs ${opponent}`,
        reason: reason || null,
        award_date: awardDate,
      });

      if (error) throw error;
      toast.success("POTM saved!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save POTM");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Player Name</Label>
          <Input
            placeholder="First Last"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs">Shirt Number</Label>
          <Input
            type="number" placeholder="#"
            value={shirtNumber}
            onChange={(e) => setShirtNumber(e.target.value)}
          />
        </div>
      </div>
      <div>
        <Label className="text-xs">Reason for Award</Label>
        <Textarea
          placeholder="Outstanding performance, great tackles..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
        />
      </div>
      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trophy className="h-4 w-4 mr-2" />}
        Save Player of the Match
      </Button>
    </div>
  );
}

/* ── Team Selection Tab ────────────────────────────────────── */
function TeamSelectionTab({
  teamSlug, opponent, fixture,
}: {
  teamSlug: string; opponent: string; fixture: FAFixture;
}) {
  const [players, setPlayers] = useState<string[]>([""]);
  const [formation, setFormation] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: existing } = useQuery({
    queryKey: ["team-selection", teamSlug, fixture.date, opponent],
    queryFn: async () => {
      const { data } = await supabase
        .from("team_selections")
        .select("*")
        .eq("team_slug", teamSlug)
        .eq("fixture_date", fixture.date)
        .eq("opponent", opponent)
        .maybeSingle();
      return data;
    },
  });

  useState(() => {
    if (existing) {
      const parsed = existing.players as string[];
      if (Array.isArray(parsed) && parsed.length > 0) setPlayers(parsed);
      if (existing.formation) setFormation(existing.formation);
      if (existing.notes) setNotes(existing.notes);
    }
  });

  const addPlayer = () => setPlayers([...players, ""]);
  const removePlayer = (i: number) => setPlayers(players.filter((_, idx) => idx !== i));
  const updatePlayer = (i: number, val: string) => {
    const next = [...players];
    next[i] = val;
    setPlayers(next);
  };

  const handleSave = async () => {
    const filtered = players.filter((p) => p.trim());
    if (filtered.length === 0) { toast.error("Add at least one player"); return; }
    setSaving(true);
    try {
      const payload = {
        team_slug: teamSlug,
        fixture_date: fixture.date,
        opponent,
        players: filtered,
        formation: formation || null,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        const { error } = await supabase
          .from("team_selections")
          .update(payload)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("team_selections")
          .insert(payload);
        if (error) throw error;
      }

      toast.success("Team selection saved!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 pt-2">
      <div>
        <Label className="text-xs">Formation</Label>
        <Select value={formation} onValueChange={setFormation}>
          <SelectTrigger><SelectValue placeholder="Select formation" /></SelectTrigger>
          <SelectContent>
            {["4-4-2", "4-3-3", "3-5-2", "4-2-3-1", "3-4-3", "5-3-2", "4-5-1"].map((f) => (
              <SelectItem key={f} value={f}>{f}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs">Players</Label>
          <Button size="sm" variant="ghost" onClick={addPlayer} className="h-7 text-xs gap-1">
            <Plus className="h-3 w-3" />Add
          </Button>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {players.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}.</span>
              <Input
                className="h-8 text-sm"
                placeholder="Player name"
                value={p}
                onChange={(e) => updatePlayer(i, e.target.value)}
              />
              {players.length > 1 && (
                <Button size="sm" variant="ghost" onClick={() => removePlayer(i)} className="h-8 w-8 p-0">
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
      <div>
        <Label className="text-xs">Squad Notes</Label>
        <Textarea
          placeholder="Substitutions, positioning notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
      </div>
      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Users className="h-4 w-4 mr-2" />}
        Save Team Selection
      </Button>
    </div>
  );
}

/* ── Training Notes Tab ────────────────────────────────────── */
function TrainingNotesTab({
  teamSlug, opponent, fixture,
}: {
  teamSlug: string; opponent: string; fixture: FAFixture;
}) {
  const [noteType, setNoteType] = useState("pre-match");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: existingNotes } = useQuery({
    queryKey: ["training-notes", teamSlug, fixture.date, opponent],
    queryFn: async () => {
      const { data } = await supabase
        .from("training_notes")
        .select("*")
        .eq("team_slug", teamSlug)
        .eq("fixture_date", fixture.date)
        .eq("opponent", opponent)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const handleSave = async () => {
    if (!content.trim()) { toast.error("Add some notes"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("training_notes").insert({
        team_slug: teamSlug,
        fixture_date: fixture.date,
        opponent,
        note_type: noteType,
        content: content.trim(),
      });
      if (error) throw error;
      toast.success("Notes saved!");
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["training-notes", teamSlug, fixture.date, opponent] });
    } catch (err: any) {
      toast.error(err.message || "Failed to save notes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 pt-2">
      <div>
        <Label className="text-xs">Note Type</Label>
        <Select value={noteType} onValueChange={setNoteType}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pre-match">Pre-Match</SelectItem>
            <SelectItem value="post-match">Post-Match</SelectItem>
            <SelectItem value="training">Training</SelectItem>
            <SelectItem value="general">General</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Notes</Label>
        <Textarea
          placeholder="Focus areas, tactics, drills to revisit..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
        />
      </div>
      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
        Save Notes
      </Button>

      {existingNotes && existingNotes.length > 0 && (
        <div className="border-t border-border pt-3 space-y-2">
          <p className="text-xs font-display font-semibold text-muted-foreground tracking-wider uppercase">Previous Notes</p>
          {existingNotes.map((note) => (
            <div key={note.id} className="bg-secondary rounded-md p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-display font-bold text-primary uppercase tracking-wider">
                  {note.note_type}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(note.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap">{note.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
