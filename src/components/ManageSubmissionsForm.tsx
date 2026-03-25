import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Pencil, Trash2, FileText, Star, Loader2, Save, X, ChevronDown, ChevronUp, Camera, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
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

const ageGroups = [
  "U7", "U8 Black", "U8 Gold", "U9", "U10",
  "U11 Black", "U11 Gold", "U13 Black", "U13 Gold", "U14",
];

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
            <label className="block text-[10px] font-display tracking-wider text-muted-foreground mb-1">Team Name</label>
            <input value={form.team_name} onChange={(e) => setForm({ ...form, team_name: e.target.value })} className="w-full bg-secondary border border-border rounded px-2 py-1.5 text-sm text-foreground" />
          </div>
          <div>
            <label className="block text-[10px] font-display tracking-wider text-muted-foreground mb-1">Age Group</label>
            <select value={form.age_group} onChange={(e) => setForm({ ...form, age_group: e.target.value })} className="w-full bg-secondary border border-border rounded px-2 py-1.5 text-sm text-foreground">
              {ageGroups.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-display tracking-wider text-muted-foreground mb-1">Opponent</label>
          <input value={form.opponent} onChange={(e) => setForm({ ...form, opponent: e.target.value })} className="w-full bg-secondary border border-border rounded px-2 py-1.5 text-sm text-foreground" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-display tracking-wider text-muted-foreground mb-1">Our Score</label>
            <input type="number" min="0" value={form.home_score} onChange={(e) => setForm({ ...form, home_score: e.target.value })} className="w-full bg-secondary border border-border rounded px-2 py-1.5 text-sm text-foreground" />
          </div>
          <div>
            <label className="block text-[10px] font-display tracking-wider text-muted-foreground mb-1">Their Score</label>
            <input type="number" min="0" value={form.away_score} onChange={(e) => setForm({ ...form, away_score: e.target.value })} className="w-full bg-secondary border border-border rounded px-2 py-1.5 text-sm text-foreground" />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-display tracking-wider text-muted-foreground mb-1">Goal Scorers</label>
          <input value={form.goal_scorers} onChange={(e) => setForm({ ...form, goal_scorers: e.target.value })} className="w-full bg-secondary border border-border rounded px-2 py-1.5 text-sm text-foreground" />
        </div>
        <div>
          <label className="block text-[10px] font-display tracking-wider text-muted-foreground mb-1">Assists</label>
          <input value={form.assists} onChange={(e) => setForm({ ...form, assists: e.target.value })} className="w-full bg-secondary border border-border rounded px-2 py-1.5 text-sm text-foreground" />
        </div>
        <div>
          <label className="block text-[10px] font-display tracking-wider text-muted-foreground mb-1">Notes</label>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full bg-secondary border border-border rounded px-2 py-1.5 text-sm text-foreground resize-none" />
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
    const { error } = await supabase
      .from("player_of_the_match")
      .update({
        player_name: form.player_name.trim(),
        team_name: form.team_name.trim(),
        age_group: form.age_group,
        shirt_number: form.shirt_number ? parseInt(form.shirt_number) : null,
        match_description: form.match_description.trim() || null,
        reason: form.reason.trim() || null,
      })
      .eq("id", potm.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to update POTM");
    } else {
      toast.success("POTM award updated");
      setEditing(false);
      onDeleted(); // refresh
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
            <label className="block text-[10px] font-display tracking-wider text-muted-foreground mb-1">Player Name</label>
            <input value={form.player_name} onChange={(e) => setForm({ ...form, player_name: e.target.value })} className="w-full bg-secondary border border-border rounded px-2 py-1.5 text-sm text-foreground" />
          </div>
          <div>
            <label className="block text-[10px] font-display tracking-wider text-muted-foreground mb-1">Shirt #</label>
            <input type="number" value={form.shirt_number} onChange={(e) => setForm({ ...form, shirt_number: e.target.value })} className="w-full bg-secondary border border-border rounded px-2 py-1.5 text-sm text-foreground" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-display tracking-wider text-muted-foreground mb-1">Team Name</label>
            <input value={form.team_name} onChange={(e) => setForm({ ...form, team_name: e.target.value })} className="w-full bg-secondary border border-border rounded px-2 py-1.5 text-sm text-foreground" />
          </div>
          <div>
            <label className="block text-[10px] font-display tracking-wider text-muted-foreground mb-1">Age Group</label>
            <select value={form.age_group} onChange={(e) => setForm({ ...form, age_group: e.target.value })} className="w-full bg-secondary border border-border rounded px-2 py-1.5 text-sm text-foreground">
              {ageGroups.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-display tracking-wider text-muted-foreground mb-1">Match (Opponent)</label>
          <input value={form.match_description} onChange={(e) => setForm({ ...form, match_description: e.target.value })} className="w-full bg-secondary border border-border rounded px-2 py-1.5 text-sm text-foreground" />
        </div>
        <div>
          <label className="block text-[10px] font-display tracking-wider text-muted-foreground mb-1">Reason</label>
          <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={2} className="w-full bg-secondary border border-border rounded px-2 py-1.5 text-sm text-foreground resize-none" />
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

export function ManageSubmissionsForm() {
  const queryClient = useQueryClient();
  const [showReports, setShowReports] = useState(true);
  const [showPotm, setShowPotm] = useState(true);

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

  return (
    <div className="space-y-6">
      {/* Match Reports */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <button
          onClick={() => setShowReports(!showReports)}
          className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="font-display text-lg font-bold text-foreground">Match Reports</h3>
            <span className="text-xs text-muted-foreground">({reports.length})</span>
          </div>
          {showReports ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>
        {showReports && (
          <div className="px-4 pb-4 space-y-2">
            {reportsLoading ? (
              <div className="text-center py-6"><Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" /></div>
            ) : reports.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No match reports submitted yet.</p>
            ) : (
              reports.map((r) => <MatchReportRow key={r.id} report={r} onDeleted={refresh} />)
            )}
          </div>
        )}
      </div>

      {/* POTM Awards */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <button
          onClick={() => setShowPotm(!showPotm)}
          className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            <h3 className="font-display text-lg font-bold text-foreground">POTM Awards</h3>
            <span className="text-xs text-muted-foreground">({potmAwards.length})</span>
          </div>
          {showPotm ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>
        {showPotm && (
          <div className="px-4 pb-4 space-y-2">
            {potmLoading ? (
              <div className="text-center py-6"><Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" /></div>
            ) : potmAwards.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No POTM awards submitted yet.</p>
            ) : (
              potmAwards.map((p) => <POTMRow key={p.id} potm={p} onDeleted={refresh} />)
            )}
          </div>
        )}
      </div>
    </div>
  );
}
