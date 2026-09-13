import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Shirt, Loader2, Package, History, Settings2, CheckCircle, XCircle,
  Download, Hand, Search, PoundSterling,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KIT_REASON_LABELS, KIT_STATUS_LABELS, KIT_STATUS_COLORS } from "@/lib/kitConfig";
import { CLUB_TEAMS } from "@/lib/teamConfig";

interface KitItem {
  id: string;
  name: string;
  category: string;
  photo_url: string | null;
  sizes: string[];
  active: boolean;
  sort_order: number;
}

interface KitRequest {
  id: string;
  user_id: string;
  player_registration_id: string | null;
  player_name: string;
  team_slug: string;
  size: string;
  reason: string;
  reason_detail: string;
  status: string;
  chargeable: boolean;
  charge_amount: number | null;
  admin_note: string | null;
  created_at: string;
  kit_items: { id: string; name: string; photo_url: string | null } | null;
}

interface KitIssue {
  id: string;
  player_registration_id: string | null;
  player_name: string;
  team_slug: string | null;
  item_name: string;
  size: string | null;
  issued_at: string;
  note: string | null;
}

interface Registration {
  id: string;
  child_name: string;
  preferred_age_group: string | null;
}

export function KitManager({ focusRequestId }: { focusRequestId?: string | null }) {
  const { user } = useAuth();
  const [items, setItems] = useState<KitItem[]>([]);
  const [requests, setRequests] = useState<KitRequest[]>([]);
  const [issues, setIssues] = useState<KitIssue[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"requests" | "register" | "items">("requests");
  const [statusFilter, setStatusFilter] = useState("open");

  const [reviewRequest, setReviewRequest] = useState<KitRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "decline">("approve");
  const [chargeable, setChargeable] = useState(false);
  const [chargeAmount, setChargeAmount] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [saving, setSaving] = useState(false);

  const [handoutOpen, setHandoutOpen] = useState(false);
  const [handoutReg, setHandoutReg] = useState("");
  const [handoutItem, setHandoutItem] = useState("");
  const [handoutSize, setHandoutSize] = useState("");
  const [handoutNote, setHandoutNote] = useState("");
  const [regSearch, setRegSearch] = useState("");

  const [registerTeam, setRegisterTeam] = useState("all");
  const [registerSearch, setRegisterSearch] = useState("");

  const [editItem, setEditItem] = useState<KitItem | null>(null);
  const [editSizes, setEditSizes] = useState("");

  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    if (focusRequestId && requests.length) {
      const r = requests.find((x) => x.id === focusRequestId);
      if (r) setTab("requests");
    }
  }, [focusRequestId, requests]);

  async function loadAll() {
    setLoading(true);
    const [itemsRes, reqsRes, issuesRes, regsRes] = await Promise.all([
      supabase.from("kit_items" as any).select("*").order("sort_order"),
      supabase.from("kit_requests" as any).select("*, kit_items(id, name, photo_url)").order("created_at", { ascending: false }),
      supabase.from("kit_issues" as any).select("*").order("issued_at", { ascending: false }),
      supabase.from("player_registrations").select("id, child_name, preferred_age_group").order("child_name"),
    ]);
    setItems((itemsRes.data as any) || []);
    setRequests((reqsRes.data as any) || []);
    setIssues((issuesRes.data as any) || []);
    setRegistrations(regsRes.data || []);
    setLoading(false);
  }

  async function notifyParent(r: KitRequest, title: string, message: string) {
    try {
      const link = "/kit";
      await supabase.from("hub_notifications").insert({
        user_id: r.user_id, title, message, type: "kit_request", link,
      });
      supabase.functions.invoke("send-push-notification", {
        body: { userIds: [r.user_id], title, message, link, tag: `kit-request-${r.id}` },
      }).catch(() => {});
    } catch (e) {
      console.error("Kit decision notification failed:", e);
    }
  }

  function playerHistory(r: KitRequest): KitIssue[] {
    const first = r.player_name.trim().split(" ")[0].toLowerCase();
    return issues.filter(
      (i) =>
        (r.player_registration_id && i.player_registration_id === r.player_registration_id) ||
        i.player_name.trim().split(" ")[0].toLowerCase() === first
    );
  }

  function openReview(r: KitRequest, action: "approve" | "decline") {
    setReviewRequest(r);
    setReviewAction(action);
    setChargeable(false);
    setChargeAmount("");
    setAdminNote("");
  }

  async function submitReview() {
    if (!reviewRequest || !user) return;
    if (reviewAction === "decline" && adminNote.trim().length < 5) {
      toast.error("Please add a short reason for declining");
      return;
    }
    if (reviewAction === "approve" && chargeable) {
      const amt = parseFloat(chargeAmount);
      if (!amt || amt <= 0) { toast.error("Enter the charge amount"); return; }
    }
    setSaving(true);
    const updates: any = {
      status: reviewAction === "approve" ? "approved" : "declined",
      admin_note: adminNote.trim() || null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      chargeable: reviewAction === "approve" ? chargeable : false,
      charge_amount: reviewAction === "approve" && chargeable ? parseFloat(chargeAmount) : null,
    };
    const { error } = await supabase.from("kit_requests" as any).update(updates).eq("id", reviewRequest.id);
    if (error) {
      toast.error("Could not save", { description: error.message });
      setSaving(false);
      return;
    }
    const itemName = reviewRequest.kit_items?.name || "kit";
    if (reviewAction === "approve") {
      notifyParent(
        reviewRequest,
        "Kit request approved",
        `${itemName} (${reviewRequest.size}) for ${reviewRequest.player_name} is approved${chargeable ? ` - chargeable replacement £${parseFloat(chargeAmount).toFixed(2)}` : ""}.${adminNote.trim() ? ` ${adminNote.trim()}` : ""}`
      );
    } else {
      notifyParent(
        reviewRequest,
        "Kit request declined",
        `Your request for ${itemName} (${reviewRequest.size}) for ${reviewRequest.player_name} was declined. ${adminNote.trim()}`
      );
    }
    setSaving(false);
    setReviewRequest(null);
    toast.success(reviewAction === "approve" ? "Request approved" : "Request declined");
    loadAll();
  }

  async function advanceStatus(r: KitRequest, next: "ready" | "handed_out") {
    const updates: any = { status: next };
    if (next === "handed_out") updates.handed_out_at = new Date().toISOString();
    const { error } = await supabase.from("kit_requests" as any).update(updates).eq("id", r.id);
    if (error) { toast.error("Could not update", { description: error.message }); return; }

    if (next === "handed_out") {
      const itemName = r.kit_items?.name || "Kit item";
      await supabase.from("kit_issues" as any).insert({
        request_id: r.id,
        player_registration_id: r.player_registration_id,
        player_name: r.player_name,
        team_slug: r.team_slug,
        kit_item_id: r.kit_items?.id || null,
        item_name: itemName,
        size: r.size,
        issued_by: user!.id,
        note: r.reason ? `Replacement - ${KIT_REASON_LABELS[r.reason] || r.reason}` : null,
      } as any);
      notifyParent(r, "Kit handed out", `${itemName} (${r.size}) for ${r.player_name} has been handed out.`);
    } else {
      notifyParent(r, "Kit ready to collect", `${r.kit_items?.name || "Kit"} (${r.size}) for ${r.player_name} is ready to collect at training.`);
    }
    toast.success(next === "ready" ? "Marked as ready to collect" : "Marked as handed out");
    loadAll();
  }

  async function saveHandout() {
    const reg = registrations.find((r) => r.id === handoutReg);
    const item = items.find((i) => i.id === handoutItem);
    if (!reg || !item || !user) { toast.error("Choose a player and an item"); return; }
    const { error } = await supabase.from("kit_issues" as any).insert({
      player_registration_id: reg.id,
      player_name: reg.child_name,
      team_slug: (reg.preferred_age_group || "").toLowerCase() || null,
      kit_item_id: item.id,
      item_name: item.name,
      size: handoutSize || null,
      issued_by: user.id,
      note: handoutNote.trim() || null,
    } as any);
    if (error) { toast.error("Could not record handout", { description: error.message }); return; }
    toast.success("Handout recorded");
    setHandoutOpen(false);
    setHandoutReg(""); setHandoutItem(""); setHandoutSize(""); setHandoutNote(""); setRegSearch("");
    loadAll();
  }

  async function toggleItemActive(item: KitItem) {
    const { error } = await supabase.from("kit_items" as any).update({ active: !item.active } as any).eq("id", item.id);
    if (error) { toast.error("Could not update item", { description: error.message }); return; }
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, active: !i.active } : i)));
  }

  async function saveItemSizes() {
    if (!editItem) return;
    const sizes = editSizes.split(",").map((s) => s.trim()).filter(Boolean);
    if (!sizes.length) { toast.error("Add at least one size"); return; }
    const { error } = await supabase.from("kit_items" as any).update({ sizes } as any).eq("id", editItem.id);
    if (error) { toast.error("Could not save sizes", { description: error.message }); return; }
    toast.success("Sizes updated");
    setEditItem(null);
    loadAll();
  }

  const openRequests = useMemo(() => {
    const open = ["pending", "approved", "ready"];
    let list = requests;
    if (statusFilter === "open") list = list.filter((r) => open.includes(r.status));
    else if (statusFilter !== "all") list = list.filter((r) => r.status === statusFilter);
    return [...list].sort((a, b) => {
      const rank = (s: string) => (s === "pending" ? 0 : s === "approved" ? 1 : s === "ready" ? 2 : 3);
      return rank(a.status) - rank(b.status) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [requests, statusFilter]);

  const filteredIssues = useMemo(() => {
    return issues.filter((i) => {
      if (registerTeam !== "all" && i.team_slug !== registerTeam) return false;
      if (registerSearch && !`${i.player_name} ${i.item_name}`.toLowerCase().includes(registerSearch.toLowerCase())) return false;
      return true;
    });
  }, [issues, registerTeam, registerSearch]);

  function exportCsv() {
    const rows = [["Date", "Player", "Team", "Item", "Size", "Note"]];
    filteredIssues.forEach((i) => rows.push([
      format(new Date(i.issued_at), "yyyy-MM-dd"), i.player_name, i.team_slug || "", i.item_name, i.size || "", i.note || "",
    ]));
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `kit-register-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  }

  const filteredRegs = useMemo(() => {
    if (!regSearch) return registrations.slice(0, 50);
    return registrations.filter((r) => r.child_name.toLowerCase().includes(regSearch.toLowerCase())).slice(0, 50);
  }, [registrations, regSearch]);

  const tabs = [
    { key: "requests" as const, label: "Requests", icon: Package },
    { key: "register" as const, label: "Kit Register", icon: History },
    { key: "items" as const, label: "Kit Items", icon: Settings2 },
  ];

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <h3 className="text-sm font-display tracking-wider uppercase text-muted-foreground flex items-center gap-2">
          <Shirt className="h-4 w-4 text-primary" /> Match Day Kit
        </h3>
        <div className="flex gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                tab === t.key ? "bg-primary text-primary-foreground" : "bg-background border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "requests" && (
        <>
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Needs action</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="ready">Ready to collect</SelectItem>
                <SelectItem value="handed_out">Handed out</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
                <SelectItem value="all">Everything</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{openRequests.length} request{openRequests.length === 1 ? "" : "s"}</p>
          </div>

          {openRequests.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No kit requests here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {openRequests.map((r) => {
                const history = playerHistory(r);
                return (
                  <div key={r.id} id={`kit-request-${r.id}`} className="bg-background border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3 min-w-0">
                        {r.kit_items?.photo_url && (
                          <img src={r.kit_items.photo_url} alt={r.kit_items.name} className="h-12 w-12 object-contain rounded-lg bg-card p-1 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground">
                            {r.kit_items?.name || "Kit item"} - size {r.size}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {r.player_name}{r.team_slug ? ` (${r.team_slug.toUpperCase()})` : ""} - {format(new Date(r.created_at), "d MMM yyyy")}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            <span className="text-foreground/80 font-medium">{KIT_REASON_LABELS[r.reason] || r.reason}:</span> {r.reason_detail}
                          </p>
                          {r.chargeable && (
                            <p className="text-xs text-amber-400 mt-0.5 flex items-center gap-1">
                              <PoundSterling className="h-3 w-3" /> Chargeable{r.charge_amount ? ` - £${Number(r.charge_amount).toFixed(2)}` : ""}
                            </p>
                          )}
                          {r.admin_note && <p className="text-xs text-muted-foreground mt-1">Note: {r.admin_note}</p>}
                        </div>
                      </div>
                      <span className={`text-[11px] px-2.5 py-1 rounded-full border font-medium shrink-0 ${KIT_STATUS_COLORS[r.status] || ""}`}>
                        {KIT_STATUS_LABELS[r.status] || r.status}
                      </span>
                    </div>

                    <div className="mt-3 border-t border-border pt-3">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                        Already issued to this player ({history.length})
                      </p>
                      {history.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Nothing on record yet.</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {history.slice(0, 8).map((h) => (
                            <span key={h.id} className="text-[10px] px-2 py-1 rounded bg-card border border-border text-muted-foreground">
                              {h.item_name}{h.size ? ` (${h.size})` : ""} - {format(new Date(h.issued_at), "MMM yy")}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-3 flex-wrap">
                      {r.status === "pending" && (
                        <>
                          <Button size="sm" onClick={() => openReview(r, "approve")}>
                            <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openReview(r, "decline")}>
                            <XCircle className="h-3.5 w-3.5 mr-1" /> Decline
                          </Button>
                        </>
                      )}
                      {r.status === "approved" && (
                        <Button size="sm" onClick={() => advanceStatus(r, "ready")}>Mark ready to collect</Button>
                      )}
                      {(r.status === "approved" || r.status === "ready") && (
                        <Button size="sm" variant="outline" onClick={() => advanceStatus(r, "handed_out")}>
                          <Hand className="h-3.5 w-3.5 mr-1" /> Mark handed out
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === "register" && (
        <>
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Select value={registerTeam} onValueChange={setRegisterTeam}>
              <SelectTrigger className="w-36 h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All teams</SelectItem>
                {CLUB_TEAMS.map((t) => (
                  <SelectItem key={t.slug} value={t.slug}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search player or item"
                value={registerSearch}
                onChange={(e) => setRegisterSearch(e.target.value)}
                className="h-9 pl-8 text-xs w-48"
              />
            </div>
            <Button size="sm" variant="outline" onClick={exportCsv}>
              <Download className="h-3.5 w-3.5 mr-1" /> Export CSV
            </Button>
            <Button size="sm" onClick={() => setHandoutOpen(true)}>
              <Hand className="h-3.5 w-3.5 mr-1" /> Record a handout
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mb-3">{filteredIssues.length} item{filteredIssues.length === 1 ? "" : "s"} issued</p>
          <div className="space-y-2">
            {filteredIssues.slice(0, 100).map((i) => (
              <div key={i.id} className="flex items-center gap-3 bg-background border border-border rounded-lg px-3 py-2.5">
                <Shirt className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground font-medium truncate">{i.item_name}{i.size ? ` - ${i.size}` : ""}</p>
                  <p className="text-xs text-muted-foreground">
                    {i.player_name}{i.team_slug ? ` (${i.team_slug.toUpperCase()})` : ""} - {format(new Date(i.issued_at), "d MMM yyyy")}{i.note ? ` - ${i.note}` : ""}
                  </p>
                </div>
              </div>
            ))}
            {filteredIssues.length > 100 && (
              <p className="text-xs text-muted-foreground text-center py-2">Showing the first 100 - use the filters or export for the full register.</p>
            )}
          </div>
        </>
      )}

      {tab === "items" && (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 bg-background border border-border rounded-lg px-3 py-2.5">
              {item.photo_url && <img src={item.photo_url} alt={item.name} className="h-10 w-10 object-contain rounded bg-card p-1 shrink-0" />}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground">Sizes: {(item.sizes || []).join(", ")}</p>
              </div>
              <Button size="sm" variant="ghost" className="text-xs" onClick={() => { setEditItem(item); setEditSizes((item.sizes || []).join(", ")); }}>
                Edit sizes
              </Button>
              <Button size="sm" variant="outline" className="text-xs" onClick={() => toggleItemActive(item)}>
                {item.active ? "Hide" : "Show"}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Approve / decline dialog */}
      <Dialog open={!!reviewRequest} onOpenChange={(open) => !open && setReviewRequest(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">
              {reviewAction === "approve" ? "Approve" : "Decline"} - {reviewRequest?.kit_items?.name}
            </DialogTitle>
          </DialogHeader>
          {reviewRequest && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {reviewRequest.player_name} - size {reviewRequest.size}
              </p>
              {reviewAction === "approve" && (
                <div className="bg-background/50 border border-border rounded-lg p-3 space-y-3">
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <Checkbox checked={chargeable} onCheckedChange={(v) => setChargeable(!!v)} />
                    Chargeable replacement (first kit is free)
                  </label>
                  {chargeable && (
                    <div className="flex items-center gap-2">
                      <PoundSterling className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Amount, e.g. 15.00"
                        value={chargeAmount}
                        onChange={(e) => setChargeAmount(e.target.value)}
                        className="h-9 text-sm w-40"
                      />
                    </div>
                  )}
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Note {reviewAction === "decline" ? "(required - the parent will see this)" : "(optional)"}
                </label>
                <Textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder={reviewAction === "decline" ? "e.g. This shirt was replaced two weeks ago - please check at home first." : "e.g. Collect at Thursday training."}
                  rows={3}
                  maxLength={300}
                />
              </div>
              <Button className="w-full" onClick={submitReview} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {reviewAction === "approve" ? "Approve request" : "Decline request"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Direct handout dialog */}
      <Dialog open={handoutOpen} onOpenChange={setHandoutOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Record a handout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Player</label>
              <Input
                placeholder="Search players"
                value={regSearch}
                onChange={(e) => setRegSearch(e.target.value)}
                className="h-9 text-sm mb-2"
              />
              <Select value={handoutReg} onValueChange={setHandoutReg}>
                <SelectTrigger><SelectValue placeholder="Choose a player" /></SelectTrigger>
                <SelectContent>
                  {filteredRegs.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.child_name}{r.preferred_age_group ? ` (${r.preferred_age_group})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Item</label>
              <Select value={handoutItem} onValueChange={setHandoutItem}>
                <SelectTrigger><SelectValue placeholder="Choose an item" /></SelectTrigger>
                <SelectContent>
                  {items.map((i) => (
                    <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Size (optional)</label>
              <Input value={handoutSize} onChange={(e) => setHandoutSize(e.target.value)} placeholder="e.g. 3XS" className="h-9 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Note (optional)</label>
              <Input value={handoutNote} onChange={(e) => setHandoutNote(e.target.value)} placeholder="e.g. Handed out at training" className="h-9 text-sm" maxLength={200} />
            </div>
            <Button className="w-full" onClick={saveHandout}>Save handout</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit sizes dialog */}
      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Sizes for {editItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={editSizes}
              onChange={(e) => setEditSizes(e.target.value)}
              rows={3}
              placeholder="Comma separated, e.g. 5XS, 4XS, 3XS, XXS, XS, S"
            />
            <p className="text-[11px] text-muted-foreground">Comma separated list shown to parents when requesting this item.</p>
            <Button className="w-full" onClick={saveItemSizes}>Save sizes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
