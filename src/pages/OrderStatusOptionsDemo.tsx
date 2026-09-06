import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Package, CheckCircle, Clock, Truck, ShoppingBag } from "lucide-react";

const STEPS = ["ordered", "arrived", "printed", "delivered"] as const;

type Status = (typeof STEPS)[number];

const mockOrders = [
  { id: "1", order_name: "#1001", customer: "Sarah Jenkins", total: 42.0, status: "ordered" as Status },
  { id: "2", order_name: "#1002", customer: "Mark Thompson", total: 65.5, status: "arrived" as Status },
  { id: "3", order_name: "#1003", customer: "Emma Wilson", total: 28.0, status: "printed" as Status },
  { id: "4", order_name: "#1004", customer: "David Patel", total: 91.0, status: "delivered" as Status },
];

function StatusBadge({ status }: { status: Status }) {
  const styles: Record<Status, string> = {
    ordered: "bg-blue-500/15 text-blue-400",
    arrived: "bg-amber-500/15 text-amber-400",
    printed: "bg-violet-500/15 text-violet-400",
    delivered: "bg-emerald-500/15 text-emerald-400",
  };
  return (
    <Badge className={`${styles[status]} border-0 text-[10px] capitalize`}>
      {status}
    </Badge>
  );
}

function Option1Dropdown() {
  const [orders, setOrders] = useState(mockOrders);
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Each order has a single status dropdown. Quick to update, easy to filter.</p>
      {orders.map((o) => (
        <div key={o.id} className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-display font-bold text-primary">{o.order_name}</span>
            <span className="text-sm text-foreground">{o.customer}</span>
            <span className="text-xs text-muted-foreground">£{o.total.toFixed(2)}</span>
          </div>
          <select
            value={o.status}
            onChange={(e) => setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, status: e.target.value as Status } : x)))}
            className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground"
          >
            {STEPS.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}

function Option2Stepper() {
  const [orders, setOrders] = useState(mockOrders);
  const stepIndex = (s: Status) => STEPS.indexOf(s);
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Click the furthest stage reached. A clear visual progress bar per order.</p>
      {orders.map((o) => (
        <div key={o.id} className="bg-card border border-border rounded-xl px-4 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-display font-bold text-primary">{o.order_name}</span>
              <span className="text-sm text-foreground">{o.customer}</span>
            </div>
            <StatusBadge status={o.status} />
          </div>
          <div className="flex items-center gap-1">
            {STEPS.map((s, i) => {
              const active = i <= stepIndex(o.status);
              return (
                <button
                  key={s}
                  onClick={() => setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, status: s } : x)))}
                  className={`flex-1 rounded-md py-1.5 text-[10px] font-display uppercase tracking-wider transition-colors ${
                    active ? "bg-primary text-primary-foreground" : "bg-secondary/40 text-muted-foreground hover:bg-secondary/60"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function Option3Bulk() {
  const [orders, setOrders] = useState(mockOrders);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };
  const apply = (status: Status) => {
    setOrders((prev) => prev.map((o) => (selected.has(o.id) ? { ...o, status } : o)));
    setSelected(new Set());
  };
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Tick multiple orders, then set them all to the same stage in one go.</p>
      <div className="flex items-center gap-2">
        {STEPS.map((s) => (
          <Button key={s} size="sm" variant="outline" onClick={() => apply(s)} disabled={selected.size === 0}>
            Mark {s}
          </Button>
        ))}
        <span className="text-xs text-muted-foreground ml-2">{selected.size} selected</span>
      </div>
      {orders.map((o) => (
        <div key={o.id} className="flex items-center gap-4 bg-card border border-border rounded-xl px-4 py-3">
          <Checkbox checked={selected.has(o.id)} onCheckedChange={() => toggle(o.id)} />
          <div className="flex-1 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-display font-bold text-primary">{o.order_name}</span>
              <span className="text-sm text-foreground">{o.customer}</span>
            </div>
            <StatusBadge status={o.status} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Option4AutoManual() {
  const [orders] = useState([
    { ...mockOrders[0], auto: "Ordered (Shopify)", manual: null },
    { ...mockOrders[1], auto: null, manual: "Arrived" as Status },
    { ...mockOrders[2], auto: null, manual: "Printed" as Status },
    { ...mockOrders[3], auto: "Delivered (Shopify)", manual: null },
  ]);
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Shopify automatically sets Ordered/Delivered. You only mark Arrived and Printed manually.</p>
      {orders.map((o: any) => (
        <div key={o.id} className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-display font-bold text-primary">{o.order_name}</span>
            <span className="text-sm text-foreground">{o.customer}</span>
          </div>
          <div className="flex items-center gap-2">
            {o.auto ? (
              <Badge className="bg-emerald-500/15 text-emerald-400 border-0 text-[10px]">
                <CheckCircle className="h-3 w-3 mr-1" /> {o.auto}
              </Badge>
            ) : (
              <select className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground">
                {STEPS.filter((s) => s !== "delivered").map((s) => (
                  <option key={s} value={s} selected={o.manual === s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function OrderStatusOptionsDemo() {
  return (
    <div className="min-h-screen bg-background text-foreground pt-28 pb-12 px-4 md:px-8 max-w-5xl mx-auto space-y-10">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Order Status Tracking Options</h1>
        <p className="text-sm text-muted-foreground mt-1">Admin-only view. Click around to see how each option feels.</p>
      </div>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-display font-bold">Option 1 — Simple Dropdown</h2>
        </div>
        <Option1Dropdown />
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-display font-bold">Option 2 — Visual Progress Stepper</h2>
        </div>
        <Option2Stepper />
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-display font-bold">Option 3 — Bulk Update</h2>
        </div>
        <Option3Bulk />
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-display font-bold">Option 4 — Auto + Manual Mix</h2>
        </div>
        <Option4AutoManual />
      </section>
    </div>
  );
}
