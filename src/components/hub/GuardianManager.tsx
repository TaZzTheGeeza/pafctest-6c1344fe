import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, UserPlus, Link2, Trash2, Shield, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface Props {
  teamSlug: string;
  teamName: string;
}

interface Guardian {
  id: string;
  parent_user_id: string;
  player_name: string;
  team_slug: string;
  invite_token: string | null;
  status: string;
}

export function GuardianManager({ teamSlug, teamName }: Props) {
  const { user, isCoach, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [playerName, setPlayerName] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: guardians = [], isLoading } = useQuery({
    queryKey: ["guardians", teamSlug],
    queryFn: async () => {
      const query = isCoach || isAdmin
        ? supabase.from("guardians").select("*").eq("team_slug", teamSlug)
        : supabase.from("guardians").select("*").eq("parent_user_id", user!.id).eq("team_slug", teamSlug);
      const { data, error } = await query;
      if (error) throw error;
      return data as Guardian[];
    },
    enabled: !!user,
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["guardian-profiles", teamSlug],
    queryFn: async () => {
      const ids = [...new Set(guardians.map((g) => g.parent_user_id))];
      if (!ids.length) return [];
      const { data } = await supabase.from("profiles").select("id, full_name, email").in("id", ids);
      return data || [];
    },
    enabled: guardians.length > 0 && (isCoach || isAdmin),
  });

  const createInviteMutation = useMutation({
    mutationFn: async () => {
      if (!playerName.trim()) throw new Error("Enter player name");
      const token = crypto.randomUUID();
      const { error } = await supabase.from("guardians").insert({
        parent_user_id: user!.id,
        player_name: playerName.trim(),
        team_slug: teamSlug,
        invite_token: token,
        status: "active",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guardians", teamSlug] });
      setPlayerName("");
      toast.success("Guardian link created!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("guardians").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guardians", teamSlug] });
      toast.success("Guardian link removed");
    },
  });

  const copyLink = (token: string, id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/hub?tab=guardian&invite=${token}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Invite link copied!");
  };

  const getProfile = (userId: string) => profiles.find((p) => p.id === userId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Parent: Link to child */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2 mb-3">
          <UserPlus className="h-4 w-4 text-primary" /> Link to Your Child ({teamName})
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          Link your account to your child's player profile to receive notifications and manage their availability.
        </p>
        <div className="flex gap-2">
          <input
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Child's first name"
            className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
          />
          <button
            onClick={() => createInviteMutation.mutate()}
            disabled={createInviteMutation.isPending || !playerName.trim()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-display tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {createInviteMutation.isPending ? "Linking…" : "Link"}
          </button>
        </div>
      </div>

      {/* My linked children */}
      {guardians.filter((g) => g.parent_user_id === user?.id).length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4 text-primary" /> My Linked Players
          </h3>
          <div className="space-y-2">
            {guardians
              .filter((g) => g.parent_user_id === user?.id)
              .map((g) => (
                <div key={g.id} className="flex items-center justify-between bg-secondary/50 rounded-lg px-3 py-2">
                  <span className="text-sm font-display font-bold text-foreground">{g.player_name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-500 font-display">{g.status}</span>
                    <button onClick={() => deleteMutation.mutate(g.id)} className="text-red-500 hover:text-red-400">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Coach view: all guardians */}
      {(isCoach || isAdmin) && guardians.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2 mb-3">
            <Link2 className="h-4 w-4 text-primary" /> All Guardian Links ({teamName})
          </h3>
          <div className="space-y-2">
            {guardians.map((g) => {
              const profile = getProfile(g.parent_user_id);
              return (
                <div key={g.id} className="flex items-center justify-between bg-secondary/50 rounded-lg px-3 py-2 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-display font-bold text-foreground">{g.player_name}</span>
                    <span className="text-muted-foreground">→ {profile?.full_name || profile?.email || "Unknown parent"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {g.invite_token && (
                      <button onClick={() => copyLink(g.invite_token!, g.id)} className="text-primary hover:text-primary/80 transition-colors">
                        {copiedId === g.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    )}
                    <button onClick={() => deleteMutation.mutate(g.id)} className="text-red-500 hover:text-red-400">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
