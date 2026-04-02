import { motion } from "framer-motion";
import type { ShowcaseProps } from "./types";

export function ShowcaseMeetTheTeam({ teamName, players, coaches }: ShowcaseProps) {
  return (
    <div className="space-y-12">
      {/* Hero banner */}
      <div className="text-center space-y-2">
        <h2 className="font-display text-3xl md:text-4xl font-bold">
          <span className="text-gold-gradient">MEET THE TEAM</span>
        </h2>
        <p className="text-muted-foreground text-sm">Peterborough Athletic FC · {teamName}</p>
      </div>

      {/* Players grid - Premier League style */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
        {players.map((player, i) => (
          <motion.div
            key={player.name}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06 }}
            className="group text-center"
          >
            {/* Photo with clipping */}
            <div className="relative mx-auto w-full aspect-square overflow-hidden rounded-xl bg-secondary mb-3">
              <img
                src={player.photo}
                alt={player.name}
                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
              />
              {/* Bottom gradient */}
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background to-transparent" />
              {/* Number */}
              <span className="absolute bottom-2 right-3 font-display text-4xl font-bold text-primary/40">
                {player.number}
              </span>
            </div>

            <h3 className="font-display font-bold text-sm">{player.name}</h3>
            <p className="text-[10px] text-primary font-display tracking-widest uppercase">{player.role}</p>

            {/* Mini stat bar */}
            <div className="flex justify-center gap-3 mt-2 text-[10px] text-muted-foreground">
              <span>{player.appearances ?? 0} apps</span>
              <span className="text-foreground font-medium">{player.goals ?? 0}G</span>
              <span>{player.assists ?? 0}A</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Coaches section */}
      <div>
        <h3 className="font-display text-lg font-bold text-primary tracking-wider text-center mb-6">COACHING STAFF</h3>
        <div className="flex flex-wrap justify-center gap-8">
          {coaches.map((coach, i) => (
            <motion.div
              key={coach.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="w-28 h-28 rounded-full overflow-hidden mx-auto mb-3 border-2 border-primary">
                <img
                  src={coach.photo}
                  alt={coach.name}
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <h4 className="font-display font-bold text-sm">{coach.name}</h4>
              <p className="text-[10px] text-primary font-display tracking-widest uppercase">{coach.role}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
