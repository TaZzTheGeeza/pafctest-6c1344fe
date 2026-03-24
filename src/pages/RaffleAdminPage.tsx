import { useState, useEffect, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trophy, Ticket, Loader2, Shuffle, Eye, Trash2, ImagePlus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  image_url: string | null;
  created_at: string;
}

interface RaffleTicket {
  id: string;
  raffle_id: string;
  ticket_number: number;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string | null;
  payment_status: string;
  created_at: string;
}

const RaffleAdminPage = () => {
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [tickets, setTickets] = useState<Record<string, RaffleTicket[]>>({});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [viewingRaffle, setViewingRaffle] = useState<string | null>(null);
  const [drawing, setDrawing] = useState<string | null>(null);
  const [adminKey, setAdminKey] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newRaffle, setNewRaffle] = useState({
    title: "",
    description: "",
    prize_description: "",
    ticket_price: "",
    max_tickets: "",
    draw_date: "",
  });

  // Simple admin password check (temporary until proper auth)
  const ADMIN_KEY = "pafc2024admin";

  const handleLogin = () => {
    if (adminKey === ADMIN_KEY) {
      setAuthenticated(true);
      fetchRaffles();
    } else {
      toast.error("Invalid admin key");
    }
  };

  useEffect(() => {
    if (authenticated) fetchRaffles();
  }, [authenticated]);

  const fetchRaffles = async () => {
    // Admin sees all raffles including draft
    const { data, error } = await supabase
      .from("raffles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load raffles");
      return;
    }

    setRaffles(data || []);

    for (const raffle of data || []) {
      const { data: ticketData } = await supabase
        .from("raffle_tickets")
        .select("*")
        .eq("raffle_id", raffle.id)
        .order("ticket_number", { ascending: true });

      setTickets(prev => ({ ...prev, [raffle.id]: ticketData || [] }));
    }

    setLoading(false);
  };

  const createRaffle = async () => {
    if (!newRaffle.title || !newRaffle.prize_description || !newRaffle.ticket_price) {
      toast.error("Please fill in title, prize, and ticket price");
      return;
    }

    setCreating(true);

    let imageUrl: string | null = null;

    // Upload image if selected
    if (imageFile) {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("raffle-images")
        .upload(fileName, imageFile);

      if (uploadError) {
        toast.error("Failed to upload image: " + uploadError.message);
        setCreating(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("raffle-images")
        .getPublicUrl(fileName);
      imageUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from("raffles").insert({
      title: newRaffle.title,
      description: newRaffle.description || null,
      prize_description: newRaffle.prize_description,
      ticket_price_cents: Math.round(parseFloat(newRaffle.ticket_price) * 100),
      max_tickets: newRaffle.max_tickets ? parseInt(newRaffle.max_tickets) : null,
      draw_date: newRaffle.draw_date || null,
      status: "draft",
      image_url: imageUrl,
    });

    if (error) {
      toast.error("Failed to create raffle: " + error.message);
    } else {
      toast.success("Raffle created! Set it to 'Active' when ready.");
      setShowCreate(false);
      setNewRaffle({ title: "", description: "", prize_description: "", ticket_price: "", max_tickets: "", draw_date: "" });
      setImageFile(null);
      setImagePreview(null);
      fetchRaffles();
    }
    setCreating(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const updateStatus = async (raffleId: string, status: string) => {
    const { error } = await supabase.from("raffles").update({ status }).eq("id", raffleId);
    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success(`Raffle ${status === "active" ? "activated" : status}`);
      fetchRaffles();
    }
  };

  const drawWinner = async (raffleId: string) => {
    const paidTickets = (tickets[raffleId] || []).filter(t => t.payment_status === "paid");
    if (paidTickets.length === 0) {
      toast.error("No paid tickets to draw from");
      return;
    }

    setDrawing(raffleId);

    // Dramatic delay
    await new Promise(r => setTimeout(r, 2000));

    const winnerIndex = Math.floor(Math.random() * paidTickets.length);
    const winner = paidTickets[winnerIndex];

    const { error } = await supabase
      .from("raffles")
      .update({
        status: "drawn",
        winner_ticket_id: winner.id,
        winner_name: winner.buyer_name,
      })
      .eq("id", raffleId);

    if (error) {
      toast.error("Failed to record winner");
    } else {
      toast.success(`🎉 Winner: ${winner.buyer_name} (Ticket #${winner.ticket_number})!`, { duration: 10000 });
      fetchRaffles();
    }
    setDrawing(null);
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(cents / 100);
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-20 pb-12 flex items-center justify-center">
          <Card className="w-full max-w-md bg-card border-border">
            <CardHeader>
              <CardTitle className="font-display">Raffle Admin</CardTitle>
              <CardDescription>Enter the admin key to manage raffles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Admin Key</Label>
                <Input
                  type="password"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  placeholder="Enter admin key..."
                />
              </div>
              <Button onClick={handleLogin} className="w-full bg-gold-gradient text-primary-foreground font-display">
                Access Admin Panel
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20 pb-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold text-gold-gradient">Raffle Admin</h1>
              <p className="text-muted-foreground text-sm">Manage fundraising raffles</p>
            </div>
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
              <DialogTrigger asChild>
                <Button className="bg-gold-gradient text-primary-foreground font-display">
                  <Plus className="h-4 w-4 mr-2" /> New Raffle
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="font-display">Create New Raffle</DialogTitle>
                  <DialogDescription>Set up a new fundraising raffle</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label>Raffle Title *</Label>
                    <Input placeholder="e.g. Summer Prize Draw" value={newRaffle.title} onChange={(e) => setNewRaffle(p => ({ ...p, title: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea placeholder="Optional description..." value={newRaffle.description} onChange={(e) => setNewRaffle(p => ({ ...p, description: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Prize Description *</Label>
                    <Input placeholder="e.g. £100 cash prize" value={newRaffle.prize_description} onChange={(e) => setNewRaffle(p => ({ ...p, prize_description: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Ticket Price (£) *</Label>
                      <Input type="number" step="0.01" min="0.50" placeholder="1.00" value={newRaffle.ticket_price} onChange={(e) => setNewRaffle(p => ({ ...p, ticket_price: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Max Tickets (optional)</Label>
                      <Input type="number" min="1" placeholder="Unlimited" value={newRaffle.max_tickets} onChange={(e) => setNewRaffle(p => ({ ...p, max_tickets: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <Label>Draw Date (optional)</Label>
                    <Input type="date" value={newRaffle.draw_date} onChange={(e) => setNewRaffle(p => ({ ...p, draw_date: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Raffle Image (optional)</Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    {imagePreview ? (
                      <div className="relative mt-2">
                        <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-lg border border-border" />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6"
                          onClick={removeImage}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full mt-1 border-dashed border-border"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <ImagePlus className="h-4 w-4 mr-2" />
                        Upload Image
                      </Button>
                    )}
                  </div>
                  <Button onClick={createRaffle} disabled={creating} className="w-full bg-gold-gradient text-primary-foreground font-display">
                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Raffle"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : raffles.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No raffles yet. Create your first one!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {raffles.map((raffle) => {
                const raffleTickets = tickets[raffle.id] || [];
                const paidTickets = raffleTickets.filter(t => t.payment_status === "paid");
                const revenue = paidTickets.length * raffle.ticket_price_cents;
                const isViewing = viewingRaffle === raffle.id;

                return (
                  <Card key={raffle.id} className="bg-card border-border">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="font-display text-xl">{raffle.title}</CardTitle>
                          <CardDescription>{raffle.prize_description}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={raffle.status === "active" ? "default" : raffle.status === "drawn" ? "secondary" : "outline"}>
                            {raffle.status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="bg-secondary rounded-lg p-3">
                          <p className="text-2xl font-bold text-primary">{paidTickets.length}</p>
                          <p className="text-xs text-muted-foreground">Tickets Sold</p>
                        </div>
                        <div className="bg-secondary rounded-lg p-3">
                          <p className="text-2xl font-bold text-primary">{formatPrice(revenue)}</p>
                          <p className="text-xs text-muted-foreground">Revenue</p>
                        </div>
                        <div className="bg-secondary rounded-lg p-3">
                          <p className="text-2xl font-bold text-primary">{formatPrice(raffle.ticket_price_cents)}</p>
                          <p className="text-xs text-muted-foreground">Per Ticket</p>
                        </div>
                      </div>

                      {/* Winner */}
                      {raffle.winner_name && (
                        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 text-center">
                          <Trophy className="h-6 w-6 text-primary mx-auto mb-1" />
                          <p className="font-display font-bold text-primary">Winner: {raffle.winner_name}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        {raffle.status === "draft" && (
                          <Button size="sm" onClick={() => updateStatus(raffle.id, "active")} className="bg-green-600 hover:bg-green-700">
                            Activate
                          </Button>
                        )}
                        {raffle.status === "active" && (
                          <>
                            <Button size="sm" variant="destructive" onClick={() => updateStatus(raffle.id, "cancelled")}>
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => drawWinner(raffle.id)}
                              disabled={drawing === raffle.id || paidTickets.length === 0}
                              className="bg-gold-gradient text-primary-foreground"
                            >
                              {drawing === raffle.id ? (
                                <><Shuffle className="h-4 w-4 mr-1 animate-spin" /> Drawing...</>
                              ) : (
                                <><Trophy className="h-4 w-4 mr-1" /> Draw Winner</>
                              )}
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="outline" onClick={() => setViewingRaffle(isViewing ? null : raffle.id)}>
                          <Eye className="h-4 w-4 mr-1" /> {isViewing ? "Hide" : "View"} Tickets
                        </Button>
                      </div>

                      {/* Ticket list */}
                      {isViewing && (
                        <>
                          <Separator />
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>#</TableHead>
                                  <TableHead>Name</TableHead>
                                  <TableHead>Email</TableHead>
                                  <TableHead>Phone</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Date</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {raffleTickets.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground">No tickets yet</TableCell>
                                  </TableRow>
                                ) : (
                                  raffleTickets.map((ticket) => (
                                    <TableRow key={ticket.id} className={ticket.id === raffle.winner_ticket_id ? "bg-primary/10" : ""}>
                                      <TableCell className="font-mono">{ticket.ticket_number}</TableCell>
                                      <TableCell>{ticket.buyer_name}</TableCell>
                                      <TableCell className="text-xs">{ticket.buyer_email}</TableCell>
                                      <TableCell className="text-xs">{ticket.buyer_phone || "-"}</TableCell>
                                      <TableCell>
                                        <Badge variant={ticket.payment_status === "paid" ? "default" : "outline"} className={ticket.payment_status === "paid" ? "bg-green-600" : ""}>
                                          {ticket.payment_status}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-xs">{new Date(ticket.created_at).toLocaleDateString("en-GB")}</TableCell>
                                    </TableRow>
                                  ))
                                )}
                              </TableBody>
                            </Table>
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

export default RaffleAdminPage;
