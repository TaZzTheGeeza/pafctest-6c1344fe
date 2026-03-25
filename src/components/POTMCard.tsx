import { Trophy, Star, Calendar, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useRef, useEffect } from "react";

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
  const formattedDate = (() => {
    try {
      const d = new Date(awardDate);
      return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return awardDate;
    }
  })();

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 12;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * -12;
      el.style.transform = `perspective(800px) rotateY(${x}deg) rotateX(${y}deg) scale(1.02)`;
    };
    const handleLeave = () => {
      el.style.transform = "perspective(800px) rotateY(0deg) rotateX(0deg) scale(1)";
    };
    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);
    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      whileHover={{ scale: 1.05, y: -8 }}
      whileTap={{ scale: 0.98 }}
    >
      <div
        ref={cardRef}
        className="potm-card-v2 relative w-[280px] rounded-2xl overflow-hidden cursor-default"
        style={{ transition: "transform 0.15s ease-out" }}
      >
        {/* Gold accent border */}
        <div className="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-br from-primary via-primary/30 to-primary/60">
          <div className="w-full h-full rounded-2xl bg-card" />
        </div>

        {/* Card content */}
        <div className="relative z-10">
          {/* Photo area */}
          <div className="relative h-[300px] overflow-hidden bg-gradient-to-b from-secondary to-card">
            {/* Subtle gold radial glow behind player */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center_70%,_hsla(38,45%,47%,0.15)_0%,_transparent_70%)]" />

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

            {/* Player image */}
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={playerName}
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-28 h-28 rounded-full bg-secondary border-2 border-primary/30 flex items-center justify-center">
                  <span className="font-display text-5xl font-bold text-primary/40">
                    {shirtNumber || playerName.charAt(0)}
                  </span>
                </div>
              </div>
            )}

            {/* Bottom gradient fade */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-card via-card/80 to-transparent" />

            {/* Shirt number overlay */}
            {shirtNumber && (
              <div className="absolute bottom-14 right-4 z-20">
                <span className="font-display text-5xl font-bold text-primary/15">
                  {shirtNumber}
                </span>
              </div>
            )}
          </div>

          {/* Info section */}
          <div className="relative px-5 pb-5 -mt-8">
            {/* Player name */}
            <h3 className="font-display text-xl font-bold uppercase tracking-wide text-foreground leading-tight">
              {playerName}
            </h3>

            {/* Team & match info */}
            <div className="mt-2.5 space-y-1.5">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-3 w-3 text-primary/70 shrink-0" />
                <span className="text-xs font-body truncate">{teamName}</span>
              </div>
              {matchDescription && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Trophy className="h-3 w-3 text-primary/70 shrink-0" />
                  <span className="text-xs font-body truncate">vs {matchDescription}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3 w-3 text-primary/70 shrink-0" />
                <span className="text-xs font-body">{formattedDate}</span>
              </div>
            </div>

            {/* Reason quote */}
            {reason && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs font-body text-muted-foreground italic leading-relaxed line-clamp-2">
                  "{reason}"
                </p>
              </div>
            )}

            {/* POTM label */}
            <div className="mt-3 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary/10 border border-primary/20">
              <Star className="h-3 w-3 text-primary fill-primary" />
              <span className="font-display text-[10px] font-bold uppercase tracking-[0.15em] text-primary">
                Player of the Match
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
