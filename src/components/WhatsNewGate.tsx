import { useEffect, useState } from "react";
import { Sparkles, Check } from "lucide-react";

/**
 * WhatsNewGate
 * ------------
 * Option 3 — Centered "What's New" changelog card. Shown when a new build
 * is detected. Tapping Continue clears caches and hard-reloads.
 */

interface Bullet {
  title: string;
  desc: string;
}

interface Props {
  onEnter: () => void;
  title?: string;
  bullets?: Bullet[];
}

const DEFAULT_BULLETS: Bullet[] = [
  { title: "World Cup 2026 Sweepstake", desc: "Pick a number, get a team — live now on the homepage." },
  { title: "Tournament Weekend Ready", desc: "Fixtures, groups and live updates locked in for Saturday." },
];

export function WhatsNewGate({ onEnter }: Props) {
  const [entering, setEntering] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleEnter = () => {
    if (entering) return;
    setEntering(true);
    setTimeout(() => onEnter(), 350);
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center overflow-y-auto bg-black/85 backdrop-blur-md p-4"
      role="dialog"
      aria-label="What's new"
    >
      <div
        className={`relative w-full max-w-md rounded-2xl border border-primary/20 bg-card shadow-[0_0_80px_hsl(var(--primary)/0.15)] transition-all duration-500 ${
          mounted && !entering ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95"
        }`}
      >
        {/* Gold accent bar */}
        <div className="h-1 w-full rounded-t-2xl bg-gradient-to-r from-transparent via-primary to-transparent" />

        <div className="p-7">
          {/* Eyebrow */}
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="text-[10px] font-display uppercase tracking-[0.3em] text-primary/80">
                Pendle Athletic FC
              </div>
              <div className="text-[10px] font-display uppercase tracking-[0.2em] text-muted-foreground">
                Latest Update · Matchday
              </div>
            </div>
          </div>

          {/* Headline */}
          <h2 className="mb-2 font-display text-3xl font-black uppercase tracking-tight text-foreground sm:text-4xl">
            What's <span className="text-primary">New</span>
          </h2>
          <p className="mb-6 text-sm text-muted-foreground">
            A fresh version of PAFC just landed. Here's what's waiting for you.
          </p>

          {/* Highlights */}
          <ul className="mb-7 space-y-4">
            {HIGHLIGHTS.map((h, i) => (
              <li
                key={h.title}
                className={`flex gap-3 transition-all duration-500 ${
                  mounted ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
                }`}
                style={{ transitionDelay: `${150 + i * 100}ms` }}
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

          {/* Continue button */}
          <button
            onClick={handleEnter}
            disabled={entering}
            className="group relative w-full overflow-hidden rounded-full bg-primary py-3.5 font-display text-sm font-bold uppercase tracking-[0.3em] text-primary-foreground transition-all hover:shadow-[0_0_40px_hsl(var(--primary)/0.5)] disabled:opacity-70"
          >
            <span
              className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-1000 group-hover:translate-x-full"
              aria-hidden
            />
            <span className="relative">{entering ? "Loading…" : "Got it · Continue"}</span>
          </button>

          <p className="mt-3 text-center text-[10px] font-display uppercase tracking-[0.2em] text-muted-foreground/60">
            Updating to the latest version
          </p>
        </div>
      </div>
    </div>
  );
}
