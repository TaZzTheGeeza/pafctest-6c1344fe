import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ShoppingBag, Loader2, RefreshCw, Package, ExternalLink,
  ChevronDown, ChevronUp, Clock, CheckCircle, XCircle, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ShopifyLineItem {
  id: number;
  title: string;
  variant_title: string | null;
  quantity: number;
  price: string;
}

interface ShopifyOrder {
  id: number;
  name: string;
  order_number: number;
  created_at: string;
  financial_status: string;
  fulfillment_status: string | null;
  total_price: string;
  currency: string;
  email: string;
  customer: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
  line_items: ShopifyLineItem[];
  cancelled_at: string | null;
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
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("any");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) {
        toast.error("Please sign in again");
        return;
      }

      const url = new URL(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/shopify-orders`
      );
      url.searchParams.set("limit", "50");
      url.searchParams.set("status", statusFilter);

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error ${res.status}`);
      }

      const data = await res.json();
      setOrders(data.orders ?? []);
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
    if (order.customer) {
      const name = `${order.customer.first_name || ""} ${order.customer.last_name || ""}`.trim();
      return name || order.customer.email || order.email || "Unknown";
    }
    return order.email || "Unknown";
  };

  const totalRevenue = orders
    .filter((o) => !o.cancelled_at && (o.financial_status === "paid" || o.financial_status === "partially_paid"))
    .reduce((sum, o) => sum + parseFloat(o.total_price || "0"), 0);

  return (
    <div className="space-y-6">
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

      {/* Filters + refresh */}
      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
        >
          <option value="any">All Statuses</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
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
                          <span className="text-sm font-display font-bold text-primary">{order.name}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-display font-semibold text-foreground truncate">
                            {customerName(order)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString("en-GB", {
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
                          £{parseFloat(order.total_price).toFixed(2)}
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
                              <th className="text-center px-3 py-2 text-xs font-display uppercase tracking-wider text-muted-foreground">Qty</th>
                              <th className="text-right px-3 py-2 text-xs font-display uppercase tracking-wider text-muted-foreground">Price</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {order.line_items.map((item) => (
                              <tr key={item.id}>
                                <td className="px-3 py-2 text-foreground">
                                  {item.title}
                                  {item.variant_title && (
                                    <span className="text-muted-foreground text-xs ml-1">({item.variant_title})</span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-center text-foreground">{item.quantity}</td>
                                <td className="px-3 py-2 text-right text-foreground">£{parseFloat(item.price).toFixed(2)}</td>
                              </tr>
                            ))}
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
