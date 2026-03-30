import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2, CreditCard, TrendingUp, AlertTriangle, XCircle,
  Users, Search, RefreshCw, ChevronDown, ChevronUp
} from "lucide-react";
import { toast } from "sonner";

interface SubRecord {
  id: string;
  customer_email: string | null;
  customer_name: string | null;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  amount_cents: number;
  currency: string;
  interval: string | null;
  created: string;
}

interface PaymentRecord {
  id: string;
  amount_cents: number;
  currency: string;
  status: string;
  customer_email: string | null;
  customer_name: string | null;
  description: string | null;
  created: string;
}

interface Summary {
  active_subscriptions: number;
  past_due: number;
  canceled: number;
  total_customers: number;
  revenue_last_90_days_cents: number;
  currency: string;
}

type Tab = "subscriptions" | "payments";

export function TreasurerPaymentsBoard() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [subscriptions, setSubscriptions] = useState<SubRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [tab, setTab] = useState<Tab>("subscriptions");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortAsc, setSortAsc] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-payments-board");
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setSummary(data.summary);
      setSubscriptions(data.subscriptions || []);
      setPayments(data.payments || []);
    } catch (e: any) {
      toast.error(e.message || "Failed to load payment data");
    }
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  const fmt = (cents: number, currency = "gbp") =>
    new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(cents / 100);

  const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

  const statusColors: Record<string, string> = {
    active: "bg-emerald-500/20 text-emerald-400",
    past_due: "bg-amber-500/20 text-amber-400",
    canceled: "bg-red-500/20 text-red-400",
    trialing: "bg-blue-500/20 text-blue-400",
    unpaid: "bg-red-500/20 text-red-400",
    succeeded: "bg-emerald-500/20 text-emerald-400",
    requires_payment_method: "bg-amber-500/20 text-amber-400",
    requires_action: "bg-amber-500/20 text-amber-400",
  };

  const filteredSubs = subscriptions
    .filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (s.customer_email?.toLowerCase().includes(q) || s.customer_name?.toLowerCase().includes(q));
      }
      return true;
    })
    .sort((a, b) => sortAsc
      ? new Date(a.created).getTime() - new Date(b.created).getTime()
      : new Date(b.created).getTime() - new Date(a.created).getTime()
    );

  const filteredPayments = payments
    .filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (p.customer_email?.toLowerCase().includes(q) || p.customer_name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
      }
      return true;
    })
    .sort((a, b) => sortAsc
      ? new Date(a.created).getTime() - new Date(b.created).getTime()
      : new Date(b.created).getTime() - new Date(a.created).getTime()
    );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground text-sm">Loading Stripe data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Active Subs", value: summary.active_subscriptions, icon: TrendingUp, color: "text-emerald-400" },
            { label: "Past Due", value: summary.past_due, icon: AlertTriangle, color: "text-amber-400" },
            { label: "Cancelled", value: summary.canceled, icon: XCircle, color: "text-red-400" },
            { label: "Customers", value: summary.total_customers, icon: Users, color: "text-foreground" },
            { label: "Revenue (90d)", value: fmt(summary.revenue_last_90_days_cents, summary.currency), icon: CreditCard, color: "text-primary", isText: true },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className={`h-4 w-4 ${s.color}`} />
                <span className="text-[10px] text-muted-foreground font-display tracking-wider uppercase">{s.label}</span>
              </div>
              <p className={`text-xl font-display font-bold ${s.color}`}>
                {"isText" in s ? s.value : s.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs + Controls */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-1">
              {(["subscriptions", "payments"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setStatusFilter("all"); }}
                  className={`font-display text-xs tracking-wider py-2 px-4 rounded-lg border transition-all ${
                    tab === t ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "subscriptions" ? "Subscriptions" : "Payment History"}
                </button>
              ))}
            </div>
            <button onClick={loadData} className="ml-auto p-2 text-muted-foreground hover:text-primary transition-colors" title="Refresh">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground"
            >
              <option value="all">All Statuses</option>
              {tab === "subscriptions" ? (
                <>
                  <option value="active">Active</option>
                  <option value="past_due">Past Due</option>
                  <option value="canceled">Cancelled</option>
                  <option value="trialing">Trialing</option>
                  <option value="unpaid">Unpaid</option>
                </>
              ) : (
                <>
                  <option value="succeeded">Succeeded</option>
                  <option value="requires_payment_method">Requires Payment</option>
                  <option value="requires_action">Requires Action</option>
                </>
              )}
            </select>
            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="flex items-center gap-1 px-3 py-2.5 border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {sortAsc ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {sortAsc ? "Oldest" : "Newest"}
            </button>
          </div>
        </div>

        {/* Subscriptions Table */}
        {tab === "subscriptions" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left px-4 py-3 font-display text-[10px] tracking-wider uppercase text-muted-foreground">Customer</th>
                  <th className="text-left px-4 py-3 font-display text-[10px] tracking-wider uppercase text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-display text-[10px] tracking-wider uppercase text-muted-foreground">Amount</th>
                  <th className="text-left px-4 py-3 font-display text-[10px] tracking-wider uppercase text-muted-foreground">Next Payment</th>
                  <th className="text-left px-4 py-3 font-display text-[10px] tracking-wider uppercase text-muted-foreground">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSubs.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">No subscriptions found</td></tr>
                ) : (
                  filteredSubs.map((s) => (
                    <tr key={s.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-display font-semibold text-foreground text-xs">{s.customer_name || "—"}</p>
                        <p className="text-[10px] text-muted-foreground">{s.customer_email || "—"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-display tracking-wider uppercase ${statusColors[s.status] || "bg-muted text-muted-foreground"}`}>
                          {s.status.replace(/_/g, " ")}
                        </span>
                        {s.cancel_at_period_end && (
                          <span className="ml-1 text-[9px] text-amber-400">(cancels at end)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-display text-xs text-foreground">
                        {fmt(s.amount_cents, s.currency)}/{s.interval || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(s.current_period_end)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(s.created)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Payments Table */}
        {tab === "payments" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left px-4 py-3 font-display text-[10px] tracking-wider uppercase text-muted-foreground">Customer</th>
                  <th className="text-left px-4 py-3 font-display text-[10px] tracking-wider uppercase text-muted-foreground">Description</th>
                  <th className="text-left px-4 py-3 font-display text-[10px] tracking-wider uppercase text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-display text-[10px] tracking-wider uppercase text-muted-foreground">Amount</th>
                  <th className="text-left px-4 py-3 font-display text-[10px] tracking-wider uppercase text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPayments.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">No payments found</td></tr>
                ) : (
                  filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-display font-semibold text-foreground text-xs">{p.customer_name || "—"}</p>
                        <p className="text-[10px] text-muted-foreground">{p.customer_email || "—"}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">{p.description || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-display tracking-wider uppercase ${statusColors[p.status] || "bg-muted text-muted-foreground"}`}>
                          {p.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-display text-xs text-foreground">{fmt(p.amount_cents, p.currency)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(p.created)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-3 border-t border-border bg-secondary/30 text-center">
          <p className="text-xs text-muted-foreground">
            {tab === "subscriptions"
              ? `Showing ${filteredSubs.length} of ${subscriptions.length} subscriptions`
              : `Showing ${filteredPayments.length} of ${payments.length} payments (last 90 days)`}
          </p>
        </div>
      </div>
    </div>
  );
}
