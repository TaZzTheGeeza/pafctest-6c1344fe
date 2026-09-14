import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Shirt, Loader2, ArrowLeft, Package, History, Ruler, CheckCircle,
  XCircle, Clock, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  KIT_REASONS, KIT_STATUS_LABELS, KIT_STATUS_COLORS,
  MACRON_SIZE_GUIDE, suggestSize,
} from "@/lib/kitConfig";

interface KitItem {
  id: string;
  name: string;
  category: string;
  photo_url: string | null;
  sizes: string[];
}

interface Registration {
  /** Registration id when the player is registered, otherwise a guardian-derived key. */
  id: string;
  child_name: string;
  child_dob: string | null;
  preferred_age_group: string | null;
  /** False when the player comes from a guardian link rather than a registration. */
  registered?: boolean;
}

interface KitRequest {
  id: string;
  player_name: string;
  size: string;
  reason: string;
  reason_detail: string;
  status: string;
  chargeable: boolean;
  charge_amount: number | null;
  admin_note: string | null;
  created_at: string;
  kit_items: { name: string; photo_url: string | null } | null;
}

interface KitIssue {
  id: string;
  player_name: string;
  item_name: string;
  size: string | null;
  issued_at: string;
  note: string | null;
}

export default function KitPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<KitItem[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [requests, setRequests] = useState<KitRequest[]>([]);
  const [issues, setIssues] = useState<KitIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"request" | "requests" | "history">("request");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogItem, setDialogItem] = useState<KitItem | null>(null);
  const [playerRegId, setPlayerRegId] = useState("");
  const [size, setSize] = useState("");
  const [reason, setReason] = useState("");
  const [reasonDetail, setReasonDetail] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadAll();
  }, [user]);

  async function loadAll() {
    setLoading(true);
    const [itemsRes, regsRes, reqsRes, issuesRes] = await Promise.all([
      supabase.from("kit_items" as any).select("*").eq("active", true).order("sort_order"),
      supabase.from("player_registrations").select("id, child_name, child_dob, preferred_age_group").eq("user_id", user!.id).order("child_name"),
      supabase.from("kit_requests" as any).select("*, kit_items(name, photo_url)").eq("user_id", user!.id).order("created_at", { ascending: false }),
      supabase.from("kit_issues" as any).select("id, player_name, item_name, size, issued_at, note").order("issued_at", { ascending: false }),
    ]);
    setItems((itemsRes.data as any) || []);
    setRegistrations(regsRes.data || []);
    setRequests((reqsRes.data as any) || []);
    setIssues((issuesRes.data as any) || []);
    setLoading(false);
  }

  const suggested = useMemo(() => {
    const h = parseInt(heightCm, 10);
    return h ? suggestSize(h) : null;
  }, [heightCm]);

  function openRequest(item: KitItem) {
    if (registrations.length === 0) {
      toast.error("You need a registered player first", {
        description: "Register your child, then come back to request kit.",
      });
      return;
    }
    setDialogItem(item);
    setPlayerRegId(registrations[0]?.id || "");
    setSize("");
    setReason("");
    setReasonDetail("");
    setHeightCm("");
    setDialogOpen(true);
  }

  async function submitRequest() {
    if (!user || !dialogItem) return;
    const reg = registrations.find((r) => r.id === playerRegId);
    if (!reg) { toast.error("Please choose a player"); return; }
    if (!size) { toast.error("Please choose a size"); return; }
    if (!reason) { toast.error("Please choose a reason"); return; }
    if (reasonDetail.trim().length < 10) {
      toast.error("Please tell us a little more", {
        description: "A short explanation is required - kit is only replaced with a genuine reason.",
      });
      return;
    }
    setSubmitting(true);
    const { data: inserted, error } = await supabase
      .from("kit_requests" as any)
      .insert({
        user_id: user.id,
        player_registration_id: reg.id,
        player_name: reg.child_name,
        team_slug: (reg.preferred_age_group || "").toLowerCase(),
        kit_item_id: dialogItem.id,
        size,
        reason,
        reason_detail: reasonDetail.trim(),
      } as any)
      .select("id")
      .single();

    if (error) {
      setSubmitting(false);
      if (error.message?.includes("kit_requests_unique_pending")) {
        toast.error("You already have a pending request for this item", {
          description: "Wait for it to be reviewed, or cancel it first.",
        });
      } else {
        toast.error("Could not submit the request", { description: error.message });
      }
      return;
    }

    // Notify admins (in-app + push), linked straight to the request.
    try {
      const { data: admins } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
      if (admins?.length) {
        const link = `/dashboard?section=kit&request=${(inserted as any).id}`;
        await supabase.from("hub_notifications").insert(
          admins.map((a) => ({
            user_id: a.user_id,
            title: "New kit request",
            message: `${reg.child_name} (${reg.preferred_age_group || "team tbc"}) - ${dialogItem.name}, size ${size}. Reason: ${reasonDetail.trim().slice(0, 120)}`,
            type: "kit_request",
            link,
          }))
        );
        supabase.functions.invoke("send-push-notification", {
          body: {
            userIds: admins.map((a) => a.user_id),
            title: "New kit request",
            message: `${reg.child_name} - ${dialogItem.name} (${size})`,
            link,
            tag: `kit-request-${(inserted as any).id}`,
          },
        }).catch(() => {});
      }
    } catch (e) {
      console.error("Kit request notification failed:", e);
    }

    setSubmitting(false);
    setDialogOpen(false);
    toast.success("Kit request sent", {
      description: "An admin will review it and you will be notified of the decision.",
    });
    setTab("requests");
    loadAll();
  }

  async function cancelRequest(id: string) {
    const { error } = await supabase
      .from("kit_requests" as any)
      .update({ status: "cancelled" } as any)
      .eq("id", id);
    if (error) {
      toast.error("Could not cancel", { description: error.message });
    } else {
      toast.success("Request cancelled");
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "cancelled" } : r)));
    }
  }

  const tabs = [
    { key: "request" as const, label: "Request Kit", icon: Shirt },
    { key: "requests" as const, label: "My Requests", icon: Package },
    { key: "history" as const, label: "My Kit", icon: History },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Kit Requests | Peterborough Athletic FC"
        description="Request match day kit for your child and see what kit they have been given."
        path="/kit"
      />
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          <Link to="/hub" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to the Hub
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-primary/20">
              <Shirt className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight">Match Day Kit</h1>
              <p className="text-sm text-muted-foreground">Every player gets one kit set free. Request replacements here.</p>
            </div>
          </div>

          <div className="flex gap-2 mt-6 mb-6 flex-wrap">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tab === t.key ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <t.icon className="h-4 w-4" /> {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : tab === "request" ? (
            <>
              <div className="bg-card border border-border rounded-xl p-4 mb-6 flex gap-3">
                <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Your child's first kit is free. For replacements, pick the item and tell us why it is needed.
                  Admins review every request and you can see exactly what your child has already been given under My Kit.
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {items.map((item) => (
                  <div key={item.id} className="bg-card border border-border rounded-xl overflow-hidden flex flex-col">
                    <div className="aspect-square bg-background/50 flex items-center justify-center p-4">
                      {item.photo_url ? (
                        <img src={item.photo_url} alt={item.name} className="max-h-full max-w-full object-contain" loading="lazy" />
                      ) : (
                        <Shirt className="h-12 w-12 text-muted-foreground" />
                      )}
                    </div>
                    <div className="p-3 flex-1 flex flex-col">
                      <p className="text-sm font-semibold text-foreground mb-1">{item.name}</p>
                      {item.category === "goalkeeper" && (
                        <p className="text-[11px] text-primary mb-2">Goalkeeper kit</p>
                      )}
                      <Button size="sm" variant="outline" className="mt-auto w-full" onClick={() => openRequest(item)}>
                        Request this
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : tab === "requests" ? (
            <div className="space-y-3">
              {requests.length === 0 ? (
                <div className="bg-card border border-border rounded-xl p-12 text-center">
                  <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No kit requests yet</p>
                </div>
              ) : requests.map((r) => (
                <div key={r.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0">
                      {r.kit_items?.photo_url && (
                        <img src={r.kit_items.photo_url} alt={r.kit_items.name} className="h-12 w-12 object-contain rounded-lg bg-background/50 p-1 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">{r.kit_items?.name || "Kit item"} - size {r.size}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.player_name} - requested {format(new Date(r.created_at), "d MMM yyyy")}
                        </p>
                        {r.chargeable && (
                          <p className="text-xs text-amber-400 mt-0.5">
                            Chargeable replacement{r.charge_amount ? ` - £${Number(r.charge_amount).toFixed(2)}` : ""}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`text-[11px] px-2.5 py-1 rounded-full border font-medium ${KIT_STATUS_COLORS[r.status] || ""}`}>
                      {KIT_STATUS_LABELS[r.status] || r.status}
                    </span>
                  </div>
                  {r.admin_note && (
                    <p className="text-xs text-muted-foreground mt-2 border-t border-border pt-2">Note from the club: {r.admin_note}</p>
                  )}
                  {r.status === "pending" && (
                    <Button size="sm" variant="ghost" className="mt-2 text-xs text-muted-foreground" onClick={() => cancelRequest(r.id)}>
                      Cancel request
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {issues.length === 0 ? (
                <div className="bg-card border border-border rounded-xl p-12 text-center">
                  <History className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No kit recorded for your children yet</p>
                </div>
              ) : issues.map((i) => (
                <div key={i.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                    <Shirt className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{i.item_name}{i.size ? ` - size ${i.size}` : ""}</p>
                    <p className="text-xs text-muted-foreground">
                      {i.player_name} - {format(new Date(i.issued_at), "d MMM yyyy")}{i.note ? ` - ${i.note}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Request {dialogItem?.name}</DialogTitle>
          </DialogHeader>
          {dialogItem && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Which player?</label>
                <Select value={playerRegId} onValueChange={setPlayerRegId}>
                  <SelectTrigger><SelectValue placeholder="Choose a player" /></SelectTrigger>
                  <SelectContent>
                    {registrations.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.child_name}{r.preferred_age_group ? ` (${r.preferred_age_group})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-background/50 border border-border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Ruler className="h-4 w-4 text-primary" />
                  <p className="text-xs font-semibold text-foreground">Size helper (Macron)</p>
                </div>
                <p className="text-[11px] text-muted-foreground mb-2">
                  Macron kit is a slim European fit - when in doubt, size up. Enter your child's height for a suggestion.
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Height in cm, e.g. 128"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    className="h-9 text-sm"
                  />
                  {suggested && (
                    <span className="text-xs font-semibold text-primary whitespace-nowrap">
                      Suggests {suggested.size}{suggested.age ? ` (age ${suggested.age})` : ""}
                    </span>
                  )}
                </div>
                <div className="mt-2 max-h-28 overflow-y-auto text-[10px] text-muted-foreground">
                  {MACRON_SIZE_GUIDE.map((r) => (
                    <div key={r.size} className="flex justify-between py-0.5 border-b border-border/40 last:border-0">
                      <span className="font-semibold text-foreground/80 w-10">{r.size}</span>
                      <span>{r.age ? `Age ${r.age} - ` : ""}{r.heightCm[0]}-{r.heightCm[1]} cm</span>
                      <span>Chest {r.chestCm[0]}-{r.chestCm[1]} cm</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Size</label>
                <Select value={size} onValueChange={setSize}>
                  <SelectTrigger><SelectValue placeholder="Choose a size" /></SelectTrigger>
                  <SelectContent>
                    {(dialogItem.sizes || []).map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Why is new kit needed?</label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger><SelectValue placeholder="Choose a reason" /></SelectTrigger>
                  <SelectContent>
                    {KIT_REASONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tell us a little more</label>
                <Textarea
                  value={reasonDetail}
                  onChange={(e) => setReasonDetail(e.target.value)}
                  placeholder="e.g. The current shirt is far too small after the summer and can't be worn on match days."
                  rows={3}
                  maxLength={500}
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Required - first kit is free, so every replacement needs a genuine reason.
                </p>
              </div>

              <Button className="w-full" onClick={submitRequest} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                Send request
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
