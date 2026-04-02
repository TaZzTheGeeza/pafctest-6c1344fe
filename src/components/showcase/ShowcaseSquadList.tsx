import { motion } from "framer-motion";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { ShowcaseProps } from "./types";

export function ShowcaseSquadList({ teamName, players, coaches }: ShowcaseProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Squad */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="bg-primary/10 px-6 py-3 border-b border-border">
          <h2 className="font-display text-sm font-bold text-primary tracking-wider">SQUAD</h2>
        </div>
        <div className="divide-y divide-border">
          {players.map((player, i) => (
            <motion.div
              key={player.name}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-4 px-6 py-3 hover:bg-muted/30 transition-colors"
            >
              {/* Number */}
              <span className="font-display font-bold text-lg text-primary w-8 text-center">
                {player.number}
              </span>

              {/* Photo */}
              <Avatar className="h-10 w-10 border border-border">
                <AvatarImage src={player.photo} alt={player.name} className="object-cover object-top" />
                <AvatarFallback>{player.name[0]}</AvatarFallback>
              </Avatar>

              {/* Name & role */}
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-sm">{player.name}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{player.role}</p>
              </div>

              {/* Stats */}
              <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
                <span title="Appearances">{player.appearances ?? 0} app</span>
                <span title="Goals" className="font-medium text-foreground">{player.goals ?? 0}G</span>
                <span title="Assists">{player.assists ?? 0}A</span>
                {(player.potm ?? 0) > 0 && (
                  <span className="text-primary font-bold">⭐{player.potm}</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Coaches */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="bg-primary/10 px-6 py-3 border-b border-border">
          <h2 className="font-display text-sm font-bold text-primary tracking-wider">COACHING STAFF</h2>
        </div>
        <div className="divide-y divide-border">
          {coaches.map((coach, i) => (
            <motion.div
              key={coach.name}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-4 px-6 py-3"
            >
              <Avatar className="h-10 w-10 border border-border">
                <AvatarImage src={coach.photo} alt={coach.name} className="object-cover object-top" />
                <AvatarFallback>{coach.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-display font-bold text-sm">{coach.name}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{coach.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
