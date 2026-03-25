import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Star } from "lucide-react";
import { format } from "date-fns";

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
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {players.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="bg-card border border-border rounded-xl overflow-hidden group hover:border-primary/50 transition-colors"
                >
                  {p.photo_url ? (
                    <div className="aspect-square overflow-hidden">
                      <img src={p.photo_url} alt={p.player_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  ) : (
                    <div className="aspect-square bg-secondary flex items-center justify-center">
                      <Star className="h-16 w-16 text-primary/30" />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-1">
                      <Trophy className="h-4 w-4 text-primary" />
                      <span className="text-xs font-display tracking-wider text-primary">{p.age_group}</span>
                    </div>
                    <h3 className="font-display text-xl font-bold text-foreground mb-1">{p.player_name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{p.team_name}</p>
                    {p.match_description && <p className="text-xs text-muted-foreground mb-2">vs {p.match_description}</p>}
                    {p.reason && <p className="text-sm text-foreground/80 italic">"{p.reason}"</p>}
                    <p className="text-xs text-muted-foreground mt-3">{format(new Date(p.award_date), "dd MMM yyyy")}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
