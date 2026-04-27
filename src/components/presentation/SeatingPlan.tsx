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
  /** Player first names belonging to current user — gold ring */
  highlightedNames?: string[];
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
  highlightedNames = [],
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

  // Stable colour per age group (hashed into HSL hue)
  const ageGroupColor = (ag: string | null | undefined) => {
    if (!ag) return null;
    let hash = 0;
    for (let i = 0; i < ag.length; i++) hash = (hash * 31 + ag.charCodeAt(i)) >>> 0;
    const hue = hash % 360;
    return { hue };
  };

  // Split players evenly between left & right theatre blocks
  const { leftTheatrePlayers, rightTheatrePlayers } = useMemo(() => {
    const sorted = [...theatrePlayers].sort((a, b) => {
      const ag = (a.age_group ?? "").localeCompare(b.age_group ?? "");
      if (ag !== 0) return ag;
      const an = a.shirt_number ?? 999;
      const bn = b.shirt_number ?? 999;
      if (an !== bn) return an - bn;
      return (a.first_name ?? "").localeCompare(b.first_name ?? "");
    });
    const half = Math.ceil(sorted.length / 2);
    return {
      leftTheatrePlayers: sorted.slice(0, half),
      rightTheatrePlayers: sorted.slice(half),
    };
  }, [theatrePlayers]);


  return (
    <div
      className="w-full rounded-2xl p-4 md:p-6 relative overflow-x-auto"
      style={{
        background:
          "radial-gradient(ellipse at top, hsl(45 60% 8%) 0%, hsl(0 0% 4%) 70%)",
        border: "1px solid hsl(var(--primary) / 0.3)",
        boxShadow:
          "inset 0 0 60px hsl(var(--primary) / 0.05), 0 10px 40px -10px hsl(var(--primary) / 0.2)",
      }}
    >
      <div className="pointer-events-none absolute inset-0 rounded-2xl border border-primary/20 m-2" />

      {/* STAGE + flanking theatre blocks */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 md:gap-6 mb-6 md:mb-8 min-w-[900px]">
        {/* Left theatre block — angled toward stage */}
        <div className="flex justify-end">
          <TheatreSeatBlock
            players={leftTheatrePlayers}
            highlightedNames={highlightedNames}
            tilt={-14}
            side="left"
          />
        </div>

        {/* STAGE */}
        <div
          className="min-w-[180px] md:min-w-[260px] py-3 md:py-4 px-6 text-center font-display tracking-[0.4em] uppercase text-primary border-2 border-primary/60 rounded-md self-start"
          style={{
            background:
              "linear-gradient(180deg, hsl(45 50% 15%) 0%, hsl(45 30% 10%) 100%)",
            boxShadow: "0 0 25px hsl(var(--primary) / 0.25)",
          }}
        >
          <p className="text-base md:text-xl font-bold">★ Stage ★</p>
        </div>

        {/* Right theatre block — angled toward stage */}
        <div className="flex justify-start">
          <TheatreSeatBlock
            players={rightTheatrePlayers}
            highlightedNames={highlightedNames}
            tilt={14}
            side="right"
          />
        </div>
      </div>

      {/* Rows of tables */}
      <div className="flex flex-col gap-4 md:gap-5 min-w-[900px]">
        {rows.map(([rowIdx, rowTables]) => (
          <div key={rowIdx} className="grid grid-cols-10 gap-2 md:gap-3">
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
                  ageHue={ageGroupColor(table.age_group)?.hue ?? null}
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
                    background: `hsl(${c?.hue} 60% 30% / 0.45)`,
                    borderColor: `hsl(${c?.hue} 70% 55% / 0.7)`,
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
