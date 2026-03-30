import { useState, useEffect } from "react";
import { useRolePermissions, getPermissionLabel } from "@/hooks/useRolePermissions";
import { Shield, Loader2, Lock, Unlock, ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";

interface CustomRole {
  id: string;
  name: string;
  label: string;
  color: string;
  is_system: boolean;
}

const CATEGORIES = ["Dashboard Tabs", "Page Access", "Actions"];

const ALL_PERMISSIONS = [
  "dashboard.users", "dashboard.requests", "dashboard.finances",
  "dashboard.enquiries", "dashboard.notifications",
  "page.coach_panel", "page.admin_panel", "page.safeguarding_reports",
  "page.gallery_manage", "page.events_manage", "page.documents_manage",
  "action.manage_match_reports", "action.manage_player_stats",
  "action.manage_team_selections", "action.manage_potm",
  "action.manage_events", "action.manage_registrations",
  "action.manage_announcements", "action.manage_live_matches",
];

export function RolePermissionManager() {
  const { permissions, loading, togglePermission, reload } = useRolePermissions();
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [selectedRole, setSelectedRole] = useState("coach");
  const [toggling, setToggling] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(CATEGORIES);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleLabel, setNewRoleLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadRoles();
  }, []);

  async function loadRoles() {
    const { data } = await supabase
      .from("custom_roles" as any)
      .select("*")
      .order("is_system", { ascending: false })
      .order("name") as any;
    setRoles((data as CustomRole[]) || []);
  }

  const rolePerms = permissions.filter((p) => p.role === selectedRole);

  const grouped = CATEGORIES.map((cat) => ({
    category: cat,
    permissions: rolePerms.filter((p) => getPermissionLabel(p.permission).category === cat),
  })).filter((g) => g.permissions.length > 0);

  async function handleToggle(id: string, enabled: boolean) {
    setToggling(id);
    try {
      await togglePermission(id, enabled);
      toast.success("Permission updated");
    } catch {
      toast.error("Failed to update permission");
    }
    setToggling(null);
  }

  function toggleCategory(cat: string) {
    setExpandedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  async function handleCreateRole() {
    const name = newRoleName.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    const label = newRoleLabel.trim();
    if (!name || !label) {
      toast.error("Please fill in both fields");
      return;
    }
    if (roles.some((r) => r.name === name)) {
      toast.error("A role with that name already exists");
      return;
    }

    setCreating(true);
    try {
      // Create the role
      const { error: roleErr } = await (supabase
        .from("custom_roles" as any)
        .insert({ name, label, color: "#6b7280", is_system: false }) as any);
      if (roleErr) throw roleErr;

      // Seed permissions for the new role
      const permRows = ALL_PERMISSIONS.map((p) => ({
        role: name,
        permission: p,
        enabled: false,
      }));
      const { error: permErr } = await (supabase
        .from("role_permissions" as any)
        .insert(permRows) as any);
      if (permErr) throw permErr;

      toast.success(`Role "${label}" created`);
      setNewRoleName("");
      setNewRoleLabel("");
      setShowCreateForm(false);
      setSelectedRole(name);
      await Promise.all([loadRoles(), reload()]);
    } catch (err: any) {
      toast.error(err.message || "Failed to create role");
    }
    setCreating(false);
  }

  async function handleDeleteRole(role: CustomRole) {
    if (role.is_system) return;
    setDeleting(role.name);
    try {
      // Delete permissions for this role
      await (supabase
        .from("role_permissions" as any)
        .delete()
        .eq("role", role.name) as any);

      // Delete user assignments for this role
      await supabase
        .from("user_roles")
        .delete()
        .eq("role", role.name as any);

      // Delete the role itself
      await (supabase
        .from("custom_roles" as any)
        .delete()
        .eq("name", role.name) as any);

      toast.success(`Role "${role.label}" deleted`);
      if (selectedRole === role.name) setSelectedRole("coach");
      await Promise.all([loadRoles(), reload()]);
    } catch {
      toast.error("Failed to delete role");
    }
    setDeleting(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const selectedRoleMeta = roles.find((r) => r.name === selectedRole);
  const isAdminRole = selectedRole === "admin";

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-5 border-b border-border">
        <h2 className="text-sm font-display tracking-wider uppercase text-foreground flex items-center gap-2 mb-4">
          <Shield className="h-4 w-4 text-primary" /> Role Permission Manager
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          Configure what each role can access across the platform. Changes take effect immediately.
        </p>

        {/* Role selector */}
        <div className="flex gap-2 flex-wrap items-center">
          {roles.map((role) => (
            <div key={role.name} className="flex items-center gap-1">
              <button
                onClick={() => setSelectedRole(role.name)}
                className={`flex items-center gap-2 font-display text-xs tracking-wider py-2 px-4 rounded-lg border transition-all ${
                  selectedRole === role.name
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                }`}
              >
                {role.label}
              </button>
              {!role.is_system && (
                <button
                  onClick={() => handleDeleteRole(role)}
                  disabled={deleting === role.name}
                  className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                  title="Delete role"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-1 font-display text-xs tracking-wider py-2 px-3 rounded-lg border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all"
          >
            <Plus className="h-3 w-3" /> New Role
          </button>
        </div>

        {/* Create role form */}
        {showCreateForm && (
          <div className="mt-4 p-4 bg-secondary/30 rounded-lg border border-border space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Role ID (lowercase, no spaces)</label>
                <Input
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g. welfare_officer"
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Display Name</label>
                <Input
                  value={newRoleLabel}
                  onChange={(e) => setNewRoleLabel(e.target.value)}
                  placeholder="e.g. Welfare Officer"
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateRole}
                disabled={creating}
                className="flex items-center gap-1 text-xs font-display tracking-wider py-1.5 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {creating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                Create Role
              </button>
              <button
                onClick={() => { setShowCreateForm(false); setNewRoleName(""); setNewRoleLabel(""); }}
                className="text-xs text-muted-foreground hover:text-foreground py-1.5 px-3"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Permission list by category */}
      <div className="divide-y divide-border">
        {grouped.map(({ category, permissions: catPerms }) => (
          <div key={category}>
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
            >
              <span className="text-xs font-display tracking-wider uppercase text-muted-foreground">
                {category}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">
                  {catPerms.filter((p) => p.enabled).length}/{catPerms.length} enabled
                </span>
                {expandedCategories.includes(category) ? (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>
            </button>
            {expandedCategories.includes(category) && (
              <div className="px-4 pb-4 space-y-2">
                {catPerms.map((perm) => {
                  const { label } = getPermissionLabel(perm.permission);
                  return (
                    <div
                      key={perm.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                        perm.enabled
                          ? "bg-primary/5 border-primary/20"
                          : "bg-secondary/20 border-border"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {perm.enabled ? (
                          <Unlock className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        <span className="text-sm text-foreground">{label}</span>
                      </div>
                      <button
                        onClick={() => handleToggle(perm.id, !perm.enabled)}
                        disabled={toggling === perm.id || isAdminRole}
                        title={isAdminRole ? "Admin permissions cannot be modified" : ""}
                        className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ${
                          perm.enabled ? "bg-primary" : "bg-muted"
                        } ${isAdminRole ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            perm.enabled ? "translate-x-5" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {grouped.length === 0 && (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No permissions configured for this role yet.
          </div>
        )}
      </div>

      {isAdminRole && (
        <div className="p-4 bg-secondary/20 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            🔒 Admin permissions are locked and cannot be modified for security.
          </p>
        </div>
      )}
    </div>
  );
}
