import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { useTeamFixtures } from "@/hooks/useTeamFixtures";
import { normalizeClubTeamSlugs, CLUB_TEAMS } from "@/lib/teamConfig";
import { KIT_STATUS_LABELS } from "@/lib/kitConfig";
import {
  Loader2, AlertCircle, Package, ShoppingBag, Shirt, CalendarDays,
  FileText, Settings, Wallet, CheckCircle2, MapPin, Bell, Trophy,
  ClipboardCheck, FileWarning, Share2, CircleDollarSign,
} from "lucide-react";

interface Child {
  key: string;
  name: string;
  teamSlug: string | null;
  registered: boolean;
  photoUrl?: string | null;
  consentMedical?: boolean | null;
  consentPhotography?: boolean | null;
  declarationConfirmed?: boolean | null;
  paymentStatus?: string | null;
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

interface AvailabilityRow {
  id: string;
  team_slug: string;
  fixture_date: string;
  opponent: string | null;
  status: string;
  responding_for: string | null;
  updated_at: string;
}

interface NotificationRow {
  id: string;
  title: string;
  message: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

interface PlayerStatRow {
  first_name: string;
  team_name: string | null;
  age_group: string | null;
  goals: number | null;
  assists: number | null;
  potm_awards: number | null;
  saves: number | null;
}

interface ReportRow {
  id: string;
  team_name: string;
  age_group: string | null;
  opponent: string;
  home_score: number | null;
  away_score: number | null;
  match_date: string;
}

interface WeekEvent {
  id: string;
  title: string;
  when: Date | null;
  whenLabel: string;
  location: string | null;
  team: string | null;
  link: string;
}

function slugFromTeamName(name: string | null): string | null {
  if (!name) return null;
  const base = name.trim().toLowerCase().replace(/\s+/g, "-");
  const normalized = normalizeClubTeamSlugs([base]);
  return normalized[0] ?? null;
}

function teamNameFromSlug(slug: string | null): string | null {
  if (!slug) return null;
  return CLUB_TEAMS.find((t) => t.slug === slug)?.name ?? null;
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

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function ChildFixtureCard({ child, availability }: { child: Child; availability: AvailabilityRow[] }) {
  const slug = child.teamSlug ?? undefined;
  const { data, isLoading, isError } = useTeamFixtures(slug);
  const next = data?.fixtures?.[0];

  const answered = useMemo(() => {
    if (!next || !slug) return true;
    return availability.some(
      (a) =>
        a.team_slug === slug &&
        a.fixture_date === next.date &&
        (!a.responding_for || a.responding_for.toLowerCase().includes(child.name.split(" ")[0].toLowerCase())),
    );
  }, [availability, next, slug, child.name]);

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
            {!answered && (
              <p className="mt-3 text-[10px] font-bold uppercase tracking-wider bg-destructive/15 text-destructive px-2 py-1 rounded-sm">
                Availability not answered yet
              </p>
            )}
            {slug && (
              <Link
                to={`/hub?tab=availability&team=${slug}`}
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
  const [availability, setAvailability] = useState<AvailabilityRow[]>([]);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [stats, setStats] = useState<PlayerStatRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [weekEvents, setWeekEvents] = useState<WeekEvent[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const [profileRes, regsRes, guardiansRes, kitRes, ordersRes, availRes, notifRes] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", user.id).single(),
        supabase
          .from("player_registrations")
          .select("id, child_name, preferred_age_group, photo_url, consent_medical, consent_photography, declaration_confirmed, payment_status")
          .eq("user_id", user.id),
        supabase.from("guardians").select("id, player_name, team_slug").eq("parent_user_id", user.id),
        supabase.from("kit_requests" as any).select("id, player_name, status, size, chargeable, charge_amount, created_at, kit_items(name)").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("shop_orders").select("id, created_at, status, progress_status, total_cents, items").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
        supabase.from("fixture_availability").select("id, team_slug, fixture_date, opponent, status, responding_for, updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(40),
        supabase.from("hub_notifications").select("id, title, message, link, is_read, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
      ]);

      const fullName = (profileRes.data?.full_name || "").trim();
      setFirstName(fullName.split(" ")[0] || "there");

      const kids: Child[] = [];
      const known = new Set<string>();
      for (const r of (regsRes.data as any[]) || []) {
        const name = (r.child_name || "").trim();
        if (!name) continue;
        known.add(name.toLowerCase());
        kids.push({
          key: r.id,
          name,
          teamSlug: slugFromTeamName(r.preferred_age_group),
          registered: true,
          photoUrl: r.photo_url,
          consentMedical: r.consent_medical,
          consentPhotography: r.consent_photography,
          declarationConfirmed: r.declaration_confirmed,
          paymentStatus: r.payment_status,
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
      setAvailability(((availRes.data as any[]) || []) as AvailabilityRow[]);
      setNotifications(((notifRes.data as any[]) || []) as NotificationRow[]);

      // Team-scoped extras
      const slugs = [...new Set(kids.map((k) => k.teamSlug).filter(Boolean))] as string[];
      const names = slugs.map((s) => teamNameFromSlug(s)).filter(Boolean) as string[];

      if (names.length > 0) {
        const reportNames = names.flatMap((n) => [`Peterborough Athletic ${n}`, n]);
        const now = new Date();
        const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const [statsRes, reportsRes, eventsRes, hubEventsRes] = await Promise.all([
          supabase.from("player_stats").select("first_name, team_name, age_group, goals, assists, potm_awards, saves").in("age_group", names),
          supabase.from("match_reports").select("id, team_name, age_group, opponent, home_score, away_score, match_date").in("team_name", reportNames).order("match_date", { ascending: false }).limit(20),
          supabase.from("club_events").select("id, title, start_time, location, team").gte("start_time", now.toISOString()).lte("start_time", weekAhead.toISOString()).order("start_time"),
          supabase.from("hub_availability_events").select("id, title, event_date, event_time, venue, team_slug").in("team_slug", slugs),
        ]);

        setStats(((statsRes.data as any[]) || []) as PlayerStatRow[]);
        setReports(((reportsRes.data as any[]) || []) as ReportRow[]);

        const events: WeekEvent[] = [];
        for (const e of (eventsRes.data as any[]) || []) {
          if (e.team && !names.includes(e.team) && !slugs.includes(String(e.team).toLowerCase())) continue;
          const when = new Date(e.start_time);
          events.push({
            id: `club-${e.id}`,
            title: e.title,
            when,
            whenLabel: when.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) +
              ` ${when.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`,
            location: e.location,
            team: e.team,
            link: "/events",
          });
        }
        for (const e of (hubEventsRes.data as any[]) || []) {
          const parsed = e.event_date ? new Date(`${e.event_date}${e.event_time ? `T${e.event_time}` : "T00:00"}`) : null;
          if (!parsed || isNaN(parsed.getTime())) continue;
          if (parsed < now || parsed > weekAhead) continue;
          events.push({
            id: `hub-${e.id}`,
            title: e.title,
            when: parsed,
            whenLabel: parsed.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) +
              (e.event_time ? ` ${e.event_time}` : ""),
            location: e.venue,
            team: teamNameFromSlug(e.team_slug),
            link: `/hub?tab=availability&team=${e.team_slug}`,
          });
        }
        events.sort((a, b) => (a.when?.getTime() ?? 0) - (b.when?.getTime() ?? 0));
        setWeekEvents(events.slice(0, 6));
      }

      setLoading(false);
    })();
  }, [user]);

  // 1. Payments due
  const paymentsDue = useMemo(() => {
    const list: { id: string; label: string; amount: string | null; to: string }[] = [];
    for (const o of orders) {
      if (o.status === "pending") {
        list.push({ id: `order-${o.id}`, label: "Club shop order awaiting payment", amount: formatPrice(o.total_cents), to: "/my-profile?tab=orders" });
      }
    }
    for (const r of kitRequests) {
      if (r.chargeable && r.charge_amount && ["approved", "ready"].includes(r.status)) {
        list.push({
          id: `kit-${r.id}`,
          label: `${r.kit_items?.name || "Kit"} for ${r.player_name.split(" ")[0]}`,
          amount: formatPrice(r.charge_amount),
          to: "/kit",
        });
      }
    }
    for (const c of children) {
      if (c.registered && c.paymentStatus && c.paymentStatus !== "paid" && c.paymentStatus !== "active") {
        list.push({ id: `reg-${c.key}`, label: `Registration payment for ${c.name.split(" ")[0]}`, amount: null, to: "/my-profile" });
      }
    }
    return list;
  }, [orders, kitRequests, children]);

  const actions = useMemo(() => {
    const list: { id: string; label: string; detail: string; to: string }[] = [];
    for (const r of kitRequests) {
      const itemName = r.kit_items?.name || "Kit";
      if (r.status === "ready") {
        list.push({ id: `kit-ready-${r.id}`, label: `Collect ${itemName} for ${r.player_name}`, detail: "Ready to collect", to: "/kit" });
      }
    }
    for (const c of children) {
      if (!c.registered) {
        list.push({ id: `reg-${c.key}`, label: `Complete registration for ${c.name}`, detail: "Registration not finished", to: "/register" });
      }
    }
    return list;
  }, [kitRequests, children]);

  // 3. Stats snapshot per child
  const childStats = useMemo(() => {
    return children.map((c) => {
      const teamName = teamNameFromSlug(c.teamSlug);
      const first = c.name.split(" ")[0].toLowerCase();
      const row = stats.find(
        (s) => (s.first_name || "").toLowerCase() === first && (!teamName || s.age_group === teamName),
      );
      return { child: c, row };
    }).filter((x) => x.row);
  }, [children, stats]);

  // 4. Attendance at a glance
  const attendance = useMemo(() => {
    const recent = availability.slice(0, 8);
    const available = recent.filter((a) => a.status === "available" || a.status === "yes").length;
    return { total: recent.length, available };
  }, [availability]);

  // 8. Latest report per team
  const latestReports = useMemo(() => {
    const seen = new Set<string>();
    const out: ReportRow[] = [];
    for (const r of reports) {
      if (seen.has(r.team_name)) continue;
      seen.add(r.team_name);
      out.push(r);
    }
    return out.slice(0, 3);
  }, [reports]);

  // 7. Documents & forms status
  const docIssues = useMemo(() => {
    const list: { id: string; child: string; missing: string[] }[] = [];
    for (const c of children) {
      if (!c.registered) continue;
      const missing: string[] = [];
      if (!c.photoUrl) missing.push("Player photo");
      if (!c.consentMedical) missing.push("Medical consent");
      if (!c.consentPhotography) missing.push("Photography consent");
      if (!c.declarationConfirmed) missing.push("Parent declaration");
      if (missing.length) list.push({ id: c.key, child: c.name.split(" ")[0], missing });
    }
    return list;
  }, [children]);

  const activeKit = kitRequests.filter((r) => ["pending", "approved", "ready"].includes(r.status));
  const activeOrders = orders.filter((o) => o.status !== "cancelled" && o.progress_status !== "delivered").slice(0, 3);

  const shareReport = async (r: ReportRow) => {
    const teamSlug = CLUB_TEAMS.find((t) => r.team_name.includes(t.name))?.slug;
    const url = `${window.location.origin}${teamSlug ? `/hub?tab=reports&team=${teamSlug}&report=${r.id}` : `/results?report=${r.id}`}`;
    const text = `${r.team_name} ${r.home_score ?? 0}-${r.away_score ?? 0} ${r.opponent}\n${url}`;
    if (navigator.share) {
      try { await navigator.share({ text }); return; } catch { /* cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    }
  };

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
            <>
              {/* 1. Payments due strip */}
              {paymentsDue.length > 0 && (
                <section className="bg-card border border-primary/40 rounded-sm p-4 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex items-center gap-2 shrink-0">
                    <CircleDollarSign className="h-5 w-5 text-primary" />
                    <h3 className="text-foreground font-display uppercase text-lg">Payments Due</h3>
                  </div>
                  <div className="flex-1 flex flex-wrap gap-2">
                    {paymentsDue.map((p) => (
                      <Link
                        key={p.id}
                        to={p.to}
                        className="bg-muted/60 hover:bg-muted transition-colors px-3 py-2 rounded text-xs text-foreground font-semibold flex items-center gap-2"
                      >
                        {p.label}
                        {p.amount && <span className="text-primary font-bold">{p.amount}</span>}
                      </Link>
                    ))}
                  </div>
                </section>
              )}

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
                          <Link key={a.id} to={a.to} className="block bg-muted/50 p-3 rounded hover:bg-muted transition-colors">
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

                  {/* 2. Latest alerts */}
                  <section className="bg-card border border-border p-5 rounded-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-foreground font-display uppercase text-lg flex items-center gap-2">
                        <Bell className="h-4 w-4 text-primary" /> Latest Alerts
                      </h3>
                      <Link to="/hub" className="text-primary text-[10px] font-bold uppercase tracking-wider">View all</Link>
                    </div>
                    {notifications.length === 0 ? (
                      <p className="text-muted-foreground text-xs">Nothing new right now.</p>
                    ) : (
                      <div className="space-y-3">
                        {notifications.slice(0, 3).map((n) => (
                          <Link
                            key={n.id}
                            to={n.link || "/hub"}
                            className="block bg-muted/40 hover:bg-muted transition-colors p-3 rounded"
                          >
                            <p className="text-foreground text-sm font-semibold flex items-center gap-2">
                              {!n.is_read && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                              {n.title}
                            </p>
                            {n.message && <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{n.message}</p>}
                            <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(n.created_at)}</p>
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

                  {/* 7. Documents & forms */}
                  <section className="bg-card border border-border p-5 rounded-sm">
                    <h3 className="text-foreground font-display uppercase text-lg mb-4 flex items-center gap-2">
                      <FileWarning className="h-4 w-4 text-primary" /> Forms & Consents
                    </h3>
                    {docIssues.length === 0 ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Everything we need is on file.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {docIssues.map((d) => (
                          <Link key={d.id} to="/my-profile" className="block bg-muted/40 hover:bg-muted transition-colors p-3 rounded">
                            <p className="text-foreground text-sm font-semibold">{d.child}</p>
                            <p className="text-muted-foreground text-xs mt-1">Missing: {d.missing.join(", ")}</p>
                          </Link>
                        ))}
                      </div>
                    )}
                  </section>
                </div>

                {/* Right column */}
                <div className="lg:col-span-2 space-y-6">
                  <section className="bg-card border border-border p-6 rounded-sm">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-foreground font-display uppercase text-2xl flex items-center gap-2">
                        <CalendarDays className="h-5 w-5 text-primary" /> Next Fixtures
                      </h3>
                      <Link
                        to="/hub?tab=availability"
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
                          <ChildFixtureCard key={c.key} child={c} availability={availability} />
                        ))}
                      </div>
                    )}
                  </section>

                  {/* 3. Stats snapshot */}
                  {childStats.length > 0 && (
                    <section className="bg-card border border-border p-6 rounded-sm">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-foreground font-display uppercase text-xl flex items-center gap-2">
                          <Trophy className="h-5 w-5 text-primary" /> Season Stats
                        </h3>
                        <Link to="/hub?tab=stats" className="text-primary text-[10px] font-bold uppercase tracking-wider">Full stats</Link>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {childStats.map(({ child, row }) => (
                          <div key={child.key} className="bg-muted/40 p-4 rounded-sm">
                            <p className="text-foreground font-display uppercase text-lg">{child.name.split(" ")[0]}</p>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">{teamNameFromSlug(child.teamSlug) || ""}</p>
                            <div className="grid grid-cols-4 gap-2 text-center">
                              {[
                                { label: "Goals", value: row?.goals ?? 0 },
                                { label: "Assists", value: row?.assists ?? 0 },
                                { label: "POTM", value: row?.potm_awards ?? 0 },
                                { label: "Saves", value: row?.saves ?? 0 },
                              ].map((s) => (
                                <div key={s.label}>
                                  <p className="text-primary font-display text-2xl leading-none">{s.value}</p>
                                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground mt-1">{s.label}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* 6. This week */}
                  <section className="bg-card border border-border p-6 rounded-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-foreground font-display uppercase text-xl flex items-center gap-2">
                        <CalendarDays className="h-5 w-5 text-primary" /> This Week For Your Family
                      </h3>
                      <Link to="/events" className="text-primary text-[10px] font-bold uppercase tracking-wider">Club calendar</Link>
                    </div>
                    {weekEvents.length === 0 ? (
                      <p className="text-muted-foreground text-sm">Nothing scheduled in the next seven days.</p>
                    ) : (
                      <div className="space-y-2">
                        {weekEvents.map((e) => (
                          <Link key={e.id} to={e.link} className="flex items-center gap-3 bg-muted/40 hover:bg-muted transition-colors p-3 rounded">
                            <div className="text-primary font-display text-xs uppercase w-28 shrink-0">{e.whenLabel}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-foreground text-sm font-semibold truncate">{e.title}</p>
                              <p className="text-muted-foreground text-[11px] truncate">
                                {[e.team, e.location].filter(Boolean).join(" - ")}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </section>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* 4. Attendance */}
                    <section className="bg-card border border-border p-6 rounded-sm">
                      <h3 className="text-foreground font-display uppercase text-xl flex items-center gap-2 mb-4">
                        <ClipboardCheck className="h-5 w-5 text-primary" /> Availability
                      </h3>
                      {attendance.total === 0 ? (
                        <p className="text-muted-foreground text-sm">No availability answers recorded yet.</p>
                      ) : (
                        <>
                          <p className="text-foreground font-display text-4xl">
                            {attendance.available}<span className="text-muted-foreground text-xl">/{attendance.total}</span>
                          </p>
                          <p className="text-muted-foreground text-xs mt-1">
                            Marked available across your last {attendance.total} answers.
                          </p>
                          <Link to="/hub?tab=availability" className="inline-block mt-4 text-primary text-[10px] font-bold uppercase tracking-wider">
                            Answer upcoming games
                          </Link>
                        </>
                      )}
                    </section>

                    {/* 8. Match report shortcuts */}
                    <section className="bg-card border border-border p-6 rounded-sm">
                      <h3 className="text-foreground font-display uppercase text-xl flex items-center gap-2 mb-4">
                        <FileText className="h-5 w-5 text-primary" /> Latest Match Reports
                      </h3>
                      {latestReports.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No reports posted yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {latestReports.map((r) => {
                            const teamSlug = CLUB_TEAMS.find((t) => r.team_name.includes(t.name))?.slug;
                            return (
                              <div key={r.id} className="flex items-center gap-3 bg-muted/40 p-3 rounded">
                                <Link
                                  to={teamSlug ? `/hub?tab=reports&team=${teamSlug}&report=${r.id}` : `/results?report=${r.id}`}
                                  className="flex-1 min-w-0"
                                >
                                  <p className="text-foreground text-sm font-semibold truncate">
                                    {r.team_name} {r.home_score ?? 0}-{r.away_score ?? 0} {r.opponent}
                                  </p>
                                  <p className="text-muted-foreground text-[11px]">
                                    {new Date(r.match_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                                  </p>
                                </Link>
                                <button
                                  onClick={() => shareReport(r)}
                                  aria-label="Share match report"
                                  className="p-2 rounded hover:bg-primary/20 transition-colors"
                                >
                                  <Share2 className="h-4 w-4 text-primary" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </section>
                  </div>

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
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
