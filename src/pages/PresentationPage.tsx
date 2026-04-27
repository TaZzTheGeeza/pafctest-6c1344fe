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
import type { TheatrePlayer } from "@/components/presentation/TheatreBlock";

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

  // ── Players (for theatre block) ──────────────────────
  const { data: theatrePlayers = [] } = useQuery({
    queryKey: ["presentation-theatre-players"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("player_stats")
        .select("id, first_name, shirt_number, age_group");
      if (error) throw error;
      return (data ?? []) as TheatrePlayer[];
    },
  });

  const { data: theatreAssignments = [] } = useQuery({
    queryKey: ["presentation-theatre-assignments", event?.id],
    enabled: !!event?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("presentation_theatre_seats")
        .select("player_stat_id, side, row_index, col_index")
        .eq("event_id", event!.id);
      if (error) throw error;
      return (data ?? []).map((r) => ({
        player_id: r.player_stat_id,
        side: r.side as "left" | "right",
        row_index: r.row_index,
        col_index: r.col_index,
      }));
    },
  });

  // Names of children linked to the current user (highlighted in the theatre block)
  const { data: myChildrenNames = [] } = useQuery({
    queryKey: ["my-children-names", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("guardians")
        .select("player_name")
        .eq("parent_user_id", user!.id)
        .eq("status", "active");
      return (data ?? [])
        .map((g) => (g.player_name ?? "").trim())
        .filter(Boolean)
        // Use first-name only to match player_stats.first_name
        .map((n) => n.split(/\s+/)[0]);
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
                  theatrePlayers={theatrePlayers}
                  theatreAssignments={theatreAssignments}
                  highlightedNames={myChildrenNames}
                />
                <p className="text-center text-xs text-muted-foreground mt-4">
                  Players sit in the theatre blocks flanking the stage (auto-allocated by
                  age group). Guest tables seat 2 adults + 1 child per player. Your child&apos;s
                  chair is highlighted in gold.
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
  // Guest tickets only — the player gets their own seat in the theatre block at the front.
  const [adults, setAdults] = useState(2);
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
    if (adults < 0 || adults > 2 || children < 0 || children > 1) {
      toast.error("Maximum 2 adults and 1 child guest per player");
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
          Your player has a reserved seat in the <strong>front theatre block</strong>. You can
          also bring up to <strong>2 adults &amp; 1 child guest</strong>, who will be seated
          together at a guest table.
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
          <Counter label="Adults" value={adults} setValue={setAdults} min={0} max={2} />
          <Counter
            label="Child guests"
            value={children}
            setValue={setChildren}
            min={0}
            max={1}
            helper="Excludes your player (they sit in the theatre block)"
          />
        </div>

        <p className="text-xs text-muted-foreground">
          Your player&apos;s seat in the theatre block is automatic — you don&apos;t need to add
          a ticket for them. Need a different arrangement? Contact a club admin.
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
  min = 0,
  helper,
}: {
  label: string;
  value: number;
  setValue: (n: number) => void;
  max: number;
  min?: number;
  helper?: string;
}) {
  return (
    <div>
      <Label>
        {label} (max {max})
      </Label>
      <div className="flex items-center gap-2 mt-2">
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={() => setValue(Math.max(min, value - 1))}
          disabled={value <= min}
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
      {helper && (
        <p className="text-[11px] text-muted-foreground mt-1">{helper}</p>
      )}
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
  const allSeated =
    myTickets.length > 0 &&
    myTickets.every((t) => t.table_id && t.seat_number != null);

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
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="font-display font-bold">Your tickets</h3>
          {myTickets.length > 0 && (
            <span
              className={`text-[10px] font-display tracking-[0.2em] uppercase px-2.5 py-1 rounded-full border ${
                allSeated
                  ? "bg-primary/10 text-primary border-primary/40"
                  : "bg-muted/40 text-muted-foreground border-border"
              }`}
            >
              {allSeated ? "Seats allocated" : "Awaiting seat allocation"}
            </span>
          )}
        </div>

        {myTickets.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No tickets added yet. Use the buttons above to add adults & children.
          </p>
        ) : (
          <>
            <div className="space-y-2">
              {myTickets.map((t) => {
                const table = tables.find((tb) => tb.id === t.table_id);
                return (
                  <TicketRow
                    key={t.id}
                    ticket={t}
                    tableNumber={table?.table_number ?? null}
                    tableLabel={table?.label ?? null}
                    onRefresh={onRefresh}
                  />
                );
              })}
            </div>
            <div
              className={`mt-4 rounded-lg border p-3 text-xs ${
                allSeated
                  ? "border-primary/30 bg-primary/5 text-foreground"
                  : "border-border bg-card/40 text-muted-foreground"
              }`}
            >
              {allSeated ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 inline mr-1.5 text-primary" />
                  Your seats have been allocated by the club. See your table & seat number on
                  each ticket above. Please arrive 15 minutes before the start time.
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 inline mr-1.5 text-primary" />
                  Once everyone has claimed their tickets a club admin will allocate your table
                  & seats. You&apos;ll get a notification here as soon as your seats are confirmed.
                </>
              )}
            </div>
          </>
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
    </div>
  );
}

function TicketRow({
  ticket,
  tableNumber,
  tableLabel,
  onRefresh,
}: {
  ticket: PresentationTicketSeat & { allocation_id: string };
  tableNumber: number | null;
  tableLabel: string | null;
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

  const seated = tableNumber != null && ticket.seat_number != null;

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
        {seated ? (
          <span className="text-xs text-primary flex items-center gap-1 font-display">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {tableLabel ?? `Table ${tableNumber}`} &middot; Seat {ticket.seat_number}
          </span>
        ) : (
          <span className="text-[10px] font-display tracking-wider uppercase text-muted-foreground">
            Awaiting seat
          </span>
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
