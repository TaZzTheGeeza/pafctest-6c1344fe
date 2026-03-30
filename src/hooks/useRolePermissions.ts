import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface RolePermission {
  id: string;
  role: string;
  permission: string;
  enabled: boolean;
}

const PERMISSION_LABELS: Record<string, { label: string; category: string }> = {
  "dashboard.users": { label: "Users Tab", category: "Dashboard Tabs" },
  "dashboard.requests": { label: "Requests Tab", category: "Dashboard Tabs" },
  "dashboard.finances": { label: "Finances Tab", category: "Dashboard Tabs" },
  "dashboard.enquiries": { label: "Enquiries Tab", category: "Dashboard Tabs" },
  "dashboard.notifications": { label: "Notifications Tab", category: "Dashboard Tabs" },
  "page.coach_panel": { label: "Coach Panel", category: "Page Access" },
  "page.admin_panel": { label: "Admin Panel", category: "Page Access" },
  "page.safeguarding_reports": { label: "Safeguarding Reports", category: "Page Access" },
  "page.gallery_manage": { label: "Gallery Management", category: "Page Access" },
  "page.events_manage": { label: "Events Management", category: "Page Access" },
  "page.documents_manage": { label: "Documents Management", category: "Page Access" },
  "action.manage_match_reports": { label: "Manage Match Reports", category: "Actions" },
  "action.manage_player_stats": { label: "Manage Player Stats", category: "Actions" },
  "action.manage_team_selections": { label: "Manage Team Selections", category: "Actions" },
  "action.manage_potm": { label: "Manage POTM", category: "Actions" },
  "action.manage_events": { label: "Manage Events", category: "Actions" },
  "action.manage_registrations": { label: "Manage Registrations", category: "Actions" },
  "action.manage_announcements": { label: "Manage Announcements", category: "Actions" },
  "action.manage_live_matches": { label: "Manage Live Matches", category: "Actions" },
};

export function getPermissionLabel(permission: string) {
  return PERMISSION_LABELS[permission] || { label: permission, category: "Other" };
}

export function useRolePermissions() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadPermissions();
  }, [user]);

  async function loadPermissions() {
    setLoading(true);
    const { data } = await supabase
      .from("role_permissions")
      .select("*")
      .order("role")
      .order("permission");
    setPermissions((data as any as RolePermission[]) || []);
    setLoading(false);
  }

  async function togglePermission(id: string, enabled: boolean) {
    const { error } = await supabase
      .from("role_permissions")
      .update({ enabled, updated_at: new Date().toISOString() } as any)
      .eq("id", id);
    if (error) throw error;
    setPermissions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled } : p))
    );
  }

  return { permissions, loading, togglePermission, reload: loadPermissions };
}

/** Check if any of the user's roles have a specific permission enabled */
export function useHasPermission(permission: string) {
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) {
      setHasPermission(false);
      return;
    }
    
    async function check() {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);
      
      if (!roles || roles.length === 0) {
        setHasPermission(false);
        return;
      }

      const userRoles = roles.map((r) => r.role);
      
      const { data: perms } = await supabase
        .from("role_permissions")
        .select("enabled")
        .in("role", userRoles)
        .eq("permission", permission);
      
      setHasPermission(perms?.some((p: any) => p.enabled) ?? false);
    }
    check();
  }, [user, permission]);

  return hasPermission;
}
