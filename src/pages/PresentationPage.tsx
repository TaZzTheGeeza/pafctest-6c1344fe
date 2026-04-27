import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  MapPin,
  Shirt,
  Sparkles,
  Ticket,
  Users,
  Plus,
  Minus,
  Trash2,
  Loader2,
  LogIn,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  SeatingPlan,
  type PresentationTable,
  type PresentationTicketSeat,
} from "@/components/presentation/SeatingPlan";
import { SeatPicker } from "@/components/presentation/SeatPicker";

interface PresentationEvent {
  id: string;
  title: string;
  event_date: string;
  doors_open_time: string;
  start_time: string;
  venue: string;
  venue_address: string | null;
  dress_code: string | null;
  description: string | null;
  seats_per_table: number;
}

interface Allocation {
  id: string;
  event_id: string;
  user_id: string;
  player_name: string;
  team_slug: string | null;
  max_adults: number;
  max_children: number;
  notes: string | null;
}

export default function PresentationPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  // Admin check (for shortcut button)
  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin-presentation", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.rpc("has_role", {
        _user_id: user!.id,
        _role: "admin",
      });
      return !!data;
    },
  });

  // ── Event ────────────────────────────────────────────
  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ["presentation-event"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("presentation_events")
        .select("*")
        .eq("is_active", true)
        .order("event_date", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as PresentationEvent | null;
    },
  });

  // ── Tables ───────────────────────────────────────────
  const { data: tables = [] } = useQuery({
    queryKey: ["presentation-tables", event?.id],
    enabled: !!event?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("presentation_tables")
        .select("*")
        .eq("event_id", event!.id)
        .order("table_number");
      if (error) throw error;
      return (data ?? []) as PresentationTable[];
    },
  });

  // ── All tickets (public, for seat occupancy) ─────────
  const { data: allTickets = [] } = useQuery({
    queryKey: ["presentation-tickets-all", event?.id],
    enabled: !!event?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("presentation_tickets")
        .select("id,table_id,seat_number,attendee_name,ticket_type,user_id,allocation_id")
        .eq("event_id", event!.id);
      if (error) throw error;
      return (data ?? []) as (PresentationTicketSeat & { allocation_id: string })[];
    },
  });

  // ── User allocation ──────────────────────────────────
  const { data: myAllocation, isLoading: allocLoading } = useQuery({
    queryKey: ["presentation-allocation", event?.id, user?.id],
    enabled: !!event?.id && !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("presentation_allocations")
        .select("*")
        .eq("event_id", event!.id)
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as Allocation | null;
    },
  });

  const myTickets = useMemo(
    () => allTickets.filter((t) => t.user_id === user?.id),
    [allTickets, user?.id],
  );

  const refreshAll = () => {
    qc.invalidateQueries({ queryKey: ["presentation-tickets-all"] });
    qc.invalidateQueries({ queryKey: ["presentation-allocation"] });
  };

  if (eventLoading) {
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

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-32 pb-16 container mx-auto px-4 text-center">
          <h1 className="text-3xl font-display font-bold mb-2">No upcoming presentation</h1>
          <p className="text-muted-foreground">Check back soon!</p>
        </main>
        <Footer />
      </div>
    );
  }

  const eventDate = new Date(event.event_date);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-20">
        {/* HERO */}
        <section className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card p-8 md:p-12 mb-8"
          >
            <div className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-display tracking-[0.2em] uppercase text-primary/80 bg-primary/10 border border-primary/30 px-3 py-1 rounded-full">
              <Sparkles className="h-3 w-3" />
              Main Event
            </div>
            <p className="text-xs font-display tracking-[0.3em] uppercase text-primary/80 mb-3">
              Peterborough Athletic FC
            </p>
            <h1 className="text-3xl md:text-5xl font-bold font-display mb-4">
              <span className="text-gold-gradient">{event.title}</span>
            </h1>
            {event.description && (
              <p className="text-muted-foreground max-w-2xl mb-8">{event.description}</p>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <InfoTile icon={Calendar} label="Date" value={format(eventDate, "EEE d MMM yyyy")} />
              <InfoTile icon={Clock} label="Doors" value={`${event.doors_open_time}`} sub={`Start ${event.start_time}`} />
              <InfoTile icon={MapPin} label="Venue" value={event.venue} sub={event.venue_address ?? undefined} />
              <InfoTile icon={Shirt} label="Dress Code" value={event.dress_code ?? "Smart"} />
            </div>
            {isAdmin && (
              <Button asChild variant="outline" size="sm">
                <Link to="/presentation-admin">
                  <ShieldAlert className="h-4 w-4 mr-2" />
                  Admin: manage seating
                </Link>
              </Button>
            )}
          </motion.div>
        </section>

        <section className="container mx-auto px-4">
          <Tabs defaultValue="tickets" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="tickets">
                <Ticket className="h-4 w-4 mr-2" />
                My Tickets
              </TabsTrigger>
              <TabsTrigger value="seating">
                <Users className="h-4 w-4 mr-2" />
                Seating Plan
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tickets">
              <TicketsPanel
                event={event}
                user={user}
                authLoading={authLoading}
                allocation={myAllocation ?? null}
                allocLoading={allocLoading}
                myTickets={myTickets}
                tables={tables}
                allTickets={allTickets}
                onRefresh={refreshAll}
                onSignIn={() => navigate("/auth?redirect=/presentation")}
              />
            </TabsContent>

            <TabsContent value="seating">
              <div className="max-w-5xl mx-auto">
                <SeatingPlan
                  tables={tables}
                  tickets={allTickets}
                  highlightUserId={user?.id ?? null}
                  seatsPerTable={event.seats_per_table}
                />
                <p className="text-center text-xs text-muted-foreground mt-4">
                  This is a live view of which tables are filling up. Pick your seats from the
                  &quot;My Tickets&quot; tab.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </main>
      <Footer />
    </div>
  );
}

// ────────────────────────────────────────────────────────
// Subcomponents
// ────────────────────────────────────────────────────────

function InfoTile({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: any;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-card/60 border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 text-[10px] font-display tracking-[0.2em] uppercase text-muted-foreground mb-2">
        <Icon className="h-3.5 w-3.5 text-primary" />
        {label}
      </div>
      <p className="font-display font-bold text-foreground leading-tight">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function TicketsPanel({
  event,
  user,
  authLoading,
  allocation,
  allocLoading,
  myTickets,
  tables,
  allTickets,
  onRefresh,
  onSignIn,
}: {
  event: PresentationEvent;
  user: any;
  authLoading: boolean;
  allocation: Allocation | null;
  allocLoading: boolean;
  myTickets: (PresentationTicketSeat & { allocation_id: string })[];
  tables: PresentationTable[];
  allTickets: (PresentationTicketSeat & { allocation_id: string })[];
  onRefresh: () => void;
  onSignIn: () => void;
}) {
  if (authLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <Card className="max-w-xl mx-auto p-8 text-center">
        <LogIn className="h-12 w-12 text-primary mx-auto mb-4" />
        <h2 className="text-xl font-display font-bold mb-2">Sign in to claim your tickets</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Tickets are reserved for registered club families. Please sign in with your parent or
          coach account.
        </p>
        <Button onClick={onSignIn} className="w-full">
          <LogIn className="h-4 w-4 mr-2" /> Sign In
        </Button>
      </Card>
    );
  }

  if (allocLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!allocation) {
    return <ClaimAllocationForm event={event} userId={user.id} onCreated={onRefresh} />;
  }

  return (
    <ManageTickets
      event={event}
      allocation={allocation}
      myTickets={myTickets}
      tables={tables}
      allTickets={allTickets}
      onRefresh={onRefresh}
    />
  );
}

function ClaimAllocationForm({
  event,
  userId,
  onCreated,
}: {
  event: PresentationEvent;
  userId: string;
  onCreated: () => void;
}) {
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [adults, setAdults] = useState(2);
  // Children count INCLUDES the player themselves. Min 1 (just the player), max 2.
  const [children, setChildren] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Children linked to this parent via the guardians table
  const { data: guardians = [], isLoading: guardiansLoading } = useQuery({
    queryKey: ["my-guardians", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("guardians")
        .select("player_name, team_slug, status")
        .eq("parent_user_id", userId)
        .eq("status", "active");
      return (data ?? []).filter((g) => g.player_name && g.player_name.trim().length > 0);
    },
  });

  // Allocations already claimed by this parent (one per child)
  const { data: existingAllocations = [] } = useQuery({
    queryKey: ["my-allocations", event.id, userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("presentation_allocations")
        .select("player_name")
        .eq("event_id", event.id)
        .eq("user_id", userId);
      return data ?? [];
    },
  });

  const claimedNames = new Set(existingAllocations.map((a) => a.player_name));
  const availableChildren = guardians.filter((g) => !claimedNames.has(g.player_name));

  // Auto-select if exactly one available child
  useEffect(() => {
    if (availableChildren.length === 1 && !selectedPlayer) {
      setSelectedPlayer(availableChildren[0].player_name);
    }
  }, [availableChildren, selectedPlayer]);

  const selectedGuardian = availableChildren.find((g) => g.player_name === selectedPlayer);

  const handleSubmit = async () => {
    if (!selectedPlayer) {
      toast.error("Please select which child this ticket is for");
      return;
    }
    if (adults < 0 || adults > 2 || children < 0 || children > 3) {
      toast.error("Maximum 2 adults and 3 children per family allocation");
      return;
    }
    if (adults + children === 0) {
      toast.error("Please claim at least one ticket");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("presentation_allocations").insert({
        event_id: event.id,
        user_id: userId,
        player_name: selectedPlayer,
        team_slug: selectedGuardian?.team_slug ?? null,
        max_adults: adults,
        max_children: children,
      });
      if (error) throw error;
      toast.success("Tickets claimed! Now pick your seats.");
      onCreated();
    } catch (err: any) {
      toast.error(err.message ?? "Could not claim tickets");
    } finally {
      setSubmitting(false);
    }
  };

  if (guardiansLoading) {
    return (
      <Card className="max-w-2xl mx-auto p-12 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Card>
    );
  }

  // No linked children — block claim and direct them to link via the Hub
  if (guardians.length === 0) {
    return (
      <Card className="max-w-2xl mx-auto p-8 text-center">
        <ShieldAlert className="h-12 w-12 text-primary mx-auto mb-4" />
        <h2 className="text-xl font-display font-bold mb-2">No registered player linked to your account</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Family tickets are allocated per registered player. Please link your child to your
          account from the PAFC Hub before claiming. If you believe this is a mistake, contact
          a club admin.
        </p>
        <Button asChild className="w-full">
          <Link to="/hub">Go to PAFC Hub</Link>
        </Button>
      </Card>
    );
  }

  // All linked children already have tickets claimed
  if (availableChildren.length === 0) {
    return (
      <Card className="max-w-2xl mx-auto p-8 text-center">
        <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-4" />
        <h2 className="text-xl font-display font-bold mb-2">All your players have tickets</h2>
        <p className="text-sm text-muted-foreground">
          You&apos;ve already claimed a family ticket for every child linked to your account.
          Switch to the seating plan to pick or update seats.
        </p>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto p-6 md:p-8">
      <div className="text-center mb-6">
        <Ticket className="h-10 w-10 text-primary mx-auto mb-3" />
        <h2 className="text-2xl font-display font-bold mb-2">Claim your family tickets</h2>
        <p className="text-sm text-muted-foreground">
          Each player is allocated <strong>1 family ticket</strong> covering up to{" "}
          <strong>2 adults & 3 children</strong> (the player counts as one of the children).
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <Label>Claiming for</Label>
          {availableChildren.length === 1 ? (
            <div className="mt-2 flex items-center justify-between rounded-lg border border-primary/40 bg-primary/5 px-4 py-3">
              <div>
                <p className="font-display font-bold">{availableChildren[0].player_name}</p>
                {availableChildren[0].team_slug && (
                  <p className="text-xs text-muted-foreground">{availableChildren[0].team_slug}</p>
                )}
              </div>
              <span className="text-[10px] font-display tracking-[0.2em] uppercase text-primary">
                Linked player
              </span>
            </div>
          ) : (
            <RadioGroup
              value={selectedPlayer}
              onValueChange={setSelectedPlayer}
              className="mt-2 space-y-2"
            >
              {availableChildren.map((g) => (
                <label
                  key={g.player_name}
                  htmlFor={`player-${g.player_name}`}
                  className="flex items-center gap-3 rounded-lg border border-border hover:border-primary/40 px-4 py-3 cursor-pointer transition-colors"
                >
                  <RadioGroupItem value={g.player_name} id={`player-${g.player_name}`} />
                  <div className="flex-1">
                    <p className="font-display font-bold">{g.player_name}</p>
                    {g.team_slug && (
                      <p className="text-xs text-muted-foreground">{g.team_slug}</p>
                    )}
                  </div>
                </label>
              ))}
            </RadioGroup>
          )}
          {claimedNames.size > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              {claimedNames.size} of your linked player(s) already have a family ticket claimed.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Counter label="Adults" value={adults} setValue={setAdults} max={2} />
          <Counter label="Children" value={children} setValue={setChildren} max={3} />
        </div>

        <p className="text-xs text-muted-foreground">
          Need fewer tickets? Just lower the count above. Need more? Contact a club admin.
        </p>

        <Button
          onClick={handleSubmit}
          disabled={submitting || !selectedPlayer}
          className="w-full"
          size="lg"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Ticket className="h-4 w-4 mr-2" />
          )}
          Claim {adults + children} ticket{adults + children === 1 ? "" : "s"}
        </Button>
      </div>
    </Card>
  );
}

function Counter({
  label,
  value,
  setValue,
  max,
}: {
  label: string;
  value: number;
  setValue: (n: number) => void;
  max: number;
}) {
  return (
    <div>
      <Label>{label} (max {max})</Label>
      <div className="flex items-center gap-2 mt-2">
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={() => setValue(Math.max(0, value - 1))}
          disabled={value <= 0}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <div className="flex-1 text-center font-display text-2xl font-bold">{value}</div>
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={() => setValue(Math.min(max, value + 1))}
          disabled={value >= max}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function ManageTickets({
  event,
  allocation,
  myTickets,
  tables,
  allTickets,
  onRefresh,
}: {
  event: PresentationEvent;
  allocation: Allocation;
  myTickets: (PresentationTicketSeat & { allocation_id: string })[];
  tables: PresentationTable[];
  allTickets: (PresentationTicketSeat & { allocation_id: string })[];
  onRefresh: () => void;
}) {
  const adultCount = myTickets.filter((t) => t.ticket_type === "adult").length;
  const childCount = myTickets.filter((t) => t.ticket_type === "child").length;
  const adultsRemaining = allocation.max_adults - adultCount;
  const childrenRemaining = allocation.max_children - childCount;
  const totalAllocated = allocation.max_adults + allocation.max_children;
  const totalIssued = myTickets.length;

  const [addingType, setAddingType] = useState<"adult" | "child" | null>(null);
  const [seatPickerOpen, setSeatPickerOpen] = useState(false);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Allocation summary */}
      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-xs font-display tracking-[0.2em] uppercase text-muted-foreground mb-1">
              Allocation for
            </p>
            <h2 className="text-2xl font-display font-bold">{allocation.player_name}</h2>
            {allocation.team_slug && (
              <p className="text-sm text-muted-foreground">{allocation.team_slug}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs font-display tracking-[0.2em] uppercase text-muted-foreground mb-1">
              Tickets used
            </p>
            <p className="text-2xl font-display font-bold text-primary">
              {totalIssued} / {totalAllocated}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-card/60 border border-border rounded-lg p-3 text-center">
            <p className="text-[10px] font-display tracking-wider uppercase text-muted-foreground">Adults</p>
            <p className="font-display text-lg font-bold">
              {adultCount} <span className="text-muted-foreground text-sm">/ {allocation.max_adults}</span>
            </p>
          </div>
          <div className="bg-card/60 border border-border rounded-lg p-3 text-center">
            <p className="text-[10px] font-display tracking-wider uppercase text-muted-foreground">Children</p>
            <p className="font-display text-lg font-bold">
              {childCount} <span className="text-muted-foreground text-sm">/ {allocation.max_children}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {adultsRemaining > 0 && (
            <Button onClick={() => setAddingType("adult")} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add adult
            </Button>
          )}
          {childrenRemaining > 0 && (
            <Button onClick={() => setAddingType("child")} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add child
            </Button>
          )}
        </div>
      </Card>

      {/* Tickets list */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold">Your tickets</h3>
          {myTickets.length > 0 && (
            <Button onClick={() => setSeatPickerOpen(true)} size="sm">
              <Users className="h-4 w-4 mr-2" /> Pick seats
            </Button>
          )}
        </div>

        {myTickets.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No tickets added yet. Use the buttons above to add adults & children.
          </p>
        ) : (
          <div className="space-y-2">
            {myTickets.map((t) => {
              const table = tables.find((tb) => tb.id === t.table_id);
              return (
                <TicketRow key={t.id} ticket={t} tableNumber={table?.table_number ?? null} onRefresh={onRefresh} />
              );
            })}
          </div>
        )}
      </Card>

      {addingType && (
        <AddAttendeeDialog
          type={addingType}
          allocation={allocation}
          eventId={event.id}
          onClose={() => setAddingType(null)}
          onAdded={() => {
            setAddingType(null);
            onRefresh();
          }}
        />
      )}

      {seatPickerOpen && (
        <SeatPickerDialog
          event={event}
          tables={tables}
          allTickets={allTickets}
          myTickets={myTickets}
          onClose={() => setSeatPickerOpen(false)}
          onSaved={() => {
            setSeatPickerOpen(false);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}

function TicketRow({
  ticket,
  tableNumber,
  onRefresh,
}: {
  ticket: PresentationTicketSeat & { allocation_id: string };
  tableNumber: number | null;
  onRefresh: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const remove = async () => {
    if (!confirm("Remove this ticket?")) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("presentation_tickets").delete().eq("id", ticket.id);
      if (error) throw error;
      toast.success("Ticket removed");
      onRefresh();
    } catch (err: any) {
      toast.error(err.message ?? "Could not remove ticket");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 p-3 bg-card/60 border border-border rounded-lg">
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={`text-[10px] font-display tracking-wider uppercase px-2 py-0.5 rounded ${
            ticket.ticket_type === "adult"
              ? "bg-primary/15 text-primary border border-primary/30"
              : "bg-secondary text-foreground border border-border"
          }`}
        >
          {ticket.ticket_type}
        </span>
        <p className="font-medium truncate">{ticket.attendee_name}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {tableNumber != null && ticket.seat_number != null ? (
          <span className="text-xs text-primary flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            T{tableNumber} &middot; S{ticket.seat_number}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">No seat</span>
        )}
        <Button
          size="icon"
          variant="ghost"
          onClick={remove}
          disabled={deleting}
          className="h-8 w-8 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function AddAttendeeDialog({
  type,
  allocation,
  eventId,
  onClose,
  onAdded,
}: {
  type: "adult" | "child";
  allocation: Allocation;
  eventId: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!name.trim()) {
      toast.error("Please enter a name");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("presentation_tickets").insert({
        allocation_id: allocation.id,
        event_id: eventId,
        user_id: allocation.user_id,
        ticket_type: type,
        attendee_name: name.trim(),
      });
      if (error) throw error;
      toast.success("Ticket added");
      onAdded();
    } catch (err: any) {
      toast.error(err.message ?? "Could not add ticket");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add {type} ticket</DialogTitle>
          <DialogDescription>
            Enter the name of the {type === "adult" ? "adult" : "child"} attending.
          </DialogDescription>
        </DialogHeader>
        <div>
          <Label htmlFor="att-name">Full name</Label>
          <Input
            id="att-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={type === "adult" ? "e.g. Sarah Smith" : "e.g. Jamie Smith"}
            maxLength={100}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Add ticket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SeatPickerDialog({
  event,
  tables,
  allTickets,
  myTickets,
  onClose,
  onSaved,
}: {
  event: PresentationEvent;
  tables: PresentationTable[];
  allTickets: (PresentationTicketSeat & { allocation_id: string })[];
  myTickets: (PresentationTicketSeat & { allocation_id: string })[];
  onClose: () => void;
  onSaved: () => void;
}) {
  // Step 1: Select a table. Default to existing if any.
  const initialTable = myTickets.find((t) => t.table_id)?.table_id ?? null;
  const [selectedTableId, setSelectedTableId] = useState<string | null>(initialTable);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  // Tickets needing a seat (not yet seated, OR seated at the currently picked table)
  const ticketsToSeat = useMemo(() => {
    return myTickets.filter(
      (t) => !t.table_id || t.table_id === selectedTableId,
    );
  }, [myTickets, selectedTableId]);

  // Already-seated own tickets at the selected table
  const ownAtTable = useMemo(
    () => myTickets.filter((t) => t.table_id === selectedTableId && t.seat_number != null),
    [myTickets, selectedTableId],
  );

  // Initialize selected seats with own existing seats when table changes
  useEffect(() => {
    setSelectedSeats(ownAtTable.map((t) => t.seat_number!).filter(Boolean));
  }, [selectedTableId]);

  const tableSeats = useMemo(() => {
    if (!selectedTableId) return [];
    return allTickets.filter((t) => t.table_id === selectedTableId);
  }, [allTickets, selectedTableId]);

  const selectedTable = tables.find((t) => t.id === selectedTableId);
  const ticketsNeedingSeat = ticketsToSeat.length;

  const toggleSeat = (seatNumber: number) => {
    setSelectedSeats((prev) => {
      if (prev.includes(seatNumber)) return prev.filter((n) => n !== seatNumber);
      if (prev.length >= ticketsNeedingSeat) {
        toast.error(`You only have ${ticketsNeedingSeat} ticket(s) for this table`);
        return prev;
      }
      return [...prev, seatNumber];
    });
  };

  const save = async () => {
    if (!selectedTableId) {
      toast.error("Pick a table first");
      return;
    }
    if (selectedSeats.length === 0) {
      toast.error("Pick at least one seat");
      return;
    }
    setSaving(true);
    try {
      // Sort tickets so already-seated ones get their original seat back if possible
      const ordered = [...ticketsToSeat].sort((a, b) => {
        const aSeated = a.seat_number != null ? 0 : 1;
        const bSeated = b.seat_number != null ? 0 : 1;
        return aSeated - bSeated;
      });

      // Build assignments. Use the user's selected seats in numerical order.
      const seatsToAssign = [...selectedSeats].sort((a, b) => a - b);
      const updates: Promise<any>[] = [];

      for (let i = 0; i < ordered.length; i++) {
        const ticket = ordered[i];
        const seat = seatsToAssign[i] ?? null;
        if (
          ticket.table_id === selectedTableId &&
          ticket.seat_number === seat
        ) continue;
        updates.push(
          (async () => {
            const { error } = await supabase
              .from("presentation_tickets")
              .update({
                table_id: seat != null ? selectedTableId : null,
                seat_number: seat,
              })
              .eq("id", ticket.id);
            if (error) throw error;
          })(),
        );
      }

      await Promise.all(updates);
      toast.success("Seats saved!");
      onSaved();
    } catch (err: any) {
      toast.error(err.message ?? "Could not save seats");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pick your seats</DialogTitle>
          <DialogDescription>
            {!selectedTableId
              ? "Step 1: Choose a table for your family."
              : `Step 2: Pick ${ticketsNeedingSeat} seat${ticketsNeedingSeat === 1 ? "" : "s"} at Table ${selectedTable?.table_number}.`}
          </DialogDescription>
        </DialogHeader>

        {!selectedTableId ? (
          <SeatingPlan
            tables={tables}
            tickets={allTickets}
            selectedTableId={selectedTableId}
            onSelectTable={(id) => setSelectedTableId(id)}
            seatsPerTable={event.seats_per_table}
          />
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedTableId(null)}>
                ← Pick a different table
              </Button>
            </div>
            <SeatPicker
              tableNumber={selectedTable?.table_number ?? 0}
              tableLabel={selectedTable?.label ?? null}
              seatsPerTable={event.seats_per_table}
              takenSeats={tableSeats}
              selectedSeats={selectedSeats}
              ownTickets={ownAtTable}
              onToggleSeat={toggleSeat}
              maxSelectable={ticketsNeedingSeat}
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {selectedTableId && (
            <Button onClick={save} disabled={saving || selectedSeats.length === 0}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save seats
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
