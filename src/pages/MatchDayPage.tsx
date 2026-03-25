import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Radio, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";

interface LiveMatch {
  id: string;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  age_group: string;
  venue: string | null;
  kickoff_time: string | null;
  status: string;
  match_events: any[];
}

const statusLabels: Record<string, { label: string; color: string }> = {
  live: { label: "LIVE", color: "bg-red-500 animate-pulse" },
  upcoming: { label: "Upcoming", color: "bg-muted" },
  half_time: { label: "Half Time", color: "bg-yellow-600" },
  full_time: { label: "Full Time", color: "bg-green-700" },
};

function MatchCard({ match }: { match: LiveMatch }) {
  const status = statusLabels[match.status] || statusLabels.upcoming;
  const isLive = match.status === "live" || match.status === "half_time";

  return (
    <div className={`bg-card border rounded-xl p-6 transition-all ${isLive ? "border-red-500/50 shadow-lg shadow-red-500/10" : "border-border"}`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-display tracking-wider text-muted-foreground">{match.age_group}</span>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full text-white ${status.color}`}>{status.label}</span>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 text-right">
          <p className="font-display text-lg font-bold text-foreground">{match.home_team}</p>
          {match.venue && <p className="text-xs text-muted-foreground flex items-center justify-end gap-1"><MapPin className="h-3 w-3" />{match.venue}</p>}
        </div>

        <div className="text-center px-4">
          {match.status === "upcoming" ? (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="font-display text-sm">{match.kickoff_time ? format(new Date(match.kickoff_time), "HH:mm") : "TBC"}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-display text-3xl font-bold text-foreground">{match.home_score}</span>
              <span className="text-muted-foreground">-</span>
              <span className="font-display text-3xl font-bold text-foreground">{match.away_score}</span>
            </div>
          )}
        </div>

        <div className="flex-1">
          <p className="font-display text-lg font-bold text-foreground">{match.away_team}</p>
        </div>
      </div>

      {isLive && match.match_events && match.match_events.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border space-y-1">
          {(match.match_events as any[]).slice(-3).map((event: any, i: number) => (
            <p key={i} className="text-xs text-muted-foreground">
              <span className="text-primary font-bold">{event.minute}'</span> — {event.description}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MatchDayPage() {
  const [matches, setMatches] = useState<LiveMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      const { data } = await supabase
        .from("live_matches")
        .select("*")
        .order("kickoff_time", { ascending: true });
      if (data) setMatches(data);
      setLoading(false);
    };
    fetchMatches();

    const channel = supabase
      .channel("live-matches-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "live_matches" }, () => fetchMatches())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const liveMatches = matches.filter((m) => m.status === "live" || m.status === "half_time");
  const upcomingMatches = matches.filter((m) => m.status === "upcoming");
  const completedMatches = matches.filter((m) => m.status === "full_time");

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex items-center justify-center gap-3 mb-2">
              <Radio className="h-6 w-6 text-red-500 animate-pulse" />
              <h1 className="text-4xl md:text-5xl font-bold font-display text-center">
                <span className="text-gold-gradient">Match</span> Day Hub
              </h1>
            </div>
            <p className="text-muted-foreground text-center mb-12">Live scores, updates & results</p>
          </motion.div>

          {loading ? (
            <div className="text-center text-muted-foreground py-12">Loading matches...</div>
          ) : matches.length === 0 ? (
            <div className="max-w-2xl mx-auto bg-card border border-border rounded-lg p-12 text-center">
              <Radio className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No matches scheduled today. Check back on match day!</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-8">
              {liveMatches.length > 0 && (
                <div>
                  <h2 className="font-display text-sm tracking-wider text-red-500 mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> LIVE NOW
                  </h2>
                  <div className="space-y-3">
                    {liveMatches.map((m) => <MatchCard key={m.id} match={m} />)}
                  </div>
                </div>
              )}

              {upcomingMatches.length > 0 && (
                <div>
                  <h2 className="font-display text-sm tracking-wider text-muted-foreground mb-4">UPCOMING</h2>
                  <div className="space-y-3">
                    {upcomingMatches.map((m) => <MatchCard key={m.id} match={m} />)}
                  </div>
                </div>
              )}

              {completedMatches.length > 0 && (
                <div>
                  <h2 className="font-display text-sm tracking-wider text-muted-foreground mb-4">COMPLETED</h2>
                  <div className="space-y-3">
                    {completedMatches.map((m) => <MatchCard key={m.id} match={m} />)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
