import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, X, Sparkles, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RaffleTicket {
  id: string;
  ticket_number: number;
  buyer_name: string;
  buyer_email: string;
}

interface RaffleDrawProps {
  raffleName: string;
  tickets: RaffleTicket[];
  onComplete: (winner: RaffleTicket) => void;
  onClose: () => void;
  /** "admin" = interactive draw, "viewer" = auto-plays with predetermined winner */
  mode?: "admin" | "viewer";
  /** Pre-determined winner for viewer/replay mode */
  presetWinner?: RaffleTicket | null;
  /** Auto-start the draw (for live viewers) */
  autoStart?: boolean;
}

// Confetti particle
const Confetti = ({ delay }: { delay: number }) => {
  const colors = [
    "hsl(var(--primary))",
    "hsl(45 93% 58%)",
    "hsl(0 84% 60%)",
    "hsl(142 71% 45%)",
    "hsl(262 83% 58%)",
    "hsl(199 89% 48%)",
  ];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const left = Math.random() * 100;
  const size = 6 + Math.random() * 8;
  const rotation = Math.random() * 720 - 360;
  const duration = 2.5 + Math.random() * 2;

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: `${left}%`,
        top: "-2%",
        width: size,
        height: size * (0.4 + Math.random() * 0.6),
        backgroundColor: color,
        borderRadius: Math.random() > 0.5 ? "50%" : "2px",
      }}
      initial={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
      animate={{
        y: "110vh",
        opacity: [1, 1, 0.8, 0],
        rotate: rotation,
        scale: [1, 1.2, 0.8],
        x: (Math.random() - 0.5) * 200,
      }}
      transition={{
        duration,
        delay,
        ease: "easeIn",
      }}
    />
  );
};

// Single tumbler column for one digit
const TumblerColumn = ({
  targetDigit,
  isRevealed,
  columnIndex,
}: {
  targetDigit: string;
  isRevealed: boolean;
  columnIndex: number;
}) => {
  const [displayDigit, setDisplayDigit] = useState("0");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setDisplayDigit(String(Math.floor(Math.random() * 10)));
    }, 60);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (isRevealed) {
      const timeout = setTimeout(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setDisplayDigit(targetDigit);
      }, columnIndex * 400 + 200);
      return () => clearTimeout(timeout);
    }
  }, [isRevealed, targetDigit, columnIndex]);

  return (
    <motion.div
      className={cn(
        "w-14 h-20 sm:w-20 sm:h-28 rounded-xl flex items-center justify-center text-4xl sm:text-6xl font-display font-black border-2 transition-all duration-500",
        isRevealed
          ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30"
          : "bg-card text-foreground border-border"
      )}
      animate={
        !isRevealed
          ? { y: [0, -3, 0, 3, 0] }
          : {}
      }
      transition={
        !isRevealed
          ? { duration: 0.15, repeat: Infinity, repeatType: "loop" }
          : {}
      }
    >
      <motion.span
        key={displayDigit + (isRevealed ? "-final" : "")}
        initial={isRevealed ? { scale: 2, opacity: 0 } : { opacity: 0.6 }}
        animate={isRevealed ? { scale: 1, opacity: 1 } : { opacity: 1 }}
        transition={isRevealed ? { type: "spring", stiffness: 400, damping: 15 } : { duration: 0.05 }}
      >
        {displayDigit}
      </motion.span>
    </motion.div>
  );
};

// Participant name scroller
const NameScroller = ({
  names,
  winnerName,
  isRevealed,
}: {
  names: string[];
  winnerName: string;
  isRevealed: boolean;
}) => {
  const [currentName, setCurrentName] = useState(names[0] || "");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (names.length === 0) return;
    intervalRef.current = setInterval(() => {
      setCurrentName(names[Math.floor(Math.random() * names.length)]);
    }, 80);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [names]);

  useEffect(() => {
    if (isRevealed) {
      const slowDown = setTimeout(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        let count = 0;
        const slow = setInterval(() => {
          count++;
          if (count > 6) {
            clearInterval(slow);
            setCurrentName(winnerName);
          } else {
            setCurrentName(names[Math.floor(Math.random() * names.length)]);
          }
        }, 200 + count * 80);
        return () => clearInterval(slow);
      }, 800);
      return () => clearTimeout(slowDown);
    }
  }, [isRevealed, winnerName, names]);

  return (
    <div className="h-12 flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="popLayout">
        <motion.p
          key={currentName + (isRevealed && currentName === winnerName ? "-winner" : "")}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.08 }}
          className={cn(
            "text-xl sm:text-2xl font-display font-bold text-center",
            isRevealed && currentName === winnerName
              ? "text-primary"
              : "text-muted-foreground"
          )}
        >
          {currentName}
        </motion.p>
      </AnimatePresence>
    </div>
  );
};

const RaffleDraw = ({
  raffleName,
  tickets,
  onComplete,
  onClose,
  mode = "admin",
  presetWinner = null,
  autoStart = false,
}: RaffleDrawProps) => {
  const [phase, setPhase] = useState<"intro" | "spinning" | "revealing" | "winner">("intro");
  const [winner, setWinner] = useState<RaffleTicket | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const participantNames = [...new Set(tickets.map(t => t.buyer_name))];
  const ticketDigits = winner
    ? String(winner.ticket_number).padStart(3, "0").split("")
    : ["0", "0", "0"];

  const startDraw = useCallback(() => {
    let chosen: RaffleTicket;
    if (mode === "viewer" && presetWinner) {
      chosen = presetWinner;
    } else {
      const winnerIndex = Math.floor(Math.random() * tickets.length);
      chosen = tickets[winnerIndex];
    }
    setWinner(chosen);
    setPhase("spinning");

    setTimeout(() => setPhase("revealing"), 3000);

    const digits = String(chosen.ticket_number).padStart(3, "0").split("");
    setTimeout(() => {
      setPhase("winner");
      setShowConfetti(true);
    }, 3000 + digits.length * 400 + 1500);
  }, [tickets, mode, presetWinner]);

  // Auto-start for live viewers and replays
  useEffect(() => {
    if (autoStart && phase === "intro") {
      const timeout = setTimeout(() => startDraw(), 1500);
      return () => clearTimeout(timeout);
    }
  }, [autoStart, phase, startDraw]);

  useEffect(() => {
    if (phase === "winner" && winner) {
      const timeout = setTimeout(() => {
        onComplete(winner);
      }, 4000);
      return () => clearTimeout(timeout);
    }
  }, [phase, winner, onComplete]);

  const confettiPieces = showConfetti
    ? Array.from({ length: 80 }, (_, i) => i)
    : [];

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/95 backdrop-blur-md" />

      {/* Confetti layer */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {confettiPieces.map((i) => (
          <Confetti key={i} delay={Math.random() * 1.5} />
        ))}
      </div>

      {/* Close button */}
      {(phase === "winner" || mode === "viewer") && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-6 right-6 z-10 text-muted-foreground hover:text-foreground"
          onClick={onClose}
        >
          <X className="h-6 w-6" />
        </Button>
      )}

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-2xl w-full">
        {/* Raffle name */}
        <motion.p
          className="text-sm font-display tracking-[0.3em] text-muted-foreground mb-2 uppercase"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          {raffleName}
        </motion.p>

        {/* Viewer badge */}
        {mode === "viewer" && phase === "intro" && !autoStart && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4"
          >
            <span className="inline-flex items-center gap-1.5 bg-primary/20 text-primary text-xs font-display tracking-wider px-3 py-1 rounded-full">
              <Play className="h-3 w-3" /> REPLAY
            </span>
          </motion.div>
        )}

        {/* Phase: Intro */}
        <AnimatePresence mode="wait">
          {phase === "intro" && (
            <motion.div
              key="intro"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.1, opacity: 0 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                >
                  <Trophy className="h-20 w-20 text-primary mx-auto" />
                </motion.div>
                <h2 className="font-display text-4xl sm:text-5xl font-black text-foreground">
                  {autoStart ? "Draw Starting..." : "Ready to Draw?"}
                </h2>
                <p className="text-muted-foreground text-lg">
                  <span className="text-primary font-bold">{tickets.length}</span> tickets from{" "}
                  <span className="text-primary font-bold">{participantNames.length}</span> participants
                </p>
              </div>
              {!autoStart && (
                <Button
                  onClick={startDraw}
                  size="lg"
                  className="bg-gold-gradient text-primary-foreground font-display text-xl px-12 py-6 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow"
                >
                  <Sparkles className="h-5 w-5 mr-3" />
                  {mode === "viewer" ? "WATCH THE DRAW" : "DRAW THE WINNER"}
                </Button>
              )}
            </motion.div>
          )}

          {/* Phase: Spinning / Revealing */}
          {(phase === "spinning" || phase === "revealing") && (
            <motion.div
              key="spinning"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <h2 className="font-display text-3xl sm:text-4xl font-black text-foreground">
                {phase === "spinning" ? "Shuffling..." : "Revealing..."}
              </h2>

              {/* Ticket number tumbler */}
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                <span className="text-3xl sm:text-5xl font-display font-black text-muted-foreground/50">#</span>
                {ticketDigits.map((digit, i) => (
                  <TumblerColumn
                    key={i}
                    targetDigit={digit}
                    isRevealed={phase === "revealing"}
                    columnIndex={i}
                  />
                ))}
              </div>

              {/* Name scroller */}
              <div className="mt-6">
                <p className="text-xs font-display tracking-widest text-muted-foreground mb-2 uppercase">
                  Winner
                </p>
                <NameScroller
                  names={participantNames}
                  winnerName={winner?.buyer_name || ""}
                  isRevealed={phase === "revealing"}
                />
              </div>
            </motion.div>
          )}

          {/* Phase: Winner */}
          {phase === "winner" && winner && (
            <motion.div
              key="winner"
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 12 }}
              className="space-y-6"
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 border-4 border-primary shadow-lg shadow-primary/20">
                  <Trophy className="h-12 w-12 text-primary" />
                </div>
              </motion.div>

              <div>
                <motion.p
                  className="text-sm font-display tracking-[0.3em] text-muted-foreground uppercase mb-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  🎉 The Winner Is 🎉
                </motion.p>
                <motion.h2
                  className="font-display text-5xl sm:text-6xl font-black text-primary mb-2"
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                >
                  {winner.buyer_name}
                </motion.h2>
                <motion.p
                  className="text-2xl font-display text-muted-foreground"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  Ticket <span className="text-primary font-bold">#{winner.ticket_number}</span>
                </motion.p>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
              >
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="font-display mt-4"
                >
                  Close
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default RaffleDraw;
