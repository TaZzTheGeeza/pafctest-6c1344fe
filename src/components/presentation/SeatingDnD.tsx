import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { GripVertical, Lock, UserMinus, Users } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import type {
  PresentationTable,
  PresentationTicketSeat,
} from "@/components/presentation/SeatingPlan";

interface AdminTicket extends PresentationTicketSeat {
  allocation_id: string;
  event_id: string;
  ticket_type: "adult" | "child";
}

interface AdminAllocation {
  id: string;
  player_name: string;
  team_slug: string | null;
}

interface Props {
  tables: PresentationTable[];
  tickets: AdminTicket[];
  allocations: AdminAllocation[];
  seatsPerTable: number;
  onChanged: () => void;
}

type DropTarget =
  | { kind: "seat"; tableId: string; seatNumber: number }
  | { kind: "unseat" };

const UNSEAT_ID = "drop:unseat";
const seatId = (tableId: string, seatNum: number) =>
  `seat:${tableId}:${seatNum}`;

function parseDropId(id: string): DropTarget | null {
  if (id === UNSEAT_ID) return { kind: "unseat" };
  if (id.startsWith("seat:")) {
    const [, tableId, seatStr] = id.split(":");
    return { kind: "seat", tableId, seatNumber: parseInt(seatStr, 10) };
  }
  return null;
}

export function SeatingDnD({
  tables,
  tickets,
  allocations,
  seatsPerTable,
  onChanged,
}: Props) {
  const [activeTicket, setActiveTicket] = useState<AdminTicket | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [busy, setBusy] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
  );

  const allocMap = useMemo(
    () => new Map(allocations.map((a) => [a.id, a])),
    [allocations],
  );
  const ticketsById = useMemo(
    () => new Map(tickets.map((t) => [t.id, t])),
    [tickets],
  );

  // Group seated tickets per table+seat
  const seatMap = useMemo(() => {
    const m = new Map<string, AdminTicket>(); // key = seatId
    for (const t of tickets) {
      if (t.table_id && t.seat_number != null) {
        m.set(seatId(t.table_id, t.seat_number), t);
      }
    }
    return m;
  }, [tickets]);

  // Unseated grouped by allocation
  const unseatedByFamily = useMemo(() => {
    const term = filter.trim().toLowerCase();
    const groups = new Map<string, AdminTicket[]>();
    for (const t of tickets) {
      if (t.table_id && t.seat_number != null) continue;
      const arr = groups.get(t.allocation_id) ?? [];
      arr.push(t);
      groups.set(t.allocation_id, arr);
    }
    const out: { alloc: AdminAllocation; tickets: AdminTicket[] }[] = [];
    for (const [allocId, ts] of groups.entries()) {
      const alloc = allocMap.get(allocId);
      if (!alloc) continue;
      if (term) {
        const hay = `${alloc.player_name} ${alloc.team_slug ?? ""} ${ts
          .map((t) => t.attendee_name)
          .join(" ")}`.toLowerCase();
        if (!hay.includes(term)) continue;
      }
      out.push({ alloc, tickets: ts });
    }
    out.sort((a, b) => a.alloc.player_name.localeCompare(b.alloc.player_name));
    return out;
  }, [tickets, allocMap, filter]);

  const totalUnseated = useMemo(
    () =>
      tickets.filter((t) => !t.table_id || t.seat_number == null).length,
    [tickets],
  );

  const onDragStart = (e: DragStartEvent) => {
    const id = String(e.active.id);
    if (!id.startsWith("ticket:")) return;
    const ticketId = id.slice("ticket:".length);
    const t = ticketsById.get(ticketId);
    setActiveTicket(t ?? null);
  };

  const onDragEnd = async (e: DragEndEvent) => {
    const draggedId = String(e.active.id);
    const overRaw = e.over?.id ? String(e.over.id) : null;
    setActiveTicket(null);
    setOverId(null);

    if (!overRaw || !draggedId.startsWith("ticket:")) return;

    const ticketId = draggedId.slice("ticket:".length);
    const ticket = ticketsById.get(ticketId);
    if (!ticket) return;

    const target = parseDropId(overRaw);
    if (!target) return;

    if (busy) return;

    if (target.kind === "unseat") {
      if (!ticket.table_id) return; // already unseated
      setBusy(true);
      const { error } = await supabase
        .from("presentation_tickets")
        .update({ table_id: null, seat_number: null })
        .eq("id", ticket.id);
      setBusy(false);
      if (error) return toast.error(error.message);
      toast.success(`${ticket.attendee_name} unseated`);
      onChanged();
      return;
    }

    // Seat target
    const { tableId, seatNumber } = target;
    // Same seat → no-op
    if (ticket.table_id === tableId && ticket.seat_number === seatNumber) return;

    const occupant = seatMap.get(seatId(tableId, seatNumber));

    setBusy(true);
    try {
      if (!occupant) {
        // Simple move/assign
        const { error } = await supabase
          .from("presentation_tickets")
          .update({ table_id: tableId, seat_number: seatNumber })
          .eq("id", ticket.id);
        if (error) throw error;
        toast.success(`Seated ${ticket.attendee_name}`);
      } else if (occupant.id === ticket.id) {
        return;
      } else {
        // Swap. Park dragged in null first to avoid unique conflict.
        const prevTableId = ticket.table_id;
        const prevSeat = ticket.seat_number;

        const r1 = await supabase
          .from("presentation_tickets")
          .update({ table_id: null, seat_number: null })
          .eq("id", ticket.id);
        if (r1.error) throw r1.error;

        const r2 = await supabase
          .from("presentation_tickets")
          .update({ table_id: prevTableId, seat_number: prevSeat })
          .eq("id", occupant.id);
        if (r2.error) throw r2.error;

        const r3 = await supabase
          .from("presentation_tickets")
          .update({ table_id: tableId, seat_number: seatNumber })
          .eq("id", ticket.id);
        if (r3.error) throw r3.error;

        toast.success(
          prevTableId
            ? `Swapped ${ticket.attendee_name} ↔ ${occupant.attendee_name}`
            : `Bumped ${occupant.attendee_name}, seated ${ticket.attendee_name}`,
        );
      }
      onChanged();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to update seat");
    } finally {
      setBusy(false);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragOver={(e) => setOverId(e.over?.id ? String(e.over.id) : null)}
      onDragEnd={onDragEnd}
      onDragCancel={() => {
        setActiveTicket(null);
        setOverId(null);
      }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4">
        {/* ── Left: Unseated families + unseat bin ── */}
        <div className="space-y-3 lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto pr-1">
          <Card className="p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-display tracking-[0.2em] uppercase text-muted-foreground">
                Unseated
              </p>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px]",
                  totalUnseated > 0
                    ? "text-destructive border-destructive/40"
                    : "text-primary border-primary/40",
                )}
              >
                {totalUnseated}
              </Badge>
            </div>
            <Input
              placeholder="Search family or attendee…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-8 text-xs"
            />
          </Card>

          <UnseatDropZone active={overId === UNSEAT_ID} />

          <div className="space-y-2">
            {unseatedByFamily.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                {totalUnseated === 0
                  ? "🎉 Everyone is seated!"
                  : "No matches."}
              </p>
            ) : (
              unseatedByFamily.map(({ alloc, tickets: ts }) => (
                <Card
                  key={alloc.id}
                  className="p-2 bg-card/40 border-border"
                >
                  <div className="px-1 mb-1.5 flex items-center gap-1.5">
                    <Users className="h-3 w-3 text-muted-foreground shrink-0" />
                    <p className="text-[11px] font-display font-bold truncate">
                      {alloc.player_name}
                    </p>
                    {alloc.team_slug && (
                      <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
                        {alloc.team_slug}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {ts.map((t) => (
                      <DraggableTicket key={t.id} ticket={t} compact />
                    ))}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* ── Right: Tables grid ── */}
        <div>
          <Card className="p-3 mb-3">
            <p className="text-[11px] text-muted-foreground">
              Drag attendees onto an empty seat to assign · drop on a taken seat
              to swap · drop on the bin to unseat. Reserved tables can still be
              used (admin override).
            </p>
          </Card>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
            {tables
              .slice()
              .sort((a, b) => a.table_number - b.table_number)
              .map((table) => (
                <DnDTable
                  key={table.id}
                  table={table}
                  seatsPerTable={seatsPerTable}
                  ticketsBySeat={seatMap}
                  allocMap={allocMap}
                  overId={overId}
                  activeTicketId={activeTicket?.id ?? null}
                />
              ))}
          </div>
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTicket ? (
          <div className="rounded-md border border-primary/60 bg-card px-2.5 py-1.5 shadow-2xl shadow-primary/30 text-xs font-medium pointer-events-none flex items-center gap-1.5">
            <GripVertical className="h-3 w-3 text-primary" />
            <span className="truncate max-w-[180px]">
              {activeTicket.attendee_name}
            </span>
            <Badge
              variant="outline"
              className={cn(
                "text-[9px]",
                activeTicket.ticket_type === "adult" &&
                  "text-primary border-primary/40",
              )}
            >
              {activeTicket.ticket_type}
            </Badge>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────

function UnseatDropZone({ active }: { active: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: UNSEAT_ID });
  const hot = isOver || active;
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-md border-2 border-dashed p-3 flex items-center justify-center gap-2 text-xs font-display tracking-wider uppercase transition-colors",
        hot
          ? "border-destructive bg-destructive/10 text-destructive"
          : "border-muted-foreground/30 text-muted-foreground",
      )}
    >
      <UserMinus className="h-3.5 w-3.5" />
      Drop here to unseat
    </div>
  );
}

function DraggableTicket({
  ticket,
  compact,
}: {
  ticket: AdminTicket;
  compact?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `ticket:${ticket.id}`,
  });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      title={ticket.attendee_name}
      className={cn(
        "flex items-center gap-1.5 rounded-md border border-border bg-card/80 px-2 py-1 cursor-grab active:cursor-grabbing select-none transition-all touch-none w-full min-w-0 overflow-hidden hover:relative hover:z-50 hover:overflow-visible hover:bg-card hover:border-primary/60 hover:shadow-lg hover:shadow-primary/20",
        compact ? "text-[11px]" : "text-xs",
        isDragging && "opacity-30",
      )}
    >
      <GripVertical className="h-3 w-3 text-muted-foreground shrink-0" />
      <span className="truncate flex-1 group-hover:overflow-visible">{ticket.attendee_name}</span>
      <Badge
        variant="outline"
        className={cn(
          "text-[9px] px-1 py-0",
          ticket.ticket_type === "adult" && "text-primary border-primary/40",
        )}
      >
        {ticket.ticket_type === "adult" ? "A" : "C"}
      </Badge>
    </div>
  );
}

function DnDTable({
  table,
  seatsPerTable,
  ticketsBySeat,
  allocMap,
  overId,
  activeTicketId,
}: {
  table: PresentationTable;
  seatsPerTable: number;
  ticketsBySeat: Map<string, AdminTicket>;
  allocMap: Map<string, AdminAllocation>;
  overId: string | null;
  activeTicketId: string | null;
}) {
  const seatNums = Array.from({ length: seatsPerTable }, (_, i) => i + 1);
  const taken = seatNums.filter((n) =>
    ticketsBySeat.has(seatId(table.id, n)),
  ).length;

  return (
    <Card
      className={cn(
        "p-3 transition-colors",
        table.is_locked
          ? "border-muted-foreground/30 bg-muted/10"
          : taken === seatsPerTable
          ? "border-destructive/40"
          : "border-border",
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {table.is_locked && (
            <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
          )}
          <p className="font-display font-bold text-sm truncate">
            {table.label ?? `Table ${table.table_number}`}
          </p>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "text-[10px]",
            taken === seatsPerTable && "text-destructive border-destructive/40",
            taken === 0 && "text-muted-foreground",
          )}
        >
          {taken}/{seatsPerTable}
        </Badge>
      </div>
      {table.age_group && (
        <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-2">
          {table.age_group}
        </p>
      )}
      <div className="grid grid-cols-2 gap-1.5">
        {seatNums.map((n) => (
          <SeatSlot
            key={n}
            tableId={table.id}
            seatNumber={n}
            occupant={ticketsBySeat.get(seatId(table.id, n)) ?? null}
            allocMap={allocMap}
            overId={overId}
            activeTicketId={activeTicketId}
          />
        ))}
      </div>
    </Card>
  );
}

function SeatSlot({
  tableId,
  seatNumber,
  occupant,
  allocMap,
  overId,
  activeTicketId,
}: {
  tableId: string;
  seatNumber: number;
  occupant: AdminTicket | null;
  allocMap: Map<string, AdminAllocation>;
  overId: string | null;
  activeTicketId: string | null;
}) {
  const id = seatId(tableId, seatNumber);
  const { setNodeRef, isOver } = useDroppable({ id });
  const hot = isOver || overId === id;
  const isSelf = occupant && activeTicketId === occupant.id;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[36px] min-w-0 overflow-hidden rounded border px-1.5 py-1 text-[10px] flex items-center gap-1 transition-colors",
        hot
          ? occupant
            ? "border-amber-400 bg-amber-400/15"
            : "border-primary bg-primary/15"
          : occupant
          ? "border-border bg-card/60"
          : "border-dashed border-muted-foreground/30 bg-background/40",
        isSelf && "opacity-30",
      )}
    >
      <span className="text-muted-foreground shrink-0">{seatNumber}</span>
      {occupant ? (
        <div className="min-w-0 flex-1">
          <DraggableTicket ticket={occupant} compact />
        </div>
      ) : (
        <span className="text-muted-foreground/50 italic ml-auto mr-auto">
          {hot ? "drop" : "empty"}
        </span>
      )}
    </div>
  );
}
