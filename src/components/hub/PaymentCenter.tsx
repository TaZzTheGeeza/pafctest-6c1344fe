import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CreditCard, Plus, Check, Clock, AlertCircle, Users } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

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

export function PaymentCenter() {
  const { user, isCoach, isAdmin } = useAuth();
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", amount: "", due_date: "" });

  useEffect(() => {
    if (user) { loadRequests(); loadPayments(); }
  }, [user]);

  async function loadRequests() {
    const { data } = await supabase.from("hub_payment_requests").select("*").order("created_at", { ascending: false });
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
    const { error } = await supabase.from("hub_payment_requests").insert({
      title: form.title, description: form.description || null, amount_cents: amountCents,
      due_date: form.due_date || null, created_by: user?.id,
    });
    if (error) { toast.error("Failed to create request"); return; }
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
      {/* Coach: Create Payment Request */}
      {(isCoach || isAdmin) && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-sm tracking-wider text-foreground uppercase">Manage Payment Requests</h3>
            <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-display tracking-wider">
              <Plus className="h-3.5 w-3.5" /> New Request
            </button>
          </div>
          {showCreate && (
            <form onSubmit={createRequest} className="space-y-3 bg-secondary/50 rounded-lg p-4 mb-4">
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title (e.g. Monthly Subs - March)" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" required />
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description (optional)" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" rows={2} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground font-display">Amount (£)</label>
                  <input type="number" step="0.01" min="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="5.00" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" required />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-display">Due Date</label>
                  <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
                </div>
              </div>
              <button type="submit" className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-display tracking-wider hover:bg-primary/90 transition-colors">Create Request</button>
            </form>
          )}
        </div>
      )}

      {/* Payment Requests List */}
      <div className="space-y-3">
        {requests.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <CreditCard className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No payment requests yet</p>
          </div>
        ) : (
          requests.map((req) => {
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
                      <span className="flex items-center gap-1 text-xs font-display tracking-wider text-green-500 bg-green-500/10 px-3 py-1.5 rounded-full">
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
          })
        )}
      </div>
    </div>
  );
}
