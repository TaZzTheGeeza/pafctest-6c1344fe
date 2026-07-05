import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { RoleGate } from "@/components/RoleGate";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, parseISO } from "date-fns";
import { Loader2, CheckCircle2, XCircle, Hourglass, Shield, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Navigate } from "react-router-dom";

interface Booking {
  id: string;
  pitch_id: string;
  requested_by: string | null;
  start_time: string;
  end_time: string;
  purpose: string;
  age_group: string | null;
  opponent: string | null;
  notes: string | null;
  status: "pending" | "approved" | "declined" | "cancelled";
  fa_fixture_id: string | null;
  decline_reason: string | null;
  created_at: string;
}

interface Pitch { id: string; number: number; name: string; format: string; }

function Inner() {
  const { user, isAdmin } = useAuth();
  const [isFixtureSec, setIsFixtureSec] = useState<boolean | null>(null);
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [requesters, setRequesters] = useState<Record<string, { name: string; email: string }>>({});
  const [tab, setTab] = useState<"pending" | "upcoming" | "history">("pending");
  const [loading, setLoading] = useState(true);
  const [declining, setDeclining] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase.from("user_roles").select("role").eq("user_id", user.id).then(({ data }) => {
      const roles = (data as any[])?.map(r => r.role) ?? [];
      setIsFixtureSec(roles.includes("fixture_secretary") || roles.includes("admin"));
    });
  }, [user]);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const [p, b] = await Promise.all([
      (supabase as any).from("pitches").select("*").order("number"),
      (supabase as any).from("pitch_bookings").select("*").order("start_time", { ascending: false }).limit(500),
    ]);
    setPitches((p.data as Pitch[]) || []);
    const bs = (b.data as Booking[]) || [];
    setBookings(bs);
    // Load requester profiles
    const ids = Array.from(new Set(bs.map(x => x.requested_by).filter(Boolean))) as string[];
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name, email").in("id", ids);
      const map: Record<string, { name: string; email: string }> = {};
      (profs as any[])?.forEach(p => { map[p.id] = { name: p.full_name || "Unknown", email: p.email || "" }; });
      setRequesters(map);
    }
    setLoading(false);
  }

  async function approve(b: Booking) {
    const { error } = await (supabase as any).from("pitch_bookings").update({
      status: "approved", decided_by: user?.id, decided_at: new Date().toISOString(), decline_reason: null,
    }).eq("id", b.id);
    if (error) toast.error(error.message);
    else { toast.success("Booking approved"); load(); }
  }

  async function decline(b: Booking) {
    if (!declineReason.trim()) { toast.error("Add a reason"); return; }
    const { error } = await (supabase as any).from("pitch_bookings").update({
      status: "declined", decided_by: user?.id, decided_at: new Date().toISOString(), decline_reason: declineReason,
    }).eq("id", b.id);
    if (error) toast.error(error.message);
    else { toast.success("Declined"); setDeclining(null); setDeclineReason(""); load(); }
  }

  async function remove(b: Booking) {
    if (!confirm("Delete this booking permanently?")) return;
    const { error } = await (supabase as any).from("pitch_bookings").delete().eq("id", b.id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); load(); }
  }

  if (isFixtureSec === false) return <Navigate to="/pitch-bookings" replace />;
  if (isFixtureSec === null || loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const now = new Date();
  const filtered = bookings.filter(b => {
    if (tab === "pending") return b.status === "pending";
    if (tab === "upcoming") return b.status === "approved" && new Date(b.end_time) >= now;
    return b.status !== "pending" && (new Date(b.end_time) < now || b.status !== "approved");
  });

  const pendingCount = bookings.filter(b => b.status === "pending").length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-5 w-5 text-primary" />
              <h1 className="font-display text-2xl md:text-3xl uppercase tracking-wider">Pitch Booking Approvals</h1>
            </div>
            <p className="text-sm text-muted-foreground">Approve, decline or manage all pitch booking requests.</p>
          </div>

          <div className="flex gap-2 mb-4">
            <TabBtn active={tab === "pending"} onClick={() => setTab("pending")} label={`Pending${pendingCount ? ` (${pendingCount})` : ""}`} />
            <TabBtn active={tab === "upcoming"} onClick={() => setTab("upcoming")} label="Upcoming" />
            <TabBtn active={tab === "history"} onClick={() => setTab("history")} label="History" />
          </div>

          {filtered.length === 0 && (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-muted-foreground">Nothing here.</div>
          )}

          <div className="space-y-2">
            {filtered.map(b => {
              const pitch = pitches.find(p => p.id === b.pitch_id);
              const req = b.requested_by ? requesters[b.requested_by] : null;
              return (
                <div key={b.id} className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-start gap-3 flex-wrap">
                    <StatusIcon status={b.status} />
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="font-display tracking-wider text-sm">{pitch?.name} <span className="text-muted-foreground">({pitch?.format})</span></div>
                        {b.fa_fixture_id && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 uppercase">FA</span>}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {format(parseISO(b.start_time), "EEE dd MMM yyyy · HH:mm")}–{format(parseISO(b.end_time), "HH:mm")}
                      </div>
                      <div className="text-xs mt-1">
                        <span className="uppercase text-muted-foreground">{b.purpose}</span>
                        {b.age_group && <> · <span>{b.age_group}</span></>}
                        {b.opponent && <> · <span>vs {b.opponent}</span></>}
                      </div>
                      {b.notes && <div className="text-xs text-muted-foreground mt-1 italic">"{b.notes}"</div>}
                      {req && <div className="text-[11px] text-muted-foreground mt-1">Requested by {req.name} · {req.email}</div>}
                      {b.status === "declined" && b.decline_reason && (
                        <div className="text-[11px] text-red-300 mt-1">Reason: {b.decline_reason}</div>
                      )}
                    </div>

                    <div className="flex gap-2 items-center">
                      {b.status === "pending" && (
                        <>
                          <button onClick={() => approve(b)} className="text-xs px-3 py-1.5 rounded bg-green-900/40 text-green-300 hover:bg-green-900/60 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Approve
                          </button>
                          <button onClick={() => setDeclining(b.id)} className="text-xs px-3 py-1.5 rounded bg-red-900/40 text-red-300 hover:bg-red-900/60 flex items-center gap-1">
                            <XCircle className="h-3 w-3" /> Decline
                          </button>
                        </>
                      )}
                      {isAdmin && (
                        <button onClick={() => remove(b)} className="text-muted-foreground hover:text-destructive p-1">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {declining === b.id && (
                    <div className="mt-3 pt-3 border-t border-border space-y-2">
                      <Textarea value={declineReason} onChange={e => setDeclineReason(e.target.value)} placeholder="Reason for declining (visible to requester)" rows={2} />
                      <div className="flex gap-2">
                        <button onClick={() => decline(b)} className="text-xs px-3 py-1.5 rounded bg-red-900/40 text-red-300">Confirm decline</button>
                        <button onClick={() => { setDeclining(null); setDeclineReason(""); }} className="text-xs text-muted-foreground px-3 py-1.5">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function TabBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className={`text-xs font-display tracking-wider px-4 py-2 rounded-lg border ${active ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
      {label}
    </button>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "approved") return <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />;
  if (status === "declined") return <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />;
  if (status === "cancelled") return <XCircle className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />;
  return <Hourglass className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />;
}

export default function PitchBookingsAdminPage() {
  return (
    <RoleGate requiredRole="authenticated">
      <Inner />
    </RoleGate>
  );
}
