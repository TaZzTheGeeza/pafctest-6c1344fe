import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import {
  FileText, Star, Loader2, ChevronDown, ChevronUp, Trophy, Target, Users,
  Pencil, Trash2, Save, X,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ───

interface FixtureGroup {
  key: string;
  teamName: string;
  opponent: string;
  ageGroup: string;
  date: string;
  report: any;
  potmAwards: any[];
}

// ─── Main Component ───

export function ManageSubmissionsForm({ allowedAgeGroups }: { allowedAgeGroups?: string[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const queryClient = useQueryClient();

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

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["all-match-reports"] });
    queryClient.invalidateQueries({ queryKey: ["all-potm-awards"] });
  };

  const fixtureGroups = useMemo(() => {
    const groupMap = new Map<string, FixtureGroup>();

    for (const r of reports) {
      const key = `${r.team_name}::${r.opponent}::${r.match_date}`;
      groupMap.set(key, {
        key, teamName: r.team_name, opponent: r.opponent,
        ageGroup: r.age_group, date: r.match_date, report: r, potmAwards: [],
      });
    }

    for (const p of potmAwards) {
      const opponent = (p.match_description || "").replace(/^vs\s+/i, "").trim();
      let matched = false;
      for (const [, group] of groupMap) {
        if (group.teamName === p.team_name && group.date === p.award_date) {
          group.potmAwards.push(p);
          matched = true;
          break;
        }
      }
      if (!matched) {
        const key = `${p.team_name}::${opponent}::${p.award_date}`;
        const existing = groupMap.get(key);
        if (existing) {
          existing.potmAwards.push(p);
        } else {
          groupMap.set(key, {
            key, teamName: p.team_name, opponent: opponent || "Unknown",
            ageGroup: p.age_group, date: p.award_date, report: null, potmAwards: [p],
          });
        }
      }
    }

    return [...groupMap.values()].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [reports, potmAwards]);

  const isLoading = reportsLoading || potmLoading;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <FileText className="h-5 w-5 text-primary" />
        <h3 className="font-display text-lg font-bold text-foreground">Submissions</h3>
        <span className="text-xs text-muted-foreground">({fixtureGroups.length} fixtures)</span>
      </div>

      {isLoading ? (
        <div className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" /></div>
      ) : fixtureGroups.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8 bg-card border border-border rounded-xl">No submissions yet.</p>
      ) : (
        <div className="space-y-3">
          {fixtureGroups.map((group) => {
            const isExpanded = expandedId === group.key;
            return (
              <FixtureGroupCard
                key={group.key}
                group={group}
                isExpanded={isExpanded}
                onToggle={() => setExpandedId(isExpanded ? null : group.key)}
                onRefresh={invalidateAll}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Fixture Group Card ───

function FixtureGroupCard({ group, isExpanded, onToggle, onRefresh }: {
  group: FixtureGroup; isExpanded: boolean;
  onToggle: () => void; onRefresh: () => void;
}) {
  const r = group.report;
  const hasReport = !!r;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 hover:bg-secondary/50 transition-colors text-left"
      >
        {hasReport ? (
          <FileText className="h-4 w-4 text-primary shrink-0" />
        ) : (
          <Trophy className="h-4 w-4 text-yellow-500 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-display text-foreground truncate">
            {group.teamName} <span className="text-muted-foreground font-body font-normal">vs</span> {group.opponent}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {hasReport ? `${r.home_score}-${r.away_score} · ` : ""}{group.ageGroup} · {format(new Date(group.date), "dd MMM yyyy")}
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

      {isExpanded && (
        <div className="border-t border-border px-4 py-3 space-y-4">
          {hasReport && <ReportSection report={r} onRefresh={onRefresh} />}
          {group.potmAwards.length > 0 && (
            <PotmSection potmAwards={group.potmAwards} onRefresh={onRefresh} />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Editable Report Section ───

function ReportSection({ report: r, onRefresh }: { report: any; onRefresh: () => void }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    home_score: r.home_score,
    away_score: r.away_score,
    goal_scorers: r.goal_scorers || "",
    assists: r.assists || "",
    notes: r.notes || "",
  });

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("match_reports").update({
      home_score: form.home_score,
      away_score: form.away_score,
      goal_scorers: form.goal_scorers.trim() || null,
      assists: form.assists.trim() || null,
      notes: form.notes.trim() || null,
    }).eq("id", r.id);
    setSaving(false);
    if (error) { toast.error("Failed to update report"); return; }
    toast.success("Match report updated");
    setEditing(false);
    onRefresh();
  };

  const handleDelete = async () => {
    if (!confirm("Delete this match report? This cannot be undone.")) return;
    setDeleting(true);
    const { error } = await supabase.from("match_reports").delete().eq("id", r.id);
    setDeleting(false);
    if (error) { toast.error("Failed to delete report"); return; }
    toast.success("Match report deleted");
    onRefresh();
  };

  if (editing) {
    return (
      <div className="space-y-3 bg-secondary/30 rounded-lg p-3">
        <p className="text-[10px] font-display uppercase tracking-wider text-muted-foreground">Edit Match Report</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-muted-foreground">Home Score</label>
            <input type="number" min="0" value={form.home_score} onChange={(e) => setForm({ ...form, home_score: parseInt(e.target.value) || 0 })}
              className="w-full bg-secondary border border-border rounded-lg px-2 py-1.5 text-sm text-foreground" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground">Away Score</label>
            <input type="number" min="0" value={form.away_score} onChange={(e) => setForm({ ...form, away_score: parseInt(e.target.value) || 0 })}
              className="w-full bg-secondary border border-border rounded-lg px-2 py-1.5 text-sm text-foreground" />
          </div>
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground">Goal Scorers</label>
          <input value={form.goal_scorers} onChange={(e) => setForm({ ...form, goal_scorers: e.target.value })}
            className="w-full bg-secondary border border-border rounded-lg px-2 py-1.5 text-sm text-foreground" />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground">Assists</label>
          <input value={form.assists} onChange={(e) => setForm({ ...form, assists: e.target.value })}
            className="w-full bg-secondary border border-border rounded-lg px-2 py-1.5 text-sm text-foreground" />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground">Notes</label>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
            className="w-full bg-secondary border border-border rounded-lg px-2 py-1.5 text-sm text-foreground resize-none" />
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={saving}
            className="flex-1 flex items-center justify-center gap-1 text-xs font-display bg-primary text-primary-foreground rounded-lg py-2 hover:bg-primary/90 disabled:opacity-50">
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save
          </button>
          <button onClick={() => setEditing(false)}
            className="flex items-center justify-center gap-1 text-xs font-display text-muted-foreground border border-border rounded-lg px-3 py-2 hover:bg-secondary">
            <X className="h-3 w-3" /> Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-display font-bold text-foreground text-sm">{r.home_score} - {r.away_score}</span>
        <div className="flex items-center gap-1">
          <button onClick={() => setEditing(true)} className="p-1 text-muted-foreground hover:text-primary transition-colors" title="Edit report">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={handleDelete} disabled={deleting} className="p-1 text-muted-foreground hover:text-destructive transition-colors" title="Delete report">
            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {r.goal_scorers && (
        <div className="flex items-start gap-2">
          <Target className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-[10px] font-display uppercase tracking-wider text-muted-foreground mb-0.5">Goals</p>
            <p className="text-sm text-foreground">{r.goal_scorers}</p>
          </div>
        </div>
      )}

      {r.assists && (
        <div className="flex items-start gap-2">
          <Users className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-[10px] font-display uppercase tracking-wider text-muted-foreground mb-0.5">Assists</p>
            <p className="text-sm text-foreground">{r.assists}</p>
          </div>
        </div>
      )}

      {r.notes && (
        <div className="flex items-start gap-2">
          <FileText className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-[10px] font-display uppercase tracking-wider text-muted-foreground mb-0.5">Coach's Report</p>
            <p className="text-sm text-foreground whitespace-pre-line">{r.notes}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Editable POTM Section ───

function PotmSection({ potmAwards, onRefresh }: { potmAwards: any[]; onRefresh: () => void }) {
  return (
    <div className="flex items-start gap-2">
      <Trophy className="h-3.5 w-3.5 text-yellow-500 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-display uppercase tracking-wider text-muted-foreground mb-1">
          Player{potmAwards.length > 1 ? "s" : ""} of the Match
        </p>
        <div className="space-y-2">
          {potmAwards.map((potm: any) => (
            <PotmAwardRow key={potm.id} potm={potm} onRefresh={onRefresh} />
          ))}
        </div>
      </div>
    </div>
  );
}

function PotmAwardRow({ potm, onRefresh }: { potm: any; onRefresh: () => void }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    player_name: potm.player_name,
    shirt_number: potm.shirt_number || "",
    reason: potm.reason || "",
  });

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("player_of_the_match").update({
      player_name: form.player_name.trim(),
      shirt_number: form.shirt_number ? parseInt(form.shirt_number) : null,
      reason: form.reason.trim() || null,
    }).eq("id", potm.id);
    setSaving(false);
    if (error) { toast.error("Failed to update POTM"); return; }
    toast.success("POTM updated");
    setEditing(false);
    onRefresh();
  };

  const handleDelete = async () => {
    if (!confirm(`Delete POTM award for ${potm.player_name}?`)) return;
    setDeleting(true);
    const { error } = await supabase.from("player_of_the_match").delete().eq("id", potm.id);
    setDeleting(false);
    if (error) { toast.error("Failed to delete POTM"); return; }
    toast.success("POTM deleted");
    onRefresh();
  };

  if (editing) {
    return (
      <div className="bg-secondary/30 rounded-lg p-2.5 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-muted-foreground">Player Name</label>
            <input value={form.player_name} onChange={(e) => setForm({ ...form, player_name: e.target.value })}
              className="w-full bg-secondary border border-border rounded px-2 py-1 text-sm text-foreground" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground">Shirt #</label>
            <input type="number" value={form.shirt_number} onChange={(e) => setForm({ ...form, shirt_number: e.target.value })}
              className="w-full bg-secondary border border-border rounded px-2 py-1 text-sm text-foreground" />
          </div>
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground">Reason</label>
          <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
            className="w-full bg-secondary border border-border rounded px-2 py-1 text-sm text-foreground" />
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1 text-xs font-display bg-primary text-primary-foreground rounded px-2.5 py-1 hover:bg-primary/90 disabled:opacity-50">
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save
          </button>
          <button onClick={() => setEditing(false)}
            className="flex items-center gap-1 text-xs text-muted-foreground border border-border rounded px-2.5 py-1 hover:bg-secondary">
            <X className="h-3 w-3" /> Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 group">
      {potm.photo_url && (
        <img src={potm.photo_url} alt={potm.player_name} className="w-8 h-8 rounded-full object-cover border border-primary/30" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">
          {potm.shirt_number ? `#${potm.shirt_number} ` : ""}{potm.player_name}
        </p>
        {potm.reason && (
          <p className="text-xs text-muted-foreground">{potm.reason}</p>
        )}
      </div>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setEditing(true)} className="p-1 text-muted-foreground hover:text-primary transition-colors" title="Edit POTM">
          <Pencil className="h-3 w-3" />
        </button>
        <button onClick={handleDelete} disabled={deleting} className="p-1 text-muted-foreground hover:text-destructive transition-colors" title="Delete POTM">
          {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
        </button>
      </div>
    </div>
  );
}
