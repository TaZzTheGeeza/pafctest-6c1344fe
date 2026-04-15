import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { UserPlus, Trash2, Users, Search, ChevronDown, Shield, User, Heart, Mail, Loader2, Link2, Check, Copy } from "lucide-react";
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
  const [addMode, setAddMode] = useState<"search" | "invite" | "link">("search");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);

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

  async function sendEmailInvite() {
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      toast.error("Enter a valid email address");
      return;
    }
    setInviteSending(true);
    try {
      // Get inviter profile name
      const { data: inviterProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user!.id)
        .single();

      // Insert invite record
      const { error: insertError } = await supabase.from("team_invites" as any).insert({
        email,
        team_slug: teamSlug,
        role: "parent",
        invited_by: user!.id,
      });
      if (insertError) {
        if (insertError.code === "23505") {
          toast.info("This email has already been invited to this team");
          return;
        }
        throw insertError;
      }

      // Send invite email
      const signupUrl = `${window.location.origin}/auth`;
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "team-invite",
          recipientEmail: email,
          idempotencyKey: `team-invite-${teamSlug}-${email}`,
          templateData: {
            teamName: teamName,
            signupUrl,
            inviterName: inviterProfile?.full_name || "A coach",
          },
        },
      });

      toast.success(`Invite sent to ${email}`);
      setInviteEmail("");
    } catch (err: any) {
      toast.error(err.message || "Failed to send invite");
    } finally {
      setInviteSending(false);
    }
  }

  async function generateInviteLink() {
    setGeneratingLink(true);
    try {
      const { data, error } = await supabase.from("team_invites" as any).insert({
        email: `link-invite-${Date.now()}@invite.local`,
        team_slug: teamSlug,
        role: "parent",
        invited_by: user!.id,
      }).select("invite_token").single();
      if (error) throw error;
      const token = (data as any).invite_token;
      const link = `${window.location.origin}/auth?invite=${token}&redirect=${encodeURIComponent(`/hub?tab=chat&team=${teamSlug}`)}`;
      setInviteLink(link);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate link");
    } finally {
      setGeneratingLink(false);
    }
  }

  function copyInviteLink() {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setLinkCopied(true);
    toast.success("Invite link copied!");
    setTimeout(() => setLinkCopied(false), 2000);
  }

  const filteredProfiles = allProfiles.filter((p) => {
    const memberIds = members.map((m) => m.user_id);
    if (memberIds.includes(p.id)) return false;
    const q = search.toLowerCase();
    return (p.full_name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q));
  });

  const getRoleConfig = (role: string) => TEAM_ROLES.find(r => r.value === role) || TEAM_ROLES[3];

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

        {/* Add Member Panel */}
        {showAdd && (
          <div className="mb-4 bg-secondary/50 rounded-lg p-4 space-y-3">
            {/* Mode toggle */}
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => setAddMode("search")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display tracking-wider transition-all ${
                  addMode === "search" ? "bg-primary text-primary-foreground" : "bg-secondary border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <Search className="h-3 w-3" /> Existing User
              </button>
              <button
                onClick={() => setAddMode("invite")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display tracking-wider transition-all ${
                  addMode === "invite" ? "bg-primary text-primary-foreground" : "bg-secondary border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <Mail className="h-3 w-3" /> Invite by Email
              </button>
              <button
                onClick={() => { setAddMode("link"); setInviteLink(null); setLinkCopied(false); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display tracking-wider transition-all ${
                  addMode === "link" ? "bg-primary text-primary-foreground" : "bg-secondary border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <Link2 className="h-3 w-3" /> Invite Link
              </button>
            </div>

            {addMode === "search" ? (
              <>
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
              </>
            ) : (
              /* Email invite mode */
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Send an invite to a parent's email. They'll be automatically added as a <strong>Parent</strong> to {teamName} when they create their account.
                </p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="parent@example.com"
                      className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                      onKeyDown={(e) => e.key === "Enter" && sendEmailInvite()}
                    />
                  </div>
                  <button
                    onClick={sendEmailInvite}
                    disabled={inviteSending || !inviteEmail.trim()}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-display tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {inviteSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                    {inviteSending ? "Sending…" : "Send Invite"}
                  </button>
                </div>
              </div>
            )}
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
              const online = isUserOnline(p?.last_seen_at ?? null);
              const lastSeen = formatLastSeen(p?.last_seen_at ?? null);
              return (
                <div key={m.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-display text-xs font-bold">
                        {(p?.full_name || p?.email || "?")[0].toUpperCase()}
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${online ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
                    </div>
                    <div>
                      <p className="text-sm font-display text-foreground">{p?.full_name || "Loading..."}</p>
                      <p className="text-[10px] text-muted-foreground">{online ? "Online" : lastSeen !== "Never" ? `Last seen ${lastSeen}` : p?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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
