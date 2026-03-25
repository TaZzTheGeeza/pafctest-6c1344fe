import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Star } from "lucide-react";
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
}

export default function POTMPage() {
  const [players, setPlayers] = useState<POTM[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex items-center justify-center gap-3 mb-2">
              <Star className="h-6 w-6 text-primary" />
              <h1 className="text-4xl md:text-5xl font-bold font-display text-center">
                <span className="text-gold-gradient">Player of the</span> Match
              </h1>
            </div>
            <p className="text-muted-foreground text-center mb-12">Celebrating our weekly standout performers</p>
          </motion.div>

          {loading ? (
            <div className="text-center text-muted-foreground py-12">Loading...</div>
          ) : players.length === 0 ? (
            <div className="max-w-2xl mx-auto bg-card border border-border rounded-lg p-12 text-center">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No Player of the Match awards yet. Check back after match day!</p>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 justify-items-center">
              {players.map((p, i) => (
                <POTMCard
                  key={p.id}
                  playerName={p.player_name}
                  teamName={p.team_name}
                  ageGroup={p.age_group}
                  matchDescription={p.match_description}
                  photoUrl={p.photo_url}
                  reason={p.reason}
                  awardDate={p.award_date}
                  index={i}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
