import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Trophy, Ticket, Clock, Gift, Loader2, CheckCircle, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";

interface Raffle {
  id: string;
  title: string;
  description: string | null;
  prize_description: string;
  ticket_price_cents: number;
  currency: string;
  max_tickets: number | null;
  draw_date: string | null;
  status: string;
  winner_name: string | null;
  created_at: string;
}

interface RaffleTicket {
  id: string;
  ticket_number: number;
  buyer_name: string;
  payment_status: string;
}

const RafflePage = () => {
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [tickets, setTickets] = useState<Record<string, RaffleTicket[]>>({});
  const [loading, setLoading] = useState(true);
  const [purchaseForm, setPurchaseForm] = useState<Record<string, { name: string; email: string; phone: string; quantity: number }>>({});
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetchRaffles();
    if (searchParams.get("success") === "true") {
      toast.success("Payment successful! Your raffle tickets have been confirmed.", { duration: 6000 });
    }
    if (searchParams.get("cancelled") === "true") {
      toast.error("Payment cancelled. No tickets were purchased.");
    }
  }, [searchParams]);

  const fetchRaffles = async () => {
    const { data, error } = await supabase
      .from("raffles")
      .select("*")
      .in("status", ["active", "drawn"])
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load raffles");
      return;
    }

    setRaffles(data || []);

    // Fetch ticket counts for each raffle
    for (const raffle of data || []) {
      const { data: ticketData } = await supabase
        .from("raffle_tickets")
        .select("id, ticket_number, buyer_name, payment_status")
        .eq("raffle_id", raffle.id)
        .eq("payment_status", "paid")
        .order("ticket_number", { ascending: true });

      setTickets(prev => ({ ...prev, [raffle.id]: ticketData || [] }));
    }

    setLoading(false);
  };

  const handlePurchase = async (raffleId: string) => {
    const form = purchaseForm[raffleId];
    if (!form?.name || !form?.email || !form?.quantity) {
      toast.error("Please fill in your name, email, and number of tickets");
      return;
    }

    setPurchasing(raffleId);
    try {
      const { data, error } = await supabase.functions.invoke("create-raffle-checkout", {
        body: {
          raffleId,
          quantity: form.quantity,
          buyerName: form.name,
          buyerEmail: form.email,
          buyerPhone: form.phone,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to start checkout");
    } finally {
      setPurchasing(null);
    }
  };

  const updateForm = (raffleId: string, field: string, value: string | number) => {
    setPurchaseForm(prev => ({
      ...prev,
      [raffleId]: { ...prev[raffleId], [field]: value } as any,
    }));
  };

  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
              <Ticket className="h-4 w-4 text-primary" />
              <span className="text-primary font-display text-sm tracking-wider">CLUB FUNDRAISING</span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              <span className="text-gold-gradient">PAFC Raffle</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Support Peterborough Athletic FC by purchasing raffle tickets. All proceeds go directly to the club as a non-profit fundraiser.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : raffles.length === 0 ? (
            <Card className="max-w-lg mx-auto bg-card border-border">
              <CardContent className="pt-6 text-center">
                <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No active raffles at the moment. Check back soon!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8 max-w-3xl mx-auto">
              {raffles.map((raffle) => {
                const soldTickets = tickets[raffle.id]?.length || 0;
                const isDrawn = raffle.status === "drawn";

                return (
                  <Card key={raffle.id} className="bg-card border-border overflow-hidden">
                    <CardHeader className="bg-secondary/50">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="font-display text-2xl">{raffle.title}</CardTitle>
                          {raffle.description && (
                            <CardDescription className="mt-2 text-sm">{raffle.description}</CardDescription>
                          )}
                        </div>
                        <Badge variant={isDrawn ? "secondary" : "default"} className={isDrawn ? "" : "bg-green-600"}>
                          {isDrawn ? "Drawn" : "Active"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                      {/* Prize & Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="flex items-start gap-3">
                          <Trophy className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground font-display tracking-wider">PRIZE</p>
                            <p className="font-medium text-sm">{raffle.prize_description}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Ticket className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground font-display tracking-wider">TICKET PRICE</p>
                            <p className="font-bold text-lg text-primary">{formatPrice(raffle.ticket_price_cents, raffle.currency)}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Clock className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground font-display tracking-wider">DRAW DATE</p>
                            <p className="font-medium text-sm">
                              {raffle.draw_date ? new Date(raffle.draw_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "TBA"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Tickets sold info */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{soldTickets} ticket{soldTickets !== 1 ? "s" : ""} sold{raffle.max_tickets ? ` of ${raffle.max_tickets}` : ""}</span>
                      </div>

                      {/* Winner announcement */}
                      {isDrawn && raffle.winner_name && (
                        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 text-center">
                          <Trophy className="h-8 w-8 text-primary mx-auto mb-2" />
                          <p className="font-display text-lg font-bold text-primary">Winner: {raffle.winner_name}</p>
                          <p className="text-sm text-muted-foreground">Congratulations!</p>
                        </div>
                      )}

                      {/* Purchase form - only for active raffles */}
                      {!isDrawn && (
                        <>
                          <Separator />
                          <div>
                            <h3 className="font-display text-lg mb-4">Buy Tickets</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor={`name-${raffle.id}`}>Full Name *</Label>
                                <Input
                                  id={`name-${raffle.id}`}
                                  placeholder="Your full name"
                                  value={purchaseForm[raffle.id]?.name || ""}
                                  onChange={(e) => updateForm(raffle.id, "name", e.target.value)}
                                />
                              </div>
                              <div>
                                <Label htmlFor={`email-${raffle.id}`}>Email *</Label>
                                <Input
                                  id={`email-${raffle.id}`}
                                  type="email"
                                  placeholder="your@email.com"
                                  value={purchaseForm[raffle.id]?.email || ""}
                                  onChange={(e) => updateForm(raffle.id, "email", e.target.value)}
                                />
                              </div>
                              <div>
                                <Label htmlFor={`phone-${raffle.id}`}>Phone (optional)</Label>
                                <Input
                                  id={`phone-${raffle.id}`}
                                  placeholder="07..."
                                  value={purchaseForm[raffle.id]?.phone || ""}
                                  onChange={(e) => updateForm(raffle.id, "phone", e.target.value)}
                                />
                              </div>
                              <div>
                                <Label htmlFor={`qty-${raffle.id}`}>Number of Tickets *</Label>
                                <Input
                                  id={`qty-${raffle.id}`}
                                  type="number"
                                  min={1}
                                  max={raffle.max_tickets ? raffle.max_tickets - soldTickets : 50}
                                  placeholder="1"
                                  value={purchaseForm[raffle.id]?.quantity || ""}
                                  onChange={(e) => updateForm(raffle.id, "quantity", parseInt(e.target.value) || 0)}
                                />
                              </div>
                            </div>
                            {purchaseForm[raffle.id]?.quantity > 0 && (
                              <p className="mt-3 text-sm text-muted-foreground">
                                Total: <span className="text-primary font-bold">{formatPrice(raffle.ticket_price_cents * (purchaseForm[raffle.id]?.quantity || 0), raffle.currency)}</span>
                              </p>
                            )}
                            <Button
                              onClick={() => handlePurchase(raffle.id)}
                              disabled={purchasing === raffle.id}
                              className="w-full mt-4 bg-gold-gradient text-primary-foreground font-display"
                              size="lg"
                            >
                              {purchasing === raffle.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Ticket className="h-4 w-4 mr-2" />
                                  Buy Tickets
                                </>
                              )}
                            </Button>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RafflePage;
