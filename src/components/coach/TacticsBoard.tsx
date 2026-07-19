import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Undo2, Trash2, Save, MousePointer2, Pencil, MoveRight, Circle,
  Users2, Loader2, BookOpen, Camera, Sun, Download,
} from "lucide-react";
import { useTeamRoster } from "@/hooks/useTeamRoster";
import { FORMATIONS, type SlotDef } from "@/lib/formations";
import type { FAFixture } from "@/hooks/useTeamFixtures";

type Tool = "select" | "draw" | "arrow" | "zone" | "eraser";
type Color = "attack" | "defence" | "neutral";

interface Token {
  id: string;
  kind: "home" | "away" | "ball";
  x: number; // 0-100
  y: number; // 0-100
  label?: string;
}
interface Stroke {
  id: string;
  tool: "draw" | "arrow" | "zone";
  color: Color;
  points: { x: number; y: number }[]; // for zone: [start, end]
}
interface BoardData {
  tokens: Token[];
  strokes: Stroke[];
  half: "full" | "attack" | "defence";
}

const emptyBoard: BoardData = { tokens: [], strokes: [], half: "full" };

const colorMap: Record<Color, string> = {
  attack: "#fbbf24", // gold
  defence: "#ef4444",
  neutral: "#f8fafc",
};

const uid = () => Math.random().toString(36).slice(2, 10);

export function TacticsBoard({
  teamSlug, opponent, fixture, importSignal,
}: {
  teamSlug: string; opponent: string; fixture: FAFixture; importSignal?: number;
}) {
  const { data: roster = [] } = useTeamRoster(teamSlug);
  const queryClient = useQueryClient();

  const [boardId, setBoardId] = useState<string | null>(null);
  const [name, setName] = useState<string>(`vs ${opponent}`);
  const [board, setBoard] = useState<BoardData>(emptyBoard);
  const [tool, setTool] = useState<Tool>("select");
  const [color, setColor] = useState<Color>("attack");
  const [saving, setSaving] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [selectedBoardId, setSelectedBoardId] = useState<string>("__new__");

  const svgRef = useRef<SVGSVGElement | null>(null);
  const drawingRef = useRef<Stroke | null>(null);
  const draggingTokenRef = useRef<string | null>(null);

  const { data: fixtureBoards = [] } = useQuery({
    queryKey: ["tactics-boards", teamSlug, fixture.date, opponent],
    queryFn: async () => {
      const { data } = await supabase
        .from("tactics_boards" as any)
        .select("id, name, board_data, is_template, updated_at")
        .eq("team_slug", teamSlug)
        .or(`and(fixture_date.eq.${fixture.date},opponent.eq.${opponent}),is_template.eq.true`)
        .order("updated_at", { ascending: false });
      return (data || []) as any[];
    },
  });

  const templates = useMemo(
    () => fixtureBoards.filter((b) => b.is_template),
    [fixtureBoards]
  );
  const savedForFixture = useMemo(
    () => fixtureBoards.filter((b) => !b.is_template),
    [fixtureBoards]
  );

  // Prevent page scroll when drawing on the SVG
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const prevent = (e: TouchEvent) => e.preventDefault();
    el.addEventListener("touchmove", prevent, { passive: false });
    return () => el.removeEventListener("touchmove", prevent);
  }, []);

  const svgToPct = (e: React.PointerEvent) => {
    const svg = svgRef.current!;
    const rect = svg.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)),
    };
  };

  const startPointer = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const p = svgToPct(e);

    if (tool === "select") return; // token drag handled by token onPointerDown
    if (tool === "eraser") return;

    const stroke: Stroke = {
      id: uid(),
      tool: tool === "arrow" ? "arrow" : tool === "zone" ? "zone" : "draw",
      color,
      points: [p],
    };
    drawingRef.current = stroke;
    setBoard((b) => ({ ...b, strokes: [...b.strokes, stroke] }));
  };

  const movePointer = (e: React.PointerEvent) => {
    if (draggingTokenRef.current) {
      const p = svgToPct(e);
      setBoard((b) => ({
        ...b,
        tokens: b.tokens.map((t) =>
          t.id === draggingTokenRef.current ? { ...t, x: p.x, y: p.y } : t
        ),
      }));
      return;
    }
    if (!drawingRef.current) return;
    const p = svgToPct(e);
    setBoard((b) => {
      const strokes = b.strokes.slice();
      const idx = strokes.findIndex((s) => s.id === drawingRef.current!.id);
      if (idx === -1) return b;
      const s = { ...strokes[idx] };
      if (s.tool === "arrow" || s.tool === "zone") {
        s.points = [s.points[0], p];
      } else {
        s.points = [...s.points, p];
      }
      strokes[idx] = s;
      return { ...b, strokes };
    });
  };

  const endPointer = () => {
    drawingRef.current = null;
    draggingTokenRef.current = null;
  };

  const addToken = (kind: Token["kind"], label?: string) => {
    setBoard((b) => ({
      ...b,
      tokens: [...b.tokens, { id: uid(), kind, x: 50, y: 50, label }],
    }));
  };

  const addRosterToken = (id: string) => {
    const p = roster.find((r) => r.id === id);
    if (!p) return;
    addToken("home", (p.shirt_number ? String(p.shirt_number) : p.first_name.slice(0, 3)).toUpperCase());
  };

  const importLineup = async () => {
    try {
      const { data: sel, error } = await supabase
        .from("team_selections")
        .select("formation, formation_format, positions")
        .eq("team_slug", teamSlug)
        .eq("fixture_date", fixture.date)
        .eq("opponent", opponent)
        .maybeSingle();
      if (error) throw error;
      if (!sel) { toast.error("No lineup saved for this fixture yet"); return; }
      const positions = (sel.positions as any[]) || [];
      const starters = positions.filter((p) => p.slot_id);
      if (starters.length === 0) { toast.error("No starters placed on the formation"); return; }

      // Resolve slot definitions (handles built-in and custom "custom:UUID" refs)
      let slots: SlotDef[] | null = null;
      const formationRef = sel.formation || "";
      if (formationRef.startsWith("custom:")) {
        const customId = formationRef.slice("custom:".length);
        const { data: custom } = await supabase
          .from("custom_formations")
          .select("slots")
          .eq("id", customId)
          .maybeSingle();
        if (custom?.slots) slots = custom.slots as unknown as SlotDef[];
      } else {
        slots =
          FORMATIONS.find((f) => f.name === formationRef && f.format === sel.formation_format)?.slots ?? null;
        if (!slots && sel.formation_format) {
          const { data: custom } = await supabase
            .from("custom_formations")
            .select("slots")
            .eq("team_slug", teamSlug)
            .eq("format", sel.formation_format)
            .eq("name", formationRef)
            .maybeSingle();
          if (custom?.slots) slots = custom.slots as unknown as SlotDef[];
        }
      }
      if (!slots) { toast.error("Formation layout not found"); return; }

      const slotMap = new Map(slots.map((s) => [s.id, s]));
      const newTokens: Token[] = starters
        .map((p) => {
          const slot = slotMap.get(p.slot_id);
          if (!slot) return null;
          const player = roster.find((r) => r.id === p.player_id);
          const label = player?.shirt_number
            ? `#${player.shirt_number}`
            : (p.guest_name || player?.first_name || slot.label).slice(0, 3).toUpperCase();
          return {
            id: uid(),
            kind: "home" as const,
            x: slot.x,
            y: slot.y, // portrait pitch matches Squad tab (own goal at top)
            label,
          };
        })
        .filter(Boolean) as Token[];

      setBoard((b) => ({
        ...b,
        tokens: [...b.tokens.filter((t) => t.kind !== "home"), ...newTokens],
      }));
      toast.success(`Imported ${newTokens.length} players from lineup`);
    } catch (err: any) {
      toast.error(err.message || "Failed to import lineup");
    }
  };

  useEffect(() => {
    if (importSignal && importSignal > 0) {
      importLineup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importSignal]);

  const eraseAt = (strokeId?: string, tokenId?: string) => {
    if (tool !== "eraser") return;
    setBoard((b) => ({
      ...b,
      strokes: strokeId ? b.strokes.filter((s) => s.id !== strokeId) : b.strokes,
      tokens: tokenId ? b.tokens.filter((t) => t.id !== tokenId) : b.tokens,
    }));
  };

  const undo = () => {
    setBoard((b) => ({ ...b, strokes: b.strokes.slice(0, -1) }));
  };
  const clearAll = () => setBoard((b) => ({ ...b, tokens: [], strokes: [] }));

  const load = (id: string) => {
    if (id === "__new__") {
      setBoardId(null);
      setName(`vs ${opponent}`);
      setBoard(emptyBoard);
      setSelectedBoardId("__new__");
      return;
    }
    const rec = fixtureBoards.find((b) => b.id === id);
    if (!rec) return;
    setBoardId(rec.is_template ? null : rec.id); // templates load as new copies
    setName(rec.is_template ? `${rec.name} — vs ${opponent}` : rec.name);
    setBoard({ ...emptyBoard, ...(rec.board_data as BoardData) });
    setSelectedBoardId(id);
  };

  const persist = async (asTemplate: boolean) => {
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uidUser = userData.user?.id;
      const payload: any = {
        team_slug: teamSlug,
        fixture_date: asTemplate ? null : fixture.date,
        opponent: asTemplate ? null : opponent,
        name: name || (asTemplate ? "Untitled play" : `vs ${opponent}`),
        board_data: board as any,
        is_template: asTemplate,
        updated_at: new Date().toISOString(),
      };
      if (boardId && !asTemplate) {
        const { error } = await supabase.from("tactics_boards" as any).update(payload).eq("id", boardId);
        if (error) throw error;
      } else {
        payload.created_by = uidUser;
        const { data, error } = await supabase.from("tactics_boards" as any).insert(payload).select("id").single();
        if (error) throw error;
        if (!asTemplate) setBoardId((data as any)?.id ?? null);
      }
      queryClient.invalidateQueries({ queryKey: ["tactics-boards", teamSlug, fixture.date, opponent] });
      toast.success(asTemplate ? "Saved to playbook" : "Board saved");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const snapshot = async () => {
    const svg = svgRef.current;
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const src = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([src], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name || "tactics"}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Snapshot downloaded");
  };

  const pitchFill = highContrast ? "#000" : "#0b3b1f";
  const pitchLine = highContrast ? "#fff" : "rgba(255,255,255,0.7)";

  return (
    <div className="space-y-3 pt-2">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={selectedBoardId} onValueChange={load}>
          <SelectTrigger className="h-8 text-xs w-[180px]">
            <SelectValue placeholder="Load board" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__new__">➕ New board</SelectItem>
            {savedForFixture.length > 0 && (
              <div className="px-2 py-1 text-[10px] uppercase text-muted-foreground">This fixture</div>
            )}
            {savedForFixture.map((b) => (
              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
            ))}
            {templates.length > 0 && (
              <div className="px-2 py-1 text-[10px] uppercase text-muted-foreground">Playbook</div>
            )}
            {templates.map((b) => (
              <SelectItem key={b.id} value={b.id}>📘 {b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-xs flex-1 min-w-[140px]" placeholder="Board name" />
        <Button size="sm" variant="ghost" onClick={() => setHighContrast((v) => !v)} title="Toggle high contrast">
          <Sun className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 rounded-md border bg-muted/40 p-1">
        <ToolBtn active={tool === "select"} onClick={() => setTool("select")} icon={<MousePointer2 className="h-3.5 w-3.5" />} label="Move" />
        <ToolBtn active={tool === "draw"} onClick={() => setTool("draw")} icon={<Pencil className="h-3.5 w-3.5" />} label="Draw" />
        <ToolBtn active={tool === "arrow"} onClick={() => setTool("arrow")} icon={<MoveRight className="h-3.5 w-3.5" />} label="Arrow" />
        <ToolBtn active={tool === "zone"} onClick={() => setTool("zone")} icon={<Circle className="h-3.5 w-3.5" />} label="Zone" />
        <ToolBtn active={tool === "eraser"} onClick={() => setTool("eraser")} icon={<Trash2 className="h-3.5 w-3.5" />} label="Erase" />
        <div className="mx-1 h-5 w-px bg-border" />
        {(["attack", "defence", "neutral"] as Color[]).map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className={`h-6 w-6 rounded-full border-2 ${color === c ? "border-foreground" : "border-transparent"}`}
            style={{ background: colorMap[c] }}
            title={c}
          />
        ))}
        <div className="mx-1 h-5 w-px bg-border" />
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={undo}>
          <Undo2 className="h-3.5 w-3.5 mr-1" />Undo
        </Button>
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={clearAll}>Clear</Button>
      </div>

      {/* Pitch */}
      <div className="relative rounded-lg overflow-hidden border mx-auto" style={{ aspectRatio: "3 / 4", maxWidth: 520 }}>
        <svg
          ref={svgRef}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full touch-none select-none"
          style={{ background: pitchFill, cursor: tool === "select" ? "default" : "crosshair" }}
          onPointerDown={startPointer}
          onPointerMove={movePointer}
          onPointerUp={endPointer}
          onPointerLeave={endPointer}
        >
          {/* Pitch markings (portrait — matches Squad tab) */}
          <g stroke={pitchLine} strokeWidth="0.3" fill="none">
            <rect x="2" y="2" width="96" height="96" />
            <line x1="2" y1="50" x2="98" y2="50" />
            <circle cx="50" cy="50" r="9" />
            <rect x="25" y="2" width="50" height="14" />
            <rect x="38" y="2" width="24" height="6" />
            <rect x="25" y="84" width="50" height="14" />
            <rect x="38" y="92" width="24" height="6" />
          </g>

          {/* Arrow marker */}
          <defs>
            <marker id="arrowhead" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
              <polygon points="0 0, 4 2, 0 4" fill={colorMap.attack} />
            </marker>
            {(["attack", "defence", "neutral"] as Color[]).map((c) => (
              <marker key={c} id={`arrow-${c}`} markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
                <polygon points="0 0, 4 2, 0 4" fill={colorMap[c]} />
              </marker>
            ))}
          </defs>

          {/* Strokes */}
          {board.strokes.map((s) => {
            const stroke = colorMap[s.color];
            if (s.tool === "zone" && s.points.length >= 2) {
              const [a, b] = s.points;
              const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y);
              const w = Math.abs(b.x - a.x), h = Math.abs(b.y - a.y);
              return (
                <rect key={s.id} x={x} y={y} width={w} height={h}
                  fill={stroke} fillOpacity={0.18} stroke={stroke} strokeWidth={0.3} strokeDasharray="1 0.6"
                  onPointerDown={(e) => { e.stopPropagation(); eraseAt(s.id); }}
                />
              );
            }
            if (s.points.length < 2) return null;
            const d = s.points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
            return (
              <path key={s.id} d={d} fill="none" stroke={stroke} strokeWidth={0.7}
                strokeLinecap="round" strokeLinejoin="round"
                strokeDasharray={s.tool === "arrow" ? undefined : undefined}
                markerEnd={s.tool === "arrow" ? `url(#arrow-${s.color})` : undefined}
                onPointerDown={(e) => { e.stopPropagation(); eraseAt(s.id); }}
              />
            );
          })}

          {/* Tokens */}
          {board.tokens.map((t) => {
            const fill = t.kind === "home" ? "#fbbf24" : t.kind === "away" ? "#ef4444" : "#fff";
            const fg = t.kind === "ball" ? "#000" : "#0a0a0a";
            return (
              <g
                key={t.id}
                transform={`translate(${t.x} ${t.y})`}
                style={{ cursor: tool === "select" ? "grab" : tool === "eraser" ? "not-allowed" : "default" }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  if (tool === "eraser") { eraseAt(undefined, t.id); return; }
                  if (tool === "select") {
                    (e.target as Element).setPointerCapture?.(e.pointerId);
                    draggingTokenRef.current = t.id;
                  }
                }}
              >
                <circle r={t.kind === "ball" ? 1.4 : 2.4} fill={fill} stroke="#000" strokeWidth={0.25} />
                {t.label && (
                  <text y={0.9} textAnchor="middle" fontSize={2.2} fontWeight={700} fill={fg}>
                    {t.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Add tokens row */}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => addToken("home", "H")} className="h-7 text-xs">
          <span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-[#fbbf24]" />Home
        </Button>
        <Button size="sm" variant="outline" onClick={() => addToken("away", "A")} className="h-7 text-xs">
          <span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-[#ef4444]" />Opp
        </Button>
        <Button size="sm" variant="outline" onClick={() => addToken("ball")} className="h-7 text-xs">⚽ Ball</Button>
        <Button size="sm" variant="secondary" onClick={importLineup} className="h-7 text-xs">
          <Download className="h-3 w-3 mr-1" />Import lineup
        </Button>
        {roster.length > 0 && (
          <Select onValueChange={addRosterToken}>
            <SelectTrigger className="h-7 text-xs w-[150px]">
              <Users2 className="h-3 w-3 mr-1" />
              <SelectValue placeholder="Add player" />
            </SelectTrigger>
            <SelectContent>
              {roster.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.shirt_number ? `#${r.shirt_number} ` : ""}{r.first_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Save row */}
      <div className="grid grid-cols-3 gap-2">
        <Button size="sm" variant="outline" onClick={snapshot}>
          <Camera className="h-3.5 w-3.5 mr-1" />Snapshot
        </Button>
        <Button size="sm" variant="secondary" onClick={() => persist(true)} disabled={saving}>
          <BookOpen className="h-3.5 w-3.5 mr-1" />Save to playbook
        </Button>
        <Button size="sm" onClick={() => persist(false)} disabled={saving}>
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />}
          Save board
        </Button>
      </div>
    </div>
  );
}

function ToolBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs ${active ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
    >
      {icon}<span className="hidden sm:inline">{label}</span>
    </button>
  );
}
