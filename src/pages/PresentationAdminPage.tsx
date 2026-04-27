import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  Users,
  Ticket,
  Search,
  Lock,
  Unlock,
  Move,
  Trash2,
  Download,
  ShieldAlert,
  Pencil,
  Check,
  X,
  Bell,
  Send,
} from "lucide-react";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  SeatingPlan,
  type PresentationTable,
  type PresentationTicketSeat,
} from "@/components/presentation/SeatingPlan";

interface PresentationEvent {
  id: string;
  title: string;
  event_date: string;
  seats_per_table: number;
}

interface AdminTicket extends PresentationTicketSeat {
  allocation_id: string;
  event_id: string;
  ticket_type: "adult" | "child";
}

interface AdminAllocation {
  id: string;
  user_id: string;
  player_name: string;
  team_slug: string | null;
  max_adults: number;
  max_children: number;
  notes: string | null;
}

export default function PresentationAdminPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  // Check admin role
  const { data: isAdmin, isLoading: roleLoading } = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.rpc("has_role", {
        _user_id: user!.id,
        _role: "admin",
      });
      return !!data;
    },
  });

  const { data: event } = useQuery({
    queryKey: ["presentation-event-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("presentation_events")
        .select("id, title, event_date, seats_per_table")
        .eq("is_active", true)
        .order("event_date", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as PresentationEvent | null;
    },
  });

  const { data: tables = [], refetch: refetchTables } = useQuery({
    queryKey: ["presentation-tables-admin", event?.id],
    enabled: !!event?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("presentation_tables")
        .select("*")
        .eq("event_id", event!.id)
        .order("table_number");
      return (data ?? []) as PresentationTable[];
    },
  });

  const { data: tickets = [], refetch: refetchTickets } = useQuery({
    queryKey: ["presentation-tickets-admin", event?.id],
    enabled: !!event?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("presentation_tickets")
        .select("*")
        .eq("event_id", event!.id);
      return (data ?? []) as AdminTicket[];
    },
  });

  const { data: allocations = [] } = useQuery({
    queryKey: ["presentation-allocations-admin", event?.id],
    enabled: !!event?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("presentation_allocations")
        .select("*")
        .eq("event_id", event!.id)
        .order("player_name");
      return (data ?? []) as AdminAllocation[];
    },
  });

  const refresh = () => {
    refetchTables();
    refetchTickets();
    qc.invalidateQueries({ queryKey: ["presentation-allocations-admin"] });
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-32 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-32 pb-20 container mx-auto px-4 text-center">
          <ShieldAlert className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-display font-bold mb-2">Admins only</h1>
          <p className="text-muted-foreground mb-6">
            You need an admin role to manage presentation seating.
          </p>
          <Button onClick={() => navigate("/presentation")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Presentation
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-32 pb-20 container mx-auto px-4 text-center">
          <p>No active presentation event.</p>
        </main>
        <Footer />
      </div>
    );
  }

  const seatedTickets = tickets.filter((t) => t.table_id && t.seat_number != null);
  const unseatedTickets = tickets.filter((t) => !t.table_id || t.seat_number == null);
  const totalSeats = tables.filter((t) => !t.is_locked).length * event.seats_per_table;
  const lockedSeats = tables.filter((t) => t.is_locked).length * event.seats_per_table;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-20 container mx-auto px-4">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/presentation")}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <h1 className="text-3xl md:text-4xl font-display font-bold mt-2">
              <span className="text-gold-gradient">Presentation Admin</span>
            </h1>
            <p className="text-sm text-muted-foreground">{event.title}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <NotifyAllSeatedButton
              tickets={tickets}
              allocations={allocations}
              tables={tables}
              eventTitle={event.title}
            />
            <Button variant="outline" onClick={() => exportCsv(tickets, allocations, tables)}>
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <StatCard label="Allocations" value={allocations.length} icon={Ticket} />
          <StatCard label="Total tickets" value={tickets.length} icon={Users} />
          <StatCard label="Seated" value={seatedTickets.length} icon={Users} accent />
          <StatCard label="Unseated" value={unseatedTickets.length} icon={Move} warn={unseatedTickets.length > 0} />
          <StatCard label="Capacity" value={`${tickets.length} / ${totalSeats}`} icon={Users} sub={`${lockedSeats} reserved`} />
        </div>

        <Tabs defaultValue="plan" className="w-full">
          <TabsList>
            <TabsTrigger value="plan">Seating Plan</TabsTrigger>
            <TabsTrigger value="people">People</TabsTrigger>
            <TabsTrigger value="tables">Manage Tables</TabsTrigger>
          </TabsList>

          <TabsContent value="plan" className="mt-6">
            <SeatingPlanAdmin
              tables={tables}
              tickets={tickets}
              allocations={allocations}
              seatsPerTable={event.seats_per_table}
              onRefresh={refresh}
            />
          </TabsContent>

          <TabsContent value="people" className="mt-6">
            <PeoplePanel
              tickets={tickets}
              tables={tables}
              allocations={allocations}
              seatsPerTable={event.seats_per_table}
              eventTitle={event.title}
              onRefresh={refresh}
            />
          </TabsContent>

          <TabsContent value="tables" className="mt-6">
            <ManageTablesPanel tables={tables} tickets={tickets} onRefresh={refresh} />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  warn,
  sub,
}: {
  label: string;
  value: any;
  icon: any;
  accent?: boolean;
  warn?: boolean;
  sub?: string;
}) {
  return (
    <Card className={`p-4 ${warn ? "border-destructive/40" : accent ? "border-primary/40" : ""}`}>
      <div className="flex items-center gap-2 text-[10px] font-display tracking-[0.2em] uppercase text-muted-foreground mb-1">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className={`text-2xl font-display font-bold ${warn ? "text-destructive" : accent ? "text-primary" : ""}`}>
        {value}
      </p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </Card>
  );
}

// ── Seating Plan with click-to-inspect-table ─────────────
function SeatingPlanAdmin({
  tables,
  tickets,
  allocations,
  seatsPerTable,
  onRefresh,
}: {
  tables: PresentationTable[];
  tickets: AdminTicket[];
  allocations: AdminAllocation[];
  seatsPerTable: number;
  onRefresh: () => void;
}) {
  const [openTableId, setOpenTableId] = useState<string | null>(null);

  return (
    <>
      <SeatingPlan
        tables={tables}
        tickets={tickets}
        seatsPerTable={seatsPerTable}
        adminMode
        onSelectTable={(id) => setOpenTableId(id)}
      />
      <p className="text-center text-xs text-muted-foreground mt-3">
        Click any table (including reserved) to view occupants and move people.
      </p>
      {openTableId && (
        <TableInspectorDialog
          tableId={openTableId}
          tables={tables}
          tickets={tickets}
          allocations={allocations}
          seatsPerTable={seatsPerTable}
          onClose={() => setOpenTableId(null)}
          onChanged={onRefresh}
        />
      )}
    </>
  );
}

function TableInspectorDialog({
  tableId,
  tables,
  tickets,
  allocations,
  seatsPerTable,
  onClose,
  onChanged,
}: {
  tableId: string;
  tables: PresentationTable[];
  tickets: AdminTicket[];
  allocations: AdminAllocation[];
  seatsPerTable: number;
  onClose: () => void;
  onChanged: () => void;
}) {
  const table = tables.find((t) => t.id === tableId);
  const seated = tickets.filter((t) => t.table_id === tableId);
  const allocMap = new Map(allocations.map((a) => [a.id, a]));

  if (!table) return null;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {table.label ?? `Table ${table.table_number}`}{" "}
            {table.is_locked && (
              <Badge variant="outline" className="ml-2 border-muted-foreground/40 text-muted-foreground">
                <Lock className="h-3 w-3 mr-1" /> Reserved
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {seated.length} / {seatsPerTable} seats taken
            {table.age_group ? ` · ${table.age_group}` : ""}
          </DialogDescription>
        </DialogHeader>

        {seated.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No one seated here yet.</p>
        ) : (
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {seated
              .sort((a, b) => (a.seat_number ?? 0) - (b.seat_number ?? 0))
              .map((t) => {
                const alloc = allocMap.get(t.allocation_id);
                return (
                  <SeatedRow
                    key={t.id}
                    ticket={t}
                    allocationLabel={alloc ? `${alloc.player_name}${alloc.team_slug ? ` · ${alloc.team_slug}` : ""}` : ""}
                    tables={tables}
                    tickets={tickets}
                    seatsPerTable={seatsPerTable}
                    onChanged={onChanged}
                  />
                );
              })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SeatedRow({
  ticket,
  allocationLabel,
  tables,
  tickets,
  seatsPerTable,
  onChanged,
}: {
  ticket: AdminTicket;
  allocationLabel: string;
  tables: PresentationTable[];
  tickets: AdminTicket[];
  seatsPerTable: number;
  onChanged: () => void;
}) {
  const [moving, setMoving] = useState(false);
  return (
    <div className="flex items-center justify-between gap-3 p-3 bg-card/60 border border-border rounded-lg">
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <Badge variant="outline" className="text-[10px]">
            Seat {ticket.seat_number}
          </Badge>
          <Badge
            variant="outline"
            className={ticket.ticket_type === "adult" ? "text-primary border-primary/40" : ""}
          >
            {ticket.ticket_type}
          </Badge>
        </div>
        <p className="font-medium truncate">{ticket.attendee_name}</p>
        {allocationLabel && (
          <p className="text-xs text-muted-foreground truncate">Family of {allocationLabel}</p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button size="sm" variant="outline" onClick={() => setMoving(true)}>
          <Move className="h-3.5 w-3.5 mr-1" /> Move
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-destructive"
          onClick={async () => {
            if (!confirm(`Remove ${ticket.attendee_name} from their seat (keep ticket)?`)) return;
            const { error } = await supabase
              .from("presentation_tickets")
              .update({ table_id: null, seat_number: null })
              .eq("id", ticket.id);
            if (error) toast.error(error.message);
            else {
              toast.success("Seat cleared");
              onChanged();
            }
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      {moving && (
        <MoveSeatDialog
          ticket={ticket}
          tables={tables}
          tickets={tickets}
          seatsPerTable={seatsPerTable}
          onClose={() => setMoving(false)}
          onMoved={() => {
            setMoving(false);
            onChanged();
          }}
        />
      )}
    </div>
  );
}

function MoveSeatDialog({
  ticket,
  tables,
  tickets,
  seatsPerTable,
  onClose,
  onMoved,
}: {
  ticket: AdminTicket;
  tables: PresentationTable[];
  tickets: AdminTicket[];
  seatsPerTable: number;
  onClose: () => void;
  onMoved: () => void;
}) {
  const [tableId, setTableId] = useState<string>(ticket.table_id ?? "");
  const [seatNumber, setSeatNumber] = useState<string>(String(ticket.seat_number ?? ""));
  const [saving, setSaving] = useState(false);

  const takenSeats = useMemo(() => {
    return new Set(
      tickets
        .filter((t) => t.table_id === tableId && t.id !== ticket.id && t.seat_number != null)
        .map((t) => t.seat_number),
    );
  }, [tickets, tableId, ticket.id]);

  const save = async () => {
    if (!tableId) return toast.error("Pick a table");
    const seatNum = parseInt(seatNumber, 10);
    if (!seatNum || seatNum < 1 || seatNum > seatsPerTable) {
      return toast.error(`Seat must be 1-${seatsPerTable}`);
    }
    if (takenSeats.has(seatNum)) {
      return toast.error("That seat is already taken");
    }
    setSaving(true);
    const { error } = await supabase
      .from("presentation_tickets")
      .update({ table_id: tableId, seat_number: seatNum })
      .eq("id", ticket.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Moved!");
    onMoved();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move {ticket.attendee_name}</DialogTitle>
          <DialogDescription>
            Pick a new table & seat. Reserved tables are available in admin mode.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-display tracking-wider uppercase text-muted-foreground">Table</label>
            <Select value={tableId} onValueChange={setTableId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Pick a table" />
              </SelectTrigger>
              <SelectContent>
                {tables.map((t) => {
                  const taken = tickets.filter((tk) => tk.table_id === t.id).length;
                  const name = t.label ?? `Table ${t.table_number}`;
                  return (
                    <SelectItem key={t.id} value={t.id}>
                      {name} ({taken}/{seatsPerTable}){t.is_locked ? " · Reserved" : ""}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-display tracking-wider uppercase text-muted-foreground">
              Seat number (1-{seatsPerTable})
            </label>
            <Input
              type="number"
              min={1}
              max={seatsPerTable}
              value={seatNumber}
              onChange={(e) => setSeatNumber(e.target.value)}
              className="mt-1"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Taken seats at this table: {Array.from(takenSeats).sort((a, b) => (a ?? 0) - (b ?? 0)).join(", ") || "none"}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── People panel: families grouped by allocation ─────────
function PeoplePanel({
  tickets,
  tables,
  allocations,
  seatsPerTable,
  eventTitle,
  onRefresh,
}: {
  tickets: AdminTicket[];
  tables: PresentationTable[];
  allocations: AdminAllocation[];
  seatsPerTable: number;
  eventTitle: string;
  onRefresh: () => void;
}) {
  const [q, setQ] = useState("");
  const [moving, setMoving] = useState<AdminTicket | null>(null);
  const tableByid = useMemo(() => new Map(tables.map((t) => [t.id, t])), [tables]);

  const ticketsByAllocation = useMemo(() => {
    const map = new Map<string, AdminTicket[]>();
    for (const t of tickets) {
      const arr = map.get(t.allocation_id) ?? [];
      arr.push(t);
      map.set(t.allocation_id, arr);
    }
    return map;
  }, [tickets]);

  const filteredAllocations = useMemo(() => {
    const term = q.trim().toLowerCase();
    return allocations
      .filter((a) => {
        if (!term) return true;
        const familyTickets = ticketsByAllocation.get(a.id) ?? [];
        const hay = `${a.player_name} ${a.team_slug ?? ""} ${familyTickets
          .map((t) => t.attendee_name)
          .join(" ")}`.toLowerCase();
        return hay.includes(term);
      })
      .sort((a, b) => a.player_name.localeCompare(b.player_name));
  }, [allocations, q, ticketsByAllocation]);

  return (
    <Card className="p-4 md:p-6">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by player, attendee or team…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
        {filteredAllocations.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No claimed tickets found.
          </p>
        ) : (
          filteredAllocations.map((alloc) => {
            const familyTickets = ticketsByAllocation.get(alloc.id) ?? [];
            const seatedCount = familyTickets.filter(
              (t) => t.table_id && t.seat_number != null,
            ).length;
            const allSeated =
              familyTickets.length > 0 && seatedCount === familyTickets.length;
            return (
              <div
                key={alloc.id}
                className="border border-border rounded-lg bg-card/40 overflow-hidden"
              >
                <div className="flex items-center justify-between gap-3 p-3 bg-muted/20 border-b border-border flex-wrap">
                  <div className="min-w-0">
                    <p className="font-display font-bold truncate">
                      {alloc.player_name}
                      {alloc.team_slug && (
                        <span className="text-xs font-normal text-muted-foreground">
                          {" "}· {alloc.team_slug}
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {familyTickets.length} ticket(s) · {seatedCount}/{familyTickets.length} seated
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        allSeated
                          ? "text-primary border-primary/40"
                          : "text-muted-foreground"
                      }
                    >
                      {allSeated ? "Seats allocated" : "Awaiting allocation"}
                    </Badge>
                    <NotifyFamilyButton
                      allocation={alloc}
                      familyTickets={familyTickets}
                      tables={tables}
                      eventTitle={eventTitle}
                      disabled={familyTickets.length === 0}
                    />
                  </div>
                </div>
                <div className="p-2 space-y-1.5">
                  {familyTickets.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-3">
                      No attendees added yet.
                    </p>
                  ) : (
                    familyTickets.map((t) => {
                      const table = t.table_id ? tableByid.get(t.table_id) : null;
                      return (
                        <div
                          key={t.id}
                          className="flex items-center justify-between gap-3 p-2.5 bg-card/60 border border-border rounded-md"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Badge
                              variant="outline"
                              className={`text-[9px] ${t.ticket_type === "adult" ? "text-primary border-primary/40" : ""}`}
                            >
                              {t.ticket_type}
                            </Badge>
                            <p className="font-medium truncate text-sm">
                              {t.attendee_name}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {table && t.seat_number != null ? (
                              <Badge
                                variant="outline"
                                className="text-primary border-primary/40 text-[10px]"
                              >
                                {table.label ?? `T${table.table_number}`} · S{t.seat_number}
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-destructive border-destructive/40 text-[10px]"
                              >
                                Unseated
                              </Badge>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setMoving(t)}
                            >
                              <Move className="h-3.5 w-3.5 mr-1" /> Move
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {moving && (
        <MoveSeatDialog
          ticket={moving}
          tables={tables}
          tickets={tickets}
          seatsPerTable={seatsPerTable}
          onClose={() => setMoving(null)}
          onMoved={() => {
            setMoving(null);
            onRefresh();
          }}
        />
      )}
    </Card>
  );
}

// ── Manage tables: rename / set age group / lock ────────
function ManageTablesPanel({
  tables,
  tickets,
  onRefresh,
}: {
  tables: PresentationTable[];
  tickets: AdminTicket[];
  onRefresh: () => void;
}) {
  const ticketsByTable = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of tickets) {
      if (!t.table_id) continue;
      m.set(t.table_id, (m.get(t.table_id) ?? 0) + 1);
    }
    return m;
  }, [tickets]);

  const [bulkRow, setBulkRow] = useState<string>("");
  const [bulkAgeGroup, setBulkAgeGroup] = useState<string>("");

  // Group tables by row_index for display
  const rows = useMemo(() => {
    const map = new Map<number, PresentationTable[]>();
    for (const t of tables) {
      const r = t.row_index ?? Math.ceil(t.table_number / 8);
      const arr = map.get(r) ?? [];
      arr.push(t);
      map.set(r, arr);
    }
    for (const arr of map.values()) {
      arr.sort(
        (a, b) =>
          (a.col_index ?? a.table_number) - (b.col_index ?? b.table_number),
      );
    }
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [tables]);

  const applyRowAgeGroup = async () => {
    if (!bulkRow || !bulkAgeGroup.trim()) {
      toast.error("Pick a row and enter an age group");
      return;
    }
    const rowNum = parseInt(bulkRow, 10);
    const ids = (rows.find(([r]) => r === rowNum)?.[1] ?? []).map((t) => t.id);
    if (!ids.length) return;
    const { error } = await supabase
      .from("presentation_tables")
      .update({ age_group: bulkAgeGroup.trim() })
      .in("id", ids);
    if (error) toast.error(error.message);
    else {
      toast.success(`Row ${rowNum} set to ${bulkAgeGroup.trim()}`);
      setBulkAgeGroup("");
      onRefresh();
    }
  };

  return (
    <Card className="p-4 md:p-6">
      <p className="text-xs text-muted-foreground mb-4">
        Rename any table or change its age group. Use the bulk action to quickly
        rename a whole row at once. Lock tables to mark them reserved.
      </p>

      {/* Bulk row → age group */}
      <div className="flex flex-wrap items-end gap-2 mb-6 p-3 rounded-lg border border-primary/30 bg-primary/5">
        <div className="flex-1 min-w-[140px]">
          <label className="text-[10px] font-display tracking-wider uppercase text-muted-foreground">
            Row
          </label>
          <Select value={bulkRow} onValueChange={setBulkRow}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Pick row" />
            </SelectTrigger>
            <SelectContent>
              {rows.map(([r, arr]) => (
                <SelectItem key={r} value={String(r)}>
                  Row {r} ({arr[0]?.age_group ?? "—"})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="text-[10px] font-display tracking-wider uppercase text-muted-foreground">
            New age group label
          </label>
          <Input
            placeholder="e.g. U10s"
            value={bulkAgeGroup}
            onChange={(e) => setBulkAgeGroup(e.target.value)}
            className="mt-1"
          />
        </div>
        <Button onClick={applyRowAgeGroup}>Apply to row</Button>
      </div>

      {/* Per-row table cards */}
      <div className="space-y-6">
        {rows.map(([rowIdx, rowTables]) => (
          <div key={rowIdx}>
            <p className="text-xs font-display tracking-[0.18em] uppercase text-primary mb-2">
              Row {rowIdx} · {rowTables[0]?.age_group ?? "Unassigned"}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
              {rowTables.map((t) => (
                <TableEditorCard
                  key={t.id}
                  table={t}
                  used={ticketsByTable.get(t.id) ?? 0}
                  onRefresh={onRefresh}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function TableEditorCard({
  table,
  used,
  onRefresh,
}: {
  table: PresentationTable;
  used: number;
  onRefresh: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(table.label ?? "");
  const [ageGroup, setAgeGroup] = useState(table.age_group ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("presentation_tables")
      .update({
        label: label.trim() || null,
        age_group: ageGroup.trim() || null,
      })
      .eq("id", table.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Updated");
      setEditing(false);
      onRefresh();
    }
  };

  const toggleLock = async () => {
    const { error } = await supabase
      .from("presentation_tables")
      .update({ is_locked: !table.is_locked })
      .eq("id", table.id);
    if (error) toast.error(error.message);
    else {
      toast.success(table.is_locked ? "Unlocked" : "Locked");
      onRefresh();
    }
  };

  return (
    <div
      className={`p-2 rounded-lg border flex flex-col gap-1.5 ${
        table.is_locked ? "border-muted-foreground/40 bg-muted/20" : "border-border bg-card/40"
      }`}
    >
      {editing ? (
        <div className="space-y-1.5">
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Table name"
            className="h-7 text-xs"
          />
          <Input
            value={ageGroup}
            onChange={(e) => setAgeGroup(e.target.value)}
            placeholder="Age group"
            className="h-7 text-xs"
          />
          <div className="flex gap-1">
            <Button
              size="icon"
              className="h-7 w-7"
              onClick={save}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-7 w-7"
              onClick={() => {
                setEditing(false);
                setLabel(table.label ?? "");
                setAgeGroup(table.age_group ?? "");
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ) : (
        <>
          <p className="font-display font-bold text-xs leading-tight truncate">
            {table.label ?? `Table ${table.table_number}`}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {table.age_group ?? "—"} · {used} seated
            {table.is_locked ? " · reserved" : ""}
          </p>
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="outline"
              className="h-6 w-6"
              onClick={() => setEditing(true)}
              title="Rename / change age group"
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant={table.is_locked ? "default" : "outline"}
              className="h-6 w-6"
              onClick={toggleLock}
              title={table.is_locked ? "Unlock" : "Lock as reserved"}
            >
              {table.is_locked ? (
                <Unlock className="h-3 w-3" />
              ) : (
                <Lock className="h-3 w-3" />
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

// ── CSV export ───────────────────────────────────────────
function exportCsv(
  tickets: AdminTicket[],
  allocations: AdminAllocation[],
  tables: PresentationTable[],
) {
  const allocMap = new Map(allocations.map((a) => [a.id, a]));
  const tableMap = new Map(tables.map((t) => [t.id, t]));
  const rows = [
    ["Player (family)", "Team", "Attendee", "Type", "Table", "Age group", "Seat"],
    ...tickets.map((t) => {
      const a = allocMap.get(t.allocation_id);
      const tb = t.table_id ? tableMap.get(t.table_id) : null;
      return [
        a?.player_name ?? "",
        a?.team_slug ?? "",
        t.attendee_name,
        t.ticket_type,
        tb ? (tb.label ?? `Table ${tb.table_number}`) : "",
        tb?.age_group ?? "",
        t.seat_number != null ? String(t.seat_number) : "",
      ];
    }),
  ];
  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `presentation-seating-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
