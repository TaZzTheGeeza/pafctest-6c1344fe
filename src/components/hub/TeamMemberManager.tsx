import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { UserPlus, Trash2, Users, Search } from "lucide-react";
import { toast } from "sonner";

interface Member {
  id: string;
  user_id: string;
  team_slug: string;
  role: string;
  profile?: { full_name: string | null; email: string | null };
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
}

export function TeamMemberManager({ teamSlug, teamName }: { teamSlug: string; teamName: string }) {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);

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
    const { data } = await supabase.from("profiles").select("id, full_name, email").eq("id", userId).single();
    if (data) setProfiles((prev) => ({ ...prev, [userId]: data }));
  }

  async function loadAllProfiles() {
    // Load profiles that aren't already members
    const { data } = await supabase.from("profiles").select("id, full_name, email");
    if (data) setAllProfiles(data);
  }

  async function addMember(userId: string) {
    const { error } = await supabase.from("team_members").insert({ user_id: userId, team_slug: teamSlug });
    if (error) {
      if (error.code === "23505") { toast.info("Already a member"); return; }
      toast.error("Failed to add member"); return;
    }
    toast.success("Member added!");
    loadMembers();
  }

  async function removeMember(id: string) {
    const { error } = await supabase.from("team_members").delete().eq("id", id);
    if (error) { toast.error("Failed to remove member"); return; }
    toast.success("Member removed");
    loadMembers();
  }

  const filteredProfiles = allProfiles.filter((p) => {
    const memberIds = members.map((m) => m.user_id);
    if (memberIds.includes(p.id)) return false;
    const q = search.toLowerCase();
    return (p.full_name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q));
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
            members.map((m) => {
              const p = profiles[m.user_id];
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
                  <button onClick={() => removeMember(m.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
