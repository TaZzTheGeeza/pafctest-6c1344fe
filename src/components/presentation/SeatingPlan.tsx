import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Lock, Camera } from "lucide-react";

export interface PresentationTable {
  id: string;
  table_number: number;
  label: string | null;
  is_staff_only: boolean;
  is_locked: boolean;
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
}

/**
 * Elegant venue-style seating plan.
 * - Stage at the top with a dance floor below it
 * - 360° video booth indicator top-right
 * - 22 round tables laid out in 5 rows (4-5-4-5-4)
 * - Tables show seat count and lock status
 */
export function SeatingPlan({
  tables,
  tickets,
  selectedTableId,
  onSelectTable,
  highlightUserId,
  seatsPerTable = 10,
  adminMode = false,
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

  const layout = [
    [1, 2, 3, 4],
    [5, 6, 7, 8, 9],
    [10, 11, 12, 13],
    [14, 15, 16, 17, 18],
    [19, 20, 21, 22],
  ];

  const tableByNumber = useMemo(() => {
    const map = new Map<number, PresentationTable>();
    for (const t of tables) map.set(t.table_number, t);
    return map;
  }, [tables]);

  return (
    <div
      className="w-full rounded-2xl p-4 md:p-8 relative overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at top, hsl(45 60% 8%) 0%, hsl(0 0% 4%) 70%)",
        border: "1px solid hsl(var(--primary) / 0.3)",
        boxShadow:
          "inset 0 0 60px hsl(var(--primary) / 0.05), 0 10px 40px -10px hsl(var(--primary) / 0.2)",
      }}
    >
      {/* Decorative gold corner ornaments */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl border border-primary/20 m-2" />

      {/* TOP: Stage + 360 booth */}
      <div className="relative flex items-start justify-between gap-4 mb-6">
        <div className="w-16 md:w-20 shrink-0" />
        {/* Stage */}
        <div className="flex-1 flex flex-col items-center">
          <div className="w-full max-w-md relative">
            <div
              className="rounded-t-2xl py-3 md:py-5 text-center font-display tracking-[0.4em] uppercase text-primary border-2 border-primary/60"
              style={{
                background:
                  "linear-gradient(180deg, hsl(45 50% 15%) 0%, hsl(45 30% 10%) 100%)",
                boxShadow: "0 0 25px hsl(var(--primary) / 0.25)",
              }}
            >
              <p className="text-base md:text-xl font-bold">★ Stage ★</p>
            </div>
            {/* truss / lights row */}
            <div className="flex justify-center gap-2 md:gap-3 mt-1.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <span
                  key={i}
                  className="block h-1.5 w-1.5 rounded-full bg-primary/70 shadow-[0_0_6px_hsl(var(--primary))]"
                />
              ))}
            </div>
          </div>
        </div>
        {/* 360 booth */}
        <div className="shrink-0">
          <div
            className="h-16 w-16 md:h-20 md:w-20 rounded-full border-2 border-primary/60 flex flex-col items-center justify-center text-primary"
            style={{
              background:
                "radial-gradient(circle, hsl(45 30% 12%) 0%, hsl(0 0% 4%) 100%)",
              boxShadow: "0 0 20px hsl(var(--primary) / 0.3)",
            }}
            title="360° Video Booth"
          >
            <Camera className="h-4 w-4 md:h-5 md:w-5" />
            <span className="text-[8px] md:text-[9px] font-display tracking-wider mt-0.5">
              360°
            </span>
          </div>
        </div>
      </div>

      {/* Dance floor */}
      <div className="flex justify-center mb-8">
        <div
          className="w-32 md:w-44 h-16 md:h-24 rounded-md flex items-center justify-center text-[10px] md:text-xs font-display tracking-[0.3em] uppercase text-primary/90 border border-primary/40"
          style={{
            background:
              "repeating-linear-gradient(45deg, hsl(45 30% 10%) 0 10px, hsl(45 20% 7%) 10px 20px)",
            boxShadow: "inset 0 0 20px hsl(var(--primary) / 0.15)",
          }}
        >
          Dance Floor
        </div>
      </div>

      {/* Tables grid */}
      <div className="flex flex-col gap-5 md:gap-7">
        {layout.map((row, rowIdx) => (
          <div
            key={rowIdx}
            className="flex justify-center items-center gap-3 md:gap-6 flex-wrap"
          >
            {row.map((num) => {
              const table = tableByNumber.get(num);
              if (!table) return null;
              const seated = ticketsByTable.get(table.id) ?? [];
              const taken = seated.length;
              const isSelected = selectedTableId === table.id;
              const isLocked = !adminMode && (table.is_locked || table.is_staff_only);
              const isFull = !adminMode && taken >= seatsPerTable;
              const hasMine =
                !!highlightUserId && seated.some((s) => s.user_id === highlightUserId);

              return (
                <TableMarker
                  key={table.id}
                  num={num}
                  taken={taken}
                  total={seatsPerTable}
                  isLocked={isLocked}
                  isFull={isFull}
                  isSelected={isSelected}
                  hasMine={hasMine}
                  onClick={() =>
                    !isLocked && (!isFull || isSelected || adminMode) && onSelectTable?.(table.id)
                  }
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-8 pt-5 border-t border-primary/20 flex flex-wrap items-center justify-center gap-4 text-[10px] font-display tracking-wider uppercase text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full border-2 border-primary/40 bg-card" /> Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full border-2 border-primary bg-primary/15" /> Your table
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full border-2 border-destructive/40 bg-destructive/10" /> Full
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full border-2 border-muted-foreground/30 bg-muted/30" /> Reserved
        </span>
      </div>
    </div>
  );
}

function TableMarker({
  num,
  taken,
  total,
  isLocked,
  isFull,
  isSelected,
  hasMine,
  onClick,
}: {
  num: number;
  taken: number;
  total: number;
  isLocked: boolean;
  isFull: boolean;
  isSelected: boolean;
  hasMine: boolean;
  onClick: () => void;
}) {
  // Render seats around a circular table
  const size = 88; // px
  const seatSize = 10;
  const radius = size / 2 + 8;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLocked || (isFull && !isSelected)}
      title={
        isLocked
          ? `Table ${num} - Reserved`
          : `Table ${num} - ${taken}/${total} seats taken`
      }
      className={cn(
        "relative group transition-all",
        !isLocked && !isFull && "hover:scale-110 cursor-pointer",
        isSelected && "scale-110",
        (isLocked || isFull) && "cursor-not-allowed",
      )}
      style={{ width: size + 24, height: size + 24 }}
    >
      {/* Seats around table */}
      {Array.from({ length: total }).map((_, i) => {
        const angle = (i / total) * 2 * Math.PI - Math.PI / 2;
        const x = size / 2 + 12 + radius * Math.cos(angle) - seatSize / 2;
        const y = size / 2 + 12 + radius * Math.sin(angle) - seatSize / 2;
        const occupied = i < taken;
        return (
          <span
            key={i}
            className={cn(
              "absolute rounded-sm border",
              isLocked
                ? "bg-muted/40 border-muted-foreground/30"
                : occupied
                ? "bg-destructive/60 border-destructive/80"
                : "bg-card border-primary/40",
            )}
            style={{ left: x, top: y, width: seatSize, height: seatSize }}
          />
        );
      })}

      {/* Round table top */}
      <div
        className={cn(
          "absolute rounded-full flex items-center justify-center font-display font-bold border-2 transition-all",
          isLocked
            ? "border-muted-foreground/40 text-muted-foreground/70"
            : isFull
            ? "border-destructive/60 text-destructive"
            : isSelected
            ? "border-primary text-primary shadow-[0_0_25px_hsl(var(--primary)/0.6)]"
            : hasMine
            ? "border-primary/80 text-primary"
            : "border-primary/50 text-primary group-hover:border-primary",
        )}
        style={{
          left: 12,
          top: 12,
          width: size,
          height: size,
          background: isLocked
            ? "radial-gradient(circle, hsl(0 0% 15%) 0%, hsl(0 0% 8%) 100%)"
            : "radial-gradient(circle, hsl(45 25% 14%) 0%, hsl(45 15% 7%) 100%)",
          boxShadow: isSelected
            ? "0 0 20px hsl(var(--primary) / 0.5)"
            : "inset 0 0 15px hsl(var(--primary) / 0.15)",
        }}
      >
        {isLocked ? (
          <Lock className="h-5 w-5" />
        ) : (
          <div className="flex flex-col items-center leading-none">
            <span className="text-lg md:text-xl">{num}</span>
            <span className="text-[8px] font-normal text-muted-foreground mt-0.5">
              {taken}/{total}
            </span>
          </div>
        )}
      </div>
    </button>
  );
}
