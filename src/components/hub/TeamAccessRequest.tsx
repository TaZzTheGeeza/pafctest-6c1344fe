import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Shield, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const TEAMS = [
  { slug: "u7", label: "U7" },
  { slug: "u8-black", label: "U8 Black" },
  { slug: "u8-gold", label: "U8 Gold" },
  { slug: "u9", label: "U9" },
  { slug: "u10", label: "U10" },
  { slug: "u11-black", label: "U11 Black" },
  { slug: "u11-gold", label: "U11 Gold" },
  { slug: "u13-black", label: "U13 Black" },
  { slug: "u13-gold", label: "U13 Gold" },
  { slug: "u14", label: "U14" },
];

const ROLES = [
  { value: "parent", label: "Parent / Guardian", icon: UserPlus },
  { value: "coach", label: "Coach", icon: Shield },
];

export function TeamAccessRequest() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedRole, setSelectedRole] = useState("parent");
  const [playerName, setPlayerName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [useInvite, setUseInvite] = useState(false);

  const { data: myRequests = [], isLoading } = useQuery({
    queryKey: ["team-requests", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_requests" as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });

  const { data: myMemberships = [] } = useQuery({
    queryKey: ["my-memberships", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("team_members")
        .select("team_slug, role")
        .eq("user_id", user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTeam) throw new Error("Please select a team");
      if (selectedRole === "parent" && !playerName.trim() && !inviteCode.trim()) {
        throw new Error("Please enter your child's name or an invite code");
      }

      const { error } = await supabase.from("team_requests" as any).insert({
        user_id: user!.id,
        team_slug: selectedTeam,
        role_requested: selectedRole,
        player_name: selectedRole === "parent" ? playerName.trim() || null : null,
        invite_code: inviteCode.trim() || null,
        status: "pending",
      } as any);

      if (error) {
        if (error.code === "23505") throw new Error("You already have a pending request for this team");
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-requests"] });
      setSelectedTeam("");
      setPlayerName("");
      setInviteCode("");
      toast.success("Request submitted! An admin will review it shortly.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const pendingRequests = myRequests.filter((r: any) => r.status === "pending");
  const hasTeams = myMemberships.length > 0;

  const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
    pending: { icon: Clock, color: "text-amber-400 bg-amber-500/20 border-amber-500/30", label: "Pending Review" },
    approved: { icon: CheckCircle, color: "text-green-400 bg-green-500/20 border-green-500/30", label: "Approved" },
    declined: { icon: XCircle, color: "text-red-400 bg-red-500/20 border-red-500/30", label: "Declined" },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Banner if no teams */}
      {!hasTeams && pendingRequests.length === 0 && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-5 text-center">
          <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
          <h3 className="font-display text-lg font-bold text-foreground mb-1">Welcome to the PAFC Hub</h3>
          <p className="text-sm text-muted-foreground">
            To access team features, please request to join your child's team below.
          </p>
        </div>
      )}

      {/* Request Form */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-primary" /> Request Team Access
        </h3>

        {/* Role */}
        <div>
          <label className="text-[10px] font-display tracking-wider uppercase text-muted-foreground mb-1.5 block">
            I am a...
          </label>
          <div className="flex gap-2">
            {ROLES.map((r) => {
              const Icon = r.icon;
              return (
                <button
                  key={r.value}
                  onClick={() => setSelectedRole(r.value)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-display border transition-all ${
                    selectedRole === r.value
                      ? "bg-primary/20 text-primary border-primary/30"
                      : "border-border text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Team */}
        <div>
          <label className="text-[10px] font-display tracking-wider uppercase text-muted-foreground mb-1.5 block">
            Select Team
          </label>
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground"
          >
            <option value="">Choose a team...</option>
            {TEAMS.map((t) => (
              <option key={t.slug} value={t.slug}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Parent-specific fields */}
        {selectedRole === "parent" && (
          <>
            {/* Toggle: manual vs invite code */}
            <div className="flex gap-2">
              <button
                onClick={() => setUseInvite(false)}
                className={`flex-1 py-2 rounded-lg text-xs font-display border transition-all ${
                  !useInvite ? "bg-primary/20 text-primary border-primary/30" : "border-border text-muted-foreground"
                }`}
              >
                Enter Child's Name
              </button>
              <button
                onClick={() => setUseInvite(true)}
                className={`flex-1 py-2 rounded-lg text-xs font-display border transition-all ${
                  useInvite ? "bg-primary/20 text-primary border-primary/30" : "border-border text-muted-foreground"
                }`}
              >
                Use Invite Code
              </button>
            </div>

            {!useInvite ? (
              <div>
                <label className="text-[10px] font-display tracking-wider uppercase text-muted-foreground mb-1.5 block">
                  Child's Full Name
                </label>
                <input
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="e.g. Jake Smith"
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
                />
              </div>
            ) : (
              <div>
                <label className="text-[10px] font-display tracking-wider uppercase text-muted-foreground mb-1.5 block">
                  Invite Code (from coach)
                </label>
                <input
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Paste invite code here..."
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
                />
              </div>
            )}
          </>
        )}

        <button
          onClick={() => submitMutation.mutate()}
          disabled={submitMutation.isPending || !selectedTeam}
          className="w-full py-3 bg-primary text-primary-foreground rounded-lg text-sm font-display tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {submitMutation.isPending ? "Submitting..." : "Submit Request"}
        </button>
      </div>

      {/* My Requests */}
      {myRequests.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-display text-sm font-bold text-foreground mb-3">My Requests</h3>
          <div className="space-y-2">
            {myRequests.map((req: any) => {
              const status = statusConfig[req.status] || statusConfig.pending;
              const Icon = status.icon;
              const teamLabel = TEAMS.find((t) => t.slug === req.team_slug)?.label || req.team_slug;
              return (
                <div key={req.id} className="flex items-center justify-between bg-secondary/50 rounded-lg px-3 py-2.5">
                  <div>
                    <p className="text-sm font-display text-foreground">
                      {teamLabel} — <span className="text-muted-foreground capitalize">{req.role_requested}</span>
                    </p>
                    {req.player_name && (
                      <p className="text-[10px] text-muted-foreground">Child: {req.player_name}</p>
                    )}
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-display border ${status.color}`}>
                    <Icon className="h-3 w-3" />
                    {status.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
