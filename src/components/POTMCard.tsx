import { Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

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
      return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
    } catch {
      return awardDate;
    }
  })();

  const shimmerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = shimmerRef.current;
    if (!el) return;
    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty("--shimmer-x", `${x}%`);
      el.style.setProperty("--shimmer-y", `${y}%`);
    };
    el.addEventListener("mousemove", handleMove);
    return () => el.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="group"
    >
      {/* Outer card shape – FIFA UT proportions */}
      <div ref={shimmerRef} className="potm-card relative w-[220px] mx-auto select-none" style={{ aspectRatio: "0.66" }}>
        <svg
          viewBox="0 0 220 333"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-0 w-full h-full drop-shadow-xl"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={`card-bg-${index}`} x1="0" y1="0" x2="220" y2="333" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="hsl(38 40% 28%)" />
              <stop offset="30%" stopColor="hsl(38 30% 18%)" />
              <stop offset="60%" stopColor="hsl(30 20% 12%)" />
              <stop offset="100%" stopColor="hsl(38 40% 22%)" />
            </linearGradient>
            <linearGradient id={`card-border-${index}`} x1="0" y1="0" x2="220" y2="333" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="hsl(38 50% 50%)" />
              <stop offset="50%" stopColor="hsl(38 45% 35%)" />
              <stop offset="100%" stopColor="hsl(38 50% 45%)" />
            </linearGradient>
            <clipPath id={`card-clip-${index}`}>
              <path d="M20 0 H200 Q220 0 220 20 V313 Q220 333 200 333 H20 Q0 333 0 313 V20 Q0 0 20 0Z" />
            </clipPath>
          </defs>
          {/* Card fill */}
          <path
            d="M20 0 H200 Q220 0 220 20 V313 Q220 333 200 333 H20 Q0 333 0 313 V20 Q0 0 20 0Z"
            fill={`url(#card-bg-${index})`}
          />
          {/* Border */}
          <path
            d="M20 0 H200 Q220 0 220 20 V313 Q220 333 200 333 H20 Q0 333 0 313 V20 Q0 0 20 0Z"
            fill="none"
            stroke={`url(#card-border-${index})`}
            strokeWidth="2"
          />
          {/* Decorative swoosh wings behind photo */}
          <path
            d="M10 110 Q50 70 110 85 Q170 70 210 110"
            stroke="hsl(38 45% 40%)"
            strokeWidth="1"
            fill="none"
            opacity="0.4"
          />
          <path
            d="M5 120 Q40 60 110 80 Q180 60 215 120"
            stroke="hsl(38 45% 35%)"
            strokeWidth="0.8"
            fill="none"
            opacity="0.25"
          />
          <path
            d="M15 130 Q55 80 110 95 Q165 80 205 130"
            stroke="hsl(38 45% 45%)"
            strokeWidth="0.6"
            fill="none"
            opacity="0.2"
          />
          {/* Bottom divider line */}
          <line x1="30" y1="240" x2="190" y2="240" stroke="hsl(38 45% 40%)" strokeWidth="0.8" opacity="0.5" />
          <line x1="30" y1="280" x2="190" y2="280" stroke="hsl(38 45% 40%)" strokeWidth="0.5" opacity="0.3" />
          {/* Animated gold particles */}
          {Array.from({ length: 12 }).map((_, i) => (
            <circle
              key={`particle-${i}`}
              className="potm-particle"
              cx={20 + Math.random() * 180}
              cy={20 + Math.random() * 293}
              r={0.8 + Math.random() * 1.2}
              fill="hsl(38 55% 65%)"
              opacity="0"
              style={{
                animationDelay: `${i * 0.4}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              } as React.CSSProperties}
            />
          ))}
        </svg>

        {/* Holographic shimmer overlay */}
        <div className="potm-shimmer absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Content overlay */}
        <div className="absolute inset-0 flex flex-col" style={{ padding: "12px 16px" }}>
          {/* Top row: Rating + Position */}
          <div className="flex items-start justify-between mb-1">
            <div className="flex flex-col items-center">
              <span className="font-display text-[28px] font-bold leading-none" style={{ color: "hsl(38 50% 60%)" }}>
                ★
              </span>
              <span className="font-display text-[9px] font-bold uppercase tracking-wider mt-0.5" style={{ color: "hsl(38 45% 50%)" }}>
                POTM
              </span>
            </div>
            <span className="font-display text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ color: "hsl(38 45% 55%)", background: "hsla(38, 45%, 40%, 0.2)", border: "1px solid hsla(38, 45%, 40%, 0.3)" }}>
              {ageGroup}
            </span>
          </div>

          {/* Player photo – large, no background, floating over card */}
          <div className="flex-1 flex items-center justify-center relative" style={{ marginTop: "-8px", marginBottom: "0px", minHeight: "150px" }}>
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={playerName}
                className="max-h-[160px] w-auto object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-700 relative z-10"
              />
            ) : (
              <div className="w-[120px] h-[120px] rounded-full flex items-center justify-center" style={{ background: "hsl(0 0% 12%)", border: "2px solid hsl(38 45% 40%)" }}>
                <span className="font-display text-4xl font-bold" style={{ color: "hsla(38, 45%, 50%, 0.3)" }}>
                  {shirtNumber || "?"}
                </span>
              </div>
            )}
          </div>

          {/* Player name */}
          <div className="text-center mb-1">
            {shirtNumber && (
              <span className="font-display text-[10px] block" style={{ color: "hsl(38 45% 45%)" }}>
                #{shirtNumber}
              </span>
            )}
            <h3 className="font-display text-lg font-bold uppercase tracking-wide leading-tight text-foreground">
              {playerName}
            </h3>
          </div>

          {/* Stats row – mimicking FIFA stat bar */}
          <div className="grid grid-cols-4 gap-0 text-center mb-1.5" style={{ marginTop: "2px" }}>
            {[
              { label: "TEAM", value: teamName.length > 8 ? teamName.substring(0, 8) : teamName },
              { label: "VS", value: matchDescription?.replace(/^vs\s*/i, "").substring(0, 8) || "—" },
              { label: "DATE", value: formattedDate },
              { label: "AWD", value: "⭐" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-display text-[8px] font-bold uppercase tracking-widest" style={{ color: "hsl(38 45% 45%)" }}>
                  {stat.label}
                </p>
                <p className="font-body text-[9px] font-medium text-foreground/80 mt-0.5 truncate px-0.5">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Bottom row: reason + trophy icon */}
          <div className="flex items-center justify-center gap-1 mt-auto">
            {reason ? (
              <p className="font-body text-[8px] text-foreground/50 italic text-center leading-tight line-clamp-2 px-1">
                "{reason}"
              </p>
            ) : (
              <div className="flex items-center gap-1">
                <Trophy className="h-3 w-3" style={{ color: "hsl(38 45% 50%)" }} />
                <span className="font-display text-[9px] uppercase tracking-wider" style={{ color: "hsl(38 45% 50%)" }}>
                  Player of the Match
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
