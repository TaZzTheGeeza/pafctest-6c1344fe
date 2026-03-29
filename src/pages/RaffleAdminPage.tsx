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
import { Plus, Trophy, Ticket, Loader2, Shuffle, Eye, Trash2, ImagePlus, X, Pencil } from "lucide-react";
import RichTextEditor from "@/components/RichTextEditor";
import { supabase } from "@/integrations/supabase/client";
import { DateInput } from "@/components/ui/date-input";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";
import RaffleDraw from "@/components/raffle/RaffleDraw";
import DrawVideoRecorder from "@/components/raffle/DrawVideoRecorder";

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
  winner_ticket_id: string | null;
  image_url: string | null;
  created_at: string;
  auto_draw_when_sold_out: boolean;
  number_range: number | null;
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
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit state
  const [editingRaffle, setEditingRaffle] = useState<Raffle | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    prize_description: "",
    ticket_price: "",
    max_tickets: "",
    draw_date: "",
    number_range: "",
    auto_draw_when_sold_out: false,
  });
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);

  const [newRaffle, setNewRaffle] = useState({
    title: "",
    description: "",
    prize_description: "",
    ticket_price: "",
    max_tickets: "",
    draw_date: "",
    number_range: "",
    auto_draw_when_sold_out: false,
  });

  useEffect(() => {
    fetchRaffles();
  }, []);

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
      number_range: newRaffle.number_range ? parseInt(newRaffle.number_range) : null,
      draw_date: newRaffle.draw_date || null,
      status: "draft",
      image_url: imageUrl,
      auto_draw_when_sold_out: newRaffle.auto_draw_when_sold_out,
    } as any);

    if (error) {
      toast.error("Failed to create raffle: " + error.message);
    } else {
      toast.success("Raffle created! Set it to 'Active' when ready.");
      setShowCreate(false);
      setNewRaffle({ title: "", description: "", prize_description: "", ticket_price: "", max_tickets: "", draw_date: "", number_range: "", auto_draw_when_sold_out: false });
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

  const openEditDialog = (raffle: Raffle) => {
    setEditingRaffle(raffle);
    setEditForm({
      title: raffle.title,
      description: raffle.description || "",
      prize_description: raffle.prize_description,
      ticket_price: (raffle.ticket_price_cents / 100).toFixed(2),
      max_tickets: raffle.max_tickets?.toString() || "",
      draw_date: raffle.draw_date ? raffle.draw_date.split("T")[0] : "",
      number_range: raffle.number_range?.toString() || "",
      auto_draw_when_sold_out: (raffle as any).auto_draw_when_sold_out ?? false,
    });
    setEditImagePreview(raffle.image_url);
    setEditImageFile(null);
  };

  const handleEditImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setEditImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeEditImage = () => {
    setEditImageFile(null);
    setEditImagePreview(null);
    if (editFileInputRef.current) editFileInputRef.current.value = "";
  };

  const saveEdit = async () => {
    if (!editingRaffle) return;
    if (!editForm.title || !editForm.prize_description || !editForm.ticket_price) {
      toast.error("Please fill in title, prize, and ticket price");
      return;
    }

    setSaving(true);

    let imageUrl = editingRaffle.image_url;

    if (editImageFile) {
      const fileExt = editImageFile.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("raffle-images")
        .upload(fileName, editImageFile);

      if (uploadError) {
        toast.error("Failed to upload image: " + uploadError.message);
        setSaving(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("raffle-images")
        .getPublicUrl(fileName);
      imageUrl = urlData.publicUrl;
    } else if (!editImagePreview) {
      imageUrl = null;
    }

    const { error } = await supabase
      .from("raffles")
      .update({
        title: editForm.title,
        description: editForm.description || null,
        prize_description: editForm.prize_description,
        ticket_price_cents: Math.round(parseFloat(editForm.ticket_price) * 100),
        max_tickets: editForm.max_tickets ? parseInt(editForm.max_tickets) : null,
        number_range: editForm.number_range ? parseInt(editForm.number_range) : null,
        draw_date: editForm.draw_date || null,
        image_url: imageUrl,
        auto_draw_when_sold_out: editForm.auto_draw_when_sold_out,
      } as any)
      .eq("id", editingRaffle.id);

    if (error) {
      toast.error("Failed to update raffle: " + error.message);
    } else {
      toast.success("Raffle updated!");
      setEditingRaffle(null);
      fetchRaffles();
    }
    setSaving(false);
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

  const [drawingRaffleId, setDrawingRaffleId] = useState<string | null>(null);

  const openDrawOverlay = async (raffleId: string) => {
    const paidTickets = (tickets[raffleId] || []).filter(t => t.payment_status === "paid");
    if (paidTickets.length === 0) {
      toast.error("No paid tickets to draw from");
      return;
    }

    // Broadcast draw_started_at so live viewers see it
    await supabase
      .from("raffles")
      .update({ draw_started_at: new Date().toISOString() } as any)
      .eq("id", raffleId);

    setDrawingRaffleId(raffleId);
  };

  const [drawnWinner, setDrawnWinner] = useState<{
    id: string;
    ticket_number: number;
    buyer_name: string;
    buyer_email: string;
  } | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const handleDrawComplete = async (winner: { id: string; ticket_number: number; buyer_name: string; buyer_email: string }) => {
    if (!drawingRaffleId) return;

    // Save winner to DB
    const { error } = await supabase
      .from("raffles")
      .update({
        status: "drawn",
        winner_ticket_id: winner.id,
        winner_name: winner.buyer_name,
        drawn_ticket_number: winner.ticket_number,
      } as any)
      .eq("id", drawingRaffleId);

    if (error) {
      toast.error("Failed to record winner");
    } else {
      fetchRaffles();
    }

    // Start video recording in background
    setDrawnWinner(winner);
    setIsRecording(true);
    toast.info("Recording draw video...", { duration: 3000 });
  };

  const handleVideoReady = async (blob: Blob) => {
    if (!drawingRaffleId) return;
    setIsRecording(false);

    try {
      const fileName = `draw-${drawingRaffleId}-${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from("draw-videos")
        .upload(fileName, blob, { contentType: "video/webm" });

      if (uploadError) {
        console.error("Failed to upload draw video:", uploadError);
        toast.error("Failed to save draw video");
        return;
      }

      const { data: urlData } = supabase.storage
        .from("draw-videos")
        .getPublicUrl(fileName);

      await supabase
        .from("raffles")
        .update({ draw_video_url: urlData.publicUrl } as any)
        .eq("id", drawingRaffleId);

      toast.success("Draw video saved! Viewers can now watch the replay.");
      fetchRaffles();
    } catch (err) {
      console.error("Video save error:", err);
      toast.error("Failed to save draw video");
    }
  };

  const closeDrawOverlay = () => {
    setDrawingRaffleId(null);
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(cents / 100);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-12">
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
                    <RichTextEditor placeholder="Optional description..." value={newRaffle.description} onChange={(val) => setNewRaffle(p => ({ ...p, description: val }))} />
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Number Range (optional)</Label>
                      <Input type="number" min="1" placeholder="e.g. 100 (enables number picking)" value={newRaffle.number_range} onChange={(e) => setNewRaffle(p => ({ ...p, number_range: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Draw Date (optional)</Label>
                      <DateInput value={newRaffle.draw_date} onChange={(val) => setNewRaffle(p => ({ ...p, draw_date: val }))} placeholder="Select draw date" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-secondary/30">
                    <button
                      type="button"
                      onClick={() => setNewRaffle(p => ({ ...p, auto_draw_when_sold_out: !p.auto_draw_when_sold_out }))}
                      className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ${newRaffle.auto_draw_when_sold_out ? "bg-primary" : "bg-muted"}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${newRaffle.auto_draw_when_sold_out ? "translate-x-5" : "translate-x-1"}`} />
                    </button>
                    <div>
                      <p className="text-sm font-display font-semibold text-foreground">Auto-draw when sold out</p>
                      <p className="text-[10px] text-muted-foreground">Automatically trigger the draw when all numbers have been bought</p>
                    </div>
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
                              onClick={() => openDrawOverlay(raffle.id)}
                              disabled={paidTickets.length === 0}
                              className="bg-gold-gradient text-primary-foreground"
                            >
                              <Trophy className="h-4 w-4 mr-1" /> Draw Winner
                            </Button>
                          </>
                        )}
                        {raffle.status !== "drawn" && (
                          <Button size="sm" variant="outline" onClick={() => openEditDialog(raffle)}>
                            <Pencil className="h-4 w-4 mr-1" /> Edit
                          </Button>
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
      {/* Edit Dialog */}
      <Dialog open={!!editingRaffle} onOpenChange={(open) => !open && setEditingRaffle(null)}>
        <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Raffle</DialogTitle>
            <DialogDescription>Update raffle details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Raffle Title *</Label>
              <Input value={editForm.title} onChange={(e) => setEditForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div>
              <Label>Description</Label>
              <RichTextEditor value={editForm.description} onChange={(val) => setEditForm(p => ({ ...p, description: val }))} />
            </div>
            <div>
              <Label>Prize Description *</Label>
              <Input value={editForm.prize_description} onChange={(e) => setEditForm(p => ({ ...p, prize_description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ticket Price (£) *</Label>
                <Input type="number" step="0.01" min="0.50" value={editForm.ticket_price} onChange={(e) => setEditForm(p => ({ ...p, ticket_price: e.target.value }))} />
              </div>
              <div>
                <Label>Max Tickets (optional)</Label>
                <Input type="number" min="1" placeholder="Unlimited" value={editForm.max_tickets} onChange={(e) => setEditForm(p => ({ ...p, max_tickets: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Number Range (optional)</Label>
                <Input type="number" min="1" placeholder="e.g. 100" value={editForm.number_range} onChange={(e) => setEditForm(p => ({ ...p, number_range: e.target.value }))} />
              </div>
              <div>
                <Label>Draw Date (optional)</Label>
                <DateInput value={editForm.draw_date} onChange={(val) => setEditForm(p => ({ ...p, draw_date: val }))} placeholder="Select draw date" />
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-secondary/30">
              <button
                type="button"
                onClick={() => setEditForm(p => ({ ...p, auto_draw_when_sold_out: !p.auto_draw_when_sold_out }))}
                className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ${editForm.auto_draw_when_sold_out ? "bg-primary" : "bg-muted"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editForm.auto_draw_when_sold_out ? "translate-x-5" : "translate-x-1"}`} />
              </button>
              <div>
                <p className="text-sm font-display font-semibold text-foreground">Auto-draw when sold out</p>
                <p className="text-[10px] text-muted-foreground">Automatically trigger the draw when all numbers have been bought</p>
              </div>
            </div>
            <div>
              <Label>Raffle Image</Label>
              <input
                ref={editFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleEditImageSelect}
                className="hidden"
              />
              {editImagePreview ? (
                <div className="relative mt-2">
                  <img src={editImagePreview} alt="Preview" className="w-full h-40 object-cover rounded-lg border border-border" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={removeEditImage}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full mt-1 border-dashed border-border"
                  onClick={() => editFileInputRef.current?.click()}
                >
                  <ImagePlus className="h-4 w-4 mr-2" />
                  Upload Image
                </Button>
              )}
            </div>
            <Button onClick={saveEdit} disabled={saving} className="w-full bg-gold-gradient text-primary-foreground font-display">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Draw Overlay */}
      <AnimatePresence>
        {drawingRaffleId && (
          <RaffleDraw
            raffleName={raffles.find(r => r.id === drawingRaffleId)?.title || "Raffle"}
            tickets={(tickets[drawingRaffleId] || []).filter(t => t.payment_status === "paid")}
            onComplete={handleDrawComplete}
            onClose={closeDrawOverlay}
          />
        )}
      </AnimatePresence>

      {/* Background Video Recorder */}
      {isRecording && drawnWinner && drawingRaffleId && (
        <DrawVideoRecorder
          raffleName={raffles.find(r => r.id === drawingRaffleId)?.title || "Raffle"}
          winnerName={drawnWinner.buyer_name}
          ticketNumber={drawnWinner.ticket_number}
          participantNames={[
            ...new Set(
              (tickets[drawingRaffleId] || [])
                .filter(t => t.payment_status === "paid")
                .map(t => t.buyer_name)
            ),
          ]}
          onVideoReady={handleVideoReady}
        />
      )}
      <Footer />
    </div>
  );
};

export default RaffleAdminPage;
