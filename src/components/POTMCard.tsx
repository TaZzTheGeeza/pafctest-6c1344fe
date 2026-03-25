import { Star, Trophy } from "lucide-react";
import { motion } from "framer-motion";

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="group"
    >
      <div className="relative w-[260px] mx-auto select-none">
        {/* Card body */}
        <div
          className="relative rounded-2xl overflow-hidden border-2 border-primary/40"
          style={{
            background:
              "linear-gradient(160deg, hsl(38 50% 34%) 0%, hsl(0 0% 8%) 35%, hsl(0 0% 8%) 65%, hsl(38 50% 34%) 100%)",
          }}
        >
          {/* Decorative top arc */}
          <div className="absolute top-0 left-0 right-0 h-40 overflow-hidden">
            <div
              className="absolute -top-20 left-1/2 -translate-x-1/2 w-[400px] h-[200px] rounded-[50%] opacity-15"
              style={{
                background:
                  "radial-gradient(ellipse at center, hsl(38 45% 55%) 0%, transparent 70%)",
              }}
            />
            {/* Gold line accents */}
            <svg className="absolute top-0 left-0 w-full h-full opacity-10" viewBox="0 0 260 160" fill="none">
              <path d="M0 80 Q65 20 130 50 Q195 80 260 30" stroke="hsl(38 45% 55%)" strokeWidth="1" />
              <path d="M0 100 Q65 40 130 70 Q195 100 260 50" stroke="hsl(38 45% 55%)" strokeWidth="0.5" />
            </svg>
          </div>

          {/* Rating badge */}
          <div className="absolute top-3 left-3 z-10 flex flex-col items-center">
            <span className="font-display text-3xl font-bold text-primary leading-none">
              ★
            </span>
            <span className="font-display text-[10px] uppercase tracking-widest text-primary/80 mt-0.5">
              POTM
            </span>
          </div>

          {/* Age group badge */}
          <div className="absolute top-3 right-3 z-10">
            <span className="font-display text-xs font-semibold bg-primary/20 text-primary px-2 py-0.5 rounded border border-primary/30">
              {ageGroup}
            </span>
          </div>

          {/* Player photo area */}
          <div className="relative pt-10 pb-2 px-8 flex justify-center">
            <div className="relative w-36 h-36 rounded-xl overflow-hidden border-2 border-primary/30 shadow-lg shadow-primary/10">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={playerName}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
              ) : (
                <div className="w-full h-full bg-secondary flex items-center justify-center">
                  <span className="font-display text-5xl font-bold text-primary/30">
                    {shirtNumber ? `${shirtNumber}` : "?"}
                  </span>
                </div>
              )}
              {/* Subtle overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>
          </div>

          {/* Divider line */}
          <div className="mx-6 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

          {/* Player info */}
          <div className="px-5 pt-3 pb-2 text-center">
            {shirtNumber && (
              <span className="font-display text-xs text-primary/70 tracking-wider">
                #{shirtNumber}
              </span>
            )}
            <h3 className="font-display text-xl font-bold text-foreground uppercase tracking-wide leading-tight">
              {playerName}
            </h3>
            <p className="font-body text-[11px] text-muted-foreground mt-0.5">
              {teamName}
            </p>
          </div>

          {/* Stats bar */}
          <div className="mx-5 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          <div className="px-5 py-2.5 grid grid-cols-3 gap-1 text-center">
            <div>
              <p className="font-display text-[9px] uppercase tracking-widest text-primary/60">Match</p>
              <p className="font-body text-[10px] text-foreground/80 mt-0.5 truncate">
                {matchDescription?.replace(/^vs\s*/i, "") || "—"}
              </p>
            </div>
            <div>
              <p className="font-display text-[9px] uppercase tracking-widest text-primary/60">Date</p>
              <p className="font-body text-[10px] text-foreground/80 mt-0.5">{formattedDate}</p>
            </div>
            <div>
              <p className="font-display text-[9px] uppercase tracking-widest text-primary/60">Award</p>
              <p className="font-body text-[10px] text-primary mt-0.5 flex items-center justify-center gap-0.5">
                <Trophy className="h-2.5 w-2.5" /> POTM
              </p>
            </div>
          </div>

          {/* Reason quote */}
          {reason && (
            <>
              <div className="mx-5 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
              <div className="px-5 py-2.5">
                <p className="font-body text-[10px] text-foreground/60 italic text-center leading-relaxed line-clamp-2">
                  "{reason}"
                </p>
              </div>
            </>
          )}

          {/* Bottom accent */}
          <div className="h-1.5 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
        </div>
      </div>
    </motion.div>
  );
}
