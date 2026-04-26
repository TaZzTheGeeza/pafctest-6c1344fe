import { cn } from "@/lib/utils";
import { User } from "lucide-react";
import type { PresentationTicketSeat } from "./SeatingPlan";

interface Props {
  tableNumber: number;
  seatsPerTable?: number;
  takenSeats: PresentationTicketSeat[];
  selectedSeats: number[];
  ownTickets: PresentationTicketSeat[];
  onToggleSeat: (seatNumber: number) => void;
  maxSelectable: number;
}

/**
 * Visual seat picker for one round table.
 * Shows seats 1..N arranged in a circle.
 */
export function SeatPicker({
  tableNumber,
  seatsPerTable = 10,
  takenSeats,
  selectedSeats,
  ownTickets,
  onToggleSeat,
  maxSelectable,
}: Props) {
  const radius = 110;
  const center = 140;

  const takenMap = new Map<number, PresentationTicketSeat>();
  for (const t of takenSeats) {
    if (t.seat_number != null) takenMap.set(t.seat_number, t);
  }
  const ownSet = new Set(ownTickets.map((t) => t.seat_number).filter(Boolean) as number[]);

  return (
    <div className="flex flex-col items-center">
      <p className="text-xs font-display tracking-[0.2em] uppercase text-muted-foreground mb-2">
        Table {tableNumber}
      </p>
      <div className="relative" style={{ width: center * 2, height: center * 2 }}>
        {/* Round table */}
        <div
          className="absolute rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center"
          style={{
            top: center - 60,
            left: center - 60,
            width: 120,
            height: 120,
          }}
        >
          <span className="font-display text-2xl font-bold text-primary">{tableNumber}</span>
        </div>

        {/* Seats */}
        {Array.from({ length: seatsPerTable }).map((_, i) => {
          const seatNum = i + 1;
          const angle = (i / seatsPerTable) * 2 * Math.PI - Math.PI / 2;
          const x = center + radius * Math.cos(angle) - 18;
          const y = center + radius * Math.sin(angle) - 18;
          const taken = takenMap.get(seatNum);
          const isOwn = ownSet.has(seatNum);
          const isSelected = selectedSeats.includes(seatNum);
          const isTakenByOther = !!taken && !isOwn;
          const canSelect =
            !isTakenByOther && (isSelected || selectedSeats.length < maxSelectable);

          return (
            <button
              key={seatNum}
              type="button"
              disabled={isTakenByOther || (!canSelect && !isSelected)}
              onClick={() => onToggleSeat(seatNum)}
              className={cn(
                "absolute h-9 w-9 rounded-full border-2 flex items-center justify-center",
                "text-[10px] font-display font-bold transition-all",
                isTakenByOther
                  ? "bg-destructive/20 border-destructive/50 text-destructive cursor-not-allowed"
                  : isOwn
                  ? "bg-primary border-primary text-primary-foreground"
                  : isSelected
                  ? "bg-primary/40 border-primary text-foreground scale-110"
                  : "bg-card border-primary/40 text-foreground hover:border-primary hover:scale-110",
              )}
              style={{ top: y, left: x }}
              title={
                isTakenByOther
                  ? `Seat ${seatNum} - taken by ${taken?.attendee_name ?? "another guest"}`
                  : isOwn
                  ? `Seat ${seatNum} - your seat`
                  : `Seat ${seatNum}`
              }
            >
              {taken || isSelected ? <User className="h-3.5 w-3.5" /> : seatNum}
            </button>
          );
        })}
      </div>

      <p className="text-[10px] text-muted-foreground mt-3 text-center max-w-xs">
        {takenMap.size}/{seatsPerTable} seats taken &middot; pick {maxSelectable - selectedSeats.length} more
      </p>
    </div>
  );
}
