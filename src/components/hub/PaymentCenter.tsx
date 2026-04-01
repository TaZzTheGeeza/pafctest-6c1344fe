import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CreditCard, Plus, Check, Clock, RefreshCw, ExternalLink, Loader2, Users, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import { DateInput } from "@/components/ui/date-input";
import { notifyTeamMembers } from "@/lib/notifyTeamMembers";

interface PaymentRequest {
  id: string;
  title: string;
  description: string | null;
  amount_cents: number;
  currency: string;
  team_slug: string | null;
  due_date: string | null;
  status: string;
  created_at: string;
}

interface Payment {
  id: string;
  request_id: string;
  user_id: string;
  amount_cents: number;
  status: string;
  paid_at: string | null;
}

interface SubStatus {
  subscribed: boolean;
  product_id: string | null;
  subscription_end: string | null;
}

type SubTier = "standard" | "sibling" | "coach";

const SUB_TIERS: { key: SubTier; label: string; price: string; description: string; icon: React.ReactNode }[] = [
  { key: "standard", label: "Standard", price: "£30", description: "1 player per month", icon: <CreditCard className="h-4 w-4" /> },
  { key: "sibling", label: "Sibling Discount", price: "£50", description: "2 children per month", icon: <Users className="h-4 w-4" /> },
  { key: "coach", label: "Coach Discount", price: "£20", description: "Per child per month", icon: <ShieldCheck className="h-4 w-4" /> },
];

export function PaymentCenter({ teamSlug }: { teamSlug: string }) {
  const { user, isCoach, isAdmin } = useAuth();
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", amount: "", due_date: "" });
  const [subStatus, setSubStatus] = useState<SubStatus | null>(null);
  const [subLoading, setSubLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [selectedTier, setSelectedTier] = useState<SubTier>("standard");
  const [guardianCount, setGuardianCount] = useState(0);
  const [searchParams] = useSearchParams();

  // Determine which tiers this user can access
  const availableTiers = SUB_TIERS.filter((tier) => {
    if (tier.key === "standard") return true;
    if (tier.key === "coach") return isCoach || isAdmin;
    if (tier.key === "sibling") return guardianCount >= 2;
    return false;
  });

  useEffect(() => {
    if (user) {
      loadRequests();
      loadPayments();
      checkSubscription();
      loadGuardianCount();
    }
  }, [user, teamSlug]);

  async function loadGuardianCount() {
    if (!user) return;
    const { count } = await supabase
      .from("guardians")
      .select("*", { count: "exact", head: true })
      .eq("parent_user_id", user.id)
      .eq("status", "active");
    setGuardianCount(count ?? 0);
  }

  // Auto-check after returning from checkout
  useEffect(() => {
    if (searchParams.get("subscription") === "success") {
      toast.success("Subscription setup successful! Welcome aboard 🎉");
      checkSubscription();
    }
  }, [searchParams]);

  // Periodic refresh every 60s
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [user]);

  async function checkSubscription() {
    try {
      setSubLoading(true);
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      setSubStatus(data);
    } catch (e) {
      console.error("Failed to check subscription:", e);
    } finally {
      setSubLoading(false);
    }
  }

  async function startCheckout() {
    try {
      setCheckoutLoading(true);
      const { data, error } = await supabase.functions.invoke("create-subs-checkout", { body: { tier: selectedTier } });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      if (data?.url) window.location.href = data.url;
    } catch (e) {
      toast.error("Failed to start checkout");
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function openPortal() {
    try {
      setPortalLoading(true);
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      if (data?.subscriptions?.length > 0) {
        const sub = data.subscriptions[0];
        const amount = (sub.amount / 100).toFixed(2);
        toast.info(`Your ${sub.name || "subscription"} is £${amount}/${sub.interval}. To make changes, please contact the club.`);
      } else {
        toast.info("No active subscriptions found. Contact the club if you need help.");
      }
    } catch (e) {
      toast.error("Failed to load subscription details");
    } finally {
      setPortalLoading(false);
    }
  }

  async function loadRequests() {
    const { data } = await supabase.from("hub_payment_requests").select("*").eq("team_slug", teamSlug).order("created_at", { ascending: false });
    if (data) setRequests(data);
  }

  async function loadPayments() {
    const { data } = await supabase.from("hub_payments").select("*").eq("user_id", user!.id);
    if (data) setPayments(data);
  }

  async function createRequest(e: React.FormEvent) {
    e.preventDefault();
    const amountCents = Math.round(parseFloat(form.amount) * 100);
    if (!form.title || isNaN(amountCents) || amountCents <= 0) { toast.error("Please fill in all fields"); return; }
    const id = crypto.randomUUID();
    const { error } = await supabase.from("hub_payment_requests").insert({
      id, title: form.title, description: form.description || null, amount_cents: amountCents,
      due_date: form.due_date || null, created_by: user?.id, team_slug: teamSlug,
    });
    if (error) { toast.error("Failed to create request"); return; }

    // Notify team members
    const amountStr = (amountCents / 100).toFixed(2);
    const dueStr = form.due_date ? new Date(form.due_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : undefined;
    notifyTeamMembers({
      teamSlug,
      excludeUserId: user?.id,
      notification: {
        title: "New Payment Request",
        message: `${form.title} — £${amountStr}`,
        type: "payment",
        link: "/hub?tab=payments",
      },
      email: {
        templateName: "payment-request-created",
        templateData: { title: form.title, amount: amountStr, dueDate: dueStr, teamName: teamSlug },
        idempotencyPrefix: `payment-req-${id}`,
      },
    });

    setForm({ title: "", description: "", amount: "", due_date: "" });
    setShowCreate(false);
    loadRequests();
    toast.success("Payment request created!");
  }

  async function markAsPaid(requestId: string, amountCents: number) {
    if (!user) return;
    const { error } = await supabase.from("hub_payments").insert({
      request_id: requestId, user_id: user.id, amount_cents: amountCents, status: "paid", paid_at: new Date().toISOString(),
    });
    if (error) {
      if (error.code === "23505") { toast.info("Already marked as paid"); return; }
      toast.error("Failed to mark as paid"); return;
    }
    loadPayments();
    toast.success("Marked as paid!");
  }

  function getPaymentStatus(requestId: string): string | null {
    const p = payments.find((p) => p.request_id === requestId);
    return p?.status || null;
  }

  if (!user) {
    return (
      <div className="text-center py-16">
        <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Sign in to view payments</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Monthly Subscription Card */}
      <div className="bg-card border-2 border-primary/30 rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="h-5 w-5 text-primary" />
            <h3 className="font-display text-sm tracking-wider text-foreground uppercase">Monthly Player Subs</h3>
          </div>
           <p className="text-muted-foreground text-sm mb-4">Direct debit subscription for training &amp; match days</p>

          {subLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Checking subscription status...
            </div>
          ) : subStatus?.subscribed ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-sm font-display tracking-wider text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                  <Check className="h-4 w-4" /> Active Subscription
                </span>
              </div>
              {subStatus.subscription_end && (
                <p className="text-xs text-muted-foreground">
                  Next payment: {format(new Date(subStatus.subscription_end), "dd MMMM yyyy")}
                </p>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                <button onClick={openPortal} disabled={portalLoading} className="flex items-center gap-1.5 text-xs font-display tracking-wider bg-secondary text-foreground px-4 py-2 rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50">
                  {portalLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
                  Manage Subscription
                </button>
                <button onClick={checkSubscription} className="flex items-center gap-1.5 text-xs font-display tracking-wider text-muted-foreground hover:text-foreground px-3 py-2 transition-colors">
                  <RefreshCw className="h-3.5 w-3.5" /> Refresh
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Tier selector */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {availableTiers.map((tier) => (
                  <button
                    key={tier.key}
                    onClick={() => setSelectedTier(tier.key)}
                    className={`relative rounded-lg border-2 p-3 text-left transition-all ${
                      selectedTier === tier.key
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    {selectedTier === tier.key && (
                      <div className="absolute top-1.5 right-1.5">
                        <Check className="h-3.5 w-3.5 text-primary" />
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 mb-1 text-muted-foreground">
                      {tier.icon}
                      <span className="text-xs font-display tracking-wider uppercase">{tier.label}</span>
                    </div>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-xl font-bold font-display text-primary">{tier.price}</span>
                      <span className="text-xs text-muted-foreground">/mo</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{tier.description}</p>
                  </button>
                ))}
              </div>

              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary" /> Weekly training sessions</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary" /> Match day participation</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary" /> FA-qualified coaching</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary" /> Kit & equipment included</li>
              </ul>

              <button onClick={startCheckout} disabled={checkoutLoading} className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-3 font-display text-sm tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50">
                {checkoutLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                Set Up Direct Debit
              </button>
              <button onClick={checkSubscription} className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1">
                <RefreshCw className="h-3 w-3" /> Already subscribed? Refresh status
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Coach: One-off Payment Requests */}
      {(isCoach || isAdmin) && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-sm tracking-wider text-foreground uppercase">One-Off Payment Requests</h3>
            <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-display tracking-wider">
              <Plus className="h-3.5 w-3.5" /> New Request
            </button>
          </div>
          {showCreate && (
            <form onSubmit={createRequest} className="space-y-3 bg-secondary/50 rounded-lg p-4 mb-4">
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title (e.g. Kit Fee, Tournament Entry)" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" required />
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description (optional)" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" rows={2} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground font-display">Amount (£)</label>
                  <input type="number" step="0.01" min="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="5.00" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" required />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-display">Due Date</label>
                  <DateInput value={form.due_date} onChange={(val) => setForm({ ...form, due_date: val })} placeholder="Select due date" />
                </div>
              </div>
              <button type="submit" className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-display tracking-wider hover:bg-primary/90 transition-colors">Create Request</button>
            </form>
          )}
        </div>
      )}

      {/* One-off Payment Requests List */}
      {requests.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-display text-xs tracking-wider text-muted-foreground uppercase">One-Off Payments</h3>
          {requests.map((req) => {
            const status = getPaymentStatus(req.id);
            return (
              <div key={req.id} className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-display font-bold text-foreground">{req.title}</h4>
                    {req.description && <p className="text-sm text-muted-foreground mt-1">{req.description}</p>}
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span className="font-display text-lg text-primary font-bold">£{(req.amount_cents / 100).toFixed(2)}</span>
                      {req.due_date && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Due {format(new Date(req.due_date), "dd MMM yyyy")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    {status === "paid" ? (
                      <span className="flex items-center gap-1 text-xs font-display tracking-wider text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                        <Check className="h-3.5 w-3.5" /> Paid
                      </span>
                    ) : (
                      <button onClick={() => markAsPaid(req.id, req.amount_cents)} className="flex items-center gap-1 text-xs font-display tracking-wider bg-primary text-primary-foreground px-3 py-1.5 rounded-full hover:bg-primary/90 transition-colors">
                        <CreditCard className="h-3.5 w-3.5" /> Mark Paid
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
