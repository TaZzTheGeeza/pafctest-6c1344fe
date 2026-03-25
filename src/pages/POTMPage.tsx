import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Star, Filter } from "lucide-react";
import { POTMCard } from "@/components/POTMCard";

interface POTM {
  id: string;
  player_name: string;
  team_name: string;
  age_group: string;
  match_description: string | null;
  photo_url: string | null;
  award_date: string;
  reason: string | null;
  shirt_number: number | null;
}

export default function POTMPage() {
  const [players, setPlayers] = useState<POTM[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<string>("all");

  useEffect(() => {
    supabase
      .from("player_of_the_match")
      .select("*")
      .order("award_date", { ascending: false })
      .then(({ data }) => {
        if (data) setPlayers(data);
        setLoading(false);
      });
  }, []);

  const ageGroups = [...new Set(players.map((p) => p.age_group))].sort();
  const filtered = selectedGroup === "all" ? players : players.filter((p) => p.age_group === selectedGroup);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-5">
              <Star className="h-3.5 w-3.5 text-primary fill-primary" />
              <span className="font-display text-xs font-bold uppercase tracking-[0.2em] text-primary">
                Award Winners
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold font-display leading-tight">
              <span className="text-gold-gradient">Player of the</span>
              <br />
              <span className="text-foreground">Match</span>
            </h1>
            <p className="text-muted-foreground mt-4 max-w-md mx-auto text-sm font-body">
              Celebrating the standout performers who gave everything on the pitch
            </p>
          </motion.div>

          {/* Age group filter */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex items-center justify-center gap-2 flex-wrap mb-10"
          >
            <Filter className="h-4 w-4 text-muted-foreground mr-1" />
            <button
              onClick={() => setSelectedGroup("all")}
              className={`font-display text-xs uppercase tracking-wider px-4 py-2 rounded-full border transition-all duration-200 ${
                selectedGroup === "all"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-transparent text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
              }`}
            >
              All Teams
            </button>
            {ageGroups.map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGroup(g)}
                className={`font-display text-xs uppercase tracking-wider px-4 py-2 rounded-full border transition-all duration-200 ${
                  selectedGroup === g
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-transparent text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {g}
              </button>
            ))}
          </motion.div>

          {/* Content */}
          {loading ? (
            <div className="text-center py-20">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-muted-foreground text-sm mt-4 font-body">Loading awards...</p>
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto text-center py-16"
            >
              <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
                <Trophy className="h-8 w-8 text-primary/50" />
              </div>
              <h3 className="font-display text-xl font-bold text-foreground mb-2">No Awards Yet</h3>
              <p className="text-muted-foreground text-sm font-body">
                {selectedGroup !== "all"
                  ? `No POTM awards for ${selectedGroup} yet. Check back after match day!`
                  : "No Player of the Match awards yet. Check back after match day!"}
              </p>
            </motion.div>
          ) : (
            <>
              <p className="text-center text-xs text-muted-foreground font-body mb-8">
                {filtered.length} award{filtered.length !== 1 ? "s" : ""}
                {selectedGroup !== "all" ? ` · ${selectedGroup}` : ""}
              </p>
              <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
                {filtered.map((p, i) => (
                  <POTMCard
                    key={p.id}
                    playerName={p.player_name}
                    teamName={p.team_name}
                    ageGroup={p.age_group}
                    matchDescription={p.match_description}
                    photoUrl={p.photo_url}
                    reason={p.reason}
                    shirtNumber={p.shirt_number}
                    awardDate={p.award_date}
                    index={i}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
