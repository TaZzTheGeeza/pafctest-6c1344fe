import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Award, Loader2, Check, Lock } from "lucide-react";

interface Props {
  teamSlug: string;
  teamName: string;
}

const SLUG_TO_AGE: Record<string, string> = {
  "u6s": "U6", "u7s": "U7", "u8s": "U8", "u8s-black": "U8 Black", "u8s-gold": "U8 Gold",
  "u9s-black": "U9 Black", "u9s-gold": "U9 Gold",
  "u10s": "U10", "u11s": "U11",
  "u12s-black": "U12 Black", "u12s-gold": "U12 Gold", "u12s-white": "U12 White",
  "u13s": "U13",
  "u14s-black": "U14 Black", "u14s-gold": "U14 Gold",
  "u15s": "U15",
};

const AWARDS: { type: "players_player" | "parents_player"; label: string; desc: string }[] = [
  { type: "players_player", label: "Players' Player", desc: "Voted by the players" },
  { type: "parents_player", label: "Parents' Player", desc: "Voted by the parents" },
];

export function AwardsVoting({ teamSlug, teamName }: Props) {
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();
  const ageGroup = SLUG_TO_AGE[teamSlug] || teamSlug;

  const { data: settings } = useQuery({
    queryKey: ["award-settings", teamSlug],
    queryFn: async () => {
      const { data } = await supabase
        .from("presentation_award_settings")
        .select("*")
        .eq("team_slug", teamSlug);
      return data ?? [];
    },
  });

  const { data: players, isLoading: playersLoading } = useQuery({
    queryKey: ["team-players", ageGroup],
    queryFn: async () => {
      const { data } = await supabase
        .from("player_stats")
        .select("id, first_name, shirt_number, position")
        .eq("age_group", ageGroup)
        .order("first_name");
      // Exclude coaching staff from being voted for
      return (data ?? []).filter((p: any) => {
        const pos = (p.position || "").toLowerCase();
        return !pos.includes("coach");
      });
    },
  });

  const { data: guardians } = useQuery({
    queryKey: ["my-guardians", teamSlug, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("guardians")
        .select("id, player_name")
        .eq("parent_user_id", user!.id)
        .eq("team_slug", teamSlug)
        .eq("status", "active");
      return data ?? [];
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["my-profile-name", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const userDisplayName = (profile?.full_name?.trim()) || profile?.email || user?.email || "You";

  const { data: myVotes } = useQuery({
    queryKey: ["my-award-votes", teamSlug, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("presentation_award_votes")
        .select("*")
        .eq("voter_user_id", user!.id)
        .eq("team_slug", teamSlug);
      return data ?? [];
    },
  });

  const settingFor = (award: string) =>
    settings?.find((s: any) => s.award_type === award);

  // For players_player we look up by child name; for parents_player there is one vote per user
  const voteFor = (award: string, child: string) => {
    if (award === "parents_player") {
      return myVotes?.find((v: any) => v.award_type === "parents_player");
    }
    return myVotes?.find((v: any) => v.award_type === award && v.responding_for === child);
  };

  const castVote = useMutation({
    mutationFn: async (args: { award: string; child: string; player: { id: string; first_name: string } }) => {
      const respondingFor = args.award === "parents_player" ? userDisplayName : args.child;
      const existing = voteFor(args.award, args.child);
      if (existing) {
        const { error } = await supabase
          .from("presentation_award_votes")
          .update({
            voted_for_player_name: args.player.first_name,
            voted_for_player_id: args.player.id,
            responding_for: respondingFor,
          })
          .eq("id", (existing as any).id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("presentation_award_votes").insert({
          voter_user_id: user!.id,
          responding_for: respondingFor,
          team_slug: teamSlug,
          award_type: args.award,
          voted_for_player_name: args.player.first_name,
          voted_for_player_id: args.player.id,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-award-votes", teamSlug, user?.id] });
      toast.success("Vote saved");
    },
    onError: (e: any) => toast.error(e?.message || "Could not save vote"),
  });

  if (!user) return <div className="text-sm text-muted-foreground">Sign in to vote.</div>;

  const childrenList = guardians?.map((g: any) => g.player_name).filter(Boolean) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold flex items-center gap-2">
          <Award className="h-6 w-6 text-primary" /> Presentation Awards — {teamName}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          One vote per child for each award. You can change your vote while voting is open.
        </p>
      </div>

      {childrenList.length === 0 && !isAdmin && (
        <div className="bg-card border border-border rounded-xl p-6 text-sm text-muted-foreground">
          Link your child in the <span className="text-primary">Guardian</span> tab to cast a vote on their behalf.
        </div>
      )}

      {AWARDS.map((award) => {
        const setting = settingFor(award.type);
        const open = !!setting?.voting_open;

        return (
          <div key={award.type} className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h3 className="font-display text-lg font-bold">{award.label}</h3>
                <p className="text-xs text-muted-foreground">{award.desc}</p>
              </div>
              <span className={`text-[10px] tracking-[0.15em] uppercase font-display font-semibold px-2 py-1 rounded-full border ${
                open ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                     : "text-muted-foreground border-border bg-secondary/50"
              }`}>
                {open ? "Voting Open" : "Voting Closed"}
              </span>
            </div>

            {!open ? (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Lock className="h-4 w-4" /> Voting will open closer to Presentation Evening.
              </div>
            ) : playersLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading squad...</div>
            ) : (players?.length ?? 0) === 0 ? (
              <div className="text-sm text-muted-foreground">No players found in this squad yet.</div>
            ) : childrenList.length === 0 ? (
              <div className="text-sm text-muted-foreground">No linked child to vote on behalf of.</div>
            ) : (
              <div className="space-y-4">
                {(award.type === "parents_player" ? [userDisplayName] : childrenList).map((voterLabel) => {
                  // For parents_player we use a single block keyed off the user; child arg is irrelevant
                  const current = voteFor(award.type, voterLabel);

                  // Players' Player: a child can't vote for themselves.
                  // Parents' Player: a parent can't vote for any of their own linked children.
                  const norm = (s: string) => (s || "").trim().toLowerCase();
                  const blocked = new Set<string>(
                    award.type === "parents_player"
                      ? childrenList.map((c) => norm(c))
                      : [norm(voterLabel)]
                  );
                  const eligible = players!.filter((p: any) => !blocked.has(norm(p.first_name)));

                  return (
                    <div key={voterLabel} className="space-y-2">
                      <div className="text-xs font-display tracking-wider uppercase text-muted-foreground">
                        Voting as: <span className="text-foreground">{voterLabel}</span>
                        {current && (
                          <span className="ml-2 text-primary normal-case tracking-normal">
                            · Voted: {(current as any).voted_for_player_name}
                          </span>
                        )}
                      </div>
                      {eligible.length === 0 ? (
                        <div className="text-xs text-muted-foreground italic">No eligible players to vote for.</div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {eligible.map((p: any) => {
                            const selected = current && (current as any).voted_for_player_id === p.id;
                            return (
                              <button
                                key={p.id}
                                disabled={castVote.isPending}
                                onClick={() => castVote.mutate({ award: award.type, child: voterLabel, player: p })}
                                className={`text-xs font-display tracking-wider px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                                  selected
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-transparent text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                                }`}
                              >
                                {selected && <Check className="h-3 w-3" />}
                                {p.first_name}{p.shirt_number ? ` #${p.shirt_number}` : ""}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
