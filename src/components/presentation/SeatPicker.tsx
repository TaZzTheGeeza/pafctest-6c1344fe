import { cn } from "@/lib/utils";
import { User } from "lucide-react";
import type { PresentationTicketSeat } from "./SeatingPlan";

interface Props {
  tableNumber: number;
  tableLabel?: string | null;
  seatsPerTable?: number;
  takenSeats: PresentationTicketSeat[];
  selectedSeats: number[];
  ownTickets: PresentationTicketSeat[];
  onToggleSeat: (seatNumber: number) => void;
  maxSelectable: number;
}

/**
 * Visual seat picker for one rectangular table.
 * Seats are arranged 3 above + 3 below (or split evenly for any even count).
 * Seat numbering: top row left→right = 1..N, bottom row left→right = N+1..2N.
 */
export function SeatPicker({
  tableNumber,
  tableLabel,
  seatsPerTable = 6,
  takenSeats,
  selectedSeats,
  ownTickets,
  onToggleSeat,
  maxSelectable,
}: Props) {
  const half = Math.ceil(seatsPerTable / 2);
  const topSeats = Array.from({ length: half }, (_, i) => i + 1);
  const bottomSeats = Array.from({ length: seatsPerTable - half }, (_, i) => half + i + 1);

  const takenMap = new Map<number, PresentationTicketSeat>();
  for (const t of takenSeats) {
    if (t.seat_number != null) takenMap.set(t.seat_number, t);
  }
  const ownSet = new Set(
    ownTickets.map((t) => t.seat_number).filter(Boolean) as number[],
  );

  const renderSeat = (seatNum: number) => {
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
          "h-12 w-12 rounded-lg border-2 flex items-center justify-center",
          "text-xs font-display font-bold transition-all",
          isTakenByOther
            ? "bg-destructive/20 border-destructive/50 text-destructive cursor-not-allowed"
            : isOwn
            ? "bg-primary border-primary text-primary-foreground"
            : isSelected
            ? "bg-primary/40 border-primary text-foreground scale-105"
            : "bg-card border-primary/40 text-foreground hover:border-primary hover:scale-105",
        )}
        title={
          isTakenByOther
            ? `Seat ${seatNum} – taken by ${taken?.attendee_name ?? "another guest"}`
            : isOwn
            ? `Seat ${seatNum} – your seat`
            : `Seat ${seatNum}`
        }
      >
        {taken || isSelected ? <User className="h-4 w-4" /> : seatNum}
      </button>
    );
  };

  return (
    <div className="flex flex-col items-center">
      <p className="text-xs font-display tracking-[0.2em] uppercase text-muted-foreground mb-3">
        {tableLabel ?? `Table ${tableNumber}`}
      </p>

      <div className="flex items-center gap-3">
        {/* Left column of seats */}
        <div className="flex flex-col gap-3">{topSeats.map(renderSeat)}</div>

        {/* Vertical (portrait) table */}
        <div
          className="rounded-md border-2 border-primary/40 flex items-center justify-center font-display font-bold text-primary text-center px-1"
          style={{
            width: 72,
            height: half * 60,
            background:
              "linear-gradient(180deg, hsl(45 25% 14%) 0%, hsl(45 15% 7%) 100%)",
            boxShadow: "inset 0 0 18px hsl(var(--primary) / 0.15)",
            writingMode: "vertical-rl",
            textOrientation: "mixed",
          }}
        >
          {tableLabel ?? `Table ${tableNumber}`}
        </div>

        {/* Right column of seats */}
        <div className="flex flex-col gap-3">{bottomSeats.map(renderSeat)}</div>
      </div>

      <p className="text-[10px] text-muted-foreground mt-3 text-center max-w-xs">
        {takenMap.size}/{seatsPerTable} seats taken · pick{" "}
        {Math.max(0, maxSelectable - selectedSeats.length)} more
      </p>
    </div>
  );
}
