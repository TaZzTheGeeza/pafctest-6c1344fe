import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ShoppingBag, Loader2, RefreshCw, Package,
  ChevronDown, ChevronUp, Clock, CheckCircle, XCircle, AlertTriangle, Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface LineItem {
  id: number;
  title: string;
  variant_title: string | null;
  quantity: number;
  price: string;
  properties?: Array<{ name: string; value: string }>;
}

interface LineItemOverride {
  size?: string;
  initials?: string;
  note?: string;
}


interface ShopifyOrder {
  id: string;
  shopify_order_id: number;
  order_name: string;
  order_number: number;
  email: string | null;
  customer_first_name: string | null;
  customer_last_name: string | null;
  customer_email: string | null;
  financial_status: string;
  fulfillment_status: string | null;
  total_price: number;
  currency: string;
  line_items: LineItem[];
  admin_overrides?: Record<string, LineItemOverride> | null;
  cancelled_at: string | null;
  shopify_created_at: string;
}

const SIZE_SUGGESTIONS = [
  "5-6 Years", "7-8 Years", "9-10 Years", "11-12 Years", "13-14 Years",
  "XS", "S", "M", "L", "XL", "2XL", "3XL",
];

/** Pull any personalisation (initials etc.) a customer added at checkout. */
function itemProperties(item: LineItem) {
  return (item.properties || []).filter(
    (p) => p && p.value && !String(p.name).startsWith("_")
  );
}

function initialsOf(item: LineItem) {
  const prop = itemProperties(item).find((p) =>
    /initial|name|personal/i.test(p.name)
  );
  return prop?.value || null;
}


const STATUS_STYLES: Record<string, { bg: string; text: string; icon: any }> = {
  paid: { bg: "bg-emerald-500/15", text: "text-emerald-400", icon: CheckCircle },
  partially_paid: { bg: "bg-amber-500/15", text: "text-amber-400", icon: Clock },
  pending: { bg: "bg-amber-500/15", text: "text-amber-400", icon: Clock },
  refunded: { bg: "bg-red-500/15", text: "text-red-400", icon: XCircle },
  voided: { bg: "bg-red-500/15", text: "text-red-400", icon: XCircle },
  partially_refunded: { bg: "bg-amber-500/15", text: "text-amber-400", icon: AlertTriangle },
};

const FULFILLMENT_STYLES: Record<string, { bg: string; text: string }> = {
  fulfilled: { bg: "bg-emerald-500/15", text: "text-emerald-400" },
  partial: { bg: "bg-amber-500/15", text: "text-amber-400" },
  unfulfilled: { bg: "bg-blue-500/15", text: "text-blue-400" },
};

export function OrdersTab() {
  const [orders, setOrders] = useState<ShopifyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [syncWarning, setSyncWarning] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<LineItemOverride>({});
  const [saving, setSaving] = useState(false);

  const saveOverride = async (order: ShopifyOrder, item: LineItem) => {
    setSaving(true);
    try {
      const next: Record<string, LineItemOverride> = { ...(order.admin_overrides || {}) };
      const clean: LineItemOverride = {
        size: (draft.size || "").trim() || undefined,
        initials: (draft.initials || "").trim().toUpperCase() || undefined,
        note: (draft.note || "").trim() || undefined,
      };
      if (!clean.size && !clean.initials && !clean.note) delete next[String(item.id)];
      else next[String(item.id)] = clean;

      const { error } = await supabase
        .from("shopify_orders" as any)
        .update({ admin_overrides: next } as any)
        .eq("id", order.id);
      if (error) throw error;

      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, admin_overrides: next } : o))
      );
      setEditingKey(null);
      toast.success("Order details updated");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Could not save changes");
    } finally {
      setSaving(false);
    }
  };


  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      // Pull the latest orders straight from Shopify first so the dashboard
      // is correct even if the store webhook never reached us.
      try {
        const { data: sync, error: syncErr } = await supabase.functions.invoke("shopify-orders", {
          body: {},
        });
        if (syncErr) throw syncErr;
        if ((sync as any)?.error) throw new Error((sync as any).error);
        setSyncWarning(null);
      } catch (e: any) {
        console.error("Shopify sync failed:", e);
        setSyncWarning("Could not reach Shopify just now — showing the last saved orders.");
      }

      let query = supabase
        .from("shopify_orders" as any)
        .select("*")
        .order("shopify_created_at", { ascending: false })
        .limit(100);

      if (statusFilter === "paid") {
        query = query.eq("financial_status", "paid");
      } else if (statusFilter === "pending") {
        query = query.eq("financial_status", "pending");
      } else if (statusFilter === "cancelled") {
        query = query.not("cancelled_at", "is", null);
      }

      const { data, error } = await query;
      if (error) throw error;
      setOrders((data as any) ?? []);
    } catch (err: any) {
      console.error("Failed to fetch orders:", err);
      toast.error(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const customerName = (order: ShopifyOrder) => {
    const name = `${order.customer_first_name || ""} ${order.customer_last_name || ""}`.trim();
    return name || order.customer_email || order.email || "Unknown";
  };

  const totalRevenue = orders
    .filter((o) => !o.cancelled_at && (o.financial_status === "paid" || o.financial_status === "partially_paid"))
    .reduce((sum, o) => sum + (o.total_price || 0), 0);

  return (
    <div className="space-y-6">
      <datalist id="pafc-size-options">
        {SIZE_SUGGESTIONS.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Orders", value: orders.length, icon: Package, color: "text-foreground" },
          { label: "Paid", value: orders.filter((o) => o.financial_status === "paid").length, icon: CheckCircle, color: "text-emerald-400" },
          { label: "Pending", value: orders.filter((o) => o.financial_status === "pending").length, icon: Clock, color: "text-amber-400" },
          { label: "Revenue", value: `£${totalRevenue.toFixed(2)}`, icon: ShoppingBag, color: "text-primary" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <span className="text-xs text-muted-foreground font-display tracking-wider uppercase">{s.label}</span>
            </div>
            <p className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {syncWarning && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 p-3">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-200">{syncWarning}</p>
        </div>
      )}

      {/* Filters + refresh */}
      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
        >
          <option value="all">All Orders</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <Button variant="outline" size="sm" onClick={fetchOrders} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Orders list */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="text-sm font-display tracking-wider uppercase text-foreground flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-primary" /> Recent Orders
          </h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No orders found</p>
            <p className="text-xs text-muted-foreground mt-1">Orders will appear here automatically when customers purchase from the shop</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {orders.map((order) => {
              const expanded = expandedOrder === order.id;
              const payStatus = STATUS_STYLES[order.financial_status] || STATUS_STYLES.pending;
              const PayIcon = payStatus.icon;
              const fulfillStatus = FULFILLMENT_STYLES[order.fulfillment_status || "unfulfilled"] || FULFILLMENT_STYLES.unfulfilled;

              return (
                <div key={order.id}>
                  <button
                    onClick={() => setExpandedOrder(expanded ? null : order.id)}
                    className="w-full text-left px-5 py-4 hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="flex-shrink-0">
                          <span className="text-sm font-display font-bold text-primary">{order.order_name}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-display font-semibold text-foreground truncate">
                            {customerName(order)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(order.shopify_created_at).toLocaleDateString("en-GB", {
                              day: "numeric", month: "short", year: "numeric",
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge className={`${payStatus.bg} ${payStatus.text} border-0 text-[10px] gap-1`}>
                          <PayIcon className="h-3 w-3" />
                          {order.financial_status.replace(/_/g, " ")}
                        </Badge>
                        <Badge className={`${fulfillStatus.bg} ${fulfillStatus.text} border-0 text-[10px]`}>
                          {(order.fulfillment_status || "unfulfilled").replace(/_/g, " ")}
                        </Badge>
                        <span className="text-sm font-display font-bold text-foreground ml-2">
                          £{order.total_price.toFixed(2)}
                        </span>
                        {expanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </button>

                  {expanded && (
                    <div className="px-5 pb-4 bg-secondary/10">
                      <div className="border border-border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border bg-secondary/30">
                              <th className="text-left px-3 py-2 text-xs font-display uppercase tracking-wider text-muted-foreground">Item</th>
                              <th className="text-left px-3 py-2 text-xs font-display uppercase tracking-wider text-muted-foreground">Initials</th>
                              <th className="text-left px-3 py-2 text-xs font-display uppercase tracking-wider text-muted-foreground">Size</th>
                              <th className="text-center px-3 py-2 text-xs font-display uppercase tracking-wider text-muted-foreground">Qty</th>
                              <th className="text-right px-3 py-2 text-xs font-display uppercase tracking-wider text-muted-foreground">Price</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {(order.line_items || []).map((item) => {
                              const ov = (order.admin_overrides || {})[String(item.id)] || {};
                              const props = itemProperties(item);
                              const chosenInitials = initialsOf(item);
                              const key = `${order.id}:${item.id}`;
                              const isEditing = editingKey === key;
                              return (
                                <tr key={item.id} className="align-top">
                                  <td className="px-3 py-2 text-foreground">
                                    {item.title}
                                    {props.length > 0 && (
                                      <div className="mt-1 space-y-0.5">
                                        {props.map((p) => (
                                          <p key={p.name} className="text-[11px] text-muted-foreground">
                                            {p.name}: <span className="text-foreground">{p.value}</span>
                                          </p>
                                        ))}
                                      </div>
                                    )}
                                    {ov.note && (
                                      <p className="text-[11px] text-amber-300 mt-1">Note: {ov.note}</p>
                                    )}
                                  </td>
                                  <td className="px-3 py-2">
                                    {isEditing ? (
                                      <input
                                        value={draft.initials ?? ""}
                                        onChange={(e) => setDraft((d) => ({ ...d, initials: e.target.value }))}
                                        placeholder="e.g. AB"
                                        className="w-20 bg-background border border-border rounded px-2 py-1 text-xs text-foreground uppercase"
                                      />
                                    ) : (
                                      <span className={ov.initials ? "text-amber-300 font-semibold" : "text-foreground"}>
                                        {ov.initials || chosenInitials || <span className="text-muted-foreground">—</span>}
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2">
                                    {isEditing ? (
                                      <div className="space-y-1">
                                        <input
                                          list="pafc-size-options"
                                          value={draft.size ?? ""}
                                          onChange={(e) => setDraft((d) => ({ ...d, size: e.target.value }))}
                                          placeholder="Size"
                                          className="w-28 bg-background border border-border rounded px-2 py-1 text-xs text-foreground"
                                        />
                                        <input
                                          value={draft.note ?? ""}
                                          onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
                                          placeholder="Note (optional)"
                                          className="w-40 bg-background border border-border rounded px-2 py-1 text-xs text-foreground"
                                        />
                                      </div>
                                    ) : ov.size ? (
                                      <span className="text-amber-300 font-semibold">
                                        {ov.size}
                                        {item.variant_title && (
                                          <span className="block text-[10px] text-muted-foreground line-through">
                                            {item.variant_title}
                                          </span>
                                        )}
                                      </span>
                                    ) : (
                                      <span className="text-foreground">
                                        {item.variant_title || <span className="text-muted-foreground">—</span>}
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-center text-foreground">{item.quantity}</td>
                                  <td className="px-3 py-2 text-right text-foreground">
                                    <div className="flex flex-col items-end gap-1">
                                      <span>£{parseFloat(item.price).toFixed(2)}</span>
                                      {isEditing ? (
                                        <div className="flex gap-1">
                                          <Button size="sm" className="h-6 px-2 text-[10px]" disabled={saving}
                                            onClick={() => saveOverride(order, item)}>
                                            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
                                          </Button>
                                          <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]"
                                            onClick={() => setEditingKey(null)}>
                                            Cancel
                                          </Button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => {
                                            setEditingKey(key);
                                            setDraft({
                                              size: ov.size ?? item.variant_title ?? "",
                                              initials: ov.initials ?? chosenInitials ?? "",
                                              note: ov.note ?? "",
                                            });
                                          }}
                                          className="text-[10px] text-primary hover:underline flex items-center gap-1"
                                        >
                                          <Pencil className="h-3 w-3" /> Edit
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {order.email && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Customer email: <span className="text-foreground">{order.email}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
