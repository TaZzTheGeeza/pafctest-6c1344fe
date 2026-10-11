import { useEffect, useState } from "react";
import { ArrowRight, Check, Ghost } from "lucide-react";
import clubLogo from "@/assets/club-logo.jpg";
import { useSeasonalTheme } from "@/hooks/useSeasonalTheme";
import { Bat } from "./SeasonalTheme";

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
 * fingerprint - it replaces the silent auto-refresh with a branded interaction.
 *
 * When the Halloween seasonal theme is active the gate gets a full spooky
 * treatment: drifting fog, corner cobwebs, floating bats and ghosts, falling
 * leaves and a flickering headline.
 */

interface Props {
  onEnter: () => void;
  title?: string;
  bullets?: Bullet[];
}

export function LionsDenGate({ onEnter, title, bullets }: Props) {
  const { theme } = useSeasonalTheme();
  const spooky = theme === "halloween";
  const items = bullets && bullets.length > 0 ? bullets : [];
  const headline = title?.trim();
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
      className={`fixed inset-0 z-[10000] flex items-center justify-center overflow-hidden bg-black ${
        spooky ? "lionsden-spooky" : ""
      }`}
      role="dialog"
      aria-label="Enter the Lions' Den"
    >
      {/* Radial glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: spooky
            ? "radial-gradient(ellipse at center, rgba(234,88,12,0.22) 0%, rgba(88,28,135,0.18) 35%, transparent 65%)"
            : "radial-gradient(ellipse at center, hsl(var(--primary) / 0.18) 0%, transparent 60%)",
        }}
      />

      {/* Subtle vertical floodlight bars */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute left-[15%] top-0 h-full w-px bg-gradient-to-b from-transparent via-primary/30 to-transparent" />
        <div className="absolute left-[85%] top-0 h-full w-px bg-gradient-to-b from-transparent via-primary/30 to-transparent" />
      </div>

      {/* Spooky: drifting fog */}
      {spooky && (
        <>
          <div className="ld-fog ld-fog-a" aria-hidden />
          <div className="ld-fog ld-fog-b" aria-hidden />

          {/* Spooky: corner cobwebs */}
          <div className="ld-web ld-web-l" aria-hidden>
            <svg viewBox="0 0 100 100"><path d="M0 0L100 100M0 0L100 40M0 0L40 100M0 25Q18 18 25 0M0 50Q36 36 50 0M0 75Q55 55 75 0M0 100Q72 72 100 0M12 30Q30 25 30 12M22 54Q52 46 54 22M32 78Q77 65 78 32" /></svg>
          </div>
          <div className="ld-web ld-web-r" aria-hidden>
            <svg viewBox="0 0 100 100"><path d="M0 0L100 100M0 0L100 40M0 0L40 100M0 25Q18 18 25 0M0 50Q36 36 50 0M0 75Q55 55 75 0M0 100Q72 72 100 0" /></svg>
          </div>

          {/* Spooky: floating bats and ghosts */}
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            {Array.from({ length: 8 }, (_, i) => (
              <div
                key={`ld-creep-${i}`}
                className={`ld-creep ld-creep-${i}`}
              >
                {i % 3 === 0 ? <Ghost /> : <Bat />}
              </div>
            ))}
          </div>

          {/* Spooky: falling leaves */}
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            {Array.from({ length: 18 }, (_, i) => (
              <span
                key={`ld-leaf-${i}`}
                className="ld-leaf"
                style={{
                  left: `${(i * 53 + 11) % 100}%`,
                  animationDelay: `${-(i * 2.3) % 14}s`,
                  animationDuration: `${10 + (i % 5) * 2}s`,
                  width: `${8 + (i % 4) * 3}px`,
                  height: `${12 + (i % 4) * 4}px`,
                }}
              />
            ))}
          </div>
        </>
      )}

      {/* Floating gold dust (normal theme only) */}
      {!spooky && (
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
      )}

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
              boxShadow: spooky
                ? "0 0 80px 20px rgba(234,88,12,0.35)"
                : "0 0 80px 20px hsl(var(--primary) / 0.35)",
              animation: spooky ? "lions-flicker 3.5s ease-in-out infinite" : "lions-pulse 3s ease-in-out infinite",
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
          Peterborough Athletic FC · Est. 2020
        </div>

        {/* Headline */}
        <h1
          className={`font-display text-4xl font-black uppercase tracking-tight text-foreground sm:text-6xl ${
            spooky ? "ld-headline" : ""
          }`}
        >
          {headline ? (
            headline.split(/\s+/).length > 1 ? (
              <>
                {headline.split(/\s+/).slice(0, -1).join(" ")}
                <br />
                <span className="text-primary">{headline.split(/\s+/).slice(-1)[0]}</span>
              </>
            ) : (
              <span className="text-primary">{headline}</span>
            )
          ) : (
            <>
              Welcome to
              <br />
              <span className="text-primary">The Lions' Den</span>
            </>
          )}
        </h1>

        <p className="mt-4 max-w-md text-sm text-muted-foreground sm:text-base">
          {items.length > 0 ? "Here's what's new inside the den." : spooky ? "Something stirs in the den this Halloween night. Tap below if you dare." : "A new matchday version is ready. Tap below to enter the latest experience."}
        </p>

        {items.length > 0 && (
          <ul className="mt-6 w-full max-w-md space-y-3 text-left">
            {items.map((h, i) => (
              <li
                key={h.title + i}
                className="flex gap-3"
              >
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20">
                  <Check className="h-3 w-3 text-primary" strokeWidth={3} />
                </div>
                <div className="min-w-0">
                  <div className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
                    {h.title}
                  </div>
                  <div className="text-xs text-muted-foreground">{h.desc}</div>
                </div>
              </li>
            ))}
          </ul>
        )}


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

        /* ---- Halloween gate ---- */
        @keyframes lions-flicker {
          0%, 100% { box-shadow: 0 0 80px 20px rgba(234,88,12,0.3); }
          42% { box-shadow: 0 0 110px 30px rgba(234,88,12,0.45); }
          45% { box-shadow: 0 0 40px 8px rgba(234,88,12,0.15); }
          47% { box-shadow: 0 0 110px 30px rgba(234,88,12,0.45); }
          78% { box-shadow: 0 0 90px 24px rgba(234,88,12,0.4); }
          80% { box-shadow: 0 0 50px 10px rgba(234,88,12,0.2); }
        }
        @keyframes ld-fog-drift {
          0%, 100% { transform: translateX(-6%) translateY(0); opacity: 0.5; }
          50% { transform: translateX(6%) translateY(-2%); opacity: 0.85; }
        }
        @keyframes ld-creep-sway {
          0%, 100% { transform: translateY(0) rotate(-8deg); }
          50% { transform: translateY(26px) rotate(8deg); }
        }
        @keyframes ld-leaf-fall {
          0% { transform: translate(0, -20px) rotate(0deg); opacity: 0; }
          8% { opacity: 0.75; }
          85% { opacity: 0.55; }
          100% { transform: translate(60px, 105vh) rotate(320deg); opacity: 0; }
        }
        @keyframes ld-text-flicker {
          0%, 100% { opacity: 1; text-shadow: 0 0 18px rgba(234,88,12,0.35); }
          41% { opacity: 1; text-shadow: 0 0 26px rgba(234,88,12,0.5); }
          43% { opacity: 0.65; text-shadow: none; }
          45% { opacity: 1; text-shadow: 0 0 26px rgba(234,88,12,0.5); }
          72% { opacity: 1; text-shadow: 0 0 20px rgba(234,88,12,0.4); }
          74% { opacity: 0.75; text-shadow: none; }
        }
        .lionsden-spooky .ld-headline { animation: ld-text-flicker 6s linear infinite; }
        .ld-fog {
          position: absolute; left: -20%; width: 140%; height: 60%; bottom: -5%;
          pointer-events: none; filter: blur(2px);
        }
        .ld-fog-a {
          background:
            radial-gradient(ellipse 40% 55% at 20% 80%, rgba(124,58,237,0.16), transparent 70%),
            radial-gradient(ellipse 35% 50% at 55% 85%, rgba(234,88,12,0.10), transparent 70%),
            radial-gradient(ellipse 30% 45% at 85% 80%, rgba(124,58,237,0.14), transparent 70%);
          animation: ld-fog-drift 14s ease-in-out infinite;
        }
        .ld-fog-b {
          background:
            radial-gradient(ellipse 38% 50% at 35% 90%, rgba(88,28,135,0.22), transparent 70%),
            radial-gradient(ellipse 32% 45% at 70% 88%, rgba(234,88,12,0.08), transparent 70%);
          animation: ld-fog-drift 18s ease-in-out -7s infinite reverse;
          bottom: 10%;
        }
        .ld-web { position: absolute; top: 0; width: 150px; height: 150px; color: rgba(216,180,254,0.35); pointer-events: none; }
        .ld-web svg { width: 100%; height: 100%; fill: none; stroke: currentColor; stroke-width: 0.6; }
        .ld-web-l { left: 0; }
        .ld-web-r { right: 0; transform: scaleX(-1); }
        .ld-creep {
          position: absolute; width: 44px; height: 44px; color: rgba(251,146,60,0.85);
          animation: ld-creep-sway 9s ease-in-out infinite;
        }
        .ld-creep svg { width: 100%; height: 100%; stroke-width: 1.3; }
        .ld-creep-0 { top: 24%; left: 5%; width: 46px; }
        .ld-creep-1 { top: 18%; right: 8%; width: 62px; color: rgba(216,180,254,0.8); animation-delay: -3s; }
        .ld-creep-2 { top: 48%; left: 3%; width: 34px; animation-delay: -5s; }
        .ld-creep-3 { top: 58%; right: 4%; width: 40px; animation-delay: -1.5s; color: rgba(216,180,254,0.7); }
        .ld-creep-4 { top: 38%; right: 2%; width: 46px; animation-delay: -6s; }
        .ld-creep-5 { top: 72%; left: 6%; width: 38px; animation-delay: -4s; color: rgba(216,180,254,0.65); }
        .ld-creep-6 { top: 14%; left: 14%; width: 30px; animation-delay: -2s; }
        .ld-creep-7 { top: 76%; right: 6%; width: 32px; animation-delay: -7s; }
        .ld-leaf {
          position: absolute; top: -20px;
          background: linear-gradient(135deg, #ea580c, #b45309);
          border-radius: 0 80% 0 80%;
          opacity: 0;
          animation: ld-leaf-fall linear infinite;
          pointer-events: none;
        }
        .lionsden-spooky .ld-leaf:nth-child(3n) { background: linear-gradient(135deg, #a855f7, #6b21a8); }
        .lionsden-spooky .ld-leaf:nth-child(4n) { background: linear-gradient(135deg, #fbbf24, #d97706); }
        @media (max-width: 640px) {
          .ld-web { width: 80px; height: 80px; }
          .ld-creep-0, .ld-creep-3 { width: 24px; }
          .ld-creep-1, .ld-creep-2, .ld-creep-4, .ld-creep-5 { width: 20px; }
          .ld-creep-6, .ld-creep-7 { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ld-fog, .ld-creep, .ld-leaf, .lionsden-spooky .ld-headline { animation: none; }
          .ld-leaf { display: none; }
        }
      `}</style>
    </div>
  );
}
