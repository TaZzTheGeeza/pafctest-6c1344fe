import { useEffect, useState } from "react";
import clubLogo from "@/assets/club-logo.jpg";

/**
 * KickOffGate
 * -----------
 * Option 2 — "Tap to Kick Off" splash with animated football & stadium vibe.
 * Shown when a new build is detected. Tapping KICK OFF clears caches and
 * hard-reloads to the latest version.
 */

interface Props {
  onEnter: () => void;
}

export function KickOffGate({ onEnter }: Props) {
  const [entering, setEntering] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleEnter = () => {
    if (entering) return;
    setEntering(true);
    setTimeout(() => onEnter(), 900);
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center overflow-hidden bg-black"
      role="dialog"
      aria-label="Kick off"
    >
      {/* Stadium floodlights — angled bars */}
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div
          className="absolute -top-1/4 left-1/4 h-[150%] w-32 rotate-12 bg-gradient-to-b from-primary/40 via-transparent to-transparent blur-2xl"
          style={{ animation: "kickoff-light 6s ease-in-out infinite" }}
        />
        <div
          className="absolute -top-1/4 right-1/4 h-[150%] w-32 -rotate-12 bg-gradient-to-b from-primary/40 via-transparent to-transparent blur-2xl"
          style={{ animation: "kickoff-light 6s ease-in-out 1.5s infinite" }}
        />
      </div>

      {/* Pitch grass stripes at bottom */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 opacity-25">
        <div
          className="h-full w-full"
          style={{
            background:
              "repeating-linear-gradient(90deg, hsl(120 30% 15%) 0 40px, hsl(120 40% 20%) 40px 80px)",
            maskImage: "linear-gradient(to top, black, transparent)",
            WebkitMaskImage: "linear-gradient(to top, black, transparent)",
          }}
        />
      </div>

      {/* Centre circle */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/15" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/20" />

      {/* Content */}
      <div
        className={`relative z-10 flex flex-col items-center px-6 text-center transition-all duration-700 ${
          mounted && !entering ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        {/* Crest with rolling football */}
        <div className="relative mb-8">
          <img
            src={clubLogo}
            alt="PAFC crest"
            className={`relative h-28 w-28 rounded-full object-cover ring-2 ring-primary/40 sm:h-32 sm:w-32 transition-transform duration-500 ${
              entering ? "scale-110" : ""
            }`}
          />
          {/* Football */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 text-5xl ${
              entering ? "kickoff-fly" : "kickoff-roll"
            }`}
            style={{
              left: entering ? undefined : "-80px",
            }}
          >
            ⚽
          </div>
        </div>

        {/* Eyebrow */}
        <div className="mb-3 text-[10px] font-display uppercase tracking-[0.4em] text-primary/80 sm:text-xs">
          Matchday · Pendle Athletic FC
        </div>

        {/* Headline */}
        <h1 className="font-display text-4xl font-black uppercase tracking-tight text-foreground sm:text-6xl">
          Ready to
          <br />
          <span className="text-primary">Kick Off?</span>
        </h1>

        <p className="mt-4 max-w-md text-sm text-muted-foreground sm:text-base">
          The whistle's about to blow on the latest version. Step onto the pitch.
        </p>

        {/* Kick Off button */}
        <button
          onClick={handleEnter}
          disabled={entering}
          className="group relative mt-10 inline-flex items-center gap-3 overflow-hidden rounded-full bg-primary px-12 py-4 font-display text-base font-bold uppercase tracking-[0.3em] text-primary-foreground transition-all hover:scale-105 hover:shadow-[0_0_50px_hsl(var(--primary)/0.6)] disabled:opacity-80 sm:text-lg"
        >
          <span
            className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-1000 group-hover:translate-x-full"
            aria-hidden
          />
          <span className="relative text-xl">⚽</span>
          <span className="relative">{entering ? "Kicking off…" : "Kick Off"}</span>
        </button>

        <div className="mt-6 text-[10px] font-display uppercase tracking-[0.3em] text-muted-foreground/60">
          90 minutes · Updated squad sheet loading
        </div>
      </div>

      <style>{`
        @keyframes kickoff-light {
          0%, 100% { opacity: 0.3; transform: translateY(0) rotate(12deg); }
          50% { opacity: 0.6; transform: translateY(-20px) rotate(15deg); }
        }
        @keyframes kickoff-roll-kf {
          0% { transform: translate(-80px, -50%) rotate(0deg); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translate(80px, -50%) rotate(720deg); opacity: 0; }
        }
        @keyframes kickoff-fly-kf {
          0% { transform: translate(0, -50%) rotate(0deg) scale(1); opacity: 1; }
          100% { transform: translate(400px, -250%) rotate(900deg) scale(0.4); opacity: 0; }
        }
        .kickoff-roll { animation: kickoff-roll-kf 4s ease-in-out infinite; }
        .kickoff-fly { animation: kickoff-fly-kf 0.9s cubic-bezier(0.22, 0.61, 0.36, 1) forwards; left: 50%; }
      `}</style>
    </div>
  );
}
