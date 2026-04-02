import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users } from "lucide-react";

interface PlayerStat {
  id: string;
  first_name: string;
  shirt_number: number | null;
  goals: number;
  assists: number;
  appearances: number;
  potm_awards: number;
  photo_url: string | null;
  position: string | null;
}

export function TeamTradingCards({ ageGroup }: { ageGroup: string }) {
  const [players, setPlayers] = useState<PlayerStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlayers = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("player_stats")
        .select("id, first_name, shirt_number, goals, assists, appearances, potm_awards, photo_url, position")
        .eq("age_group", ageGroup)
        .order("shirt_number", { ascending: true, nullsFirst: false });
      setPlayers((data as PlayerStat[]) || []);
      setLoading(false);
    };
    fetchPlayers();
  }, [ageGroup]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // Only show section if at least one player has a photo
  const playersWithPhotos = players.filter((p) => p.photo_url);
  if (playersWithPhotos.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        <h2 className="font-display text-sm font-bold text-primary tracking-wider">THE SQUAD</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {playersWithPhotos.map((player, i) => (
          <motion.div
            key={player.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="group relative bg-card border border-border rounded-lg overflow-hidden hover:border-primary/60 transition-all hover:scale-[1.03]"
          >
            {/* Gold top accent */}
            <div className="h-1 bg-gold-gradient" />

            {/* Photo */}
            <div className="relative aspect-[3/4] overflow-hidden">
              <img
                src={player.photo_url!}
                alt={player.first_name}
                className="w-full h-full object-cover object-top"
              />
              {/* Number overlay */}
              {player.shirt_number && (
                <div className="absolute top-2 right-2 bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-sm">
                  {player.shirt_number}
                </div>
              )}
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
            </div>

            {/* Info */}
            <div className="p-3 -mt-8 relative z-10">
              <h3 className="font-display font-bold text-base">{player.first_name}</h3>
              {player.position && (
                <p className="text-[10px] text-primary font-display tracking-widest uppercase">{player.position}</p>
              )}

              {/* Stats row */}
              <div className="grid grid-cols-4 gap-1 mt-3 pt-3 border-t border-border">
                <div className="text-center">
                  <p className="text-xs font-bold">{player.appearances}</p>
                  <p className="text-[8px] text-muted-foreground">APP</p>
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold">{player.goals}</p>
                  <p className="text-[8px] text-muted-foreground">G</p>
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold">{player.assists}</p>
                  <p className="text-[8px] text-muted-foreground">A</p>
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-primary">{player.potm_awards}</p>
                  <p className="text-[8px] text-muted-foreground">⭐</p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground text-center font-display tracking-wider">
        Only first names shown to protect player privacy
      </p>
    </div>
  );
}
