import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { useTeamFixtures } from "@/hooks/useTeamFixtures";
import { normalizeClubTeamSlugs } from "@/lib/teamConfig";
import { KIT_STATUS_LABELS } from "@/lib/kitConfig";
import {
  Loader2, AlertCircle, Package, ShoppingBag, Shirt, CalendarDays,
  FileText, Settings, Wallet, CheckCircle2, MapPin,
} from "lucide-react";

interface Child {
  key: string;
  name: string;
  teamSlug: string | null;
  registered: boolean;
}

interface KitRequest {
  id: string;
  player_name: string;
  status: string;
  size: string;
  chargeable: boolean;
  charge_amount: number | null;
  created_at: string;
  kit_items: { name: string } | null;
}

interface ShopOrder {
  id: string;
  created_at: string;
  status: string;
  progress_status: string | null;
  total_cents: number;
  items: any[];
}

function slugFromTeamName(name: string | null): string | null {
  if (!name) return null;
  const base = name.trim().toLowerCase().replace(/\s+/g, "-");
  const normalized = normalizeClubTeamSlugs([base]);
  return normalized[0] ?? null;
}

const KIT_PROGRESS: Record<string, number> = {
  pending: 25,
  approved: 50,
  ready: 75,
  handed_out: 100,
};

const ORDER_PROGRESS: Record<string, number> = {
  ordered: 25,
  arrived: 50,
  printed: 75,
  delivered: 100,
};

function formatPrice(cents: number) {
  return `£${(cents / 100).toFixed(2)}`;
}

function ChildFixtureCard({ child }: { child: Child }) {
  const slug = child.teamSlug ?? undefined;
  const { data, isLoading, isError } = useTeamFixtures(slug);
  const next = data?.fixtures?.[0];

  return (
    <div className="relative overflow-hidden bg-card border border-border p-5 rounded-sm">
      <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[9px] font-bold px-3 py-1 uppercase tracking-tighter">
        {child.name.split(" ")[0]}
      </div>
      <div className="mt-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : isError ? (
          <p className="text-muted-foreground text-xs text-center py-6">Fixtures are not loading right now.</p>
        ) : !next ? (
          <p className="text-muted-foreground text-xs text-center py-6">No upcoming fixture listed yet.</p>
        ) : (
          <div className="flex flex-col items-center text-center">
            <p className="text-primary font-display text-xs tracking-widest uppercase mb-3">
              {next.date}{next.time ? ` - ${next.time}` : ""}
            </p>
            <div className="flex items-center justify-between w-full gap-3 mb-3">
              <div className="flex-1">
                <p className="text-foreground text-xs font-bold uppercase leading-tight">{next.homeTeam}</p>
              </div>
              <div className="text-muted-foreground font-display text-lg">VS</div>
              <div className="flex-1">
                <p className="text-foreground text-xs font-bold uppercase leading-tight">{next.awayTeam}</p>
              </div>
            </div>
            {next.venue && (
              <p className="text-muted-foreground text-[10px] font-medium flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {next.venue}
              </p>
            )}
            {slug && (
              <Link
                to={`/hub?tab=fixtures&team=${slug}`}
                className="mt-4 w-full py-2 bg-primary text-primary-foreground font-bold text-[10px] uppercase tracking-widest hover:opacity-90 transition-opacity text-center rounded-sm"
              >
                View & Confirm Availability
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ParentHomePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [children, setChildren] = useState<Child[]>([]);
  const [kitRequests, setKitRequests] = useState<KitRequest[]>([]);
  const [orders, setOrders] = useState<ShopOrder[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const [profileRes, regsRes, guardiansRes, kitRes, ordersRes] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", user.id).single(),
        supabase.from("player_registrations").select("id, child_name, preferred_age_group").eq("user_id", user.id),
        supabase.from("guardians").select("id, player_name, team_slug").eq("parent_user_id", user.id),
        supabase.from("kit_requests" as any).select("id, player_name, status, size, chargeable, charge_amount, created_at, kit_items(name)").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("shop_orders").select("id, created_at, status, progress_status, total_cents, items").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
      ]);

      const fullName = (profileRes.data?.full_name || "").trim();
      setFirstName(fullName.split(" ")[0] || "there");

      const kids: Child[] = [];
      const known = new Set<string>();
      for (const r of regsRes.data || []) {
        const name = (r.child_name || "").trim();
        if (!name) continue;
        known.add(name.toLowerCase());
        kids.push({
          key: r.id,
          name,
          teamSlug: slugFromTeamName(r.preferred_age_group),
          registered: true,
        });
      }
      for (const g of guardiansRes.data || []) {
        const name = (g.player_name || "").trim();
        if (!name || known.has(name.toLowerCase())) continue;
        known.add(name.toLowerCase());
        kids.push({
          key: `guardian:${g.id}`,
          name,
          teamSlug: slugFromTeamName(g.team_slug),
          registered: false,
        });
      }
      kids.sort((a, b) => a.name.localeCompare(b.name));
      setChildren(kids);
      setKitRequests((kitRes.data as any) || []);
      setOrders(((ordersRes.data as any[]) || []).map((o) => ({ ...o, items: Array.isArray(o.items) ? o.items : [] })));
      setLoading(false);
    })();
  }, [user]);

  const actions = useMemo(() => {
    const list: { id: string; label: string; detail: string; to: string }[] = [];
    for (const r of kitRequests) {
      const itemName = r.kit_items?.name || "Kit";
      if (r.status === "ready") {
        list.push({
          id: `kit-ready-${r.id}`,
          label: `Collect ${itemName} for ${r.player_name}`,
          detail: "Ready to collect",
          to: "/kit",
        });
      } else if (r.status === "approved" && r.chargeable && r.charge_amount) {
        list.push({
          id: `kit-pay-${r.id}`,
          label: `Pay ${formatPrice(r.charge_amount)} for ${r.player_name}'s ${itemName}`,
          detail: "Charge due",
          to: "/kit",
        });
      }
    }
    for (const o of orders) {
      if (o.status === "pending") {
        list.push({
          id: `order-pay-${o.id}`,
          label: `Complete payment for your shop order (${formatPrice(o.total_cents)})`,
          detail: "Payment pending",
          to: "/my-profile?tab=orders",
        });
      }
    }
    for (const c of children) {
      if (!c.registered) {
        list.push({
          id: `reg-${c.key}`,
          label: `Complete registration for ${c.name}`,
          detail: "Registration not finished",
          to: "/register",
        });
      }
    }
    return list;
  }, [kitRequests, orders, children]);

  const activeKit = kitRequests.filter((r) => ["pending", "approved", "ready"].includes(r.status));
  const activeOrders = orders.filter((o) => o.status !== "cancelled" && o.progress_status !== "delivered").slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <SEO title="My Family | Peterborough Athletic FC" description="Your family dashboard - kit, orders, payments and fixtures in one place." />
      <Navbar />
      <main className="pt-28 pb-16 px-4 md:px-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-primary/20 pb-6 gap-4">
            <div>
              <h2 className="text-primary font-display uppercase tracking-widest text-sm font-bold mb-1">Parent Dashboard</h2>
              <h1 className="text-foreground font-display uppercase text-4xl md:text-5xl leading-none">
                Welcome back, <span className="text-primary">{firstName}</span>
              </h1>
            </div>
            {children.length > 0 && (
              <div className="bg-card border border-primary/30 px-4 py-2 rounded-sm">
                <p className="text-[10px] text-primary uppercase font-bold">Your Players</p>
                <p className="text-foreground font-display text-xl">{children.map((c) => c.name.split(" ")[0]).join(" & ")}</p>
              </div>
            )}
          </header>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left column */}
              <div className="lg:col-span-1 space-y-6">
                {/* Required actions */}
                <section className="bg-card border-l-4 border-primary p-5 rounded-sm">
                  <h3 className="text-primary font-display uppercase text-lg mb-4 flex items-center gap-2">
                    Required Actions
                    {actions.length > 0 && (
                      <span className="bg-destructive text-destructive-foreground text-[10px] px-2 py-0.5 rounded-full font-sans">
                        {actions.length}
                      </span>
                    )}
                  </h3>
                  {actions.length === 0 ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      All up to date - nothing needs your attention.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {actions.map((a) => (
                        <Link
                          key={a.id}
                          to={a.to}
                          className="block bg-muted/50 p-3 rounded hover:bg-muted transition-colors"
                        >
                          <p className="text-foreground text-sm font-semibold flex items-center gap-2">
                            <AlertCircle className="h-3.5 w-3.5 text-primary shrink-0" />
                            {a.label}
                          </p>
                          <p className="text-primary text-[10px] mt-1 font-bold uppercase tracking-wider">{a.detail}</p>
                        </Link>
                      ))}
                    </div>
                  )}
                </section>

                {/* Kit tracking */}
                <section className="bg-card border border-border p-5 rounded-sm">
                  <h3 className="text-foreground font-display uppercase text-lg mb-4 flex items-center gap-2">
                    <Shirt className="h-4 w-4 text-primary" /> Kit Tracking
                  </h3>
                  {activeKit.length === 0 ? (
                    <p className="text-muted-foreground text-xs">
                      No kit requests on the go. <Link to="/kit" className="text-primary underline">Request kit</Link>
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {activeKit.map((r) => (
                        <div key={r.id} className="flex items-center gap-4">
                          <div className="flex-1">
                            <p className="text-foreground text-sm font-bold">
                              {r.kit_items?.name || "Kit"} <span className="text-muted-foreground font-normal">for {r.player_name.split(" ")[0]} ({r.size})</span>
                            </p>
                            <div className="w-full bg-muted h-1 mt-2 rounded-full overflow-hidden">
                              <div className="bg-primary h-full transition-all" style={{ width: `${KIT_PROGRESS[r.status] ?? 10}%` }} />
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-tighter">
                              Status: {KIT_STATUS_LABELS[r.status] || r.status}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Orders */}
                <section className="bg-card border border-border p-5 rounded-sm">
                  <h3 className="text-foreground font-display uppercase text-lg mb-4 flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-primary" /> Shop Orders
                  </h3>
                  {activeOrders.length === 0 ? (
                    <p className="text-muted-foreground text-xs">
                      No orders on the go. <Link to="/shop" className="text-primary underline">Visit the club shop</Link>
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {activeOrders.map((o) => (
                        <Link key={o.id} to="/my-profile?tab=orders" className="flex items-center gap-4 group">
                          <Package className="h-5 w-5 text-primary shrink-0" />
                          <div className="flex-1">
                            <p className="text-foreground text-sm font-bold group-hover:text-primary transition-colors">
                              Order {formatPrice(o.total_cents)}
                            </p>
                            <div className="w-full bg-muted h-1 mt-2 rounded-full overflow-hidden">
                              <div className="bg-primary h-full transition-all" style={{ width: `${ORDER_PROGRESS[o.progress_status || "ordered"] ?? 25}%` }} />
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-tighter">
                              {o.status === "pending" ? "Awaiting payment" : `Status: ${o.progress_status || "ordered"}`}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              {/* Right column: fixtures */}
              <div className="lg:col-span-2 space-y-6">
                <section className="bg-card border border-border p-6 rounded-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-foreground font-display uppercase text-2xl flex items-center gap-2">
                      <CalendarDays className="h-5 w-5 text-primary" /> Next Fixtures
                    </h3>
                    <Link
                      to="/hub?tab=fixtures"
                      className="text-primary text-xs font-bold uppercase tracking-widest border border-primary/40 px-3 py-1 hover:bg-primary hover:text-primary-foreground transition-all rounded-sm"
                    >
                      View All
                    </Link>
                  </div>
                  {children.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      No players linked to your account yet.{" "}
                      <Link to="/register" className="text-primary underline">Register your child</Link> to see their fixtures here.
                    </p>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {children.map((c) => (
                        <ChildFixtureCard key={c.key} child={c} />
                      ))}
                    </div>
                  )}
                </section>

                {/* Quick links */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { to: "/hub?tab=payments", icon: Wallet, label: "Payments" },
                    { to: "/kit", icon: Shirt, label: "Match Day Kit" },
                    { to: "/hub?tab=reports", icon: FileText, label: "Match Reports" },
                    { to: "/my-profile", icon: Settings, label: "My Profile" },
                  ].map(({ to, icon: Icon, label }) => (
                    <Link
                      key={to}
                      to={to}
                      className="aspect-square bg-card border border-border flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-all group rounded-sm"
                    >
                      <div className="w-10 h-10 rounded bg-muted group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">{label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
