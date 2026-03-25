import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Trash2, FileText, Star, Loader2, Save, X, ChevronDown, ChevronUp, Camera, Plus, Trophy, ClipboardList, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useTeamRoster, type RosterPlayer } from "@/hooks/useTeamRoster";
import { uploadPotmPhoto } from "@/lib/potmPhoto";

const ageGroupToSlug: Record<string, string> = {
  "U7": "u7s", "U8 Black": "u8s-black", "U8 Gold": "u8s-gold",
  "U9": "u9s", "U10": "u10s", "U11 Black": "u11s-black",
  "U11 Gold": "u11s-gold", "U13 Black": "u13s-black", "U13 Gold": "u13s-gold",
  "U14": "u14s",
};

interface GoalEntry { playerId: string; playerName: string; count: number; }

// Parse "Player x2, Player2" text into entries
function parseTextToEntries(text: string, roster: RosterPlayer[]): GoalEntry[] {
  if (!text?.trim()) return [];
  return text.split(",").map(s => s.trim()).filter(Boolean).map(part => {
    const match = part.match(/^(.+?)(?:\s*x(\d+))?$/);
    if (!match) return { playerId: "", playerName: part, count: 1 };
    const name = match[1].trim();
    const count = match[2] ? parseInt(match[2]) : 1;
    const player = roster.find(r => r.first_name.toLowerCase() === name.toLowerCase());
    return { playerId: player?.id || "", playerName: name, count };
  });
}

function entriesToText(entries: GoalEntry[], roster: RosterPlayer[]): string {
  return entries
    .filter(e => e.playerId || e.playerName)
    .map(e => {
      const p = roster.find(r => r.id === e.playerId);
      const name = p ? p.first_name : e.playerName;
      return `${name}${e.count > 1 ? ` x${e.count}` : ""}`;
    })
    .join(", ");
}

// ─── Report Edit Tab ───

function ReportEditTab({ report, roster, onSaved }: { report: any; roster: RosterPlayer[]; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [homeScore, setHomeScore] = useState(String(report.home_score));
  const [awayScore, setAwayScore] = useState(String(report.away_score));
  const [notes, setNotes] = useState(report.notes || "");

  const [goalEntries, setGoalEntries] = useState<GoalEntry[]>(() =>
    parseTextToEntries(report.goal_scorers || "", roster)
  );
  const [assistEntries, setAssistEntries] = useState<GoalEntry[]>(() =>
    parseTextToEntries(report.assists || "", roster)
  );

  const [rosterLoaded, setRosterLoaded] = useState(false);
  if (roster.length > 0 && !rosterLoaded) {
    setRosterLoaded(true);
    setGoalEntries(parseTextToEntries(report.goal_scorers || "", roster));
    setAssistEntries(parseTextToEntries(report.assists || "", roster));
  }

  const addGoalEntry = () => setGoalEntries([...goalEntries, { playerId: "", playerName: "", count: 1 }]);
  const addAssistEntry = () => setAssistEntries([...assistEntries, { playerId: "", playerName: "", count: 1 }]);
  const removeGoalEntry = (i: number) => setGoalEntries(goalEntries.filter((_, idx) => idx !== i));
  const removeAssistEntry = (i: number) => setAssistEntries(assistEntries.filter((_, idx) => idx !== i));

  const updateEntry = (entries: GoalEntry[], setEntries: (v: GoalEntry[]) => void, i: number, field: string, val: string | number) => {
    const next = [...entries];
    if (field === "playerId") {
      const p = roster.find(r => r.id === val);
      next[i] = { ...next[i], playerId: val as string, playerName: p?.first_name || "" };
    } else {
      next[i] = { ...next[i], [field]: val };
    }
    setEntries(next);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("match_reports")
      .update({
        home_score: parseInt(homeScore) || 0,
        away_score: parseInt(awayScore) || 0,
        goal_scorers: entriesToText(goalEntries, roster) || null,
        assists: entriesToText(assistEntries, roster) || null,
        notes: notes.trim() || null,
      })
      .eq("id", report.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to update report");
    } else {
      toast.success("Match report updated");
      onSaved();
    }
  };

  const renderEntryRows = (entries: GoalEntry[], setEntries: (v: GoalEntry[]) => void, label: string, addFn: () => void, removeFn: (i: number) => void, emptyMsg: string) => (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label className="text-xs">{label}</Label>
        <Button size="sm" variant="ghost" onClick={addFn} className="h-7 text-xs gap-1">
          <Plus className="h-3 w-3" />Add
        </Button>
      </div>
      {entries.length === 0 && (
        <p className="text-xs text-muted-foreground italic">{emptyMsg}</p>
      )}
      <div className="space-y-2">
        {entries.map((entry, i) => (
          <div key={i} className="flex items-center gap-2">
            {roster.length > 0 ? (
              <Select value={entry.playerId} onValueChange={(v) => updateEntry(entries, setEntries, i, "playerId", v)}>
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
            ) : (
              <Input
                value={entry.playerName}
                onChange={(e) => { const next = [...entries]; next[i] = { ...next[i], playerName: e.target.value }; setEntries(next); }}
                placeholder="Player name"
                className="h-8 text-sm flex-1"
              />
            )}
            <Input
              type="number" min="1" value={entry.count}
              onChange={(e) => updateEntry(entries, setEntries, i, "count", parseInt(e.target.value) || 1)}
              className="h-8 w-16 text-sm text-center"
            />
            <Button size="sm" variant="ghost" onClick={() => removeFn(i)} className="h-8 w-8 p-0">
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-4 pt-2">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">{report.opponent} (Home)</Label>
          <Input type="number" min="0" value={homeScore} onChange={(e) => setHomeScore(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">{report.team_name} (Away)</Label>
          <Input type="number" min="0" value={awayScore} onChange={(e) => setAwayScore(e.target.value)} />
        </div>
      </div>

      {renderEntryRows(goalEntries, setGoalEntries, "Goal Scorers", addGoalEntry, removeGoalEntry, "No goals scored — click Add to log scorers")}
      {renderEntryRows(assistEntries, setAssistEntries, "Assists", addAssistEntry, removeAssistEntry, "No assists — click Add to log")}

      <div>
        <Label className="text-xs">Match Notes</Label>
        <Textarea placeholder="How did the team play? Key moments..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
        Save Match Report
      </Button>
    </div>
  );
}

// ─── POTM Edit Tab ───

function POTMEditTab({ potmAwards, roster, teamSlug, report, onSaved }: { potmAwards: any[]; roster: RosterPlayer[]; teamSlug: string; report: any; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [entries, setEntries] = useState(() =>
    potmAwards.map(p => ({
      id: p.id,
      playerId: roster.find(r => r.first_name.toLowerCase() === p.player_name.toLowerCase())?.id || "",
      playerName: p.player_name,
      reason: p.reason || "",
      photoFile: null as File | null,
      photoPreview: null as string | null,
      existingPhotoUrl: p.photo_url || null,
      removePhoto: false,
    }))
  );

  const selectedIds = entries.map(e => e.playerId).filter(Boolean);

  const addEntry = () => {
    setEntries([...entries, { id: null, playerId: "", playerName: "", reason: "", photoFile: null, photoPreview: null, existingPhotoUrl: null, removePhoto: false }]);
  };

  const removeEntry = async (i: number) => {
    const entry = entries[i];
    if (entry.photoPreview) URL.revokeObjectURL(entry.photoPreview);
    if (entry.id) {
      const { error } = await supabase.from("player_of_the_match").delete().eq("id", entry.id);
      if (error) { toast.error("Failed to delete POTM"); return; }
      toast.success("POTM award deleted");
    }
    setEntries(entries.filter((_, idx) => idx !== i));
    onSaved();
  };

  const updateEntry = (i: number, field: string, val: any) => {
    const next = [...entries];
    if (field === "playerId") {
      const p = roster.find(r => r.id === val);
      next[i] = { ...next[i], playerId: val, playerName: p?.first_name || "" };
    } else {
      next[i] = { ...next[i], [field]: val };
    }
    setEntries(next);
  };

  const handlePhotoSelect = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { toast.error("Photo must be under 20MB"); return; }
    const next = [...entries];
    if (next[i].photoPreview) URL.revokeObjectURL(next[i].photoPreview!);
    next[i] = { ...next[i], photoFile: file, photoPreview: URL.createObjectURL(file), removePhoto: false };
    setEntries(next);
  };

  const clearPhoto = (i: number) => {
    const next = [...entries];
    if (next[i].photoPreview) URL.revokeObjectURL(next[i].photoPreview!);
    next[i] = { ...next[i], photoFile: null, photoPreview: null, removePhoto: true };
    setEntries(next);
    if (fileInputRefs.current[i]) fileInputRefs.current[i]!.value = "";
  };

  const handleSave = async () => {
    const validEntries = entries.filter(e => e.playerId || e.playerName);
    if (validEntries.length === 0) { toast.error("Add at least one player"); return; }
    setSaving(true);
    try {
      for (const entry of validEntries) {
        const player = roster.find(r => r.id === entry.playerId);
        let photoUrl = entry.existingPhotoUrl;

        if (entry.photoFile) {
          photoUrl = await uploadPotmPhoto(entry.photoFile, {
            playerName: player?.first_name || entry.playerName,
            awardDate: report.match_date,
            teamSlug: ageGroupToSlug[report.age_group],
            onStatus: (status) => {
              if (status === "processing") toast.info("Removing photo background...");
              if (status === "processed") toast.success("Background removed");
              if (status === "fallback") toast.warning("Using original photo while background removal is improved");
            },
          });
        } else if (entry.removePhoto) {
          photoUrl = null;
        }

        const data = {
          player_name: player?.first_name || entry.playerName,
          shirt_number: player?.shirt_number || null,
          reason: entry.reason.trim() || null,
          photo_url: photoUrl,
        };

        if (entry.id) {
          const { error } = await supabase.from("player_of_the_match").update(data).eq("id", entry.id);
          if (error) throw error;
        } else {
          // Insert new POTM award linked to this match report
          const { error } = await supabase.from("player_of_the_match").insert({
            ...data,
            team_name: report.team_name,
            age_group: report.age_group,
            award_date: report.match_date,
            match_description: report.opponent,
          });
          if (error) throw error;
        }
      }

      entries.forEach(e => { if (e.photoPreview) URL.revokeObjectURL(e.photoPreview); });
      toast.success("POTM awards updated");
      onSaved();
    } catch (err: any) {
      toast.error(err.message || "Failed to save POTM");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 pt-2">
      {entries.length === 0 && (
        <p className="text-xs text-muted-foreground italic py-4 text-center">No POTM awards for this match yet.</p>
      )}

      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={addEntry} className="text-xs gap-1">
          <Plus className="h-3 w-3" /> Add POTM
        </Button>
      </div>

      {entries.map((entry, i) => (
        <div key={entry.id || i} className="border border-border rounded-lg p-3 space-y-3 relative">
          {entries.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-display text-muted-foreground">POTM #{i + 1}</span>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete POTM Award?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete this POTM award.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => removeEntry(i)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}

          <div>
            <Label className="text-xs">Select Player</Label>
            {roster.length > 0 ? (
              <Select value={entry.playerId} onValueChange={(v) => updateEntry(i, "playerId", v)}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Choose from roster" />
                </SelectTrigger>
                <SelectContent>
                  {roster
                    .filter(p => !selectedIds.includes(p.id) || p.id === entry.playerId)
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.shirt_number ? `#${p.shirt_number} ` : ""}{p.first_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            ) : (
              <Input value={entry.playerName} onChange={(e) => updateEntry(i, "playerName", e.target.value)} placeholder="Player name" className="h-8 text-sm" />
            )}
          </div>

          <div>
            <Label className="text-xs">Reason for Award</Label>
            <Textarea
              placeholder="Outstanding performance..."
              value={entry.reason}
              onChange={(e) => updateEntry(i, "reason", e.target.value)}
              rows={2}
              className="text-sm"
            />
          </div>

          <div>
            <Label className="text-xs">Attach Photo</Label>
            <input
              ref={(el) => { fileInputRefs.current[i] = el; }}
              type="file"
              accept="image/*"
              onChange={(e) => handlePhotoSelect(i, e)}
              className="hidden"
            />
            {(entry.photoPreview || (!entry.removePhoto && entry.existingPhotoUrl)) ? (
              <div className="relative inline-block mt-1">
                <img src={entry.photoPreview || entry.existingPhotoUrl!} alt="POTM preview" className="h-20 w-20 object-cover rounded-lg border border-border" />
                <button
                  type="button"
                  onClick={() => clearPhoto(i)}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-1 w-full h-8 text-xs"
                onClick={() => fileInputRefs.current[i]?.click()}
              >
                <Camera className="h-3.5 w-3.5 mr-1" />
                Add Photo
              </Button>
            )}
          </div>
        </div>
      ))}

      {roster.length === 0 && (
        <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 rounded-md p-2">
          ⚠️ No players in roster. Add players via Coach Panel to select POTM.
        </p>
      )}

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trophy className="h-4 w-4 mr-2" />}
        Save POTM Award{entries.length > 1 ? "s" : ""}
      </Button>
    </div>
  );
}

// ─── Match Delete Button ───

function DeleteReportButton({ report, onDeleted }: { report: any; onDeleted: () => void }) {
  const handleDelete = async () => {
    const { error } = await supabase.from("match_reports").delete().eq("id", report.id);
    if (error) {
      toast.error("Failed to delete report");
    } else {
      toast.success("Match report deleted");
      onDeleted();
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-destructive hover:text-destructive">
          <Trash2 className="h-3 w-3" /> Delete Match
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Match Report?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the report for {report.team_name} vs {report.opponent}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

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

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["all-match-reports", allowedAgeGroups] });
    queryClient.invalidateQueries({ queryKey: ["all-potm-awards", allowedAgeGroups] });
  };

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
            const teamSlug = ageGroupToSlug[r.age_group] || "";

            return (
              <MatchGroupCard
                key={r.id}
                group={group}
                isExpanded={isExpanded}
                teamSlug={teamSlug}
                onToggle={() => setExpandedId(isExpanded ? null : r.id)}
                onRefresh={refresh}
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

function MatchGroupCard({ group, isExpanded, teamSlug, onToggle, onRefresh }: {
  group: MatchGroup; isExpanded: boolean; teamSlug: string;
  onToggle: () => void; onRefresh: () => void;
}) {
  const r = group.report;
  const { data: roster = [] } = useTeamRoster(teamSlug);

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
        <div className="border-t border-border px-3 pb-3">
          <Tabs defaultValue="report" className="mt-2">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="report" className="text-xs gap-1">
                <ClipboardList className="h-3 w-3" />Report
              </TabsTrigger>
              <TabsTrigger value="potm" className="text-xs gap-1">
                <Trophy className="h-3 w-3" />POTM
              </TabsTrigger>
            </TabsList>

            <TabsContent value="report">
              <ReportEditTab report={r} roster={roster} onSaved={onRefresh} />
            </TabsContent>

            <TabsContent value="potm">
              <POTMEditTab potmAwards={group.potmAwards} roster={roster} teamSlug={teamSlug} report={r} onSaved={onRefresh} />
            </TabsContent>
          </Tabs>

          <div className="flex justify-end mt-2 pt-2 border-t border-border/50">
            <DeleteReportButton report={r} onDeleted={onRefresh} />
          </div>
        </div>
      )}
    </div>
  );
}
