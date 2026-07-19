import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { X, Play, RotateCcw, ChevronRight } from "lucide-react";
import { findFormation, type FormationFormat } from "@/lib/formations";
import type { PositionEntry } from "@/components/coach/FormationBuilder";

const REVEAL_PITCH_WIDTH = 75;
const REVEAL_TOKEN_RADIUS = 7.2;
const REVEAL_TOKEN_PADDING = 0.8;
const REVEAL_SAFE_X = ((REVEAL_TOKEN_RADIUS + REVEAL_TOKEN_PADDING) / REVEAL_PITCH_WIDTH) * 100;
const REVEAL_SAFE_Y = REVEAL_TOKEN_RADIUS + REVEAL_TOKEN_PADDING;
const clampRevealX = (value: number) => Math.min(100 - REVEAL_SAFE_X, Math.max(REVEAL_SAFE_X, value));
const clampRevealY = (value: number) => Math.min(100 - REVEAL_SAFE_Y, Math.max(REVEAL_SAFE_Y, value));
const revealSvgX = (value: number) => (value / 100) * REVEAL_PITCH_WIDTH;

interface Selection {
  id: string;
  team_slug: string;
  opponent: string;
  fixture_date: string;
  formation: string | null;
  formation_format: FormationFormat | null;
  positions: PositionEntry[];
  captain_id: string | null;
  vice_captain_id: string | null;
  opposition_formation: string | null;
  notes: string | null;
}

interface RosterPlayer {
  id: string;
  first_name: string;
  shirt_number: number | null;
}

export default function LineupRevealPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selection, setSelection] = useState<Selection | null>(null);
  const [roster, setRoster] = useState<RosterPlayer[]>([]);
  const [customFormation, setCustomFormation] = useState<{ name: string; slots: any[] } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [revealIndex, setRevealIndex] = useState<number>(-1); // -1 = not started
  const [autoPlay, setAutoPlay] = useState(false);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from("team_selections").select("*").eq("id", id).maybeSingle();
      if (error || !data) { setLoadError("Lineup not found"); return; }
      setSelection(data as any);
      const allPositions = ((data as any).positions ?? []) as PositionEntry[];
      const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const realIds = allPositions.map((p) => p.player_id).filter((pid) => UUID_RE.test(pid));
      const guestRoster: RosterPlayer[] = allPositions
        .filter((p) => !UUID_RE.test(p.player_id))
        .map((p) => ({ id: p.player_id, first_name: (p as any).guest_name || "Guest", shirt_number: null }));
      if (realIds.length > 0) {
        const { data: players } = await supabase
          .from("player_stats").select("id, first_name, shirt_number").in("id", realIds);
        setRoster([...(players as any ?? []), ...guestRoster]);
      } else {
        setRoster(guestRoster);
      }

      // Resolve custom formation reference (custom:UUID)
      const formationRef: string = (data as any).formation ?? "";
      if (formationRef.startsWith("custom:")) {
        const customId = formationRef.slice("custom:".length);
        const { data: custom } = await supabase
          .from("custom_formations")
          .select("name, slots")
          .eq("id", customId)
          .maybeSingle();
        if (custom?.slots) {
          setCustomFormation({ name: custom.name || "Custom", slots: custom.slots as any[] });
        } else {
          setLoadError("Custom formation not found");
        }
      }
    })();
  }, [id]);

  const formation = useMemo(() => {
    if (!selection) return undefined;
    if (customFormation) {
      return { name: customFormation.name, slots: customFormation.slots } as any;
    }
    if (!selection.formation || !selection.formation_format) return undefined;
    return findFormation(selection.formation, selection.formation_format);
  }, [selection, customFormation]);

  const orderedStarters = useMemo(() => {
    if (!selection || !formation) return [];
    // reveal order: FWDs first (top of pitch drama), then MIDs, then DEFs, then GK last
    const slotOrder = [...formation.slots].sort((a, b) => b.y - a.y);
    const map = new Map<string, PositionEntry>();
    selection.positions.forEach((p) => { if (p.slot_id) map.set(p.slot_id, p); });
    return slotOrder
      .map((s) => ({ slot: s, entry: map.get(s.id) }))
      .filter((x) => x.entry) as { slot: typeof formation.slots[number]; entry: PositionEntry }[];
  }, [selection, formation]);

  const bench = useMemo(() => {
    if (!selection) return [];
    return selection.positions.filter((p) => !p.slot_id);
  }, [selection]);

  useEffect(() => {
    if (!autoPlay || revealIndex >= orderedStarters.length) return;
    const t = setTimeout(() => setRevealIndex((i) => i + 1), 1400);
    return () => clearTimeout(t);
  }, [autoPlay, revealIndex, orderedStarters.length]);

  const start = () => { setRevealIndex(0); setAutoPlay(true); };
  const reset = () => { setRevealIndex(-1); setAutoPlay(false); };
  const next = () => setRevealIndex((i) => Math.min(i + 1, orderedStarters.length));

  const playerName = (pid: string) => roster.find((r) => r.id === pid)?.first_name ?? "?";
  const playerNumber = (pid: string) => roster.find((r) => r.id === pid)?.shirt_number ?? null;

  if (!selection || !formation) {
    return (
      <div className="fixed inset-0 bg-black text-white flex flex-col items-center justify-center gap-3">
        <p className="text-sm text-white/60">{loadError ?? "Loading lineup…"}</p>
        {loadError && (
          <Button size="sm" variant="secondary" onClick={() => navigate(-1)}>Back</Button>
        )}
      </div>
    );
  }

  const shown = revealIndex; // number of starters revealed so far
  const complete = revealIndex >= orderedStarters.length;

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-primary">Starting XI</p>
          <p className="text-sm font-display">vs {selection.opponent} · {formation.name}</p>
        </div>
        <div className="flex items-center gap-2">
          {revealIndex < 0 && (
            <Button size="sm" onClick={start}><Play className="h-4 w-4 mr-1" />Start reveal</Button>
          )}
          {revealIndex >= 0 && !complete && (
            <>
              <Button size="sm" variant="secondary" onClick={() => setAutoPlay((a) => !a)}>
                {autoPlay ? "Pause" : "Auto"}
              </Button>
              <Button size="sm" onClick={next}><ChevronRight className="h-4 w-4" /></Button>
            </>
          )}
          <Button size="icon" variant="ghost" onClick={reset} title="Restart">
            <RotateCcw className="h-4 w-4" />
          </Button>
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
          <svg viewBox="0 0 75 100" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full pointer-events-none">
            <g stroke="rgba(255,255,255,0.35)" strokeWidth="0.3" fill="none">
              <rect x="1.5" y="2" width="72" height="96" />
              <line x1="1.5" y1="50" x2="73.5" y2="50" />
              <circle cx="37.5" cy="50" r="9" />
              <rect x="18.75" y="2" width="37.5" height="14" />
              <rect x="28.5" y="2" width="18" height="6" />
              <rect x="18.75" y="84" width="37.5" height="14" />
              <rect x="28.5" y="92" width="18" height="6" />
            </g>
            <AnimatePresence>
              {orderedStarters.slice(0, Math.max(shown, 0)).map(({ slot, entry }) => {
                const isCap = selection.captain_id === entry.player_id;
                const isVice = selection.vice_captain_id === entry.player_id;
                const safeX = revealSvgX(clampRevealX(slot.x));
                const safeY = clampRevealY(slot.y);
                const numberLabel = playerNumber(entry.player_id) ?? slot.label;
                const nameLabel = playerName(entry.player_id);

                return (
                  <motion.g
                    key={entry.player_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.05 }}
                  >
                    <circle
                      cx={safeX}
                      cy={safeY}
                      r={REVEAL_TOKEN_RADIUS}
                      fill="hsl(var(--primary))"
                      stroke="hsl(var(--primary) / 0.5)"
                      strokeWidth="1.1"
                    />
                    <text
                      x={safeX}
                      y={safeY - 1.6}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="hsl(var(--primary-foreground))"
                      fontSize="3.2"
                      fontFamily="monospace"
                      fontWeight="700"
                    >
                      {numberLabel}
                    </text>
                    <text
                      x={safeX}
                      y={safeY + 2.4}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="hsl(var(--primary-foreground))"
                      fontSize="2.8"
                      fontWeight="800"
                    >
                      {nameLabel.length > 9 ? `${nameLabel.slice(0, 8)}…` : nameLabel}
                    </text>
                    {(isCap || isVice) && (
                      <text
                        x={safeX + 6.2}
                        y={safeY - 6.2}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="hsl(var(--primary))"
                        stroke="hsl(var(--background))"
                        strokeWidth="0.45"
                        fontSize="4.2"
                        fontWeight="900"
                      >
                        {isCap ? "★" : "◐"}
                      </text>
                    )}
                  </motion.g>
                );
              })}
            </AnimatePresence>
          </svg>

          {revealIndex < 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">Ready</p>
                <p className="text-2xl font-display mt-1">Tap "Start reveal"</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bench + team talk */}
      {complete && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-white/10 px-4 py-3 shrink-0 max-h-[30vh] overflow-y-auto"
        >
          {bench.length > 0 && (
            <div className="mb-2">
              <p className="text-[10px] uppercase tracking-[0.2em] text-primary mb-1">Subs</p>
              <div className="flex flex-wrap gap-2">
                {bench.map((p) => (
                  <span key={p.player_id} className="text-xs bg-white/10 rounded-full px-3 py-1">
                    <span className="font-mono opacity-70 mr-1">{playerNumber(p.player_id) ?? "-"}</span>
                    {playerName(p.player_id)}
                  </span>
                ))}
              </div>
            </div>
          )}
          {selection.notes && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-primary mb-1">Team talk</p>
              <p className="text-sm whitespace-pre-wrap text-white/90">{selection.notes}</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
