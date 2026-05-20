import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Award, ArrowLeft, Download, Loader2, Lock, Unlock, Trophy, Medal } from "lucide-react";

const TEAMS = [
  { slug: "u7s", name: "U7" },
  { slug: "u8s-black", name: "U8 Black" },
  { slug: "u8s-gold", name: "U8 Gold" },
  { slug: "u9s", name: "U9" },
  { slug: "u10s", name: "U10" },
  { slug: "u11s-black", name: "U11 Black" },
  { slug: "u11s-gold", name: "U11 Gold" },
  { slug: "u13s-black", name: "U13 Black" },
  { slug: "u13s-gold", name: "U13 Gold" },
  { slug: "u14s", name: "U14" },
];

const AWARDS = [
  { type: "players_player", label: "Players' Player" },
  { type: "parents_player", label: "Parents' Player" },
] as const;

export default function PresentationAwardsAdminPage() {
  const qc = useQueryClient();
  const [team, setTeam] = useState<string>(TEAMS[0].slug);

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["paw-settings", team],
    queryFn: async () => {
      const { data } = await supabase
        .from("presentation_award_settings")
        .select("*")
        .eq("team_slug", team);
      return data ?? [];
    },
  });

  const { data: allSettings } = useQuery({
    queryKey: ["paw-settings-all"],
    queryFn: async () => {
      const { data } = await supabase
        .from("presentation_award_settings")
        .select("*");
      return data ?? [];
    },
  });

  const allOpen = useMemo(() => {
    if (!allSettings) return false;
    // Open if every team has both awards open
    for (const t of TEAMS) {
      for (const a of AWARDS) {
        const s = (allSettings as any[]).find((x) => x.team_slug === t.slug && x.award_type === a.type);
        if (!s?.voting_open) return false;
      }
    }
    return true;
  }, [allSettings]);

  const toggleAll = useMutation({
    mutationFn: async (open: boolean) => {
      const rows: any[] = [];
      for (const t of TEAMS) {
        for (const a of AWARDS) {
          rows.push({ team_slug: t.slug, award_type: a.type, voting_open: open });
        }
      }
      const { error } = await supabase
        .from("presentation_award_settings")
        .upsert(rows, { onConflict: "team_slug,award_type" });
      if (error) throw error;
    },
    onSuccess: (_d, open) => {
      qc.invalidateQueries({ queryKey: ["paw-settings"] });
      qc.invalidateQueries({ queryKey: ["paw-settings-all"] });
      qc.invalidateQueries({ queryKey: ["paw-settings", team] });
      toast.success(open ? "Voting opened for all teams" : "Voting closed for all teams");
    },
    onError: (e: any) => toast.error(e?.message || "Failed"),
  });

  const { data: votes, isLoading: votesLoading } = useQuery({
    queryKey: ["paw-votes", team],
    queryFn: async () => {
      const { data } = await supabase
        .from("presentation_award_votes")
        .select("*")
        .eq("team_slug", team)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: allVotes, isLoading: allVotesLoading } = useQuery({
    queryKey: ["paw-votes-all"],
    queryFn: async () => {
      const { data } = await supabase
        .from("presentation_award_votes")
        .select("team_slug, award_type, voted_for_player_name");
      return data ?? [];
    },
  });

  // Winners summary: per team per award -> sorted [name, count][]
  const winnersByTeamAward = useMemo(() => {
    const map = new Map<string, [string, number][]>();
    for (const t of TEAMS) {
      for (const a of AWARDS) {
        const filtered = (allVotes ?? []).filter(
          (v: any) => v.team_slug === t.slug && v.award_type === a.type,
        );
        const counts = new Map<string, number>();
        filtered.forEach((v: any) => {
          const n = v.voted_for_player_name;
          counts.set(n, (counts.get(n) || 0) + 1);
        });
        map.set(`${t.slug}::${a.type}`, [...counts.entries()].sort((x, y) => y[1] - x[1]));
      }
    }
    return map;
  }, [allVotes]);

  const exportAllWinnersCsv = () => {
    const rows: string[][] = [["Team", "Award", "Winner", "Votes", "Runner-Up", "Runner-Up Votes", "Total Votes", "Tie?"]];
    for (const t of TEAMS) {
      for (const a of AWARDS) {
        const list = winnersByTeamAward.get(`${t.slug}::${a.type}`) || [];
        const total = list.reduce((s, [, c]) => s + c, 0);
        const [first, second] = [list[0], list[1]];
        const tie = first && second && first[1] === second[1] ? "Yes" : "";
        rows.push([
          t.name,
          a.label,
          first?.[0] || "—",
          String(first?.[1] ?? 0),
          second?.[0] || "—",
          String(second?.[1] ?? 0),
          String(total),
          tie,
        ]);
      }
    }
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `presentation-award-winners-all-teams.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const voterIds = useMemo(() => [...new Set((votes ?? []).map((v: any) => v.voter_user_id))], [votes]);


  const { data: voterProfiles } = useQuery({
    queryKey: ["paw-voter-profiles", voterIds],
    enabled: voterIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", voterIds as string[]);
      return data ?? [];
    },
  });

  const profileMap = new Map((voterProfiles ?? []).map((p: any) => [p.id, p]));

  const toggleSetting = useMutation({
    mutationFn: async (args: { award: string; open: boolean }) => {
      const existing = settings?.find((s: any) => s.award_type === args.award);
      if (existing) {
        const { error } = await supabase
          .from("presentation_award_settings")
          .update({ voting_open: args.open })
          .eq("id", (existing as any).id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("presentation_award_settings")
          .insert({ team_slug: team, award_type: args.award, voting_open: args.open });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["paw-settings", team] });
      toast.success("Voting status updated");
    },
    onError: (e: any) => toast.error(e?.message || "Failed"),
  });

  const tallies = (award: string) => {
    const filtered = (votes ?? []).filter((v: any) => v.award_type === award);
    const counts = new Map<string, number>();
    filtered.forEach((v: any) => {
      counts.set(v.voted_for_player_name, (counts.get(v.voted_for_player_name) || 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  };

  const totalForAward = (award: string) =>
    (votes ?? []).filter((v: any) => v.award_type === award).length;

  const exportCsv = () => {
    const rows = [
      ["Award", "Team", "Voter Name", "Voter Email", "Voting For Child", "Voted For Player", "Voted At"],
      ...((votes ?? []).map((v: any) => {
        const p = profileMap.get(v.voter_user_id) as any;
        return [
          AWARDS.find((a) => a.type === v.award_type)?.label || v.award_type,
          team,
          p?.full_name || "",
          p?.email || "",
          v.responding_for || "",
          v.voted_for_player_name || "",
          new Date(v.created_at).toISOString(),
        ];
      })),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `presentation-award-votes-${team}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary font-display tracking-wider mb-6">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
          </Link>

          <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold flex items-center gap-3">
                <Award className="h-8 w-8 text-primary" /> Presentation Awards
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Manage voting and view live results per team.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleAll.mutate(!allOpen)}
                disabled={toggleAll.isPending}
                className={`inline-flex items-center gap-1.5 text-xs font-display tracking-wider px-4 py-2 rounded-lg border transition-all disabled:opacity-50 ${
                  allOpen
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/20"
                    : "bg-primary/10 text-primary border-primary/40 hover:bg-primary/20"
                }`}
                title="Open or close voting for every team and award at once"
              >
                {toggleAll.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : allOpen ? (
                  <Lock className="h-3.5 w-3.5" />
                ) : (
                  <Unlock className="h-3.5 w-3.5" />
                )}
                {allOpen ? "Close Voting (All Teams)" : "Open Voting (All Teams)"}
              </button>
              <button
                onClick={exportAllWinnersCsv}
                disabled={!allVotes || allVotes.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/40 text-xs font-display tracking-wider text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
              >
                <Trophy className="h-3.5 w-3.5" /> Export All Winners
              </button>
              <button
                onClick={exportCsv}
                disabled={!votes || votes.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-xs font-display tracking-wider hover:border-primary/50 hover:text-primary transition-colors disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" /> Export Team CSV
              </button>
            </div>
          </div>

          {/* Team filter */}
          <div className="flex flex-wrap gap-2 mb-8">
            {TEAMS.map((t) => (
              <button
                key={t.slug}
                onClick={() => setTeam(t.slug)}
                className={`font-display text-xs uppercase tracking-wider px-4 py-2 rounded-full border transition-all ${
                  team === t.slug
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>

          {/* Per-award panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {AWARDS.map((award) => {
              const setting = settings?.find((s: any) => s.award_type === award.type) as any;
              const open = !!setting?.voting_open;
              const results = tallies(award.type);
              const total = totalForAward(award.type);

              return (
                <div key={award.type} className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-lg font-bold">{award.label}</h2>
                    <button
                      onClick={() => toggleSetting.mutate({ award: award.type, open: !open })}
                      disabled={toggleSetting.isPending}
                      className={`inline-flex items-center gap-1.5 text-xs font-display tracking-wider px-3 py-1.5 rounded-full border transition-all ${
                        open
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                          : "bg-secondary text-muted-foreground border-border hover:border-primary/50"
                      }`}
                    >
                      {open ? <><Unlock className="h-3 w-3" /> Voting Open</> : <><Lock className="h-3 w-3" /> Closed</>}
                    </button>
                  </div>

                  <p className="text-xs text-muted-foreground mb-4">{total} vote{total === 1 ? "" : "s"} cast</p>

                  {settingsLoading || votesLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>
                  ) : results.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No votes yet.</div>
                  ) : (
                    <div className="space-y-2">
                      {results.map(([name, count]) => {
                        const pct = total > 0 ? (count / total) * 100 : 0;
                        return (
                          <div key={name}>
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="font-display">{name}</span>
                              <span className="text-muted-foreground text-xs">{count} ({pct.toFixed(0)}%)</span>
                            </div>
                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                              <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Vote log */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="font-display text-lg font-bold mb-4">Vote Log</h2>
            {votesLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>
            ) : (votes?.length ?? 0) === 0 ? (
              <div className="text-sm text-muted-foreground">No votes recorded yet for this team.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-border text-xs font-display tracking-wider uppercase text-muted-foreground">
                      <th className="py-2 pr-4">Award</th>
                      <th className="py-2 pr-4">Voter</th>
                      <th className="py-2 pr-4">On Behalf Of</th>
                      <th className="py-2 pr-4">Voted For</th>
                      <th className="py-2 pr-4">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(votes ?? []).map((v: any) => {
                      const p = profileMap.get(v.voter_user_id) as any;
                      return (
                        <tr key={v.id} className="border-b border-border/50">
                          <td className="py-2 pr-4">{AWARDS.find((a) => a.type === v.award_type)?.label || v.award_type}</td>
                          <td className="py-2 pr-4">
                            <div>{p?.full_name || "—"}</div>
                            <div className="text-xs text-muted-foreground">{p?.email || ""}</div>
                          </td>
                          <td className="py-2 pr-4">{v.responding_for}</td>
                          <td className="py-2 pr-4 text-primary font-display">{v.voted_for_player_name}</td>
                          <td className="py-2 pr-4 text-xs text-muted-foreground">{new Date(v.created_at).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
