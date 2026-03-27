import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import {
  Users, Shield, ShieldCheck, ShieldAlert, UserCog, Trash2,
  Search, ChevronDown, Trophy, Ticket, BarChart3, FileText,
  MessageSquare, Settings, Eye, Plus, Loader2, Crown, Swords
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

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
  { label: "Coach Panel", path: "/coach-panel", icon: Swords, desc: "Match reports, POTM, team selection" },
  { label: "Tournament Admin", path: "/tournament-admin", icon: Trophy, desc: "Manage tournaments & brackets" },
  { label: "Raffle Admin", path: "/raffle-admin", icon: Ticket, desc: "Create & manage raffles" },
  { label: "PAFC Hub", path: "/hub", icon: MessageSquare, desc: "Team chat, payments, availability" },
  { label: "Results", path: "/results", icon: BarChart3, desc: "Match results & stats" },
  { label: "Club Documents", path: "/club-documents", icon: FileText, desc: "Manage club docs" },
  { label: "Bulk Doc Upload", path: "/admin/bulk-documents", icon: FileText, desc: "Upload docs for multiple players" },
  { label: "Safeguarding Reports", path: "/admin/safeguarding-reports", icon: Shield, desc: "View & manage safeguarding concerns" },
];

export default function AdminPanelPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<AppRole | "all">("all");
  const [addingRole, setAddingRole] = useState<string | null>(null);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [togglingReg, setTogglingReg] = useState(false);
  const [shopOpen, setShopOpen] = useState(true);
  const [togglingShop, setTogglingShop] = useState(false);

  useEffect(() => {
    loadRegistrationSetting();
    loadShopSetting();
  }, []);

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

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email"),
      supabase.from("user_roles").select("user_id, role"),
    ]);

    const profiles = profilesRes.data ?? [];
    const roles = rolesRes.data ?? [];

    const roleMap: Record<string, AppRole[]> = {};
    for (const r of roles) {
      if (!roleMap[r.user_id]) roleMap[r.user_id] = [];
      roleMap[r.user_id].push(r.role);
    }

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

  async function addRole(userId: string, role: AppRole) {
    setAddingRole(`${userId}-${role}`);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
    if (error) {
      if (error.code === "23505") toast.info("User already has this role");
      else toast.error("Failed to add role");
    } else {
      toast.success(`${ROLE_CONFIG[role].label} role added`);
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

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !search ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.roles.includes(roleFilter);
    return matchesSearch && matchesRole;
  });

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.roles.includes("admin")).length,
    coaches: users.filter((u) => u.roles.includes("coach")).length,
    players: users.filter((u) => u.roles.includes("player")).length,
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-primary/20">
                <Settings className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight">
                  Admin Panel
                </h1>
                <p className="text-sm text-muted-foreground">Manage users, roles & access control</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
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

          {/* Site Toggles */}
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-3">
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

          {/* Quick Links */}
          <div className="mb-8">
            <h2 className="text-sm font-display tracking-wider uppercase text-muted-foreground mb-3 flex items-center gap-2">
              <Eye className="h-4 w-4" /> Quick Access
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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

          {/* User Management */}
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
        </div>
      </main>
      <Footer />
    </div>
  );
}

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
  const navigate = useNavigate();
  const isCurrentUser = user.id === currentUserId;
  const availableRoles = (["admin", "coach", "player", "user"] as AppRole[]).filter(
    (r) => !user.roles.includes(r)
  );

  return (
    <div className="px-5 py-4 hover:bg-secondary/20 transition-colors cursor-pointer" onClick={() => navigate(`/admin/player/${user.id}`)}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* User Info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-display text-sm font-bold shrink-0">
            {(user.full_name || user.email || "?")[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-display font-semibold text-foreground truncate flex items-center gap-2">
              {user.full_name || "Unnamed"}
              {isCurrentUser && (
                <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">You</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>

        {/* Roles */}
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

          {/* Add Role Button */}
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
        </div>
      </div>
    </div>
  );
}
