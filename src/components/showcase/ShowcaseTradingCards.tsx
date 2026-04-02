import { motion } from "framer-motion";
import { Trophy, Target, Star, Shield } from "lucide-react";
import type { ShowcaseProps } from "./types";

export function ShowcaseTradingCards({ teamName, players, coaches }: ShowcaseProps) {
  return (
    <div className="space-y-10">
      {/* Players */}
      <div>
        <h2 className="font-display text-xl font-bold text-primary tracking-wider mb-6 text-center">THE SQUAD</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {players.map((player, i) => (
            <motion.div
              key={player.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="group relative bg-card border border-border rounded-lg overflow-hidden hover:border-primary/60 transition-all hover:scale-[1.03]"
            >
              {/* Gold top accent */}
              <div className="h-1 bg-gold-gradient" />

              {/* Photo */}
              <div className="relative aspect-[3/4] overflow-hidden">
                <img
                  src={player.photo}
                  alt={player.name}
                  className="w-full h-full object-cover object-top"
                />
                {/* Number overlay */}
                <div className="absolute top-2 right-2 bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-sm">
                  {player.number}
                </div>
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
              </div>

              {/* Info */}
              <div className="p-3 -mt-8 relative z-10">
                <h3 className="font-display font-bold text-base">{player.name}</h3>
                <p className="text-[10px] text-primary font-display tracking-widest uppercase">{player.role}</p>

                {/* Stats row */}
                <div className="grid grid-cols-4 gap-1 mt-3 pt-3 border-t border-border">
                  <div className="text-center">
                    <p className="text-xs font-bold">{player.appearances ?? 0}</p>
                    <p className="text-[8px] text-muted-foreground">APP</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold">{player.goals ?? 0}</p>
                    <p className="text-[8px] text-muted-foreground">G</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold">{player.assists ?? 0}</p>
                    <p className="text-[8px] text-muted-foreground">A</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-primary">{player.potm ?? 0}</p>
                    <p className="text-[8px] text-muted-foreground">⭐</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Coaches */}
      <div>
        <h2 className="font-display text-xl font-bold text-primary tracking-wider mb-6 text-center">COACHING STAFF</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {coaches.map((coach, i) => (
            <motion.div
              key={coach.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="relative bg-card border border-border rounded-lg overflow-hidden"
            >
              <div className="h-1 bg-gold-gradient" />
              <div className="relative aspect-[3/4] overflow-hidden">
                <img src={coach.photo} alt={coach.name} className="w-full h-full object-cover object-top" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
              </div>
              <div className="p-3 -mt-8 relative z-10">
                <h3 className="font-display font-bold text-base">{coach.name}</h3>
                <p className="text-[10px] text-primary font-display tracking-widest uppercase">{coach.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
