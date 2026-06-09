import { useEffect, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import clubLogo from "@/assets/club-logo.jpg";

interface Bullet {
  title: string;
  desc: string;
}

/**
 * LionsDenGate
 * ------------
 * Full-screen "Enter The Lions' Den" splash shown when a new build is detected.
 * Tapping ENTER clears caches/SW and hard-reloads to the latest version.
 *
 * This component is rendered by UpdateGate when initial load detects a stale
 * fingerprint — it replaces the silent auto-refresh with a branded interaction.
 */

interface Props {
  onEnter: () => void;
}

export function LionsDenGate({ onEnter }: Props) {
  const [entering, setEntering] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // tiny delay so the entrance animation plays
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleEnter = () => {
    if (entering) return;
    setEntering(true);
    // brief delay so the user sees the button press / shimmer
    setTimeout(() => onEnter(), 450);
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center overflow-hidden bg-black"
      role="dialog"
      aria-label="Enter the Lions' Den"
    >
      {/* Radial gold glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, hsl(var(--primary) / 0.18) 0%, transparent 60%)",
        }}
      />

      {/* Subtle vertical floodlight bars */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute left-[15%] top-0 h-full w-px bg-gradient-to-b from-transparent via-primary/30 to-transparent" />
        <div className="absolute left-[85%] top-0 h-full w-px bg-gradient-to-b from-transparent via-primary/30 to-transparent" />
      </div>

      {/* Floating gold dust */}
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className="absolute block h-1 w-1 rounded-full bg-primary/70"
            style={{
              left: `${(i * 53) % 100}%`,
              top: `${(i * 37) % 100}%`,
              opacity: 0.4 + ((i % 5) / 10),
              animation: `lions-dust ${8 + (i % 6)}s ease-in-out ${i * 0.4}s infinite`,
              filter: "blur(0.5px)",
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div
        className={`relative z-10 flex flex-col items-center px-6 text-center transition-all duration-700 ${
          mounted && !entering ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        } ${entering ? "scale-105" : ""}`}
      >
        {/* Crest with pulsing glow */}
        <div className="relative mb-8">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              boxShadow: "0 0 80px 20px hsl(var(--primary) / 0.35)",
              animation: "lions-pulse 3s ease-in-out infinite",
            }}
          />
          <img
            src={clubLogo}
            alt="PAFC crest"
            className="relative h-28 w-28 rounded-full object-cover ring-2 ring-primary/50 sm:h-36 sm:w-36"
          />
        </div>

        {/* Eyebrow */}
        <div className="mb-3 text-[10px] font-display uppercase tracking-[0.4em] text-primary/80 sm:text-xs">
          Pendle Athletic FC · Est. 2020
        </div>

        {/* Headline */}
        <h1 className="font-display text-4xl font-black uppercase tracking-tight text-foreground sm:text-6xl">
          Welcome to
          <br />
          <span className="text-primary">The Lions' Den</span>
        </h1>

        <p className="mt-4 max-w-md text-sm text-muted-foreground sm:text-base">
          A new matchday version is ready. Tap below to enter the latest experience.
        </p>

        {/* Enter button */}
        <button
          onClick={handleEnter}
          disabled={entering}
          className="group relative mt-10 inline-flex items-center gap-3 overflow-hidden rounded-full bg-primary px-10 py-4 font-display text-base font-bold uppercase tracking-[0.3em] text-primary-foreground transition-all hover:scale-105 hover:shadow-[0_0_40px_hsl(var(--primary)/0.5)] disabled:opacity-70 sm:text-lg"
        >
          {/* Shimmer */}
          <span
            className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-1000 group-hover:translate-x-full"
            aria-hidden
          />
          <span className="relative">{entering ? "Entering…" : "Enter"}</span>
          <ArrowRight
            className={`relative h-5 w-5 transition-transform ${
              entering ? "translate-x-2" : "group-hover:translate-x-1"
            }`}
          />
        </button>

        <div className="mt-6 text-[10px] font-display uppercase tracking-[0.3em] text-muted-foreground/60">
          Loading the latest version
        </div>
      </div>

      <style>{`
        @keyframes lions-pulse {
          0%, 100% { box-shadow: 0 0 80px 20px hsl(var(--primary) / 0.25); }
          50% { box-shadow: 0 0 120px 40px hsl(var(--primary) / 0.45); }
        }
        @keyframes lions-dust {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          50% { transform: translateY(-30px) translateX(10px); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
