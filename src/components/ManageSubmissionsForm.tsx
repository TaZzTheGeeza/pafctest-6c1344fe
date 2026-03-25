import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Pencil, Trash2, FileText, Star, Loader2, Save, X, ChevronDown, ChevronUp, Camera, Upload, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const ageGroups = [
  "U7", "U8 Black", "U8 Gold", "U9", "U10",
  "U11 Black", "U11 Gold", "U13 Black", "U13 Gold", "U14",
];

// Reverse map age group to team slug for roster lookup
const ageGroupToSlug: Record<string, string> = {
  "U7": "u7s", "U8 Black": "u8s-black", "U8 Gold": "u8s-gold",
  "U9": "u9s", "U10": "u10s", "U11 Black": "u11s-black",
  "U11 Gold": "u11s-gold", "U13 Black": "u13s-black", "U13 Gold": "u13s-gold",
  "U14": "u14s",
};

interface GoalEntry { playerId: string; playerName: string; count: number; }
interface AssistEntry { playerId: string; playerName: string; count: number; }

// ─── Match Reports Section ───

function MatchReportRow({ report, onDeleted }: { report: any; onDeleted: () => void }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    team_name: report.team_name,
    age_group: report.age_group,
    opponent: report.opponent,
    home_score: String(report.home_score),
    away_score: String(report.away_score),
    goal_scorers: report.goal_scorers || "",
    assists: report.assists || "",
    notes: report.notes || "",
  });

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("match_reports")
      .update({
        team_name: form.team_name.trim(),
        age_group: form.age_group,
        opponent: form.opponent.trim(),
        home_score: parseInt(form.home_score) || 0,
        away_score: parseInt(form.away_score) || 0,
        goal_scorers: form.goal_scorers.trim() || null,
        assists: form.assists.trim() || null,
        notes: form.notes.trim() || null,
      })
      .eq("id", report.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to update report");
    } else {
      toast.success("Match report updated");
      setEditing(false);
      onDeleted(); // refresh
    }
  };

  const handleDelete = async () => {
    const { error } = await supabase.from("match_reports").delete().eq("id", report.id);
    if (error) {
      toast.error("Failed to delete report");
    } else {
      toast.success("Match report deleted");
      onDeleted();
    }
  };

  if (editing) {
    return (
      <div className="bg-card border border-primary/30 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-display text-sm text-primary">Editing Report</span>
          <Button variant="ghost" size="sm" onClick={() => setEditing(false)} className="h-7 w-7 p-0">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-display tracking-wider text-muted-foreground mb-1">Team Name</label>
            <input value={form.team_name} onChange={(e) => setForm({ ...form, team_name: e.target.value })} className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground" />
          </div>
          <div>
            <label className="block text-xs font-display tracking-wider text-muted-foreground mb-1">Age Group</label>
            <select value={form.age_group} onChange={(e) => setForm({ ...form, age_group: e.target.value })} className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground">
              {ageGroups.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-display tracking-wider text-muted-foreground mb-1">Opponent</label>
          <input value={form.opponent} onChange={(e) => setForm({ ...form, opponent: e.target.value })} className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-display tracking-wider text-muted-foreground mb-1">Our Score</label>
            <input type="number" min="0" value={form.home_score} onChange={(e) => setForm({ ...form, home_score: e.target.value })} className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground" />
          </div>
          <div>
            <label className="block text-xs font-display tracking-wider text-muted-foreground mb-1">Their Score</label>
            <input type="number" min="0" value={form.away_score} onChange={(e) => setForm({ ...form, away_score: e.target.value })} className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-display tracking-wider text-muted-foreground mb-1">Goal Scorers</label>
          <input value={form.goal_scorers} onChange={(e) => setForm({ ...form, goal_scorers: e.target.value })} className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground" />
        </div>
        <div>
          <label className="block text-xs font-display tracking-wider text-muted-foreground mb-1">Assists</label>
          <input value={form.assists} onChange={(e) => setForm({ ...form, assists: e.target.value })} className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground" />
        </div>
        <div>
          <label className="block text-xs font-display tracking-wider text-muted-foreground mb-1">Notes</label>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground resize-none" />
        </div>
        <Button onClick={handleSave} disabled={saving} size="sm" className="w-full gap-1">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save Changes
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-3 flex items-center gap-3 group hover:border-primary/30 transition-colors">
      <FileText className="h-4 w-4 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-display text-foreground truncate">
          {report.team_name} vs {report.opponent}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {report.home_score}-{report.away_score} · {report.age_group} · {format(new Date(report.match_date), "dd MMM yyyy")}
        </p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="h-7 w-7 p-0">
          <Pencil className="h-3 w-3" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive">
              <Trash2 className="h-3 w-3" />
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
      </div>
    </div>
  );
}

// ─── POTM Section ───

function POTMRow({ potm, onDeleted }: { potm: any; onDeleted: () => void }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [form, setForm] = useState({
    player_name: potm.player_name,
    team_name: potm.team_name,
    age_group: potm.age_group,
    shirt_number: potm.shirt_number ? String(potm.shirt_number) : "",
    match_description: potm.match_description || "",
    reason: potm.reason || "",
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Photo must be under 5MB"); return; }
    setNewPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    setRemovePhoto(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let photo_url = potm.photo_url;

      // Upload new photo if selected
      if (newPhoto) {
        const ext = newPhoto.name.split(".").pop() || "jpg";
        const path = `potm/${Date.now()}-${form.player_name.replace(/\s+/g, "-")}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("club-photos")
          .upload(path, newPhoto, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("club-photos").getPublicUrl(path);
        photo_url = urlData.publicUrl;
      } else if (removePhoto) {
        photo_url = null;
      }

      const { error } = await supabase
        .from("player_of_the_match")
        .update({
          player_name: form.player_name.trim(),
          team_name: form.team_name.trim(),
          age_group: form.age_group,
          shirt_number: form.shirt_number ? parseInt(form.shirt_number) : null,
          match_description: form.match_description.trim() || null,
          reason: form.reason.trim() || null,
          photo_url,
        })
        .eq("id", potm.id);
      if (error) throw error;
      toast.success("POTM award updated");
      setEditing(false);
      setNewPhoto(null);
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
      onDeleted(); // refresh
    } catch (err: any) {
      toast.error(err.message || "Failed to update POTM");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const { error } = await supabase.from("player_of_the_match").delete().eq("id", potm.id);
    if (error) {
      toast.error("Failed to delete POTM");
    } else {
      toast.success("POTM award deleted");
      onDeleted();
    }
  };

  if (editing) {
    return (
      <div className="bg-card border border-primary/30 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-display text-sm text-primary">Editing POTM</span>
          <Button variant="ghost" size="sm" onClick={() => setEditing(false)} className="h-7 w-7 p-0">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-display tracking-wider text-muted-foreground mb-1">Player Name</label>
            <input value={form.player_name} onChange={(e) => setForm({ ...form, player_name: e.target.value })} className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground" />
          </div>
          <div>
            <label className="block text-xs font-display tracking-wider text-muted-foreground mb-1">Shirt #</label>
            <input type="number" value={form.shirt_number} onChange={(e) => setForm({ ...form, shirt_number: e.target.value })} className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-display tracking-wider text-muted-foreground mb-1">Team Name</label>
            <input value={form.team_name} onChange={(e) => setForm({ ...form, team_name: e.target.value })} className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground" />
          </div>
          <div>
            <label className="block text-xs font-display tracking-wider text-muted-foreground mb-1">Age Group</label>
            <select value={form.age_group} onChange={(e) => setForm({ ...form, age_group: e.target.value })} className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground">
              {ageGroups.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-display tracking-wider text-muted-foreground mb-1">Match (Opponent)</label>
          <input value={form.match_description} onChange={(e) => setForm({ ...form, match_description: e.target.value })} className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground" />
        </div>
        <div>
          <label className="block text-xs font-display tracking-wider text-muted-foreground mb-1">Reason</label>
          <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={2} className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground resize-none" />
        </div>

        {/* Photo section */}
        <div>
          <label className="block text-xs font-display tracking-wider text-muted-foreground mb-1">Player Photo</label>
          {(photoPreview || (!removePhoto && potm.photo_url)) ? (
            <div className="flex items-center gap-3">
              <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-border shrink-0">
                <img
                  src={photoPreview || potm.photo_url}
                  alt={form.player_name}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (photoPreview) URL.revokeObjectURL(photoPreview);
                    setNewPhoto(null);
                    setPhotoPreview(null);
                    setRemovePhoto(true);
                  }}
                  className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full p-0.5"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
              <label className="cursor-pointer text-xs text-primary hover:underline flex items-center gap-1">
                <Camera className="h-3 w-3" /> Replace
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </label>
            </div>
          ) : (
            <label className="flex items-center gap-2 cursor-pointer bg-secondary border border-dashed border-border rounded-lg px-3 py-3 hover:border-primary/50 transition-colors">
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Upload a photo</span>
              <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
            </label>
          )}
        </div>

        <Button onClick={handleSave} disabled={saving} size="sm" className="w-full gap-1">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save Changes
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-3 flex items-center gap-3 group hover:border-primary/30 transition-colors">
      {potm.photo_url ? (
        <img src={potm.photo_url} alt={potm.player_name} className="h-8 w-8 rounded-full object-cover border border-primary/30 shrink-0" />
      ) : (
        <Star className="h-4 w-4 text-primary shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-display text-foreground truncate">
          {potm.shirt_number ? `#${potm.shirt_number} ` : ""}{potm.player_name}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {potm.team_name} · {potm.age_group} · {potm.match_description || "No match"} · {format(new Date(potm.award_date), "dd MMM yyyy")}
        </p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="h-7 w-7 p-0">
          <Pencil className="h-3 w-3" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive">
              <Trash2 className="h-3 w-3" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete POTM Award?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the POTM award for {potm.player_name}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

// ─── Main Component ───

interface MatchGroup {
  report: any;
  potmAwards: any[];
}

export function ManageSubmissionsForm() {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ["all-match-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("match_reports")
        .select("*")
        .order("match_date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const { data: potmAwards = [], isLoading: potmLoading } = useQuery({
    queryKey: ["all-potm-awards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("player_of_the_match")
        .select("*")
        .order("award_date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["all-match-reports"] });
    queryClient.invalidateQueries({ queryKey: ["all-potm-awards"] });
  };

  // Group POTM awards into their matching report by team_name + date
  const matchGroups: MatchGroup[] = reports.map((r: any) => {
    const linked = potmAwards.filter(
      (p: any) => p.team_name === r.team_name && p.award_date === r.match_date
    );
    return { report: r, potmAwards: linked };
  });

  // Find orphaned POTM awards (not linked to any report)
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
              <div key={r.id} className="bg-card border border-border rounded-xl overflow-hidden">
                {/* Match header row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : r.id)}
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

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-border">
                    {/* Match report edit */}
                    <div className="px-3 py-2">
                      <p className="text-[10px] font-display uppercase tracking-wider text-muted-foreground mb-2">Match Report</p>
                      <MatchReportRow report={r} onDeleted={refresh} />
                    </div>

                    {/* Linked POTM awards */}
                    {group.potmAwards.length > 0 && (
                      <div className="px-3 py-2 border-t border-border/50">
                        <p className="text-[10px] font-display uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                          <Star className="h-2.5 w-2.5 text-primary" /> POTM Awards ({group.potmAwards.length})
                        </p>
                        <div className="space-y-2">
                          {group.potmAwards.map((p: any) => (
                            <POTMRow key={p.id} potm={p} onDeleted={refresh} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Orphaned POTM awards (not linked to a report) */}
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
                  <POTMRow key={p.id} potm={p} onDeleted={refresh} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
