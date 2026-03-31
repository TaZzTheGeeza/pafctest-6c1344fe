import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle, Clock, Loader2, UserPlus, Shield, Users } from "lucide-react";
import { toast } from "sonner";

const TEAM_LABELS: Record<string, string> = {
  "u7s": "U7", "u8s-black": "U8 Black", "u8s-gold": "U8 Gold", "u9s": "U9", "u10s": "U10",
  "u11s-black": "U11 Black", "u11s-gold": "U11 Gold", "u13s-black": "U13 Black", "u13s-gold": "U13 Gold", "u14s": "U14",
};

const TEAM_SLUG_TO_AGE_GROUP: Record<string, string> = {
  "u7s": "U7", "u8s-black": "U8 Black", "u8s-gold": "U8 Gold", "u9s": "U9", "u10s": "U10",
  "u11s-black": "U11 Black", "u11s-gold": "U11 Gold", "u13s-black": "U13 Black", "u13s-gold": "U13 Gold", "u14s": "U14",
};

interface TeamRequest {
  id: string;
  user_id: string;
  team_slug: string;
  role_requested: string;
  player_name: string | null;
  invite_code: string | null;
  status: string;
  created_at: string;
}

export function TeamRequestsManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"pending" | "all">("pending");

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["admin-team-requests", filter],
    queryFn: async () => {
      let query = supabase.from("team_requests" as any).select("*").order("created_at", { ascending: false });
      if (filter === "pending") query = query.eq("status", "pending");
      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as TeamRequest[];
    },
    enabled: !!user,
  });

  const { data: profiles = {} } = useQuery({
    queryKey: ["request-profiles", requests.map((r) => r.user_id).join(",")],
    queryFn: async () => {
      const ids = [...new Set(requests.map((r) => r.user_id))];
      if (!ids.length) return {};
      const { data } = await supabase.from("profiles").select("id, full_name, email").in("id", ids);
      const map: Record<string, { full_name: string | null; email: string | null }> = {};
      data?.forEach((p) => { map[p.id] = p; });
      return map;
    },
    enabled: requests.length > 0,
  });

  const approveMutation = useMutation({
    mutationFn: async (req: TeamRequest) => {
      // 1. Add to team_members
      const teamRole = req.role_requested === "coach" ? "coach" : "parent";
      await supabase.from("team_members").upsert({
        user_id: req.user_id,
        team_slug: req.team_slug,
        role: teamRole,
      }, { onConflict: "user_id,team_slug" });

      // 2. If parent, create guardian link
      if (req.role_requested === "parent" && req.player_name) {
        await supabase.from("guardians").upsert({
          parent_user_id: req.user_id,
          player_name: req.player_name,
          team_slug: req.team_slug,
          status: "active",
        }, { onConflict: "parent_user_id,player_name,team_slug" as any });
      }

      // 3. Ensure user has 'user' app role at minimum
      await supabase.from("user_roles").upsert({
        user_id: req.user_id,
        role: "user",
      }, { onConflict: "user_id,role" });
      // If coach, also add coach role
      if (req.role_requested === "coach") {
        await supabase.from("user_roles").upsert({
          user_id: req.user_id,
          role: "coach",
        }, { onConflict: "user_id,role" });
      }

      // 5. Sync user_age_groups
      const ageGroup = TEAM_SLUG_TO_AGE_GROUP[req.team_slug];
      if (ageGroup) {
        await supabase.from("user_age_groups").upsert({
          user_id: req.user_id,
          age_group: ageGroup,
        }, { onConflict: "user_id,age_group" as any });
      }

      // 6. Update request status
      const { error } = await supabase
        .from("team_requests" as any)
        .update({ status: "approved", reviewed_by: user!.id, reviewed_at: new Date().toISOString() } as any)
        .eq("id", req.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-team-requests"] });
      toast.success("Request approved! User has been added to the team.");
    },
    onError: () => toast.error("Failed to approve request"),
  });

  const declineMutation = useMutation({
    mutationFn: async (reqId: string) => {
      const { error } = await supabase
        .from("team_requests" as any)
        .update({ status: "declined", reviewed_by: user!.id, reviewed_at: new Date().toISOString() } as any)
        .eq("id", reqId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-team-requests"] });
      toast.success("Request declined.");
    },
    onError: () => toast.error("Failed to decline request"),
  });

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-5 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-display tracking-wider uppercase text-foreground flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" /> Team Access Requests
            {pendingCount > 0 && (
              <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] px-2 py-0.5 rounded-full font-display">
                {pendingCount} pending
              </span>
            )}
          </h2>
          <div className="flex gap-1">
            <button
              onClick={() => setFilter("pending")}
              className={`px-3 py-1.5 rounded-lg text-xs font-display transition-all ${
                filter === "pending" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-display transition-all ${
                filter === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
          </div>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground text-sm">
          {filter === "pending" ? "No pending requests 🎉" : "No requests found"}
        </div>
      ) : (
        <div className="divide-y divide-border">
          {requests.map((req) => {
            const profile = profiles[req.user_id];
            const teamLabel = TEAM_LABELS[req.team_slug] || req.team_slug;
            const isPending = req.status === "pending";
            const isProcessing = approveMutation.isPending || declineMutation.isPending;

            return (
              <div key={req.id} className="px-5 py-4 hover:bg-secondary/20 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-display text-sm font-bold shrink-0">
                      {(profile?.full_name || profile?.email || "?")[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-display font-semibold text-foreground truncate">
                        {profile?.full_name || "Unnamed User"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Details */}
                    <div className="text-right">
                      <p className="text-xs font-display text-foreground">
                        <span className="text-primary">{teamLabel}</span>
                        {" — "}
                        <span className="capitalize">{req.role_requested}</span>
                      </p>
                      {req.player_name && (
                        <p className="text-[10px] text-muted-foreground">Child: {req.player_name}</p>
                      )}
                      {req.invite_code && (
                        <p className="text-[10px] text-muted-foreground">Has invite code</p>
                      )}
                    </div>

                    {/* Actions */}
                    {isPending ? (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => approveMutation.mutate(req)}
                          disabled={isProcessing}
                          className="p-2 rounded-lg bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-colors disabled:opacity-50"
                          title="Approve"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => declineMutation.mutate(req.id)}
                          disabled={isProcessing}
                          className="p-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                          title="Decline"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-display border ${
                        req.status === "approved"
                          ? "text-green-400 bg-green-500/20 border-green-500/30"
                          : "text-red-400 bg-red-500/20 border-red-500/30"
                      }`}>
                        {req.status === "approved" ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {req.status === "approved" ? "Approved" : "Declined"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
