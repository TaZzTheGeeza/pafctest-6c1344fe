import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getAgeGroup } from "@/hooks/useTeamRoster";
import { Plus, Pencil, Trash2, Loader2, Save, X, User, Hash, Link2, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";

interface GuardianLink {
  id: string;
  parent_user_id: string;
  player_name: string;
  team_slug: string;
  status: string;
  parent_name?: string | null;
  parent_email?: string | null;
}

interface ProfileLite { id: string; full_name: string | null; email: string | null; }

interface Player {
  id: string;
  first_name: string;
  shirt_number: number | null;
  position: string | null;
  age_group: string;
  team_name: string;
  photo_url: string | null;
}

const POSITIONS = ["Goalkeeper", "Defender", "Midfielder", "Forward"];

const defaultTeamName = (ageGroup: string) => `Peterborough Athletic ${ageGroup}s`.replace(/s+s$/, "s");

export function PlayerRosterManager({ teamSlug, teamName }: { teamSlug: string; teamName: string }) {
  const ageGroup = getAgeGroup(teamSlug);
  const [players, setPlayers] = useState<Player[]>([]);
  const [guardians, setGuardians] = useState<GuardianLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [linkingFor, setLinkingFor] = useState<string | null>(null);
  const [parentSearch, setParentSearch] = useState("");
  const [parentResults, setParentResults] = useState<ProfileLite[]>([]);
  const [searching, setSearching] = useState(false);

  const emptyDraft = {
    first_name: "",
    shirt_number: "" as string | number,
    position: "",
  };
  const [draft, setDraft] = useState<typeof emptyDraft>(emptyDraft);

  useEffect(() => {
    load();
  }, [teamSlug]);

  async function load() {
    setLoading(true);
    const [{ data: pData, error: pErr }, { data: gData }] = await Promise.all([
      supabase
        .from("player_stats")
        .select("id, first_name, shirt_number, position, age_group, team_name, photo_url")
        .eq("age_group", ageGroup)
        .order("shirt_number", { ascending: true, nullsFirst: false }),
      supabase
        .from("guardians")
        .select("id, parent_user_id, player_name, team_slug, status")
        .eq("team_slug", teamSlug),
    ]);
    if (pErr) toast.error(pErr.message);
    setPlayers(pData || []);

    const ids = [...new Set((gData || []).map((g) => g.parent_user_id))];
    let profiles: ProfileLite[] = [];
    if (ids.length) {
      const { data: profData } = await supabase.from("profiles").select("id, full_name, email").in("id", ids);
      profiles = profData || [];
    }
    setGuardians(
      (gData || []).map((g) => {
        const p = profiles.find((pr) => pr.id === g.parent_user_id);
        return { ...g, parent_name: p?.full_name, parent_email: p?.email };
      })
    );
    setLoading(false);
  }

  function guardiansForPlayer(name: string) {
    const lc = name.trim().toLowerCase();
    return guardians.filter((g) => g.player_name.trim().toLowerCase() === lc);
  }

  async function searchParents(q: string) {
    setParentSearch(q);
    if (q.trim().length < 2) { setParentResults([]); return; }
    setSearching(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
      .limit(8);
    setParentResults(data || []);
    setSearching(false);
  }

  async function linkParent(player: Player, parent: ProfileLite) {
    const { error } = await supabase.from("guardians").insert({
      parent_user_id: parent.id,
      player_name: player.first_name,
      team_slug: teamSlug,
      status: "active",
    });
    if (error) { toast.error(error.message); return; }
    toast.success(`Linked ${parent.full_name || parent.email} to ${player.first_name}`);
    setLinkingFor(null); setParentSearch(""); setParentResults([]);
    load();
  }

  async function unlinkGuardian(id: string) {
    if (!confirm("Remove this parent link?")) return;
    const { error } = await supabase.from("guardians").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Parent unlinked");
    load();
  }


  function startEdit(p: Player) {
    setEditingId(p.id);
    setShowAdd(false);
    setDraft({
      first_name: p.first_name,
      shirt_number: p.shirt_number ?? "",
      position: p.position ?? "",
    });
  }

  function cancel() {
    setEditingId(null);
    setShowAdd(false);
    setDraft(emptyDraft);
  }

  async function save() {
    if (!draft.first_name.trim()) {
      toast.error("Player name required");
      return;
    }
    setSaving(true);
    const payload = {
      first_name: draft.first_name.trim(),
      shirt_number: draft.shirt_number === "" ? null : Number(draft.shirt_number),
      position: draft.position || null,
      age_group: ageGroup,
      team_name: defaultTeamName(ageGroup),
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from("player_stats").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("player_stats").insert(payload));
    }
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editingId ? "Player updated" : "Player added");
    cancel();
    load();
  }

  async function remove(p: Player) {
    if (!confirm(`Remove ${p.first_name} from ${ageGroup}? This will also delete their match stats history.`)) return;
    const { error } = await supabase.from("player_stats").delete().eq("id", p.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Player removed");
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 bg-card border border-border rounded-xl p-4">
        <div>
          <h2 className="font-display text-lg font-bold text-foreground">Player Roster — {teamName}</h2>
          <p className="text-xs text-muted-foreground mt-1">Add, edit, or remove players in this age group.</p>
        </div>
        {!showAdd && !editingId && (
          <button
            onClick={() => { setShowAdd(true); setDraft(emptyDraft); }}
            className="flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-display tracking-wider hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Player
          </button>
        )}
      </div>

      {(showAdd || editingId) && (
        <div className="bg-card border border-primary/30 rounded-xl p-4 space-y-3">
          <h3 className="font-display text-sm font-bold text-primary tracking-wider uppercase">
            {editingId ? "Edit Player" : "New Player"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-display">First Name</label>
              <input
                value={draft.first_name}
                onChange={(e) => setDraft({ ...draft, first_name: e.target.value })}
                placeholder="e.g. Jamie"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground mt-1"
                autoFocus
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-display">Shirt #</label>
              <input
                type="number"
                value={draft.shirt_number}
                onChange={(e) => setDraft({ ...draft, shirt_number: e.target.value })}
                placeholder="—"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground mt-1"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-display">Position</label>
              <select
                value={draft.position}
                onChange={(e) => setDraft({ ...draft, position: e.target.value })}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground mt-1"
              >
                <option value="">—</option>
                {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-display tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {editingId ? "Save Changes" : "Add Player"}
            </button>
            <button
              onClick={cancel}
              className="flex items-center gap-2 bg-secondary text-foreground rounded-lg px-4 py-2 text-sm font-display tracking-wider hover:bg-secondary/80 transition-colors"
            >
              <X className="h-4 w-4" /> Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
            Loading roster...
          </div>
        ) : players.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No players yet. Click <span className="text-primary font-display">Add Player</span> to get started.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {players.map((p) => {
              const links = guardiansForPlayer(p.first_name);
              const isLinking = linkingFor === p.id;
              return (
                <li key={p.id} className="px-4 py-3 hover:bg-secondary/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center overflow-hidden shrink-0">
                      {p.photo_url ? (
                        <img src={p.photo_url} alt={p.first_name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display text-sm font-bold text-foreground truncate">{p.first_name}</span>
                        {p.shirt_number != null && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-display font-bold bg-primary/15 text-primary border border-primary/30 px-1.5 py-0.5 rounded">
                            <Hash className="h-2.5 w-2.5" />{p.shirt_number}
                          </span>
                        )}
                        {p.position && (
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-display">{p.position}</span>
                        )}
                        {links.length > 0 && (
                          <span className="text-[10px] text-green-500 font-display">
                            • {links.length} parent{links.length > 1 ? "s" : ""} linked
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => { setLinkingFor(isLinking ? null : p.id); setParentSearch(""); setParentResults([]); }}
                        className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary transition-colors"
                        title="Link parent"
                      >
                        <Link2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => startEdit(p)} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary transition-colors" title="Edit">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => remove(p)} className="p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Remove">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Existing parent links */}
                  {links.length > 0 && (
                    <div className="mt-2 ml-13 flex flex-wrap gap-1.5">
                      {links.map((g) => (
                        <span key={g.id} className="inline-flex items-center gap-1.5 text-[11px] bg-secondary/70 border border-border rounded-full pl-2 pr-1 py-0.5 font-display">
                          <UserPlus className="h-3 w-3 text-primary" />
                          <span className="text-foreground">{g.parent_name || g.parent_email || "Unknown parent"}</span>
                          <button onClick={() => unlinkGuardian(g.id)} className="text-muted-foreground hover:text-red-400 rounded-full p-0.5">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Link parent search */}
                  {isLinking && (
                    <div className="mt-3 bg-background border border-primary/30 rounded-lg p-3 space-y-2">
                      <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-display flex items-center gap-1.5">
                        <Search className="h-3 w-3" /> Search parent by name or email
                      </label>
                      <input
                        value={parentSearch}
                        onChange={(e) => searchParents(e.target.value)}
                        placeholder="e.g. Jane Smith or jane@…"
                        className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                        autoFocus
                      />
                      {searching && <div className="text-xs text-muted-foreground">Searching…</div>}
                      {parentResults.length > 0 && (
                        <ul className="divide-y divide-border bg-card border border-border rounded-lg max-h-48 overflow-auto">
                          {parentResults.map((pr) => (
                            <li key={pr.id}>
                              <button
                                onClick={() => linkParent(p, pr)}
                                className="w-full text-left px-3 py-2 hover:bg-secondary/60 transition-colors flex flex-col"
                              >
                                <span className="text-sm font-display text-foreground">{pr.full_name || "(no name)"}</span>
                                <span className="text-[11px] text-muted-foreground">{pr.email}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                      {parentSearch.length >= 2 && !searching && parentResults.length === 0 && (
                        <div className="text-xs text-muted-foreground">No matches. Parent must have an account first.</div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

        )}
      </div>
    </div>
  );
}
