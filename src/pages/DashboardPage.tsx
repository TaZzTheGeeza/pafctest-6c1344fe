import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { toast } from "sonner";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Users, Shield, ShieldCheck, ShieldAlert, UserCog, Trash2,
  Search, ChevronDown, Trophy, Ticket, BarChart3, FileText,
  MessageSquare, Settings, Eye, Plus, Loader2, Crown, Swords, ShoppingBag,
  Star, LayoutDashboard, Mail, Clock, ExternalLink, Pencil, Check, X as XIcon, Megaphone
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { ManageSubmissionsForm } from "@/components/ManageSubmissionsForm";
import { EnquiryReplyPanel } from "@/components/dashboard/EnquiryReplyPanel";
import { UserMessagesInbox } from "@/components/dashboard/UserMessagesInbox";
import { PlayerStatsForm } from "@/components/PlayerStatsForm";
import { useUserAgeGroups } from "@/hooks/useUserAgeGroups";
import { faTeamConfigs } from "@/lib/faFixtureConfig";
import { POTMForm } from "@/pages/CoachPanelPage";
import { MatchReportForm } from "@/pages/CoachPanelPage";
import { Upload, CheckCircle, AlertTriangle, UserPlus as UserPlusIcon } from "lucide-react";
import { TeamRequestsManager } from "@/components/dashboard/TeamRequestsManager";
import { AdminNotificationComposer } from "@/components/dashboard/AdminNotificationComposer";

type AppRole = Database["public"]["Enums"]["app_role"];

const ALL_AGE_GROUPS = [
  "U7", "U8 Black", "U8 Gold", "U9", "U10",
  "U11 Black", "U11 Gold", "U13 Black", "U13 Gold", "U14",
];

interface UserWithRoles {
  id: string;
  email: string | null;
  full_name: string | null;
  roles: AppRole[];
}

const ROLE_CONFIG: Record<AppRole, { label: string; color: string; icon: any }> = {
  admin: { label: "Admin", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: Crown },
  coach: { label: "Coach", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: ShieldCheck },
  player: { label: "Player", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: Users },
  user: { label: "User", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: UserCog },
};

const ADMIN_LINKS = [
  { label: "Tournament Admin", path: "/tournament-admin", icon: Trophy, desc: "Manage tournaments & brackets" },
  { label: "Raffle Admin", path: "/raffle-admin", icon: Ticket, desc: "Create & manage raffles" },
  { label: "PAFC Hub", path: "/hub", icon: MessageSquare, desc: "Team chat, payments, availability" },
  { label: "Results", path: "/results", icon: BarChart3, desc: "Match results & stats" },
  { label: "Club Documents", path: "/club-documents", icon: FileText, desc: "Manage club docs" },
  { label: "Bulk Doc Upload", path: "/admin/bulk-documents", icon: FileText, desc: "Upload docs for multiple players" },
  { label: "Safeguarding Reports", path: "/admin/safeguarding-reports", icon: Shield, desc: "View & manage safeguarding concerns" },
];

type DashboardSection = "overview" | "users" | "requests" | "enquiries" | "messages" | "notifications" | "potm" | "report" | "stats" | "manage";

export default function DashboardPage() {
  const { user, isAdmin, isCoach } = useAuth();
  const { assignedGroups, isLoading: ageGroupsLoading } = useUserAgeGroups();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<AppRole | "all">("all");
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [teamMemberships, setTeamMemberships] = useState<Record<string, string[]>>({});
  const [addingRole, setAddingRole] = useState<string | null>(null);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [togglingReg, setTogglingReg] = useState(false);
  const [shopOpen, setShopOpen] = useState(true);
  const [togglingShop, setTogglingShop] = useState(false);
  const [activeSection, setActiveSection] = useState<DashboardSection>("overview");
  const [searchParams] = useSearchParams();

  // Handle section from URL params (e.g. /dashboard?section=messages)
  useEffect(() => {
    const section = searchParams.get("section");
    if (section && ["overview", "users", "requests", "enquiries", "messages", "notifications", "potm", "report", "stats", "manage"].includes(section)) {
      setActiveSection(section as DashboardSection);
    }
  }, [searchParams]);

  const effectiveAgeGroups = isAdmin ? ALL_AGE_GROUPS : assignedGroups;
  const showCoachTools = isCoach || isAdmin;

  useEffect(() => {
    if (isAdmin) {
      loadRegistrationSetting();
      loadShopSetting();
      loadUsers();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  async function loadRegistrationSetting() {
    const { data } = await supabase
      .from("site_settings" as any)
      .select("value")
      .eq("key", "registration_open")
      .single();
    if (data) setRegistrationOpen((data as any).value === "true");
  }

  async function loadShopSetting() {
    const { data } = await supabase
      .from("site_settings" as any)
      .select("value")
      .eq("key", "shop_open")
      .single();
    if (data) setShopOpen((data as any).value === "true");
  }

  async function toggleShop() {
    setTogglingShop(true);
    const newVal = !shopOpen;
    const { error } = await supabase
      .from("site_settings" as any)
      .update({ value: newVal ? "true" : "false", updated_at: new Date().toISOString() } as any)
      .eq("key", "shop_open");
    if (error) {
      toast.error("Failed to update shop setting");
    } else {
      setShopOpen(newVal);
      toast.success(`Club Shop ${newVal ? "opened" : "closed"}`);
    }
    setTogglingShop(false);
  }

  async function toggleRegistration() {
    setTogglingReg(true);
    const newVal = !registrationOpen;
    const { error } = await supabase
      .from("site_settings" as any)
      .update({ value: newVal ? "true" : "false", updated_at: new Date().toISOString() } as any)
      .eq("key", "registration_open");
    if (error) {
      toast.error("Failed to update registration setting");
    } else {
      setRegistrationOpen(newVal);
      toast.success(`Player registration ${newVal ? "opened" : "closed"}`);
    }
    setTogglingReg(false);
  }

  async function loadUsers() {
    setLoading(true);
    const [profilesRes, rolesRes, membersRes] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email"),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("team_members").select("user_id, team_slug"),
    ]);

    const profiles = profilesRes.data ?? [];
    const roles = rolesRes.data ?? [];
    const members = membersRes.data ?? [];

    const roleMap: Record<string, AppRole[]> = {};
    for (const r of roles) {
      if (!roleMap[r.user_id]) roleMap[r.user_id] = [];
      roleMap[r.user_id].push(r.role);
    }

    const tmMap: Record<string, string[]> = {};
    for (const m of members) {
      if (!tmMap[m.user_id]) tmMap[m.user_id] = [];
      if (!tmMap[m.user_id].includes(m.team_slug)) tmMap[m.user_id].push(m.team_slug);
    }
    setTeamMemberships(tmMap);

    const merged: UserWithRoles[] = profiles.map((p) => ({
      id: p.id,
      email: p.email,
      full_name: p.full_name,
      roles: roleMap[p.id] ?? [],
    }));

    merged.sort((a, b) => {
      const priority = (roles: AppRole[]) =>
        roles.includes("admin") ? 0 : roles.includes("coach") ? 1 : roles.includes("player") ? 2 : 3;
      return priority(a.roles) - priority(b.roles);
    });

    setUsers(merged);
    setLoading(false);
  }

  const AGE_GROUP_TO_TEAM_SLUG: Record<string, string> = {
    "U7": "u7", "U8 Black": "u8-black", "U8 Gold": "u8-gold", "U9": "u9", "U10": "u10",
    "U11 Black": "u11-black", "U11 Gold": "u11-gold", "U13 Black": "u13-black", "U13 Gold": "u13-gold", "U14": "u14",
  };

  async function addRole(userId: string, role: AppRole) {
    setAddingRole(`${userId}-${role}`);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
    if (error) {
      if (error.code === "23505") toast.info("User already has this role");
      else toast.error("Failed to add role");
    } else {
      toast.success(`${ROLE_CONFIG[role].label} role added`);

      // Auto-add to Hub team_members based on age group assignments
      if (role === "coach" || role === "player") {
        const { data: ageGroups } = await supabase
          .from("user_age_groups")
          .select("age_group")
          .eq("user_id", userId);

        const teamRole = role === "coach" ? "coach" : "player";
        if (ageGroups && ageGroups.length > 0) {
          let addedCount = 0;
          for (const ag of ageGroups) {
            const slug = AGE_GROUP_TO_TEAM_SLUG[ag.age_group];
            if (!slug) continue;
            const { error: tmError } = await supabase
              .from("team_members")
              .insert({ user_id: userId, team_slug: slug, role: teamRole });
            if (!tmError) addedCount++;
          }
          if (addedCount > 0) {
            toast.success(`Also added to ${addedCount} Hub team(s) as ${teamRole}`);
          }
        } else {
          toast.info("Tip: Assign age groups or Hub Teams to link this user to a team in the Hub");
        }
      }

      loadUsers();
    }
    setAddingRole(null);
  }

  async function removeRole(userId: string, role: AppRole) {
    if (userId === user?.id && role === "admin") {
      toast.error("You can't remove your own admin role!");
      return;
    }
    const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
    if (error) {
      toast.error("Failed to remove role");
    } else {
      toast.success(`${ROLE_CONFIG[role].label} role removed`);
      loadUsers();
    }
  }

  // Collect unique team slugs for the filter dropdown
  const allTeamSlugs = Array.from(new Set(Object.values(teamMemberships).flat())).sort();

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !search ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.roles.includes(roleFilter);
    const matchesTeam = teamFilter === "all" || (teamMemberships[u.id] ?? []).includes(teamFilter);
    return matchesSearch && matchesRole && matchesTeam;
  });

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.roles.includes("admin")).length,
    coaches: users.filter((u) => u.roles.includes("coach")).length,
    players: users.filter((u) => u.roles.includes("player")).length,
  };

  const sectionItems: { key: DashboardSection; label: string; icon: any; adminOnly?: boolean; coachOnly?: boolean }[] = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "messages", label: "Messages", icon: MessageSquare },
    { key: "users", label: "Users", icon: Users, adminOnly: true },
    { key: "requests", label: "Requests", icon: UserPlusIcon, adminOnly: true },
    { key: "enquiries", label: "Enquiries", icon: Mail, adminOnly: true },
    { key: "notifications", label: "Notifications", icon: Megaphone, adminOnly: true },
    { key: "potm", label: "POTM", icon: Star, coachOnly: true },
    { key: "report", label: "Match Report", icon: FileText, coachOnly: true },
    { key: "stats", label: "Player Stats", icon: BarChart3, coachOnly: true },
    { key: "manage", label: "Manage", icon: Settings, coachOnly: true },
  ];

  const visibleSections = sectionItems.filter((s) => {
    if (s.adminOnly && !isAdmin) return false;
    if (s.coachOnly && !showCoachTools) return false;
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-primary/20">
                <LayoutDashboard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight">
                  Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">
                  {isAdmin ? "Manage your club" : "Coach tools & submissions"}
                </p>
              </div>
            </div>
          </div>

          {/* Section Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            {visibleSections.map((s) => (
              <button
                key={s.key}
                onClick={() => setActiveSection(s.key)}
                className={`flex items-center gap-2 font-display text-xs tracking-wider py-2.5 px-4 rounded-lg border transition-all whitespace-nowrap ${
                  activeSection === s.key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                }`}
              >
                <s.icon className="h-3.5 w-3.5" />
                {s.label}
              </button>
            ))}
          </div>

          {/* Overview Section */}
          {activeSection === "overview" && (
            <div className="space-y-8">
              {/* Stats Cards — admin only */}
              {isAdmin && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Total Users", value: stats.total, icon: Users, color: "text-foreground" },
                    { label: "Admins", value: stats.admins, icon: Crown, color: "text-red-400" },
                    { label: "Coaches", value: stats.coaches, icon: ShieldCheck, color: "text-amber-400" },
                    { label: "Players", value: stats.players, icon: Users, color: "text-emerald-400" },
                  ].map((s) => (
                    <div key={s.label} className="bg-card border border-border rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <s.icon className={`h-4 w-4 ${s.color}`} />
                        <span className="text-xs text-muted-foreground font-display tracking-wider uppercase">{s.label}</span>
                      </div>
                      <p className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Site Toggles — admin only */}
              {isAdmin && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-display font-semibold text-foreground">Player Registration</p>
                        <p className="text-[10px] text-muted-foreground">
                          {registrationOpen ? "Registration is currently OPEN" : "Registration is currently CLOSED"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={toggleRegistration}
                      disabled={togglingReg}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${registrationOpen ? "bg-primary" : "bg-muted"}`}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${registrationOpen ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <ShoppingBag className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-display font-semibold text-foreground">Club Shop</p>
                        <p className="text-[10px] text-muted-foreground">
                          {shopOpen ? "Shop is currently OPEN" : "Shop is CLOSED (browse only)"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={toggleShop}
                      disabled={togglingShop}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${shopOpen ? "bg-primary" : "bg-muted"}`}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${shopOpen ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Links */}
              {isAdmin && (
                <div>
                  <h2 className="text-sm font-display tracking-wider uppercase text-muted-foreground mb-3 flex items-center gap-2">
                    <Eye className="h-4 w-4" /> Quick Access
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <button
                      onClick={() => setActiveSection("enquiries")}
                      className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 hover:bg-primary/5 transition-all group text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <Mail className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-display font-semibold text-foreground">Enquiries</p>
                          <p className="text-[10px] text-muted-foreground">View contact form messages</p>
                        </div>
                      </div>
                    </button>
                    {ADMIN_LINKS.map((link) => (
                      <Link
                        key={link.path}
                        to={link.path}
                        className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            <link.icon className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-display font-semibold text-foreground">{link.label}</p>
                            <p className="text-[10px] text-muted-foreground">{link.desc}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Coach info on overview for coaches */}
              {showCoachTools && !isAdmin && (
                <div className="bg-card border border-border rounded-xl p-6 text-center">
                  <Swords className="h-10 w-10 text-primary mx-auto mb-3" />
                  <h3 className="font-display text-lg font-bold text-foreground mb-1">Coach Tools</h3>
                  <p className="text-sm text-muted-foreground mb-1">
                    Managing: {effectiveAgeGroups.length > 0 ? effectiveAgeGroups.join(", ") : "No age groups assigned"}
                  </p>
                  <p className="text-xs text-muted-foreground">Use the tabs above to submit POTM, match reports, and manage player stats.</p>
                </div>
              )}
            </div>
          )}

          {/* Users Section — admin only */}
          {activeSection === "users" && isAdmin && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-5 border-b border-border">
                <h2 className="text-sm font-display tracking-wider uppercase text-foreground flex items-center gap-2 mb-4">
                  <Shield className="h-4 w-4 text-primary" /> User Role Management
                </h2>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by name or email..."
                      className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as AppRole | "all")}
                    className="bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground"
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admins</option>
                    <option value="coach">Coaches</option>
                    <option value="player">Players</option>
                    <option value="user">Users</option>
                  </select>
                  <select
                    value={teamFilter}
                    onChange={(e) => setTeamFilter(e.target.value)}
                    className="bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground"
                  >
                    <option value="all">All Teams</option>
                    {allTeamSlugs.map((slug) => (
                      <option key={slug} value={slug}>
                        {slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredUsers.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground text-sm">No users found</div>
                  ) : (
                    filteredUsers.map((u) => (
                      <UserRow
                        key={u.id}
                        user={u}
                        currentUserId={user?.id}
                        addingRole={addingRole}
                        onAddRole={addRole}
                        onRemoveRole={removeRole}
                      />
                    ))
                  )}
                </div>
              )}

              <div className="p-3 border-t border-border bg-secondary/30 text-center">
                <p className="text-xs text-muted-foreground">
                  Showing {filteredUsers.length} of {users.length} users
                </p>
              </div>
            </div>
          )}

          {/* Requests Section — admin only */}
          {activeSection === "requests" && isAdmin && (
            <TeamRequestsManager />
          )}

          {/* Enquiries Section — admin only */}
          {activeSection === "enquiries" && isAdmin && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-5 border-b border-border">
                <h2 className="text-sm font-display tracking-wider uppercase text-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" /> Contact Enquiries
                </h2>
              </div>
              <EnquiryReplyPanel />
            </div>
          )}

          {/* Messages Section — all authenticated users */}
          {activeSection === "messages" && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-5 border-b border-border">
                <h2 className="text-sm font-display tracking-wider uppercase text-foreground flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" /> Messages
                </h2>
                <p className="text-xs text-muted-foreground mt-1">Replies to your contact enquiries from the club</p>
              </div>
              <UserMessagesInbox />
            </div>
          )}

          {/* Coach Tabs */}
          {activeSection === "potm" && showCoachTools && (
            <div className="max-w-2xl mx-auto">
              <POTMForm ageGroups={effectiveAgeGroups} />
            </div>
          )}
          {activeSection === "report" && showCoachTools && (
            <div className="max-w-2xl mx-auto">
              <MatchReportForm ageGroups={effectiveAgeGroups} />
            </div>
          )}
          {activeSection === "stats" && showCoachTools && (
            <div className="max-w-2xl mx-auto">
              <PlayerStatsForm allowedAgeGroups={effectiveAgeGroups} />
            </div>
          )}
          {activeSection === "manage" && showCoachTools && (
            <div className="max-w-2xl mx-auto">
              <ManageSubmissionsForm allowedAgeGroups={effectiveAgeGroups} />
            </div>
          )}
          {activeSection === "notifications" && isAdmin && (
            <AdminNotificationComposer />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

const TEAM_SLUGS = [
  "u7", "u8-black", "u8-gold", "u9", "u10",
  "u11-black", "u11-gold", "u13-black", "u13-gold", "u14",
];

const TEAM_LABELS: Record<string, string> = {
  "u7": "U7", "u8-black": "U8 Black", "u8-gold": "U8 Gold", "u9": "U9", "u10": "U10",
  "u11-black": "U11 Black", "u11-gold": "U11 Gold", "u13-black": "U13 Black", "u13-gold": "U13 Gold", "u14": "U14",
};

const TEAM_ROLES = ["coach", "player", "parent", "member"] as const;

function UserRow({
  user,
  currentUserId,
  addingRole,
  onAddRole,
  onRemoveRole,
}: {
  user: UserWithRoles;
  currentUserId?: string;
  addingRole: string | null;
  onAddRole: (userId: string, role: AppRole) => void;
  onRemoveRole: (userId: string, role: AppRole) => void;
}) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showTeamAssign, setShowTeamAssign] = useState(false);
  const [assignedTeams, setAssignedTeams] = useState<string[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [showTeamMembership, setShowTeamMembership] = useState(false);
  const [teamMemberships, setTeamMemberships] = useState<{ team_slug: string; role: string }[]>([]);
  const [loadingMemberships, setLoadingMemberships] = useState(false);
  const [addingTeamSlug, setAddingTeamSlug] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("member");
  const [isDocUploader, setIsDocUploader] = useState<boolean | null>(null);
  const [togglingDocUploader, setTogglingDocUploader] = useState(false);
  const navigate = useNavigate();
  const isCurrentUser = user.id === currentUserId;
  const availableRoles = (["admin", "coach", "player", "user"] as AppRole[]).filter(
    (r) => !user.roles.includes(r)
  );
  const isCoachUser = user.roles.includes("coach");

  async function checkDocUploaderStatus() {
    const { data } = await supabase
      .from("document_upload_permissions")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    setIsDocUploader(!!data);
  }

  async function toggleDocUploader() {
    setTogglingDocUploader(true);
    if (isDocUploader) {
      await supabase.from("document_upload_permissions").delete().eq("user_id", user.id);
      setIsDocUploader(false);
      toast.success("Document upload permission removed");
    } else {
      const { error } = await supabase.from("document_upload_permissions").insert({ user_id: user.id, granted_by: currentUserId });
      if (error) {
        if (error.code === "23505") toast.info("Already has upload permission");
        else toast.error("Failed to grant permission");
      } else {
        setIsDocUploader(true);
        toast.success("Document upload permission granted");
      }
    }
    setTogglingDocUploader(false);
  }

  useEffect(() => { checkDocUploaderStatus(); }, [user.id]);

  const [editingName, setEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");
  const [savingName, setSavingName] = useState(false);

  async function saveNameEdit() {
    if (!editNameValue.trim()) { toast.error("Name cannot be empty"); return; }
    setSavingName(true);
    const { error } = await supabase.from("profiles").update({ full_name: editNameValue.trim() }).eq("id", user.id);
    if (error) toast.error("Failed to update name");
    else { toast.success("Name updated"); user.full_name = editNameValue.trim(); setEditingName(false); }
    setSavingName(false);
  }

  async function loadAssignedTeams() {
    setLoadingTeams(true);
    const { data } = await supabase
      .from("user_age_groups")
      .select("age_group")
      .eq("user_id", user.id);
    setAssignedTeams(data?.map((d) => d.age_group) || []);
    setLoadingTeams(false);
  }

  async function toggleTeam(ageGroup: string) {
    if (assignedTeams.includes(ageGroup)) {
      await supabase
        .from("user_age_groups")
        .delete()
        .eq("user_id", user.id)
        .eq("age_group", ageGroup);
      setAssignedTeams((prev) => prev.filter((t) => t !== ageGroup));
      toast.success(`Removed from ${ageGroup}`);
    } else {
      await supabase
        .from("user_age_groups")
        .insert({ user_id: user.id, age_group: ageGroup });
      setAssignedTeams((prev) => [...prev, ageGroup]);
      toast.success(`Assigned to ${ageGroup}`);
    }
  }

  function handleTeamToggle() {
    if (!showTeamAssign) loadAssignedTeams();
    setShowTeamAssign(!showTeamAssign);
  }

  async function loadTeamMemberships() {
    setLoadingMemberships(true);
    const { data } = await supabase
      .from("team_members")
      .select("team_slug, role")
      .eq("user_id", user.id);
    setTeamMemberships(data || []);
    setLoadingMemberships(false);
  }

  function handleTeamMembershipToggle() {
    if (!showTeamMembership) loadTeamMemberships();
    setShowTeamMembership(!showTeamMembership);
  }

  async function addToTeam(teamSlug: string) {
    setAddingTeamSlug(teamSlug);
    const { error } = await supabase
      .from("team_members")
      .insert({ user_id: user.id, team_slug: teamSlug, role: selectedRole });
    if (error) {
      if (error.code === "23505") toast.info("Already a member of this team");
      else toast.error("Failed to add to team");
    } else {
      toast.success(`Added to ${TEAM_LABELS[teamSlug] || teamSlug} as ${selectedRole}`);
      setTeamMemberships((prev) => [...prev, { team_slug: teamSlug, role: selectedRole }]);
    }
    setAddingTeamSlug(null);
  }

  async function removeFromTeam(teamSlug: string) {
    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("user_id", user.id)
      .eq("team_slug", teamSlug);
    if (error) {
      toast.error("Failed to remove from team");
    } else {
      toast.success(`Removed from ${TEAM_LABELS[teamSlug] || teamSlug}`);
      setTeamMemberships((prev) => prev.filter((m) => m.team_slug !== teamSlug));
    }
  }

  return (
    <div className="hover:bg-secondary/20 transition-colors">
      <div className="px-5 py-4 cursor-pointer" onClick={() => !editingName && navigate(`/admin/player/${user.id}`)}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-display text-sm font-bold shrink-0">
              {(user.full_name || user.email || "?")[0].toUpperCase()}
            </div>
            <div className="min-w-0" onClick={(e) => e.stopPropagation()}>
              {editingName ? (
                <div className="flex items-center gap-1.5">
                  <input
                    autoFocus
                    value={editNameValue}
                    onChange={(e) => setEditNameValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") saveNameEdit(); if (e.key === "Escape") setEditingName(false); }}
                    className="text-sm font-display font-semibold text-foreground bg-background border border-border rounded px-2 py-1 w-40"
                  />
                  <button onClick={saveNameEdit} disabled={savingName} className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors">
                    {savingName ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  </button>
                  <button onClick={() => setEditingName(false)} className="p-1 text-muted-foreground hover:text-destructive rounded transition-colors">
                    <XIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <p className="text-sm font-display font-semibold text-foreground truncate flex items-center gap-2">
                  {user.full_name || "Unnamed"}
                  <button
                    onClick={() => { setEditNameValue(user.full_name || ""); setEditingName(true); }}
                    className="p-0.5 text-muted-foreground hover:text-primary transition-colors"
                    title="Edit name"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  {isCurrentUser && (
                    <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">You</span>
                  )}
                </p>
              )}
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            {user.roles.length === 0 && (
              <span className="text-xs text-muted-foreground italic">No roles</span>
            )}
            {user.roles.map((role) => {
              const config = ROLE_CONFIG[role];
              const Icon = config.icon;
              return (
                <span
                  key={role}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-display border ${config.color}`}
                >
                  <Icon className="h-3 w-3" />
                  {config.label}
                  <button
                    onClick={() => onRemoveRole(user.id, role)}
                    className="ml-0.5 hover:text-destructive transition-colors"
                    title={`Remove ${config.label} role`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </span>
              );
            })}

            {availableRoles.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowAddMenu(!showAddMenu)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-display border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <Plus className="h-3 w-3" /> Add
                  <ChevronDown className={`h-3 w-3 transition-transform ${showAddMenu ? "rotate-180" : ""}`} />
                </button>
                {showAddMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-xl z-50 py-1 min-w-[140px]">
                    {availableRoles.map((role) => {
                      const config = ROLE_CONFIG[role];
                      const Icon = config.icon;
                      const isAdding = addingRole === `${user.id}-${role}`;
                      return (
                        <button
                          key={role}
                          onClick={() => {
                            onAddRole(user.id, role);
                            setShowAddMenu(false);
                          }}
                          disabled={isAdding}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-display text-foreground hover:bg-secondary/50 transition-colors"
                        >
                          {isAdding ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Icon className="h-3 w-3" />
                          )}
                          {config.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {isCoachUser && (
              <button
                onClick={handleTeamToggle}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-display border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-colors"
              >
                <Users className="h-3 w-3" /> Coach Teams
                <ChevronDown className={`h-3 w-3 transition-transform ${showTeamAssign ? "rotate-180" : ""}`} />
              </button>
            )}

            <button
              onClick={handleTeamMembershipToggle}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-display border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-colors"
            >
              <Shield className="h-3 w-3" /> Hub Teams
              <ChevronDown className={`h-3 w-3 transition-transform ${showTeamMembership ? "rotate-180" : ""}`} />
            </button>

            {/* Doc Uploader Toggle */}
            {isDocUploader !== null && (
              <button
                onClick={(e) => { e.stopPropagation(); toggleDocUploader(); }}
                disabled={togglingDocUploader}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-display border transition-colors ${
                  isDocUploader
                    ? "bg-violet-500/20 text-violet-400 border-violet-500/30"
                    : "border-border text-muted-foreground hover:border-violet-500/30 hover:text-violet-400"
                }`}
              >
                {togglingDocUploader ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
                {isDocUploader ? "Doc Uploader ✓" : "Doc Uploader"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Coach Age Group Assignment Panel */}
      {isCoachUser && showTeamAssign && (
        <div className="px-5 pb-4" onClick={(e) => e.stopPropagation()}>
          <div className="bg-secondary/30 border border-border rounded-lg p-3 ml-13">
            <p className="text-[10px] font-display tracking-wider uppercase text-muted-foreground mb-2">
              Assign age groups for this coach
            </p>
            {loadingTeams ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {ALL_AGE_GROUPS.map((ag) => {
                  const assigned = assignedTeams.includes(ag);
                  return (
                    <button
                      key={ag}
                      onClick={() => toggleTeam(ag)}
                      className={`px-2.5 py-1 rounded-full text-xs font-display border transition-all ${
                        assigned
                          ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                          : "border-border text-muted-foreground hover:border-amber-500/30 hover:text-amber-400"
                      }`}
                    >
                      {ag}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Team Membership Assignment Panel */}
      {showTeamMembership && (
        <div className="px-5 pb-4" onClick={(e) => e.stopPropagation()}>
          <div className="bg-secondary/30 border border-border rounded-lg p-3 ml-13">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-display tracking-wider uppercase text-muted-foreground">
                PAFC Hub team membership
              </p>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="bg-background border border-border rounded px-2 py-1 text-xs text-foreground"
              >
                {TEAM_ROLES.map((r) => (
                  <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                ))}
              </select>
            </div>
            {loadingMemberships ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <div className="space-y-2">
                {/* Current memberships */}
                {teamMemberships.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {teamMemberships.map((m) => (
                      <span
                        key={m.team_slug}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-display border bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      >
                        {TEAM_LABELS[m.team_slug] || m.team_slug}
                        <span className="text-emerald-600 text-[9px]">({m.role})</span>
                        <button
                          onClick={() => removeFromTeam(m.team_slug)}
                          className="ml-0.5 hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {/* Available teams */}
                <div className="flex flex-wrap gap-1.5">
                  {TEAM_SLUGS.filter((slug) => !teamMemberships.some((m) => m.team_slug === slug)).map((slug) => (
                    <button
                      key={slug}
                      onClick={() => addToTeam(slug)}
                      disabled={addingTeamSlug === slug}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-display border border-border text-muted-foreground hover:border-emerald-500/30 hover:text-emerald-400 transition-all"
                    >
                      {addingTeamSlug === slug ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Plus className="h-3 w-3" />
                      )}
                      {TEAM_LABELS[slug]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
