import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Star, Trophy, Users, Calendar, Sparkles } from "lucide-react";
import demoPhoto from "@/assets/potm-demo-photo.jpeg";

const DEMO_PLAYER = {
  playerName: "James Wilson",
  teamName: "Hawks United",
  ageGroup: "U12",
  matchDescription: "City FC",
  shirtNumber: 10,
  reason: "Outstanding performance with two goals and an assist",
  awardDate: "2026-03-22",
};

function BaseCardContent({ playerName, teamName, ageGroup, matchDescription, shirtNumber, reason, awardDate }: typeof DEMO_PLAYER) {
  const formattedDate = new Date(awardDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  return (
    <>
      <div className="relative h-[260px] overflow-hidden bg-gradient-to-b from-secondary to-card">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center_70%,_hsla(38,45%,47%,0.15)_0%,_transparent_70%)]" />
        <div className="absolute top-3 left-3 z-20">
          <span className="font-display text-[10px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 backdrop-blur-sm">{ageGroup}</span>
        </div>
        <div className="absolute top-3 right-3 z-20">
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 backdrop-blur-sm flex items-center justify-center">
            <Star className="h-3.5 w-3.5 text-primary fill-primary" />
          </div>
        </div>
        <img src={demoPhoto} alt={playerName} className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-card via-card/80 to-transparent" />
        <div className="absolute bottom-12 right-3 z-20">
          <span className="font-display text-4xl font-bold text-primary/15">{shirtNumber}</span>
        </div>
      </div>
      <div className="relative px-4 pb-4 -mt-6">
        <h3 className="font-display text-lg font-bold uppercase tracking-wide text-foreground leading-tight">{playerName}</h3>
        <div className="mt-2 space-y-1">
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
        {reason && (
          <div className="mt-2.5 pt-2.5 border-t border-border">
            <p className="text-xs font-body text-muted-foreground italic leading-relaxed line-clamp-2">"{reason}"</p>
          </div>
        )}
        <div className="mt-2.5 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
          <Star className="h-3 w-3 text-primary fill-primary" />
          <span className="font-display text-[10px] font-bold uppercase tracking-[0.15em] text-primary">Player of the Match</span>
        </div>
      </div>
    </>
  );
}

/* ── Option 1: Holographic Shimmer ── */
function HolographicCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [shimmerPos, setShimmerPos] = useState({ x: 50, y: 50 });

  return (
    <motion.div whileHover={{ scale: 1.05, y: -8 }} whileTap={{ scale: 0.98 }}>
      <div
        ref={cardRef}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setShimmerPos({
            x: ((e.clientX - rect.left) / rect.width) * 100,
            y: ((e.clientY - rect.top) / rect.height) * 100,
          });
        }}
        className="relative w-[260px] rounded-2xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-primary/20 group"
        style={{ transition: "box-shadow 0.3s ease" }}
      >
        <div className="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-br from-primary via-primary/30 to-primary/60">
          <div className="w-full h-full rounded-2xl bg-card" />
        </div>
        <div className="relative z-10">
          <BaseCardContent {...DEMO_PLAYER} />
        </div>
        {/* Holographic shimmer overlay */}
        <div
          className="absolute inset-0 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
          style={{
            background: `radial-gradient(circle at ${shimmerPos.x}% ${shimmerPos.y}%, hsla(38,70%,65%,0.3) 0%, hsla(280,60%,60%,0.1) 25%, hsla(180,60%,50%,0.1) 50%, transparent 70%)`,
            mixBlendMode: "screen",
          }}
        />
        {/* Rainbow border on hover */}
        <div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `conic-gradient(from 0deg, hsl(var(--primary)), hsl(280,60%,60%), hsl(180,60%,50%), hsl(var(--primary)))`,
            padding: "1.5px",
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
        />
      </div>
    </motion.div>
  );
}

/* ── Option 2: Floating Particles ── */
function ParticleCard() {
  return (
    <motion.div whileHover={{ scale: 1.05, y: -8 }} whileTap={{ scale: 0.98 }} className="group">
      <div className="relative w-[260px] rounded-2xl overflow-visible cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-primary/20" style={{ transition: "box-shadow 0.3s ease" }}>
        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none z-30 overflow-visible">
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-primary opacity-0 group-hover:opacity-70"
              style={{
                left: `${15 + Math.random() * 70}%`,
                bottom: `${Math.random() * 30}%`,
              }}
              animate={{
                y: [0, -60 - Math.random() * 40],
                x: [0, (Math.random() - 0.5) * 30],
                opacity: [0, 0.8, 0],
                scale: [0.5, 1.2, 0.3],
              }}
              transition={{
                duration: 2 + Math.random(),
                repeat: Infinity,
                delay: i * 0.25,
                ease: "easeOut",
              }}
            />
          ))}
          {Array.from({ length: 4 }).map((_, i) => (
            <motion.div
              key={`star-${i}`}
              className="absolute opacity-0 group-hover:opacity-60"
              style={{
                left: `${10 + Math.random() * 80}%`,
                bottom: `${10 + Math.random() * 40}%`,
              }}
              animate={{
                y: [0, -50 - Math.random() * 30],
                opacity: [0, 0.7, 0],
                rotate: [0, 180],
                scale: [0.3, 1, 0.2],
              }}
              transition={{
                duration: 2.5 + Math.random(),
                repeat: Infinity,
                delay: 0.5 + i * 0.3,
                ease: "easeOut",
              }}
            >
              <Sparkles className="h-3 w-3 text-primary" />
            </motion.div>
          ))}
        </div>

        <div className="rounded-2xl overflow-hidden">
          <div className="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-br from-primary via-primary/30 to-primary/60">
            <div className="w-full h-full rounded-2xl bg-card" />
          </div>
          <div className="relative z-10">
            <BaseCardContent {...DEMO_PLAYER} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Option 3: Card Flip ── */
function FlipCard() {
  const [flipped, setFlipped] = useState(false);
  return (
    <motion.div whileHover={{ y: -8 }} whileTap={{ scale: 0.98 }} className="perspective-[1000px]">
      <motion.div
        className="relative w-[260px] h-[440px] cursor-pointer"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        style={{ transformStyle: "preserve-3d" }}
        onClick={() => setFlipped(!flipped)}
      >
        {/* Front */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-lg" style={{ backfaceVisibility: "hidden" }}>
          <div className="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-br from-primary via-primary/30 to-primary/60">
            <div className="w-full h-full rounded-2xl bg-card" />
          </div>
          <div className="relative z-10">
            <BaseCardContent {...DEMO_PLAYER} />
          </div>
          <div className="absolute bottom-2 left-0 right-0 text-center z-20">
            <span className="text-[10px] text-muted-foreground font-body animate-pulse">Tap to flip →</span>
          </div>
        </div>
        {/* Back */}
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
            <h3 className="font-display text-xl font-bold uppercase text-foreground mb-1">{DEMO_PLAYER.playerName}</h3>
            <p className="text-xs font-body text-primary mb-4">#{DEMO_PLAYER.shirtNumber} · {DEMO_PLAYER.teamName}</p>
            <div className="w-full space-y-3 mb-4">
              <div className="flex justify-between text-xs font-body">
                <span className="text-muted-foreground">Match</span>
                <span className="text-foreground">vs {DEMO_PLAYER.matchDescription}</span>
              </div>
              <div className="w-full h-px bg-border" />
              <div className="flex justify-between text-xs font-body">
                <span className="text-muted-foreground">Age Group</span>
                <span className="text-foreground">{DEMO_PLAYER.ageGroup}</span>
              </div>
              <div className="w-full h-px bg-border" />
              <div className="flex justify-between text-xs font-body">
                <span className="text-muted-foreground">Date</span>
                <span className="text-foreground">22 Mar 2026</span>
              </div>
            </div>
            <p className="text-xs font-body text-muted-foreground italic leading-relaxed">"{DEMO_PLAYER.reason}"</p>
            <span className="text-[10px] text-muted-foreground font-body mt-4 animate-pulse">← Tap to flip back</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Option 4: Glowing Border Pulse ── */
function GlowCard() {
  return (
    <motion.div whileHover={{ scale: 1.05, y: -8 }} whileTap={{ scale: 0.98 }} className="group">
      <div className="relative w-[260px] rounded-2xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-primary/30" style={{ transition: "box-shadow 0.3s ease" }}>
        {/* Pulsing glow border */}
        <div className="absolute -inset-[2px] rounded-2xl opacity-40 group-hover:opacity-100 transition-opacity duration-500 animate-[glow-pulse_2s_ease-in-out_infinite]"
          style={{
            background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--gold-light)), hsl(var(--primary)))",
            backgroundSize: "200% 200%",
            animation: "glow-shift 3s ease-in-out infinite, glow-pulse 2s ease-in-out infinite",
            filter: "blur(4px)",
          }}
        />
        <div className="absolute -inset-[1px] rounded-2xl"
          style={{
            background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--gold-light)), hsl(var(--primary)))",
            backgroundSize: "200% 200%",
            animation: "glow-shift 3s ease-in-out infinite",
          }}
        />
        <div className="relative rounded-2xl overflow-hidden bg-card m-[1px]">
          <div className="relative z-10">
            <BaseCardContent {...DEMO_PLAYER} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function POTMDemoPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="font-display text-xs font-bold uppercase tracking-[0.2em] text-primary">Animation Preview</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold font-display leading-tight">
              <span className="text-gold-gradient">Choose Your</span>{" "}
              <span className="text-foreground">Card Style</span>
            </h1>
            <p className="text-muted-foreground mt-4 max-w-lg mx-auto text-sm font-body">
              Hover over each card to see the animation. Pick your favourite!
            </p>
          </motion.div>

          <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 justify-items-center">
            {/* Option 1 */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col items-center gap-4">
              <HolographicCard />
              <div className="text-center">
                <h3 className="font-display text-sm font-bold uppercase text-foreground">1. Holographic Shimmer</h3>
                <p className="text-xs text-muted-foreground font-body mt-1">Rainbow foil effect follows your cursor</p>
              </div>
            </motion.div>

            {/* Option 2 */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex flex-col items-center gap-4">
              <ParticleCard />
              <div className="text-center">
                <h3 className="font-display text-sm font-bold uppercase text-foreground">2. Floating Particles</h3>
                <p className="text-xs text-muted-foreground font-body mt-1">Gold sparkles float upward on hover</p>
              </div>
            </motion.div>

            {/* Option 3 */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col items-center gap-4">
              <FlipCard />
              <div className="text-center">
                <h3 className="font-display text-sm font-bold uppercase text-foreground">3. Card Flip</h3>
                <p className="text-xs text-muted-foreground font-body mt-1">Click to reveal stats on the back</p>
              </div>
            </motion.div>

            {/* Option 4 */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex flex-col items-center gap-4">
              <GlowCard />
              <div className="text-center">
                <h3 className="font-display text-sm font-bold uppercase text-foreground">4. Glowing Border</h3>
                <p className="text-xs text-muted-foreground font-body mt-1">Pulsing gold glow like a rare card</p>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />

      <style>{`
        @keyframes glow-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
