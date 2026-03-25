import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Trophy, Target, Users, Award, Loader2 } from "lucide-react";

interface PlayerStat {
  id: string;
  first_name: string;
  shirt_number: number | null;
  goals: number;
  assists: number;
  appearances: number;
  potm_awards: number;
}

type SortKey = "goals" | "assists" | "appearances" | "potm_awards";

export function TeamStatsTable({ ageGroup }: { ageGroup: string }) {
  const [players, setPlayers] = useState<PlayerStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortKey>("goals");

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("player_stats")
        .select("id, first_name, shirt_number, goals, assists, appearances, potm_awards")
        .eq("age_group", ageGroup)
        .order("goals", { ascending: false });
      setPlayers(data || []);
      setLoading(false);
    };
    fetch();
  }, [ageGroup]);

  const sorted = [...players].sort((a, b) => b[sortBy] - a[sortBy]);

  const tabs: { key: SortKey; label: string; icon: typeof Trophy }[] = [
    { key: "goals", label: "Goals", icon: Target },
    { key: "assists", label: "Assists", icon: Users },
    { key: "appearances", label: "Apps", icon: BarChart3 },
    { key: "potm_awards", label: "POTM", icon: Award },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <h3 className="font-display text-sm font-bold mb-1">No Stats Yet</h3>
        <p className="text-xs text-muted-foreground">Player stats will appear here once they've been added by the coaching team.</p>
      </div>
    );
  }

  const topPlayer = sorted[0];

  return (
    <div className="space-y-4">
      {/* Top player highlight */}
      {topPlayer && (
        <div className="bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <Trophy className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-display tracking-widest text-primary uppercase mb-0.5">
              Top {tabs.find((t) => t.key === sortBy)?.label} Leader
            </p>
            <p className="font-display font-bold text-sm">
              {topPlayer.first_name}
              {topPlayer.shirt_number ? ` (#${topPlayer.shirt_number})` : ""}
            </p>
            <p className="text-xs text-muted-foreground">
              {topPlayer[sortBy]} {tabs.find((t) => t.key === sortBy)?.label.toLowerCase()}
            </p>
          </div>
        </div>
      )}

      {/* Sort tabs */}
      <div className="flex gap-1 bg-secondary/50 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSortBy(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-display tracking-wider py-2 rounded-md transition-all ${
              sortBy === tab.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-3 w-3" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Stats table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-[10px] font-display tracking-widest text-muted-foreground uppercase">
              <th className="text-left px-4 py-3 w-8">#</th>
              <th className="text-left px-2 py-3">Player</th>
              <th className="text-center px-2 py-3">
                <Target className="h-3 w-3 mx-auto" title="Goals" />
              </th>
              <th className="text-center px-2 py-3">
                <Users className="h-3 w-3 mx-auto" title="Assists" />
              </th>
              <th className="text-center px-2 py-3">
                <BarChart3 className="h-3 w-3 mx-auto" title="Appearances" />
              </th>
              <th className="text-center px-2 py-3">
                <Award className="h-3 w-3 mx-auto" title="POTM" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((player, i) => (
              <tr
                key={player.id}
                className={`border-b border-border/50 last:border-0 transition-colors ${
                  i === 0 ? "bg-primary/5" : "hover:bg-secondary/50"
                }`}
              >
                <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                  {player.shirt_number ?? "-"}
                </td>
                <td className="px-2 py-3">
                  <span className="font-display text-sm font-medium">{player.first_name}</span>
                </td>
                <td className={`text-center px-2 py-3 text-sm font-bold ${sortBy === "goals" ? "text-primary" : "text-foreground"}`}>
                  {player.goals}
                </td>
                <td className={`text-center px-2 py-3 text-sm font-bold ${sortBy === "assists" ? "text-primary" : "text-foreground"}`}>
                  {player.assists}
                </td>
                <td className={`text-center px-2 py-3 text-sm font-bold ${sortBy === "appearances" ? "text-primary" : "text-foreground"}`}>
                  {player.appearances}
                </td>
                <td className={`text-center px-2 py-3 text-sm font-bold ${sortBy === "potm_awards" ? "text-primary" : "text-foreground"}`}>
                  {player.potm_awards}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[10px] text-muted-foreground text-center font-display tracking-wider">
        Only first names shown to protect player privacy
      </p>
    </div>
  );
}
