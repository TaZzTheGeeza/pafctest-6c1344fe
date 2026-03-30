import { useState } from "react";
import { useRolePermissions, getPermissionLabel } from "@/hooks/useRolePermissions";
import { Shield, Loader2, Lock, Unlock, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  admin: { label: "Admin", color: "text-red-400" },
  coach: { label: "Coach", color: "text-amber-400" },
  player: { label: "Player", color: "text-emerald-400" },
  treasurer: { label: "Treasurer", color: "text-purple-400" },
  user: { label: "User", color: "text-blue-400" },
};

const CATEGORIES = ["Dashboard Tabs", "Page Access", "Actions"];

export function RolePermissionManager() {
  const { permissions, loading, togglePermission } = useRolePermissions();
  const [selectedRole, setSelectedRole] = useState("coach");
  const [toggling, setToggling] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(CATEGORIES);

  const roles = [...new Set(permissions.map((p) => p.role))].sort();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

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
        <div className="flex gap-2 flex-wrap">
          {roles.map((role) => {
            const config = ROLE_LABELS[role] || { label: role, color: "text-foreground" };
            return (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`flex items-center gap-2 font-display text-xs tracking-wider py-2 px-4 rounded-lg border transition-all ${
                  selectedRole === role
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                }`}
              >
                <span className={selectedRole === role ? "" : config.color}>
                  {config.label}
                </span>
              </button>
            );
          })}
        </div>
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
                  const isAdminRole = selectedRole === "admin";
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
      </div>

      {selectedRole === "admin" && (
        <div className="p-4 bg-secondary/20 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            🔒 Admin permissions are locked and cannot be modified for security.
          </p>
        </div>
      )}
    </div>
  );
}
