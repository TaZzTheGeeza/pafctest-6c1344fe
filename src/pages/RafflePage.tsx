import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Trophy, Ticket, Clock, Gift, Loader2, Users, Play, Radio } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import NumberPicker from "@/components/raffle/NumberPicker";
import { AnimatePresence } from "framer-motion";
import RaffleDraw from "@/components/raffle/RaffleDraw";

interface Raffle {
  id: string;
  title: string;
  description: string | null;
  prize_description: string;
  ticket_price_cents: number;
  currency: string;
  max_tickets: number | null;
  number_range: number | null;
  draw_date: string | null;
  status: string;
  winner_name: string | null;
  winner_ticket_id: string | null;
  image_url: string | null;
  created_at: string;
  draw_started_at?: string | null;
  drawn_ticket_number?: number | null;
  draw_video_url?: string | null;
}

interface RaffleTicket {
  ticket_number: number;
  payment_status: string;
}

const RafflePage = () => {
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [tickets, setTickets] = useState<Record<string, RaffleTicket[]>>({});
  const [loading, setLoading] = useState(true);
  const [purchaseForm, setPurchaseForm] = useState<Record<string, { name: string; email: string; phone: string; selectedNumbers: number[] }>>({});
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  // Draw overlay state
  const [liveDrawRaffleId, setLiveDrawRaffleId] = useState<string | null>(null);
  const [liveDrawAutoStart, setLiveDrawAutoStart] = useState(false);

  useEffect(() => {
    fetchRaffles();
    if (searchParams.get("success") === "true") {
      toast.success("Payment successful! Your raffle tickets have been confirmed.", { duration: 6000 });
    }
    if (searchParams.get("cancelled") === "true") {
      toast.error("Payment cancelled. No tickets were purchased.");
    }
  }, [searchParams]);

  // Subscribe to realtime changes on raffles for live draw
  useEffect(() => {
    const channel = supabase
      .channel("raffle-draw-live")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "raffles" },
        (payload) => {
          const updated = payload.new as any;

          // If draw just started and we're not already watching
          if (updated.draw_started_at && updated.status === "active" && !liveDrawRaffleId) {
            // Show live draw overlay automatically
            setLiveDrawRaffleId(updated.id);
            setLiveDrawAutoStart(true);
          }

          // Update local raffle data
          setRaffles((prev) =>
            prev.map((r) =>
              r.id === updated.id
                ? {
                    ...r,
                    status: updated.status,
                    winner_name: updated.winner_name,
                    winner_ticket_id: updated.winner_ticket_id,
                    draw_started_at: updated.draw_started_at,
                    drawn_ticket_number: updated.drawn_ticket_number,
                    draw_video_url: updated.draw_video_url,
                  }
                : r
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [liveDrawRaffleId]);

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

    setRaffles((data as any[]) || []);

    for (const raffle of data || []) {
      const { data: ticketData } = await supabase
        .from("raffle_tickets")
        .select("ticket_number, payment_status")
        .eq("raffle_id", raffle.id)
        .eq("payment_status", "paid")
        .order("ticket_number", { ascending: true });

      setTickets(prev => ({ ...prev, [raffle.id]: (ticketData as any[] || []) }));
    }

    setLoading(false);
  };

  const handlePurchase = async (raffleId: string) => {
    const form = purchaseForm[raffleId];
    if (!form?.name || !form?.email) {
      toast.error("Please fill in your name and email");
      return;
    }

    const raffle = raffles.find(r => r.id === raffleId);
    const hasNumberPicker = raffle?.number_range && raffle.number_range > 0;

    if (hasNumberPicker && (!form.selectedNumbers || form.selectedNumbers.length === 0)) {
      toast.error("Please select at least one number");
      return;
    }

    setPurchasing(raffleId);
    try {
      const body: any = {
        raffleId,
        buyerName: form.name,
        buyerEmail: form.email,
        buyerPhone: form.phone,
      };

      if (hasNumberPicker) {
        body.chosenNumbers = form.selectedNumbers;
        body.quantity = form.selectedNumbers.length;
      } else {
        body.quantity = form.selectedNumbers?.length || 1;
      }

      const { data, error } = await supabase.functions.invoke("create-raffle-checkout", { body });

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

  const updateForm = (raffleId: string, field: string, value: any) => {
    setPurchaseForm(prev => ({
      ...prev,
      [raffleId]: { ...prev[raffleId], [field]: value } as any,
    }));
  };

  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
  };

  const openReplay = (raffleId: string) => {
    setLiveDrawRaffleId(raffleId);
    setLiveDrawAutoStart(false);
  };

  const getPresetWinner = (raffle: Raffle): RaffleTicket | null => {
    if (!raffle.drawn_ticket_number) return null;
    return {
      ticket_number: raffle.drawn_ticket_number,
      buyer_name: raffle.winner_name || "Winner",
      payment_status: "paid",
    };
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-12">
        <div className="container mx-auto px-4">
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
                const takenNumbers = (tickets[raffle.id] || []).map(t => t.ticket_number);
                const isDrawn = raffle.status === "drawn";
                const hasNumberPicker = raffle.number_range && raffle.number_range > 0;
                const selectedNumbers = purchaseForm[raffle.id]?.selectedNumbers || [];
                const hasDrawData = isDrawn && raffle.winner_name && raffle.winner_ticket_id;

                return (
                  <Card key={raffle.id} className="bg-card border-border overflow-hidden">
                    {raffle.image_url && (
                      <div className="w-full h-48 sm:h-64 overflow-hidden">
                        <img src={raffle.image_url} alt={raffle.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <CardHeader className="bg-secondary/50">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="font-display text-2xl">{raffle.title}</CardTitle>
                          {raffle.description && (
                            <CardDescription className="mt-2 text-sm" dangerouslySetInnerHTML={{ __html: raffle.description }} />
                          )}
                        </div>
                        <Badge variant={isDrawn ? "secondary" : "default"} className={isDrawn ? "" : "bg-green-600"}>
                          {isDrawn ? "Drawn" : "Active"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
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

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{soldTickets} ticket{soldTickets !== 1 ? "s" : ""} sold{raffle.max_tickets ? ` of ${raffle.max_tickets}` : ""}</span>
                      </div>

                      {isDrawn && raffle.winner_name && (
                        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 text-center space-y-3">
                          <Trophy className="h-8 w-8 text-primary mx-auto mb-2" />
                          <p className="font-display text-lg font-bold text-primary">Winner: {raffle.winner_name}</p>
                          <p className="text-sm text-muted-foreground">Congratulations!</p>

                          {/* Video player if video is available */}
                          {(raffle as any).draw_video_url && (
                            <div className="mt-4 rounded-lg overflow-hidden border border-primary/20">
                              <video
                                controls
                                className="w-full max-h-[400px]"
                                poster=""
                                preload="metadata"
                              >
                                <source src={(raffle as any).draw_video_url} type="video/webm" />
                                Your browser does not support the video tag.
                              </video>
                            </div>
                          )}

                          {/* Fallback: animation replay if no video yet */}
                          {!(raffle as any).draw_video_url && hasDrawData && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openReplay(raffle.id)}
                              className="mt-2 font-display border-primary/30 text-primary hover:bg-primary/10"
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Watch the Draw
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Live draw indicator - when draw_started_at is set but not yet drawn */}
                      {!isDrawn && (raffle as any).draw_started_at && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center space-y-3">
                          <div className="flex items-center justify-center gap-2">
                            <Radio className="h-5 w-5 text-red-500 animate-pulse" />
                            <p className="font-display text-lg font-bold text-red-500">DRAW IN PROGRESS</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setLiveDrawRaffleId(raffle.id);
                              setLiveDrawAutoStart(true);
                            }}
                            className="font-display border-red-500/30 text-red-500 hover:bg-red-500/10"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Watch Live
                          </Button>
                        </div>
                      )}

                      {!isDrawn && !(raffle as any).draw_started_at && (
                        <>
                          <Separator />
                          <div>
                            <h3 className="font-display text-lg mb-4">
                              {hasNumberPicker ? "Choose Your Numbers" : "Buy Tickets"}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
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
                              {!hasNumberPicker && (
                                <div>
                                  <Label htmlFor={`qty-${raffle.id}`}>Number of Tickets *</Label>
                                  <Input
                                    id={`qty-${raffle.id}`}
                                    type="number"
                                    min={1}
                                    max={raffle.max_tickets ? raffle.max_tickets - soldTickets : 50}
                                    placeholder="1"
                                    value={selectedNumbers.length || ""}
                                    onChange={(e) => {
                                      const qty = parseInt(e.target.value) || 0;
                                      updateForm(raffle.id, "selectedNumbers", Array.from({ length: qty }, (_, i) => i + 1));
                                    }}
                                  />
                                </div>
                              )}
                            </div>

                            {hasNumberPicker && (
                              <NumberPicker
                                numberRange={raffle.number_range!}
                                takenNumbers={takenNumbers}
                                selectedNumbers={selectedNumbers}
                                onSelectionChange={(nums) => updateForm(raffle.id, "selectedNumbers", nums)}
                                maxSelection={raffle.max_tickets ? raffle.max_tickets - soldTickets : undefined}
                              />
                            )}

                            {selectedNumbers.length > 0 && (
                              <p className="mt-3 text-sm text-muted-foreground">
                                {selectedNumbers.length} ticket{selectedNumbers.length !== 1 ? "s" : ""} ·{" "}
                                Total: <span className="text-primary font-bold">{formatPrice(raffle.ticket_price_cents * selectedNumbers.length, raffle.currency)}</span>
                              </p>
                            )}
                            <Button
                              onClick={() => handlePurchase(raffle.id)}
                              disabled={purchasing === raffle.id || selectedNumbers.length === 0}
                              className="w-full mt-4 bg-gold-gradient text-primary-foreground font-display"
                              size="lg"
                            >
                              {purchasing === raffle.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Ticket className="h-4 w-4 mr-2" />
                                  {hasNumberPicker
                                    ? `Buy ${selectedNumbers.length} Number${selectedNumbers.length !== 1 ? "s" : ""}`
                                    : "Buy Tickets"}
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

      {/* Live / Replay Draw Overlay */}
      <AnimatePresence>
        {liveDrawRaffleId && (
          <RaffleDraw
            raffleName={raffles.find(r => r.id === liveDrawRaffleId)?.title || "Raffle"}
            tickets={(tickets[liveDrawRaffleId] || []).filter(t => t.payment_status === "paid")}
            onComplete={() => {
              // Viewer mode - no DB update needed
            }}
            onClose={() => {
              setLiveDrawRaffleId(null);
              setLiveDrawAutoStart(false);
            }}
            mode="viewer"
            presetWinner={getPresetWinner(raffles.find(r => r.id === liveDrawRaffleId)!)}
            autoStart={liveDrawAutoStart}
          />
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default RafflePage;
