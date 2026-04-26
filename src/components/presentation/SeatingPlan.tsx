import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";

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
}

/**
 * Renders 22 round tables in the layout from the venue plan:
 * - 4 rows of tables (4-5-5-4 then a final row of 4)
 * Each table shows seat occupancy.
 */
export function SeatingPlan({
  tables,
  tickets,
  selectedTableId,
  onSelectTable,
  highlightUserId,
  seatsPerTable = 10,
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

  // Layout rows from the seating plan photo: 4, 5, 4, 5, 4
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
    <div className="w-full bg-card/50 border border-border rounded-xl p-4 md:p-6">
      {/* Stage header */}
      <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-border/60">
        <div className="px-6 py-2 border-2 border-foreground/40 rounded text-xs font-display tracking-[0.3em] uppercase text-muted-foreground">
          Stage
        </div>
        <div className="text-[10px] font-display tracking-wider text-muted-foreground uppercase">
          Dance floor &middot; 360 booth
        </div>
      </div>

      <div className="flex flex-col gap-6 md:gap-8">
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
              const isLocked = table.is_locked || table.is_staff_only;
              const isFull = taken >= seatsPerTable;
              const hasMine =
                !!highlightUserId && seated.some((s) => s.user_id === highlightUserId);

              return (
                <button
                  key={table.id}
                  type="button"
                  onClick={() => !isLocked && !isFull && onSelectTable?.(table.id)}
                  disabled={isLocked || (isFull && !isSelected)}
                  className={cn(
                    "relative flex flex-col items-center justify-center rounded-full",
                    "h-16 w-16 md:h-20 md:w-20 border-2 transition-all",
                    "font-display text-sm font-bold",
                    isLocked
                      ? "bg-muted/30 border-muted-foreground/30 text-muted-foreground/60 cursor-not-allowed"
                      : isFull
                      ? "bg-destructive/10 border-destructive/40 text-destructive cursor-not-allowed"
                      : isSelected
                      ? "bg-primary/30 border-primary text-primary scale-110 shadow-[0_0_20px_hsl(var(--primary)/0.4)]"
                      : hasMine
                      ? "bg-primary/15 border-primary/70 text-foreground hover:scale-105"
                      : "bg-card border-primary/40 text-foreground hover:border-primary hover:scale-105",
                  )}
                  title={
                    isLocked
                      ? `Table ${num} - Reserved for staff`
                      : `Table ${num} - ${taken}/${seatsPerTable} seats taken`
                  }
                >
                  {isLocked ? (
                    <Lock className="h-4 w-4" />
                  ) : (
                    <>
                      <span className="leading-none">{num}</span>
                      <span className="text-[9px] font-normal text-muted-foreground mt-0.5">
                        {taken}/{seatsPerTable}
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-border/60 flex flex-wrap items-center justify-center gap-4 text-[10px] font-display tracking-wider uppercase text-muted-foreground">
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
          <span className="h-3 w-3 rounded-full border-2 border-muted-foreground/30 bg-muted/30" /> Staff only
        </span>
      </div>
    </div>
  );
}
