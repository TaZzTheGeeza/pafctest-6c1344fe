import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { X, Play, Pause, RotateCcw, ChevronRight, ChevronLeft, SkipForward } from "lucide-react";

type Color = "attack" | "defence" | "neutral";
interface Token {
  id: string;
  kind: "home" | "away" | "ball";
  x: number;
  y: number;
  label?: string;
}
interface Stroke {
  id: string;
  tool: "draw" | "arrow" | "zone";
  color: Color;
  points: { x: number; y: number }[];
}
interface BoardData {
  tokens: Token[];
  strokes: Stroke[];
  half: "full" | "attack" | "defence";
}

const colorMap: Record<Color, string> = {
  attack: "#fbbf24",
  defence: "#ef4444",
  neutral: "#f8fafc",
};

export default function TacticsRevealPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [name, setName] = useState<string>("");
  const [board, setBoard] = useState<BoardData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [step, setStep] = useState<number>(0); // 0 = tokens only, then each stroke reveals one
  const [autoPlay, setAutoPlay] = useState(false);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from("tactics_boards" as any)
        .select("name, board_data")
        .eq("id", id)
        .maybeSingle();
      if (error || !data) { setLoadError("Board not found"); return; }
      setName((data as any).name || "Tactics");
      const bd = (data as any).board_data as BoardData;
      setBoard({ tokens: bd?.tokens ?? [], strokes: bd?.strokes ?? [], half: bd?.half ?? "full" });
    })();
  }, [id]);

  const totalSteps = useMemo(() => (board ? board.strokes.length : 0), [board]);
  const complete = board ? step >= totalSteps : false;

  useEffect(() => {
    if (!autoPlay || !board) return;
    if (step >= totalSteps) { setAutoPlay(false); return; }
    const t = setTimeout(() => setStep((s) => s + 1), 1500);
    return () => clearTimeout(t);
  }, [autoPlay, step, totalSteps, board]);

  if (!board) {
    return (
      <div className="fixed inset-0 bg-black text-white flex flex-col items-center justify-center gap-3">
        <p className="text-sm text-white/60">{loadError ?? "Loading tactics…"}</p>
        {loadError && <Button size="sm" variant="secondary" onClick={() => navigate(-1)}>Back</Button>}
      </div>
    );
  }

  const visibleStrokes = board.strokes.slice(0, step);

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-primary">Tactics Reveal</p>
          <p className="text-sm font-display truncate max-w-[60vw]">{name}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/60 tabular-nums">
            {Math.min(step, totalSteps)}/{totalSteps}
          </span>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            title="Previous"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {!complete ? (
            <>
              <Button size="sm" variant="secondary" onClick={() => setAutoPlay((a) => !a)}>
                {autoPlay ? <><Pause className="h-4 w-4 mr-1" />Pause</> : <><Play className="h-4 w-4 mr-1" />Auto</>}
              </Button>
              <Button size="sm" onClick={() => setStep((s) => Math.min(totalSteps, s + 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setStep(totalSteps)} title="Show all">
                <SkipForward className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button size="icon" variant="ghost" onClick={() => { setStep(0); setAutoPlay(false); }} title="Restart">
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
          <Button size="icon" variant="ghost" onClick={() => navigate(-1)} title="Close">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Pitch */}
      <div className="flex-1 min-h-0 p-4 grid place-items-center">
        <div
          className="relative h-full aspect-[3/4] max-w-full"
          style={{
            background: "linear-gradient(180deg, #0d3d1a 0%, #0a2f14 100%)",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
            {/* Pitch markings */}
            <g stroke="rgba(255,255,255,0.5)" strokeWidth="0.3" fill="none">
              <rect x="2" y="2" width="96" height="96" />
              <line x1="2" y1="50" x2="98" y2="50" />
              <circle cx="50" cy="50" r="9" />
              <rect x="25" y="2" width="50" height="14" />
              <rect x="38" y="2" width="24" height="6" />
              <rect x="25" y="84" width="50" height="14" />
              <rect x="38" y="92" width="24" height="6" />
            </g>

            <defs>
              {(["attack", "defence", "neutral"] as Color[]).map((c) => (
                <marker key={c} id={`reveal-arrow-${c}`} markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
                  <polygon points="0 0, 4 2, 0 4" fill={colorMap[c]} />
                </marker>
              ))}
            </defs>

            {/* Strokes (revealed step by step) */}
            <AnimatePresence>
              {visibleStrokes.map((s) => {
                const stroke = colorMap[s.color];
                if (s.tool === "zone" && s.points.length >= 2) {
                  const [a, b] = s.points;
                  const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y);
                  const w = Math.abs(b.x - a.x), h = Math.abs(b.y - a.y);
                  return (
                    <motion.rect
                      key={s.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      x={x} y={y} width={w} height={h}
                      fill={stroke} fillOpacity={0.22} stroke={stroke} strokeWidth={0.4} strokeDasharray="1 0.6"
                    />
                  );
                }
                if (s.points.length < 2) return null;
                const d = s.points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
                return (
                  <motion.path
                    key={s.id}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.9, ease: "easeInOut" }}
                    d={d}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={0.9}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    markerEnd={s.tool === "arrow" ? `url(#reveal-arrow-${s.color})` : undefined}
                  />
                );
              })}
            </AnimatePresence>

            {/* Tokens (always shown) */}
            {board.tokens.map((t) => {
              const fill = t.kind === "home" ? "#fbbf24" : t.kind === "away" ? "#ef4444" : "#fff";
              const fg = t.kind === "ball" ? "#000" : "#0a0a0a";
              return (
                <motion.g
                  key={t.id}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 220, damping: 18 }}
                  transform={`translate(${t.x} ${t.y})`}
                >
                  <circle r={t.kind === "ball" ? 1.8 : 4.2} fill={fill} stroke="#000" strokeWidth={0.35} />
                  {t.label && (
                    <text
                      y={t.kind === "ball" ? 0.6 : 1.4}
                      textAnchor="middle"
                      fontSize={t.kind === "ball" ? 1.6 : 3.6}
                      fontWeight={800}
                      fill={fg}
                    >
                      {t.label}
                    </text>
                  )}
                </motion.g>
              );
            })}
          </svg>

          {totalSteps === 0 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/50 bg-black/40 px-3 py-1 rounded-full">
              No arrows or zones on this board yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
