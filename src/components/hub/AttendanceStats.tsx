import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TrendingUp, Users } from "lucide-react";

interface Props {
  teamSlug: string;
}

interface PlayerAttendance {
  id: string;
  first_name: string;
  shirt_number: number | null;
  appearances: number;
  goals: number;
  assists: number;
  potm_awards: number;
  total_matches: number;
  attendance_pct: number;
}

export function AttendanceStats({ teamSlug }: Props) {
  const { data: stats = [], isLoading } = useQuery({
    queryKey: ["attendance-stats", teamSlug],
    queryFn: async () => {
      // Get all players for this team
      const { data: players, error: pErr } = await supabase
        .from("player_stats")
        .select("id, first_name, shirt_number, appearances, goals, assists, potm_awards, team_name")
        .eq("team_name", teamSlug);
      if (pErr) throw pErr;
      if (!players?.length) return [];

      // Get total unique matches for this team
      const { data: matches, error: mErr } = await supabase
        .from("match_player_stats")
        .select("match_date, opponent")
        .eq("team_slug", teamSlug);
      if (mErr) throw mErr;

      const uniqueMatches = new Set(matches?.map((m) => `${m.match_date}::${m.opponent}`) || []);
      const totalMatches = uniqueMatches.size || 1;

      return players
        .map((p) => ({
          ...p,
          total_matches: totalMatches,
          attendance_pct: Math.round((p.appearances / totalMatches) * 100),
        }))
        .sort((a, b) => b.attendance_pct - a.attendance_pct || a.first_name.localeCompare(b.first_name));
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading stats…
      </div>
    );
  }

  if (stats.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-display text-lg font-bold text-foreground mb-2">No Stats Yet</h3>
        <p className="text-sm text-muted-foreground">Match data will appear here once stats are recorded in the Coach Panel.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" /> Season Attendance — {stats[0]?.total_matches} match{stats[0]?.total_matches !== 1 ? "es" : ""} recorded
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground text-xs font-display tracking-wider">
              <th className="text-left px-4 py-2">#</th>
              <th className="text-left px-4 py-2">Player</th>
              <th className="text-center px-4 py-2">App</th>
              <th className="text-center px-4 py-2">%</th>
              <th className="text-center px-4 py-2">G</th>
              <th className="text-center px-4 py-2">A</th>
              <th className="text-center px-4 py-2">POTM</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {stats.map((p) => (
              <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">{p.shirt_number ?? "–"}</td>
                <td className="px-4 py-2.5 font-display font-bold text-foreground">{p.first_name}</td>
                <td className="px-4 py-2.5 text-center text-muted-foreground">{p.appearances}/{p.total_matches}</td>
                <td className="px-4 py-2.5 text-center font-bold">
                  <span className={p.attendance_pct >= 75 ? "text-green-500" : p.attendance_pct >= 50 ? "text-amber-500" : "text-red-500"}>
                    {p.attendance_pct}%
                  </span>
                </td>
                <td className="px-4 py-2.5 text-center text-muted-foreground">{p.goals}</td>
                <td className="px-4 py-2.5 text-center text-muted-foreground">{p.assists}</td>
                <td className="px-4 py-2.5 text-center text-muted-foreground">{p.potm_awards}</td>
                <td className="px-4 py-2.5">
                  <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${p.attendance_pct >= 75 ? "bg-green-500" : p.attendance_pct >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                      style={{ width: `${p.attendance_pct}%` }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
