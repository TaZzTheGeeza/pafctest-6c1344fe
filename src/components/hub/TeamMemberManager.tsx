import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { UserPlus, Trash2, Users, Search, ChevronDown, Shield, User, Heart } from "lucide-react";
import { toast } from "sonner";
import { isUserOnline, formatLastSeen } from "@/hooks/usePresence";

const TEAM_ROLES = [
  { value: "coach", label: "Coach", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: Shield },
  { value: "player", label: "Player", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: User },
  { value: "parent", label: "Parent", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Heart },
  { value: "member", label: "Member", color: "bg-muted text-muted-foreground border-border", icon: Users },
];

interface Member {
  id: string;
  user_id: string;
  team_slug: string;
  role: string;
  profile?: { full_name: string | null; email: string | null; last_seen_at: string | null };
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  last_seen_at: string | null;
}

export function TeamMemberManager({ teamSlug, teamName }: { teamSlug: string; teamName: string }) {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState<string | null>(null);
  const [addRole, setAddRole] = useState("player");

  useEffect(() => {
    loadMembers();
  }, [teamSlug]);

  async function loadMembers() {
    const { data } = await supabase.from("team_members").select("*").eq("team_slug", teamSlug);
    if (data) {
      setMembers(data);
      for (const m of data) loadProfile(m.user_id);
    }
  }

  async function loadProfile(userId: string) {
    if (profiles[userId]) return;
    const { data } = await supabase.from("profiles").select("id, full_name, email, last_seen_at").eq("id", userId).single();
    if (data) setProfiles((prev) => ({ ...prev, [userId]: data as any }));
  }

  async function loadAllProfiles() {
    const { data } = await supabase.from("profiles").select("id, full_name, email, last_seen_at");
    if (data) setAllProfiles(data as any);
  }

  async function addMember(userId: string) {
    const { error } = await supabase.from("team_members").insert({ user_id: userId, team_slug: teamSlug, role: addRole });
    if (error) {
      if (error.code === "23505") { toast.info("Already a member"); return; }
      toast.error("Failed to add member"); return;
    }
    const roleLabel = TEAM_ROLES.find(r => r.value === addRole)?.label || addRole;
    toast.success(`Added as ${roleLabel}!`);
    loadMembers();
  }

  async function removeMember(id: string) {
    const { error } = await supabase.from("team_members").delete().eq("id", id);
    if (error) { toast.error("Failed to remove member"); return; }
    toast.success("Member removed");
    loadMembers();
  }

  async function updateMemberRole(memberId: string, newRole: string) {
    const { error } = await supabase.from("team_members").update({ role: newRole }).eq("id", memberId);
    if (error) { toast.error("Failed to update role"); return; }
    const roleLabel = TEAM_ROLES.find(r => r.value === newRole)?.label || newRole;
    toast.success(`Role updated to ${roleLabel}`);
    setRoleMenuOpen(null);
    loadMembers();
  }

  const filteredProfiles = allProfiles.filter((p) => {
    const memberIds = members.map((m) => m.user_id);
    if (memberIds.includes(p.id)) return false;
    const q = search.toLowerCase();
    return (p.full_name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q));
  });

  const getRoleConfig = (role: string) => TEAM_ROLES.find(r => r.value === role) || TEAM_ROLES[3];

  // Group members by role
  const sortedMembers = [...members].sort((a, b) => {
    const order = ["coach", "player", "parent", "member"];
    return order.indexOf(a.role) - order.indexOf(b.role);
  });

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-sm tracking-wider text-foreground uppercase flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> {teamName} Members
            <span className="text-muted-foreground">({members.length})</span>
          </h3>
          <button
            onClick={() => { setShowAdd(!showAdd); if (!showAdd) loadAllProfiles(); }}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-display tracking-wider"
          >
            <UserPlus className="h-3.5 w-3.5" /> Add Member
          </button>
        </div>

        {/* Add Member Search */}
        {showAdd && (
          <div className="mb-4 bg-secondary/50 rounded-lg p-4 space-y-3">
            {/* Role selector for new member */}
            <div>
              <p className="text-[10px] font-display tracking-wider uppercase text-muted-foreground mb-1.5">Add as</p>
              <div className="flex gap-1.5 flex-wrap">
                {TEAM_ROLES.map((r) => {
                  const Icon = r.icon;
                  return (
                    <button
                      key={r.value}
                      onClick={() => setAddRole(r.value)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-display border transition-all ${
                        addRole === r.value ? r.color : "border-border text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      <Icon className="h-3 w-3" />
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground"
              />
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filteredProfiles.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">
                  {search ? "No matching users found" : "Type to search users"}
                </p>
              ) : (
                filteredProfiles.slice(0, 10).map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-secondary transition-colors">
                    <div>
                      <p className="text-sm font-display text-foreground">{p.full_name || "Unnamed"}</p>
                      <p className="text-[10px] text-muted-foreground">{p.email}</p>
                    </div>
                    <button onClick={() => addMember(p.id)} className="text-xs text-primary hover:text-primary/80 font-display tracking-wider flex items-center gap-1">
                      <UserPlus className="h-3.5 w-3.5" /> Add
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Member List */}
        <div className="space-y-1">
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No members in this team yet. Add members above.</p>
          ) : (
            sortedMembers.map((m) => {
              const p = profiles[m.user_id];
              const roleConfig = getRoleConfig(m.role);
              const Icon = roleConfig.icon;
              return (
                <div key={m.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-display text-xs font-bold">
                      {(p?.full_name || p?.email || "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-display text-foreground">{p?.full_name || "Loading..."}</p>
                      <p className="text-[10px] text-muted-foreground">{p?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Role Badge / Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setRoleMenuOpen(roleMenuOpen === m.id ? null : m.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-display border transition-all hover:opacity-80 ${roleConfig.color}`}
                      >
                        <Icon className="h-3 w-3" />
                        {roleConfig.label}
                        <ChevronDown className={`h-3 w-3 transition-transform ${roleMenuOpen === m.id ? "rotate-180" : ""}`} />
                      </button>
                      {roleMenuOpen === m.id && (
                        <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-xl z-50 py-1 min-w-[130px]">
                          {TEAM_ROLES.map((r) => {
                            const RIcon = r.icon;
                            return (
                              <button
                                key={r.value}
                                onClick={() => updateMemberRole(m.id, r.value)}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-display transition-colors ${
                                  m.role === r.value ? "bg-primary/10 text-primary" : "text-foreground hover:bg-secondary/50"
                                }`}
                              >
                                <RIcon className="h-3 w-3" />
                                {r.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <button onClick={() => removeMember(m.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
