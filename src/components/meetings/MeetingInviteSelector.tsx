import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Users, Search, X, Check, ChevronDown } from "lucide-react";

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface RoleUser {
  user_id: string;
  role: string;
}

export type InviteType = "everyone" | "roles" | "specific";

interface MeetingInviteSelectorProps {
  inviteType: InviteType;
  setInviteType: (t: InviteType) => void;
  selectedRoles: string[];
  setSelectedRoles: (r: string[]) => void;
  selectedUsers: string[];
  setSelectedUsers: (u: string[]) => void;
}

export function MeetingInviteSelector({
  inviteType,
  setInviteType,
  selectedRoles,
  setSelectedRoles,
  selectedUsers,
  setSelectedUsers,
}: MeetingInviteSelectorProps) {
  const [userSearch, setUserSearch] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Fetch all custom roles
  const { data: roles = [] } = useQuery({
    queryKey: ["custom-roles-meeting"],
    queryFn: async () => {
      const { data } = await supabase
        .from("custom_roles")
        .select("name, label, color")
        .order("label");
      return data ?? [];
    },
  });

  // Fetch all profiles
  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-meeting"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("full_name");
      return (data ?? []) as Profile[];
    },
  });

  // Fetch user roles for displaying role badges
  const { data: userRoles = [] } = useQuery({
    queryKey: ["user-roles-meeting"],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("user_id, role");
      return (data ?? []) as RoleUser[];
    },
  });

  const filteredProfiles = useMemo(() => {
    if (!userSearch.trim()) return profiles.slice(0, 20);
    const q = userSearch.toLowerCase();
    return profiles.filter(
      (p) =>
        (p.full_name?.toLowerCase().includes(q)) ||
        (p.email?.toLowerCase().includes(q))
    ).slice(0, 20);
  }, [profiles, userSearch]);

  const selectedProfileDetails = useMemo(() => {
    return profiles.filter((p) => selectedUsers.includes(p.id));
  }, [profiles, selectedUsers]);

  const toggleRole = (roleName: string) => {
    setSelectedRoles(
      selectedRoles.includes(roleName)
        ? selectedRoles.filter((r) => r !== roleName)
        : [...selectedRoles, roleName]
    );
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers(
      selectedUsers.includes(userId)
        ? selectedUsers.filter((u) => u !== userId)
        : [...selectedUsers, userId]
    );
  };

  // Count users for a given role
  const getUserCountForRole = (roleName: string) => {
    return userRoles.filter((ur) => ur.role === roleName).length;
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-display text-muted-foreground mb-1 tracking-wider uppercase">
        Invite
      </label>

      {/* Invite type selector */}
      <div className="flex gap-1.5">
        {(["everyone", "roles", "specific"] as InviteType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setInviteType(type)}
            className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-display tracking-wider transition-colors border ${
              inviteType === type
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:border-primary/30"
            }`}
          >
            {type === "everyone" ? "Everyone" : type === "roles" ? "By Role" : "Specific People"}
          </button>
        ))}
      </div>

      {/* Role selection */}
      {inviteType === "roles" && (
        <div className="space-y-1.5">
          {/* System roles */}
          {["admin", "coach", "player", "treasurer", "welfare_officer"].map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => toggleRole(role)}
              className="flex items-center gap-2 p-2 rounded-lg border border-border bg-background hover:border-primary/30 cursor-pointer transition-colors w-full text-left"
            >
              <div
                className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${
                  selectedRoles.includes(role)
                    ? "bg-primary border-primary"
                    : "border-muted-foreground/40"
                }`}
              >
                {selectedRoles.includes(role) && (
                  <Check className="h-2.5 w-2.5 text-primary-foreground" />
                )}
              </div>
              <span className="text-sm text-foreground capitalize">{role.replace("_", " ")}s</span>
              <span className="text-[10px] text-muted-foreground ml-auto">
                {getUserCountForRole(role)} member{getUserCountForRole(role) !== 1 ? "s" : ""}
              </span>
            </button>
          ))}
          {/* Custom roles */}
          {roles
            .filter((r) => !["admin", "coach", "player", "user", "treasurer"].includes(r.name))
            .map((role) => (
              <label
                key={role.name}
                className="flex items-center gap-2 p-2 rounded-lg border border-border bg-background hover:border-primary/30 cursor-pointer transition-colors"
              >
                <div
                  className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${
                    selectedRoles.includes(role.name)
                      ? "bg-primary border-primary"
                      : "border-muted-foreground/40"
                  }`}
                >
                  {selectedRoles.includes(role.name) && (
                    <Check className="h-2.5 w-2.5 text-primary-foreground" />
                  )}
                </div>
                <span className="text-sm text-foreground">{role.label}</span>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {getUserCountForRole(role.name)} member{getUserCountForRole(role.name) !== 1 ? "s" : ""}
                </span>
              </label>
            ))}
        </div>
      )}

      {/* Specific user selection */}
      {inviteType === "specific" && (
        <div className="space-y-2">
          {/* Selected users chips */}
          {selectedProfileDetails.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedProfileDetails.map((p) => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/20"
                >
                  {p.full_name || p.email?.split("@")[0]}
                  <button
                    type="button"
                    onClick={() => toggleUser(p.id)}
                    className="hover:text-destructive"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={userSearch}
              onChange={(e) => {
                setUserSearch(e.target.value);
                setShowUserDropdown(true);
              }}
              onFocus={() => setShowUserDropdown(true)}
              placeholder="Search members..."
              className="w-full rounded-lg border border-border bg-background pl-8 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* User dropdown */}
          {showUserDropdown && (
            <div className="max-h-40 overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
              {filteredProfiles.length === 0 ? (
                <p className="p-3 text-xs text-muted-foreground text-center">No members found</p>
              ) : (
                filteredProfiles.map((p) => {
                  const isSelected = selectedUsers.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleUser(p.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors ${
                        isSelected ? "bg-primary/5" : ""
                      }`}
                    >
                      <div
                        className={`h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? "bg-primary border-primary"
                            : "border-muted-foreground/40"
                        }`}
                      >
                        {isSelected && (
                          <Check className="h-2.5 w-2.5 text-primary-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-foreground truncate">
                          {p.full_name || "Unnamed"}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {p.email}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
