import { Trophy, Star, Calendar, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import potmCardBg from "@/assets/potm-card-bg.jpg";

interface POTMCardProps {
  playerName: string;
  teamName: string;
  ageGroup: string;
  matchDescription?: string | null;
  photoUrl?: string | null;
  reason?: string | null;
  shirtNumber?: number | null;
  awardDate: string;
  index?: number;
}

export function POTMCard({
  playerName,
  teamName,
  ageGroup,
  matchDescription,
  photoUrl,
  reason,
  shirtNumber,
  awardDate,
  index = 0,
}: POTMCardProps) {
  const [flipped, setFlipped] = useState(false);

  const formattedDate = (() => {
    try {
      const d = new Date(awardDate);
      return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return awardDate;
    }
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      whileHover={{ y: -8 }}
      whileTap={{ scale: 0.98 }}
      className="perspective-[1000px]"
    >
      <motion.div
        className="relative w-[280px] h-[420px] cursor-pointer"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        style={{ transformStyle: "preserve-3d" }}
        onClick={() => setFlipped(!flipped)}
      >
        {/* ── FRONT ── */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-primary/20"
          style={{ backfaceVisibility: "hidden", transition: "box-shadow 0.3s ease" }}
        >
          <div className="absolute inset-0 rounded-2xl bg-card" />
          <div className="relative z-10">
            {/* Photo area with club-themed background */}
            <div className="relative h-[320px] overflow-hidden">
              {/* Club-themed background */}
              <img
                src={potmCardBg}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
                aria-hidden="true"
              />
              {/* Gold radial glow */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center_60%,_hsla(38,45%,47%,0.2)_0%,_transparent_70%)]" />

              {/* Age group badge */}
              <div className="absolute top-4 left-4 z-20">
                <span className="font-display text-[10px] font-bold uppercase tracking-[0.2em] px-2.5 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 backdrop-blur-sm">
                  {ageGroup}
                </span>
              </div>

              {/* POTM star badge */}
              <div className="absolute top-4 right-4 z-20">
                <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/40 backdrop-blur-sm flex items-center justify-center">
                  <Star className="h-4 w-4 text-primary fill-primary" />
                </div>
              </div>

              {/* Player image (transparent background from AI removal) */}
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={playerName}
                  className="absolute inset-0 w-[130%] h-[130%] -left-[15%] -top-[15%] object-contain object-center z-10"
                  loading="lazy"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="w-28 h-28 rounded-full bg-secondary/80 border-2 border-primary/30 flex items-center justify-center backdrop-blur-sm">
                    <span className="font-display text-5xl font-bold text-primary/40">
                      {shirtNumber || playerName.charAt(0)}
                    </span>
                  </div>
                </div>
              )}

              {/* Bottom gradient fade into card */}
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-card via-card/80 to-transparent z-10" />
            </div>

            {/* Minimal info on front */}
            <div className="relative px-5 pb-4 -mt-8 z-10">
              <h3 className="font-display text-xl font-bold uppercase tracking-wide text-foreground leading-tight">
                {playerName}
              </h3>
              <div className="mt-2 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary/10 border border-primary/20">
                <Star className="h-3 w-3 text-primary fill-primary" />
                <span className="font-display text-[10px] font-bold uppercase tracking-[0.15em] text-primary">
                  Player of the Match
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground font-body text-center mt-2 animate-pulse">
                Tap to see details →
              </p>
            </div>
          </div>
        </div>

        {/* ── BACK ── */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden shadow-lg"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-br from-primary via-primary/30 to-primary/60">
            <div className="w-full h-full rounded-2xl bg-card" />
          </div>
          <div className="relative z-10 p-6 flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
              <Trophy className="h-7 w-7 text-primary" />
            </div>
            <h3 className="font-display text-xl font-bold uppercase text-foreground mb-1">
              {playerName}
            </h3>
            {shirtNumber && (
              <p className="text-xs font-body text-primary mb-3">#{shirtNumber}</p>
            )}

            <div className="w-full space-y-3 mb-4">
              <div className="flex justify-between text-xs font-body">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Users className="h-3 w-3 text-primary/70" /> Team
                </span>
                <span className="text-foreground">{teamName}</span>
              </div>
              <div className="w-full h-px bg-border" />
              {matchDescription && (
                <>
                  <div className="flex justify-between text-xs font-body">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Trophy className="h-3 w-3 text-primary/70" /> Match
                    </span>
                    <span className="text-foreground">vs {matchDescription}</span>
                  </div>
                  <div className="w-full h-px bg-border" />
                </>
              )}
              <div className="flex justify-between text-xs font-body">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 text-primary/70" /> Date
                </span>
                <span className="text-foreground">{formattedDate}</span>
              </div>
              <div className="w-full h-px bg-border" />
              <div className="flex justify-between text-xs font-body">
                <span className="text-muted-foreground">Age Group</span>
                <span className="text-foreground">{ageGroup}</span>
              </div>
            </div>

            {reason && (
              <div className="pt-3 border-t border-border w-full">
                <p className="text-xs font-body text-muted-foreground italic leading-relaxed">
                  "{reason}"
                </p>
              </div>
            )}

            <p className="text-[10px] text-muted-foreground font-body mt-4 animate-pulse">
              ← Tap to flip back
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
