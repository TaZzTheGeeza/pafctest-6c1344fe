import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trophy, Ticket, Loader2, Sparkles, Lock, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import NumberPicker from "@/components/raffle/NumberPicker";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { SWEEPSTAKE_STATUSES, type SweepstakeStatus } from "@/lib/worldCupTeams";
import { cn } from "@/lib/utils";

interface Raffle {
  id: string;
  title: string;
  description: string | null;
  prize_description: string;
  ticket_price_cents: number;
  currency: string;
  max_tickets: number | null;
  number_range: number | null;
  status: string;
  sweepstake_mode: boolean;
  teams_revealed: boolean;
  prize_winner_pence: number | null;
  prize_runner_up_pence: number | null;
  prize_third_pence: number | null;
  prize_golden_boot_pence: number | null;
}

interface Assignment {
  ticket_number: number;
  country_name: string;
  flag_emoji: string;
  group_letter: string | null;
  status: SweepstakeStatus;
}

interface SoldTicket {
  ticket_number: number;
  buyer_name: string;
  buyer_email: string;
  payment_status: string;
}

const statusMeta = (status: string) =>
  SWEEPSTAKE_STATUSES.find((s) => s.value === status) ?? SWEEPSTAKE_STATUSES[0];

const formatGBP = (pence?: number | null) =>
  pence == null ? null : `£${(pence / 100).toFixed(0)}`;

const WorldCupSweepstakePage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [tickets, setTickets] = useState<SoldTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", phone: "", selectedNumbers: [] as number[] });
  const [purchasing, setPurchasing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [claimingFree, setClaimingFree] = useState(false);

  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  useEffect(() => {
    const brId = searchParams.get("br");
    if (searchParams.get("success") === "true" && brId) {
      supabase.functions.invoke("verify-raffle-payment", { body: { billingRequestId: brId } })
        .then(() => toast.success("Payment received! Your sweepstake tickets are confirmed.", { duration: 6000 }))
        .catch(() => toast.success("Direct Debit set up! Tickets confirmed shortly.", { duration: 6000 }));
    }
    if (searchParams.get("cancelled") === "true") toast.error("Payment cancelled.");
    fetchData();
  }, [searchParams]);

  useEffect(() => {
    if (user?.email) setForm((f) => ({ ...f, email: f.email || user.email! }));
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    const { data: r } = await supabase
      .from("raffles")
      .select("*")
      .eq("sweepstake_mode", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!r) {
      setRaffle(null);
      setLoading(false);
      return;
    }
    setRaffle(r as Raffle);

    const [{ data: a }, { data: t }] = await Promise.all([
      supabase.from("sweepstake_team_assignments").select("*").eq("raffle_id", r.id).order("ticket_number"),
      supabase
        .from("raffle_tickets")
        .select("ticket_number, buyer_name, buyer_email, payment_status")
        .eq("raffle_id", r.id)
        .in("payment_status", ["paid", "pending"]),
    ]);

    setAssignments((a || []) as Assignment[]);
    setTickets((t || []) as SoldTicket[]);
    setLoading(false);
  };

  const takenNumbers = useMemo(() => tickets.map((t) => t.ticket_number), [tickets]);

  const ticketByNumber = useMemo(() => {
    const m = new Map<number, SoldTicket>();
    tickets.forEach((t) => m.set(t.ticket_number, t));
    return m;
  }, [tickets]);

  const assignmentByNumber = useMemo(() => {
    const m = new Map<number, Assignment>();
    assignments.forEach((a) => m.set(a.ticket_number, a));
    return m;
  }, [assignments]);

  const myTickets = useMemo(() => {
    if (!user?.email) return [];
    return tickets
      .filter((t) => t.buyer_email.toLowerCase() === user.email!.toLowerCase())
      .map((t) => ({ ...t, team: assignmentByNumber.get(t.ticket_number) }));
  }, [tickets, user, assignmentByNumber]);

  const groupedByLetter = useMemo(() => {
    if (!raffle?.teams_revealed) return {} as Record<string, Assignment[]>;
    const groups: Record<string, Assignment[]> = {};
    assignments.forEach((a) => {
      const key = a.group_letter || "?";
      if (!groups[key]) groups[key] = [];
      groups[key].push(a);
    });
    Object.keys(groups).forEach((k) => groups[k].sort((x, y) => x.country_name.localeCompare(y.country_name)));
    return groups;
  }, [assignments, raffle?.teams_revealed]);

  const handlePurchase = async () => {
    if (!raffle) return;
    if (!form.name.trim() || !form.email.trim() || form.selectedNumbers.length === 0) {
      toast.error("Please enter your details and pick at least one number");
      return;
    }
    setPurchasing(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-raffle-checkout", {
        body: {
          raffleId: raffle.id,
          buyerName: form.name,
          buyerEmail: form.email,
          buyerPhone: form.phone,
          chosenNumbers: form.selectedNumbers,
        },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (e: any) {
      toast.error(e.message || "Could not start checkout");
    } finally {
      setPurchasing(false);
    }
  };

  const handleClaimFree = async () => {
    if (!raffle || form.selectedNumbers.length === 0) {
      toast.error("Pick at least one number to claim");
      return;
    }
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Enter a name and email");
      return;
    }
    setClaimingFree(true);
    try {
      const rows = form.selectedNumbers.map((n) => ({
        raffle_id: raffle.id,
        ticket_number: n,
        buyer_name: form.name,
        buyer_email: form.email,
        buyer_phone: form.phone || null,
        payment_status: "paid",
      }));
      const { error } = await supabase.from("raffle_tickets").insert(rows);
      if (error) throw error;
      toast.success(`Claimed ${rows.length} free test ticket${rows.length === 1 ? "" : "s"}!`);
      setForm({ ...form, selectedNumbers: [] });
      fetchData();
    } catch (e: any) {
      toast.error(e.message || "Could not claim test ticket");
    } finally {
      setClaimingFree(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        <Footer />
      </div>
    );
  }

  if (!raffle || raffle.status !== "active") {
    return (
      <div className="min-h-screen bg-background">
        <SEO title="World Cup 2026 Sweepstake | PAFC" description="Club fundraising sweepstake for the FIFA World Cup 2026." />
        <Navbar />
        <main className="container mx-auto px-4 pt-32 pb-20 text-center">
          <Trophy className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="font-display text-4xl font-black mb-2">World Cup 2026 Sweepstake</h1>
          <p className="text-muted-foreground">Coming soon — check back shortly.</p>
        </main>
        <Footer />
      </div>
    );
  }

  const totalPot = raffle.ticket_price_cents * (raffle.max_tickets || 48);
  const soldCount = tickets.filter((t) => t.payment_status === "paid").length;

  return (
    <div className="min-h-screen bg-background">
      <SEO title="World Cup 2026 Sweepstake | PAFC" description="48 teams, 48 tickets. Pick a number, get a country, win big when they lift the trophy." />
      <Navbar />
      <main className="container mx-auto px-4 pt-28 pb-20 max-w-6xl">
        {/* Hero */}
        <section className="text-center mb-12">
          <Badge className="mb-4 bg-primary/20 text-primary border-primary/30 font-display tracking-widest">FUNDRAISER • SUMMER 2026</Badge>
          <h1 className="font-display text-5xl sm:text-6xl font-black tracking-tight mb-3">
            {raffle.title}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{raffle.description}</p>
        </section>

        {/* Prize tiers */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
          {[
            { label: "Champion 🏆", amt: raffle.prize_winner_pence },
            { label: "Runner-up 🥈", amt: raffle.prize_runner_up_pence },
            { label: "3rd Place 🥉", amt: raffle.prize_third_pence },
            { label: "Golden Boot ⚽", amt: raffle.prize_golden_boot_pence },
          ].map((p) => (
            <div key={p.label} className="bg-card/60 backdrop-blur rounded-xl p-5 text-center">
              <div className="text-xs font-display tracking-widest text-muted-foreground uppercase mb-2">{p.label}</div>
              <div className="text-3xl font-display font-black text-primary">{formatGBP(p.amt) ?? "TBC"}</div>
            </div>
          ))}
        </section>

        {/* My Team panel (logged-in buyers) */}
        {myTickets.length > 0 && (
          <section className="mb-12">
            <h2 className="font-display text-2xl font-bold mb-4 flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" /> Your Sweepstake
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {myTickets.map((t) => {
                const meta = t.team ? statusMeta(t.team.status) : null;
                return (
                  <div key={t.ticket_number} className="bg-card/80 rounded-xl p-4 border border-primary/20">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-display tracking-widest text-muted-foreground">TICKET #{t.ticket_number}</div>
                      {t.payment_status === "pending" && <Badge variant="outline" className="text-xs">Pending</Badge>}
                    </div>
                    {t.payment_status !== "paid" ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Lock className="h-4 w-4" />
                        <span className="text-sm">Team revealed once payment is confirmed</span>
                      </div>
                    ) : raffle.teams_revealed && t.team ? (
                      <>
                        <div className="text-3xl mb-1">{t.team.flag_emoji}</div>
                        <div className="font-display font-bold text-xl">{t.team.country_name}</div>
                        <div className="text-xs text-muted-foreground mb-2">Group {t.team.group_letter}</div>
                        {meta && <Badge className={cn("text-xs", meta.color)}>{meta.label}</Badge>}
                      </>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Lock className="h-4 w-4" /> <span className="text-sm">Team revealed soon</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Tournament grid */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl font-bold">
              {raffle.teams_revealed ? "Tournament Board" : "The Draw"}
            </h2>
            <div className="text-sm text-muted-foreground">{soldCount} / {raffle.max_tickets || 48} tickets sold</div>
          </div>

          {raffle.teams_revealed && Object.keys(groupedByLetter).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.keys(groupedByLetter).sort().map((letter) => (
                <div key={letter} className="bg-card/60 rounded-xl p-4">
                  <div className="font-display font-black text-lg mb-3 text-primary">GROUP {letter}</div>
                  <div className="space-y-2">
                    {groupedByLetter[letter].map((a) => {
                      const ticket = ticketByNumber.get(a.ticket_number);
                      const meta = statusMeta(a.status);
                      const dimmed = a.status === "eliminated";
                      return (
                        <div key={a.ticket_number} className={cn("flex items-center gap-3 p-2 rounded-lg bg-background/40", dimmed && "opacity-50")}>
                          <span className="text-2xl">{a.flag_emoji}</span>
                          <div className="flex-1 min-w-0">
                            <div className="font-display font-bold truncate">{a.country_name}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {ticket && ticket.payment_status === "paid" ? ticket.buyer_name : "Available"}
                              </div>

                          </div>
                          <Badge className={cn("text-[10px] shrink-0", meta.color)}>{meta.label.split(" ")[0]}</Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
              {Array.from({ length: raffle.number_range || 48 }, (_, i) => i + 1).map((n) => {
                const taken = takenNumbers.includes(n);
                const ticket = ticketByNumber.get(n);
                return (
                  <div
                    key={n}
                    className={cn(
                      "aspect-square rounded-lg flex flex-col items-center justify-center text-sm font-display font-bold transition",
                      taken ? "bg-primary/20 text-primary" : "bg-card/40 text-muted-foreground"
                    )}
                    title={ticket ? `${ticket.buyer_name}` : "Available"}
                  >
                    <span>{n}</span>
                    {taken && <Lock className="h-3 w-3 mt-0.5 opacity-60" />}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Purchase form */}
        {soldCount < (raffle.max_tickets || 48) && (
          <section>
            <Card className="border-primary/30 bg-card/60 backdrop-blur">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-primary" />
                  <h2 className="font-display text-2xl font-black">
                    Buy a Ticket — £{(raffle.ticket_price_cents / 100).toFixed(2)}
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Pick a number 1–{raffle.number_range || 48}. {raffle.teams_revealed ? "Your team is shown on the board." : "Teams will be revealed once all 48 World Cup qualifiers are confirmed."}
                </p>
                <div className="grid md:grid-cols-3 gap-3">
                  <div>
                    <Label>Name</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your full name" />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
                  </div>
                  <div>
                    <Label>Phone (optional)</Label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                </div>
                <NumberPicker
                  numberRange={raffle.number_range || 48}
                  takenNumbers={takenNumbers}
                  selectedNumbers={form.selectedNumbers}
                  onSelectionChange={(n) => setForm({ ...form, selectedNumbers: n })}
                />
                <div className="flex items-center justify-between pt-2">
                  <div className="text-sm text-muted-foreground">
                    {form.selectedNumbers.length} ticket{form.selectedNumbers.length === 1 ? "" : "s"} • £
                    {((form.selectedNumbers.length * raffle.ticket_price_cents) / 100).toFixed(2)} total
                  </div>
                  <Button onClick={handlePurchase} disabled={purchasing || form.selectedNumbers.length === 0} className="bg-gold-gradient text-primary-foreground font-display">
                    {purchasing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                    Buy Tickets
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default WorldCupSweepstakePage;
