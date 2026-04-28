import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";

export interface TheatreSeatPlayer {
  id: string;
  first_name: string | null;
  shirt_number?: number | null;
  age_group?: string | null;
}

export interface PresentationTable {
  id: string;
  table_number: number;
  label: string | null;
  is_staff_only: boolean;
  is_locked: boolean;
  age_group?: string | null;
  row_index?: number | null;
  col_index?: number | null;
}

export interface PresentationTicketSeat {
  id: string;
  table_id: string | null;
  seat_number: number | null;
  attendee_name: string;
  ticket_type: "adult" | "child";
  user_id: string;
}

export interface TheatreAssignment {
  /** player_stat_id */
  player_id: string;
  side: "left" | "right";
  row_index: number;
  col_index: number;
}

interface Props {
  tables: PresentationTable[];
  tickets: PresentationTicketSeat[];
  selectedTableId?: string | null;
  onSelectTable?: (tableId: string) => void;
  highlightUserId?: string | null;
  seatsPerTable?: number;
  /** Admin override: ignore is_locked & full restrictions */
  adminMode?: boolean;
  /** Players to render in the two theatre blocks flanking the stage */
  theatrePlayers?: TheatreSeatPlayer[];
  /** Persisted seat→player assignments (admin-managed). When omitted falls back to auto-sort. */
  theatreAssignments?: TheatreAssignment[];
  /** Player first names belonging to current user — gold ring */
  highlightedNames?: string[];
  /** Click handler for any theatre chair (occupied or empty). Triggered in adminMode. */
  onTheatreSeatClick?: (info: {
    side: "left" | "right";
    row_index: number;
    col_index: number;
    player: TheatreSeatPlayer | null;
  }) => void;
  /** Theatre block dimensions — must match what the editor expects */
  theatreRows?: number;
  theatreChairsPerRow?: number;
}

/**
 * Hall-style seating plan matching the venue layout:
 *   - STAGE centered at the top
 *   - Two angled theatre-seat blocks flanking the stage (player seating)
 *   - Grid of rectangular guest tables below (6 seats per table)
 */
export function SeatingPlan({
  tables,
  tickets,
  selectedTableId,
  onSelectTable,
  highlightUserId,
  seatsPerTable = 6,
  adminMode = false,
  theatrePlayers = [],
  theatreAssignments,
  highlightedNames = [],
  onTheatreSeatClick,
  theatreRows = 7,
  theatreChairsPerRow = 12,
}: Props) {
  const ticketsByTable = useMemo(() => {
    const map = new Map<string, PresentationTicketSeat[]>();
    for (const t of tickets) {
      if (!t.table_id) continue;
      const arr = map.get(t.table_id) ?? [];
      arr.push(t);
      map.set(t.table_id, arr);
    }
    return map;
  }, [tickets]);

  // Group tables by row_index. Fallback: chunk by 10 in table_number order.
  const rows = useMemo(() => {
    const sorted = [...tables].sort((a, b) => {
      const ar = a.row_index ?? Math.ceil(a.table_number / 10);
      const br = b.row_index ?? Math.ceil(b.table_number / 10);
      if (ar !== br) return ar - br;
      const ac = a.col_index ?? ((a.table_number - 1) % 10) + 1;
      const bc = b.col_index ?? ((b.table_number - 1) % 10) + 1;
      return ac - bc;
    });
    const map = new Map<number, PresentationTable[]>();
    for (const t of sorted) {
      const r = t.row_index ?? Math.ceil(t.table_number / 10);
      const arr = map.get(r) ?? [];
      arr.push(t);
      map.set(r, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [tables]);

  // Distinct age groups in their seating order, for legend
  const ageGroupOrder = useMemo(() => {
    const seen = new Set<string>();
    const ordered: string[] = [];
    for (const [, rowTables] of rows) {
      for (const t of rowTables) {
        if (t.age_group && !seen.has(t.age_group)) {
          seen.add(t.age_group);
          ordered.push(t.age_group);
        }
      }
    }
    return ordered;
  }, [rows]);

  // Distinct, high-contrast colour per age group.
  // Each entry varies hue, saturation AND lightness so adjacent groups never
  // look similar at a glance. Used by the legend and by the theatre seats below.
  const AGE_GROUP_PALETTE: Record<string, { h: number; s: number; l: number }> = {
    "u6s":         { h: 0,   s: 90, l: 60 },
    "u7s":         { h: 28,  s: 100, l: 55 },
    "u8s-black":   { h: 55,  s: 100, l: 65 },
    "u8s-gold":    { h: 95,  s: 70, l: 50 },
    "u9s":         { h: 145, s: 80, l: 45 },
    "u10s":        { h: 175, s: 85, l: 55 },
    "u11s-gold":   { h: 205, s: 95, l: 55 },
    "u11s-black":  { h: 235, s: 75, l: 65 },
    "u13s-gold":   { h: 265, s: 80, l: 70 },
    "u13s-black":  { h: 290, s: 75, l: 50 },
    "u14s":        { h: 320, s: 90, l: 60 },
    "u15s":        { h: 345, s: 95, l: 70 },
    "u16s":        { h: 10,  s: 65, l: 45 },
    "u17s":        { h: 30,  s: 50, l: 40 },
    "u18s":        { h: 120, s: 30, l: 75 },
  };
  const ageGroupColor = (ag: string | null | undefined) => {
    if (!ag) return null;
    const key = ag.toLowerCase();
    if (key in AGE_GROUP_PALETTE) return AGE_GROUP_PALETTE[key];
    let hash = 0;
    for (let i = 0; i < ag.length; i++) hash = (hash * 31 + ag.charCodeAt(i)) >>> 0;
    const h = Math.round((hash * 137.508) % 360);
    return { h, s: 70, l: 50 };
  };

  // Build seat grids per side. If theatreAssignments is provided, place
  // players at their persisted (row,col); otherwise fall back to auto-sort
  // (sorted by age group, shirt number) split evenly L/R.
  const { leftSeatGrid, rightSeatGrid } = useMemo(() => {
    const totalSeats = theatreRows * theatreChairsPerRow;
    const buildEmpty = () =>
      Array.from({ length: theatreRows }, () =>
        Array.from({ length: theatreChairsPerRow }, () => null as TheatreSeatPlayer | null),
      );

    const left = buildEmpty();
    const right = buildEmpty();
    const playerById = new Map(theatrePlayers.map((p) => [p.id, p]));

    if (theatreAssignments && theatreAssignments.length > 0) {
      // Use persisted assignments
      for (const a of theatreAssignments) {
        const p = playerById.get(a.player_id);
        if (!p) continue;
        if (a.row_index < 1 || a.row_index > theatreRows) continue;
        if (a.col_index < 1 || a.col_index > theatreChairsPerRow) continue;
        const grid = a.side === "left" ? left : right;
        grid[a.row_index - 1][a.col_index - 1] = p;
      }
    } else {
      // Auto-sort fallback
      const sorted = [...theatrePlayers].sort((a, b) => {
        const ag = (a.age_group ?? "").localeCompare(b.age_group ?? "");
        if (ag !== 0) return ag;
        const an = a.shirt_number ?? 999;
        const bn = b.shirt_number ?? 999;
        if (an !== bn) return an - bn;
        return (a.first_name ?? "").localeCompare(b.first_name ?? "");
      });
      const half = Math.ceil(sorted.length / 2);
      const fillSide = (grid: (TheatreSeatPlayer | null)[][], list: TheatreSeatPlayer[]) => {
        for (let i = 0; i < Math.min(list.length, totalSeats); i++) {
          const r = Math.floor(i / theatreChairsPerRow);
          const c = i % theatreChairsPerRow;
          grid[r][c] = list[i];
        }
      };
      fillSide(left, sorted.slice(0, half));
      fillSide(right, sorted.slice(half));
    }

    return { leftSeatGrid: left, rightSeatGrid: right };
  }, [theatrePlayers, theatreAssignments, theatreRows, theatreChairsPerRow]);


  return (
    <div
      className="w-full rounded-2xl p-3 md:p-5 relative"
      style={{
        background:
          "radial-gradient(ellipse at top, hsl(45 60% 8%) 0%, hsl(0 0% 4%) 70%)",
        border: "1px solid hsl(var(--primary) / 0.3)",
        boxShadow:
          "inset 0 0 60px hsl(var(--primary) / 0.05), 0 10px 40px -10px hsl(var(--primary) / 0.2)",
      }}
    >
      <div className="pointer-events-none absolute inset-0 rounded-2xl border border-primary/20 m-2" />

      {/* STAGE */}
      <div className="flex justify-center mb-4 md:mb-6">
        <div
          className="min-w-[260px] md:min-w-[420px] py-4 md:py-6 px-8 text-center font-display tracking-[0.4em] uppercase text-primary border-2 border-primary/60 rounded-md"
          style={{
            background:
              "linear-gradient(180deg, hsl(45 50% 15%) 0%, hsl(45 30% 10%) 100%)",
            boxShadow: "0 0 25px hsl(var(--primary) / 0.25)",
          }}
        >
          <p className="text-base md:text-2xl font-bold">★ Stage ★</p>
          <p className="text-[9px] md:text-[10px] tracking-[0.3em] text-muted-foreground mt-2">
            168 player seats · 7 rows × 12 seats per side
          </p>
        </div>
      </div>

      {/* Theatre blocks — flanking the stage, no rotation to avoid overlap */}
      <div className="grid grid-cols-2 gap-3 md:gap-6 mb-6 md:mb-10">
        <div className="flex justify-center">
          <TheatreSeatBlock
            seatGrid={leftSeatGrid}
            highlightedNames={highlightedNames}
            side="left"
            adminMode={adminMode}
            onSeatClick={onTheatreSeatClick}
          />
        </div>
        <div className="flex justify-center">
          <TheatreSeatBlock
            seatGrid={rightSeatGrid}
            highlightedNames={highlightedNames}
            side="right"
            adminMode={adminMode}
            onSeatClick={onTheatreSeatClick}
          />
        </div>
      </div>

      {/* Divider between players and guest tables */}
      <div className="flex items-center gap-3 mb-4 md:mb-6">
        <div className="flex-1 h-px bg-primary/20" />
        <p className="text-[10px] font-display tracking-[0.4em] uppercase text-primary/70 text-center">
          ★ Guest Tables · 70 tables × 6 seats = 420 ★
        </p>
        <div className="flex-1 h-px bg-primary/20" />
      </div>

      {/* Rows of tables */}
      <div className="flex flex-col gap-3 md:gap-4">
        {rows.map(([rowIdx, rowTables]) => (
          <div key={rowIdx} className="grid grid-cols-10 gap-3 md:gap-4">
            {rowTables.map((table) => {
              const seated = ticketsByTable.get(table.id) ?? [];
              const taken = seated.length;
              const isSelected = selectedTableId === table.id;
              const isLocked =
                !adminMode && (table.is_locked || table.is_staff_only);
              const isFull = !adminMode && taken >= seatsPerTable;
              const hasMine =
                !!highlightUserId &&
                seated.some((s) => s.user_id === highlightUserId);

              return (
                <RectTable
                  key={table.id}
                  table={table}
                  taken={taken}
                  total={seatsPerTable}
                  isLocked={isLocked}
                  isFull={isFull}
                  isSelected={isSelected}
                  hasMine={hasMine}
                  ageHue={null}
                  onClick={() =>
                    !isLocked &&
                    (!isFull || isSelected || adminMode) &&
                    onSelectTable?.(table.id)
                  }
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Age group legend */}
      {ageGroupOrder.length > 0 && (
        <div className="mt-6 md:mt-7 pt-4 border-t border-primary/20 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[10px] font-display tracking-wider uppercase text-muted-foreground">
          {ageGroupOrder.map((ag) => {
            const c = ageGroupColor(ag);
            return (
              <span key={ag} className="flex items-center gap-1.5">
                <span
                  className="h-3 w-5 rounded-sm border"
                  style={{
                    background: `hsl(${c?.h} ${c?.s}% ${Math.max(20, (c?.l ?? 50) - 20)}% / 0.55)`,
                    borderColor: `hsl(${c?.h} ${c?.s}% ${c?.l}% / 0.85)`,
                  }}
                />
                {ag}
              </span>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 md:mt-8 pt-4 md:pt-5 border-t border-primary/20 flex flex-wrap items-center justify-center gap-4 text-[10px] font-display tracking-wider uppercase text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-5 rounded-sm border border-primary/40 bg-card" /> Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-5 rounded-sm border border-primary bg-primary/30" /> Your table
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-5 rounded-sm border border-destructive/40 bg-destructive/20" /> Full
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-5 rounded-sm border border-muted-foreground/30 bg-muted/30" /> Reserved
        </span>
      </div>
    </div>
  );
}

function RectTable({
  table,
  taken,
  total,
  isLocked,
  isFull,
  isSelected,
  hasMine,
  ageHue,
  onClick,
}: {
  table: PresentationTable;
  taken: number;
  total: number;
  isLocked: boolean;
  isFull: boolean;
  isSelected: boolean;
  hasMine: boolean;
  ageHue: number | null;
  onClick: () => void;
}) {
  const seatsPerSide = Math.ceil(total / 2);
  const leftFilled = Math.ceil(taken / 2);
  const rightFilled = Math.floor(taken / 2);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLocked || (isFull && !isSelected)}
      title={
        isLocked
          ? `${table.label ?? `Table ${table.table_number}`} – Reserved`
          : `${table.label ?? `Table ${table.table_number}`} – ${taken}/${total} seats`
      }
      className={cn(
        "relative group transition-all flex items-center justify-center gap-0.5",
        !isLocked && !isFull && "hover:scale-[1.06] cursor-pointer",
        isSelected && "scale-[1.06]",
        (isLocked || isFull) && "cursor-not-allowed opacity-90",
      )}
    >
      {/* Left column of seats */}
      <div className="flex flex-col justify-around h-16 md:h-20 py-1">
        {Array.from({ length: seatsPerSide }).map((_, i) => {
          const occupied = i < leftFilled;
          return (
            <span
              key={`l-${i}`}
              className={cn(
                "h-2 w-1.5 rounded-sm border",
                isLocked
                  ? "bg-muted/40 border-muted-foreground/30"
                  : occupied
                  ? "bg-destructive/70 border-destructive/80"
                  : "bg-card border-primary/40",
              )}
            />
          );
        })}
      </div>

      {/* Vertical (portrait) table body */}
      <div
        className={cn(
          "w-7 md:w-9 h-16 md:h-20 rounded-md flex items-center justify-center font-display font-bold border-2 transition-all",
          isLocked
            ? "border-muted-foreground/40 text-muted-foreground/70"
            : isFull
            ? "border-destructive/60 text-destructive"
            : isSelected
            ? "border-primary text-primary shadow-[0_0_18px_hsl(var(--primary)/0.6)]"
            : hasMine
            ? "border-primary/80 text-primary"
            : "border-primary/50 text-primary group-hover:border-primary",
        )}
        style={{
          background: isLocked
            ? "linear-gradient(180deg, hsl(0 0% 15%) 0%, hsl(0 0% 8%) 100%)"
            : isSelected
            ? "linear-gradient(180deg, hsl(45 35% 18%) 0%, hsl(45 25% 10%) 100%)"
            : ageHue != null
            ? `linear-gradient(180deg, hsl(${ageHue} 55% 22%) 0%, hsl(${ageHue} 45% 10%) 100%)`
            : "linear-gradient(180deg, hsl(45 25% 14%) 0%, hsl(45 15% 7%) 100%)",
          borderColor:
            ageHue != null && !isLocked && !isSelected && !isFull && !hasMine
              ? `hsl(${ageHue} 70% 55% / 0.7)`
              : undefined,
        }}
      >
        {isLocked ? (
          <Lock className="h-3.5 w-3.5" />
        ) : (
          <div className="flex flex-col items-center leading-none">
            <span className="text-[10px] md:text-[11px]">
              {table.col_index ?? table.table_number}
            </span>
            <span className="text-[7px] md:text-[8px] font-normal text-muted-foreground mt-0.5">
              {taken}/{total}
            </span>
          </div>
        )}
      </div>

      {/* Right column of seats */}
      <div className="flex flex-col justify-around h-16 md:h-20 py-1">
        {Array.from({ length: seatsPerSide }).map((_, i) => {
          const occupied = i < rightFilled;
          return (
            <span
              key={`r-${i}`}
              className={cn(
                "h-2 w-1.5 rounded-sm border",
                isLocked
                  ? "bg-muted/40 border-muted-foreground/30"
                  : occupied
                  ? "bg-destructive/70 border-destructive/80"
                  : "bg-card border-primary/40",
              )}
            />
          );
        })}
      </div>
    </button>
  );
}

// ────────────────────────────────────────────────────────
// Angled theatre-seat block (flanks the stage)
// ────────────────────────────────────────────────────────

function TheatreSeatBlock({
  seatGrid,
  highlightedNames,
  side,
  adminMode = false,
  onSeatClick,
}: {
  seatGrid: (TheatreSeatPlayer | null)[][];
  highlightedNames: string[];
  side: "left" | "right";
  adminMode?: boolean;
  onSeatClick?: (info: {
    side: "left" | "right";
    row_index: number;
    col_index: number;
    player: TheatreSeatPlayer | null;
  }) => void;
}) {
  const highlightSet = useMemo(
    () =>
      new Set(
        highlightedNames
          .filter(Boolean)
          .map((n) => n.trim().toLowerCase()),
      ),
    [highlightedNames],
  );

  // Pre-baked chair colours (bg gradient + border + text) hand-tuned so each
  // age group reads as a clearly different colour on the black background.
  type ChairColors = { bg1: string; bg2: string; border: string; text: string };
  const THEATRE_CHAIR_COLORS: Record<string, ChairColors> = {
    "u6s":        { bg1: "hsl(0 75% 35%)",   bg2: "hsl(0 70% 18%)",   border: "hsl(0 90% 60%)",   text: "hsl(0 90% 90%)" },     // red
    "u7s":        { bg1: "hsl(28 95% 42%)",  bg2: "hsl(28 90% 22%)",  border: "hsl(28 100% 60%)", text: "hsl(28 100% 88%)" },   // orange
    "u8s-black":  { bg1: "hsl(55 90% 45%)",  bg2: "hsl(55 85% 22%)",  border: "hsl(55 100% 65%)", text: "hsl(55 100% 88%)" },   // yellow
    "u8s-gold":   { bg1: "hsl(95 65% 28%)",  bg2: "hsl(95 60% 14%)",  border: "hsl(95 70% 50%)",  text: "hsl(95 80% 80%)" },    // olive
    "u9s":        { bg1: "hsl(145 80% 25%)", bg2: "hsl(145 75% 12%)", border: "hsl(145 80% 45%)", text: "hsl(145 80% 80%)" },   // emerald
    "u10s":       { bg1: "hsl(175 75% 32%)", bg2: "hsl(175 70% 16%)", border: "hsl(175 85% 55%)", text: "hsl(175 90% 85%)" },   // turquoise
    "u11s-gold":  { bg1: "hsl(205 90% 35%)", bg2: "hsl(205 85% 18%)", border: "hsl(205 95% 55%)", text: "hsl(205 95% 85%)" },   // azure
    "u11s-black": { bg1: "hsl(235 60% 45%)", bg2: "hsl(235 55% 22%)", border: "hsl(235 75% 65%)", text: "hsl(235 85% 88%)" },   // royal blue
    "u13s-gold":  { bg1: "hsl(265 65% 50%)", bg2: "hsl(265 60% 25%)", border: "hsl(265 80% 70%)", text: "hsl(265 90% 90%)" },   // lavender
    "u13s-black": { bg1: "hsl(290 70% 30%)", bg2: "hsl(290 65% 15%)", border: "hsl(290 75% 50%)", text: "hsl(290 85% 82%)" },   // violet
    "u14s":       { bg1: "hsl(320 75% 38%)", bg2: "hsl(320 70% 18%)", border: "hsl(320 90% 60%)", text: "hsl(320 95% 88%)" },   // magenta
    "u15s":       { bg1: "hsl(345 85% 50%)", bg2: "hsl(345 80% 25%)", border: "hsl(345 95% 70%)", text: "hsl(345 100% 90%)" },  // hot pink
    "u16s":       { bg1: "hsl(10 60% 25%)",  bg2: "hsl(10 55% 12%)",  border: "hsl(10 65% 45%)",  text: "hsl(10 70% 78%)" },    // brick
    "u17s":       { bg1: "hsl(30 45% 20%)",  bg2: "hsl(30 40% 10%)",  border: "hsl(30 50% 40%)",  text: "hsl(30 60% 75%)" },    // brown
    "u18s":       { bg1: "hsl(120 25% 55%)", bg2: "hsl(120 20% 28%)", border: "hsl(120 30% 75%)", text: "hsl(120 40% 92%)" },   // sage
  };
  const chairColorsOf = (ag: string | null | undefined): ChairColors => {
    if (!ag) return { bg1: "hsl(0 0% 25%)", bg2: "hsl(0 0% 12%)", border: "hsl(0 0% 45%)", text: "hsl(0 0% 80%)" };
    const key = ag.toLowerCase();
    if (key in THEATRE_CHAIR_COLORS) return THEATRE_CHAIR_COLORS[key];
    let hash = 0;
    for (let i = 0; i < ag.length; i++) hash = (hash * 31 + ag.charCodeAt(i)) >>> 0;
    const h = Math.round((hash * 137.508) % 360);
    return { bg1: `hsl(${h} 70% 30%)`, bg2: `hsl(${h} 65% 15%)`, border: `hsl(${h} 75% 50%)`, text: `hsl(${h} 85% 85%)` };
  };

  const totalRows = seatGrid.length;
  const chairsPerRow = seatGrid[0]?.length ?? 0;
  const totalSeats = totalRows * chairsPerRow;
  const occupied = seatGrid.flat().filter(Boolean).length;
  const clickable = adminMode && !!onSeatClick;

  const handleClick = (
    rIdx: number,
    cIdx: number,
    p: TheatreSeatPlayer | null,
  ) => {
    if (!clickable) return;
    onSeatClick!({
      side,
      row_index: rIdx + 1,
      col_index: cIdx + 1,
      player: p,
    });
  };

  return (
    <div
      className="rounded-md border border-primary/30 p-2 md:p-3 inline-block w-full"
      style={{
        background:
          "linear-gradient(180deg, hsl(45 25% 10% / 0.7) 0%, hsl(0 0% 4% / 0.7) 100%)",
        boxShadow: "inset 0 0 20px hsl(var(--primary) / 0.05)",
      }}
    >
      <p className="text-center text-[9px] md:text-[10px] font-display tracking-[0.3em] uppercase text-primary/80 mb-2">
        {side === "left" ? "◀ Stage Left" : "Stage Right ▶"} · {occupied}/{totalSeats} seats
        {clickable && <span className="ml-2 text-primary/60 normal-case tracking-normal">· click to edit</span>}
      </p>
      <div className="flex flex-col gap-[2px] md:gap-[3px]">
        {seatGrid.map((rowSeats, rIdx) => (
          <div key={rIdx} className="flex gap-[2px] md:gap-[3px] justify-center items-center">
            <span className="w-3 text-[7px] font-display text-muted-foreground/50 text-right pr-0.5">
              {rIdx + 1}
            </span>
            {rowSeats.map((p, cIdx) => {
              const baseClass =
                "h-[28px] md:h-[34px] flex-1 min-w-0 max-w-[56px] rounded-[3px] border flex flex-col items-center justify-center leading-none px-0.5 overflow-hidden transition-transform relative";
              if (!p) {
                return (
                  <button
                    type="button"
                    key={`empty-${rIdx}-${cIdx}`}
                    onClick={() => handleClick(rIdx, cIdx, null)}
                    disabled={!clickable}
                    className={cn(
                      baseClass,
                      "border-dashed border-primary/15 bg-card/20",
                      clickable && "hover:border-primary/60 hover:bg-card/40 cursor-pointer",
                    )}
                    title={
                      clickable
                        ? `Empty seat — row ${rIdx + 1}, col ${cIdx + 1} (click to assign)`
                        : "Empty seat"
                    }
                  >
                    {clickable && (
                      <span className="text-[8px] md:text-[9px] font-display text-muted-foreground/40">
                        +
                      </span>
                    )}
                  </button>
                );
              }
              const cc = chairColorsOf(p.age_group);
              const isMine =
                !!p.first_name &&
                highlightSet.has(p.first_name.trim().toLowerCase());
              return (
                <button
                  type="button"
                  key={`${rIdx}-${cIdx}-${p.id}`}
                  onClick={() => handleClick(rIdx, cIdx, p)}
                  disabled={!clickable}
                  className={cn(
                    baseClass,
                    "hover:scale-110 hover:z-10",
                    isMine && "ring-1 ring-primary ring-offset-[1px] ring-offset-background",
                    clickable && "cursor-pointer",
                  )}
                  style={{
                    background: isMine
                      ? "linear-gradient(180deg, hsl(45 60% 28%) 0%, hsl(45 50% 14%) 100%)"
                      : `linear-gradient(180deg, ${cc.bg1} 0%, ${cc.bg2} 100%)`,
                    borderColor: isMine ? "hsl(var(--primary))" : cc.border,
                    color: isMine ? "hsl(var(--primary))" : cc.text,
                  }}
                  title={
                    [
                      p.shirt_number != null ? `#${p.shirt_number}` : null,
                      p.first_name ?? "?",
                      p.age_group ? `(${p.age_group})` : null,
                      `· row ${rIdx + 1}, col ${cIdx + 1}`,
                    ]
                      .filter(Boolean)
                      .join(" ")
                  }
                >
                  {p.shirt_number != null && (
                    <span className="text-[7px] md:text-[8px] font-display font-bold opacity-70">
                      #{p.shirt_number}
                    </span>
                  )}
                  <span className="text-[8px] md:text-[9px] font-display font-bold truncate w-full text-center">
                    {p.first_name ?? "?"}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

