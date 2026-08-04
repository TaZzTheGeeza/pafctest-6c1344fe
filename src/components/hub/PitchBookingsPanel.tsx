import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, addDays, startOfDay, parseISO } from "date-fns";
import { Loader2, MapPin, Clock, Plus, X, CheckCircle2, XCircle, Hourglass, Lock, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import groundMapAsset from "@/assets/itter-park-map.png.asset.json";

const groundSatellite = groundMapAsset.url;


interface Pitch {
  id: string;
  number: number;
  name: string;
  format: string;
  suggested_age_groups: string[];
}

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
}

const PURPOSE_OPTIONS = [
  { value: "match", label: "League Match" },
  { value: "cup", label: "Cup Match" },
  { value: "friendly", label: "Friendly" },
  { value: "training", label: "Training" },
  { value: "other", label: "Other" },
];

// Layout coordinates are positioned over the satellite image of Itter Park (viewBox 620 x 974).
// LEFT: 11v11 (Pitch 6) with a 9v9 (Pitch 5) inside it, and a 5v5 (Pitch 2) inside the 9v9.
// RIGHT: two 7v7 (Pitches 1 & 3) and one small 5v5 (Pitch 4).
const PITCH_LAYOUT: Record<number, { x: number; y: number; w: number; h: number; z: number; labelTop?: boolean }> = {
  6: { x: 40,  y: 460, w: 300, h: 470, z: 0, labelTop: true },  // 11v11 (outer)
  5: { x: 72,  y: 495, w: 236, h: 400, z: 1, labelTop: true },  // 9v9 (inside 11v11)
  2: { x: 118, y: 620, w: 144, h: 190, z: 2 },                  // 5v5 (inside 9v9)
  1: { x: 300, y: 110, w: 230, h: 190, z: 0 },                  // 7v7
  3: { x: 330, y: 320, w: 230, h: 190, z: 0 },                  // 7v7
  4: { x: 385, y: 540, w: 165, h: 130, z: 0 },                  // small 5v5
};



// Physical overlap groups: the 11v11, 9v9 and small 5v5 on the left are nested inside
// each other, so a booking on any one of them blocks the other two at the same time.
// The two 7v7s and the right-hand 5v5 are standalone.
const PITCH_OVERLAPS: Record<number, number[]> = {
  6: [5, 2],
  5: [6, 2],
  2: [6, 5],
  1: [],
  3: [],
  4: [],
};


function overlappingPitchIds(pitchNumber: number, pitches: Pitch[]): string[] {
  const nums = PITCH_OVERLAPS[pitchNumber] || [];
  return pitches.filter(p => nums.includes(p.number)).map(p => p.id);
}

function statusColor(status: string, isFaLocked: boolean) {
  if (isFaLocked) return { fill: "#374151", stroke: "#6b7280", text: "#e5e7eb" };
  switch (status) {
    case "approved": return { fill: "#7f1d1d", stroke: "#dc2626", text: "#fecaca" };
    case "pending": return { fill: "#78350f", stroke: "#f59e0b", text: "#fde68a" };
    default: return { fill: "#14532d", stroke: "#22c55e", text: "#bbf7d0" };
  }
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-3 h-3 rounded-sm" style={{ background: color }} />
      <span className="text-muted-foreground uppercase tracking-wider text-[10px]">{label}</span>
    </div>
  );
}

function StatusPill({ status, faLocked }: { status: string; faLocked: boolean }) {
  if (faLocked) return <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-gray-700 text-gray-200 uppercase tracking-wider"><Lock className="h-3 w-3" />FA</span>;
  const map: Record<string, { c: string; icon: any; label: string }> = {
    approved: { c: "bg-red-900/40 text-red-300", icon: CheckCircle2, label: "Confirmed" },
    pending: { c: "bg-amber-900/40 text-amber-300", icon: Hourglass, label: "Pending" },
    declined: { c: "bg-gray-800 text-gray-400", icon: XCircle, label: "Declined" },
    cancelled: { c: "bg-gray-800 text-gray-400", icon: XCircle, label: "Cancelled" },
  };
  const s = map[status] || map.pending;
  const Icon = s.icon;
  return <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded uppercase tracking-wider ${s.c}`}><Icon className="h-3 w-3" />{s.label}</span>;
}

function BookingDialog({ pitch, dayBookings, overlapBookings, pitches, selectedDate, onClose, onCreated }: {
  pitch: Pitch; dayBookings: Booking[]; overlapBookings: Booking[]; pitches: Pitch[]; selectedDate: string; onClose: () => void; onCreated: () => void;
}) {
  const { user } = useAuth();
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [purpose, setPurpose] = useState("match");
  const [ageGroup, setAgeGroup] = useState(pitch.suggested_age_groups[0] || "");
  const [opponent, setOpponent] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const combined = useMemo(() => [...(dayBookings || []), ...(overlapBookings || [])], [dayBookings, overlapBookings]);

  const hasConflict = useMemo(() => {
    const s = new Date(`${selectedDate}T${startTime}:00`);
    const e = new Date(`${selectedDate}T${endTime}:00`);
    return combined.some(b => b.status === "approved" && new Date(b.start_time) < e && new Date(b.end_time) > s);
  }, [combined, selectedDate, startTime, endTime]);

  async function submit() {
    if (!user) return;
    const start = new Date(`${selectedDate}T${startTime}:00`);
    const end = new Date(`${selectedDate}T${endTime}:00`);
    if (end <= start) { toast.error("End time must be after start time"); return; }
    setSubmitting(true);
    const { error } = await (supabase as any).from("pitch_bookings").insert({
      pitch_id: pitch.id,
      requested_by: user.id,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      purpose,
      age_group: ageGroup || null,
      opponent: opponent || null,
      notes: notes || null,
      status: "pending",
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Booking requested. Awaiting approval.");
    onCreated();
  }

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display tracking-wider uppercase flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" /> Book {pitch.name} <span className="text-xs text-muted-foreground">({pitch.format})</span>
          </DialogTitle>
        </DialogHeader>

        {combined.length > 0 && (
          <div className="text-xs bg-secondary/30 rounded-lg p-3 space-y-1">
            <div className="font-display uppercase tracking-wider text-muted-foreground mb-1">Existing on {format(parseISO(selectedDate), "dd MMM")}</div>
            {combined.map(b => {
              const bp = pitches.find(p => p.id === b.pitch_id);
              const isOverlap = bp && bp.id !== pitch.id;
              return (
                <div key={b.id} className="flex items-center gap-2">
                  <StatusPill status={b.status} faLocked={!!b.fa_fixture_id} />
                  <span>{format(parseISO(b.start_time), "HH:mm")}–{format(parseISO(b.end_time), "HH:mm")}</span>
                  {b.opponent && <span className="text-muted-foreground">vs {b.opponent}</span>}
                  {isOverlap && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-300 uppercase tracking-wider">on {bp?.name} · overlaps</span>}
                </div>
              );
            })}
          </div>
        )}

        <div className="space-y-3 mt-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Start</label>
              <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">End</label>
              <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Purpose</label>
            <Select value={purpose} onValueChange={setPurpose}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PURPOSE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Age group</label>
            <Input value={ageGroup} onChange={e => setAgeGroup(e.target.value)} placeholder="e.g. u10s" />
            {pitch.suggested_age_groups.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {pitch.suggested_age_groups.map(a => (
                  <button key={a} onClick={() => setAgeGroup(a)} className="text-[10px] px-2 py-0.5 rounded bg-secondary/50 hover:bg-secondary text-muted-foreground">{a}</button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Opponent (optional)</label>
            <Input value={opponent} onChange={e => setOpponent(e.target.value)} />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Notes</label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>

          {hasConflict && (
            <div className="text-xs bg-red-950/40 border border-red-800 rounded-lg p-2 text-red-300">
              ⚠ This slot overlaps an approved booking on {pitch.name} or a pitch marked out inside it (the 11v11, 9v9 and 5v5 on the left share the same ground). It can still be requested but is unlikely to be approved.
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button onClick={submit} disabled={submitting}
              className="flex-1 flex items-center justify-center gap-1 bg-primary text-primary-foreground rounded-lg py-2 text-xs font-display tracking-wider uppercase disabled:opacity-50">
              {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
              Request Booking
            </button>
            <button onClick={onClose} className="px-4 py-2 text-xs text-muted-foreground hover:text-foreground">Cancel</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MyBookingsTab({ userId, pitches }: { userId?: string; pitches: Pitch[] }) {
  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [editBooking, setEditBooking] = useState<Booking | null>(null);

  async function load() {
    if (!userId) return;
    setLoading(true);
    const { data } = await (supabase as any)
      .from("pitch_bookings")
      .select("*")
      .eq("requested_by", userId)
      .order("start_time", { ascending: false });
    setItems((data as Booking[]) || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [userId]);

  async function cancel(id: string) {
    if (!confirm("Cancel this booking request?")) return;
    const { error } = await (supabase as any).from("pitch_bookings").update({ status: "cancelled" }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Cancelled"); setItems(prev => prev.map(i => i.id === id ? { ...i, status: "cancelled" } : i)); }
  }

  async function remove(id: string) {
    if (!confirm("Delete this booking permanently?")) return;
    const { error } = await (supabase as any).from("pitch_bookings").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); setItems(prev => prev.filter(i => i.id !== id)); }
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (items.length === 0) return <div className="text-center text-sm text-muted-foreground py-16">You haven't requested any pitch bookings yet.</div>;

  return (
    <div className="space-y-2">
      {items.map(b => {
        const pitch = pitches.find(p => p.id === b.pitch_id);
        return (
          <div key={b.id} className="bg-card border border-border rounded-lg p-3 flex items-center gap-3 flex-wrap">
            <StatusPill status={b.status} faLocked={!!b.fa_fixture_id} />
            <div className="text-sm font-display tracking-wider">{pitch?.name}</div>
            <div className="text-xs text-muted-foreground">{format(parseISO(b.start_time), "EEE dd MMM · HH:mm")}–{format(parseISO(b.end_time), "HH:mm")}</div>
            <div className="text-xs">{b.age_group}{b.opponent ? ` vs ${b.opponent}` : ""}</div>
            {b.status === "declined" && b.decline_reason && (
              <div className="text-[11px] text-red-300 basis-full">Reason: {b.decline_reason}</div>
            )}
            <div className="ml-auto flex items-center gap-1">
              {b.status === "pending" && (
                <button onClick={() => cancel(b.id)} title="Cancel request" className="text-[11px] text-muted-foreground hover:text-amber-300 flex items-center gap-1 px-1"><X className="h-3 w-3" />Cancel</button>
              )}
              <button onClick={() => setEditBooking(b)} title="Edit booking" className="text-muted-foreground hover:text-primary p-1"><Pencil className="h-3.5 w-3.5" /></button>
              <button onClick={() => remove(b.id)} title="Delete booking" className="text-muted-foreground hover:text-destructive p-1"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        );
      })}
      {editBooking && (
        <EditBookingDialog
          booking={editBooking}
          pitches={pitches}
          onClose={() => setEditBooking(null)}
          onSaved={() => { setEditBooking(null); load(); }}
        />
      )}
    </div>
  );
}

function EditBookingDialog({ booking, pitches, onClose, onSaved }: {
  booking: Booking; pitches: Pitch[]; onClose: () => void; onSaved: () => void;
}) {
  const pitch = pitches.find(p => p.id === booking.pitch_id);
  const dateStr = format(parseISO(booking.start_time), "yyyy-MM-dd");
  const [date, setDate] = useState(dateStr);
  const [startTime, setStartTime] = useState(format(parseISO(booking.start_time), "HH:mm"));
  const [endTime, setEndTime] = useState(format(parseISO(booking.end_time), "HH:mm"));
  const [purpose, setPurpose] = useState(booking.purpose);
  const [ageGroup, setAgeGroup] = useState(booking.age_group || "");
  const [opponent, setOpponent] = useState(booking.opponent || "");
  const [notes, setNotes] = useState(booking.notes || "");
  const [status, setStatus] = useState<Booking["status"]>(booking.status);
  const [pitchId, setPitchId] = useState(booking.pitch_id);
  const [saving, setSaving] = useState(false);

  async function save() {
    const start = new Date(`${date}T${startTime}:00`);
    const end = new Date(`${date}T${endTime}:00`);
    if (end <= start) { toast.error("End time must be after start time"); return; }
    setSaving(true);
    const { error } = await (supabase as any).from("pitch_bookings").update({
      pitch_id: pitchId,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      purpose,
      age_group: ageGroup || null,
      opponent: opponent || null,
      notes: notes || null,
      status,
      admin_override: true,
    }).eq("id", booking.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Booking updated");
    onSaved();
  }

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display tracking-wider uppercase flex items-center gap-2">
            <Pencil className="h-4 w-4 text-primary" /> Edit Booking <span className="text-xs text-muted-foreground">({pitch?.name})</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Pitch</label>
            <Select value={pitchId} onValueChange={setPitchId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {pitches.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.format})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Date</label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Start</label>
              <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">End</label>
              <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Purpose</label>
            <Select value={purpose} onValueChange={setPurpose}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PURPOSE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Age group</label>
            <Input value={ageGroup} onChange={e => setAgeGroup(e.target.value)} />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Opponent</label>
            <Input value={opponent} onChange={e => setOpponent(e.target.value)} />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Notes</label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Status</label>
            <Select value={status} onValueChange={v => setStatus(v as Booking["status"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={save} disabled={saving}
              className="flex-1 flex items-center justify-center gap-1 bg-primary text-primary-foreground rounded-lg py-2 text-xs font-display tracking-wider uppercase disabled:opacity-50">
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Pencil className="h-3 w-3" />} Save changes
            </button>
            <button onClick={onClose} className="px-4 py-2 text-xs text-muted-foreground hover:text-foreground">Cancel</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function PitchBookingsPanel() {
  const { user, isCoach, isAdmin } = useAuth();
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(true);
  const [dialogPitch, setDialogPitch] = useState<Pitch | null>(null);
  const [editBooking, setEditBooking] = useState<Booking | null>(null);

  async function deleteBooking(id: string) {
    if (!confirm("Delete this booking permanently?")) return;
    const { error } = await (supabase as any).from("pitch_bookings").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Booking deleted"); loadBookings(); }
  }
  const [tab, setTab] = useState<"map" | "mine">("map");

  useEffect(() => { loadPitches(); }, []);
  useEffect(() => { if (pitches.length) loadBookings(); }, [pitches, selectedDate]);

  useEffect(() => {
    const channel = supabase
      .channel("pitch-bookings-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "pitch_bookings" }, () => loadBookings())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedDate]);

  async function loadPitches() {
    const { data } = await (supabase as any).from("pitches").select("*").eq("active", true).order("number");
    setPitches((data as Pitch[]) || []);
  }

  async function loadBookings() {
    setLoading(true);
    const start = startOfDay(parseISO(selectedDate)).toISOString();
    const end = addDays(startOfDay(parseISO(selectedDate)), 1).toISOString();
    const { data } = await (supabase as any)
      .from("pitch_bookings")
      .select("*")
      .neq("status", "cancelled")
      .gte("start_time", start)
      .lt("start_time", end)
      .order("start_time");
    setBookings((data as Booking[]) || []);
    setLoading(false);
  }

  const dayBookingsByPitch = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of bookings) {
      const arr = map.get(b.pitch_id) || [];
      arr.push(b);
      map.set(b.pitch_id, arr);
    }
    return map;
  }, [bookings]);

  function pitchPrimaryStatus(pitchId: string): { status: string; faLocked: boolean; blockedByOverlap?: boolean } {
    const pitch = pitches.find(p => p.id === pitchId);
    const bs = dayBookingsByPitch.get(pitchId) || [];
    const overlapIds = pitch ? overlappingPitchIds(pitch.number, pitches) : [];
    const overlapBs = overlapIds.flatMap(id => dayBookingsByPitch.get(id) || []);
    const combined = [...bs, ...overlapBs];
    const faLocked = combined.some(b => b.fa_fixture_id && b.status === "approved");
    if (combined.some(b => b.status === "approved")) return { status: "approved", faLocked, blockedByOverlap: overlapBs.some(b => b.status === "approved") && !bs.some(b => b.status === "approved") };
    if (combined.some(b => b.status === "pending")) return { status: "pending", faLocked };
    return { status: "free", faLocked: false };
  }

  return (
    <div className="space-y-4">
      <div className="mb-2 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-display text-xl md:text-2xl uppercase text-foreground tracking-wider">Pitch Bookings</h2>
          <p className="text-xs text-muted-foreground mt-1">Reserve a pitch at the PAFC ground. All bookings need approval by an admin or fixture secretary.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTab("map")} className={`text-xs font-display tracking-wider px-4 py-2 rounded-lg border ${tab === "map" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>Ground Map</button>
          <button onClick={() => setTab("mine")} className={`text-xs font-display tracking-wider px-4 py-2 rounded-lg border ${tab === "mine" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>My Bookings</button>
        </div>
      </div>

      {tab === "map" && (
        <>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-display">Date</label>
            <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-auto h-9" />
            <div className="flex gap-3 text-[11px] ml-auto flex-wrap">
              <LegendDot color="#22c55e" label="Free" />
              <LegendDot color="#f59e0b" label="Pending" />
              <LegendDot color="#dc2626" label="Booked" />
              <LegendDot color="#6b7280" label="FA Fixture" />
            </div>
          </div>

          <div className="relative bg-[#05070a] border border-primary/30 rounded-xl p-4 md:p-6 overflow-hidden shadow-[0_0_40px_-12px_hsl(var(--primary)/0.5)]">
            {loading ? (
              <div className="flex items-center justify-center h-96"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : (
              <svg viewBox="0 0 620 974" className="w-full h-auto rounded-lg">
                <defs>
                  <filter id="pitchGlow" x="-40%" y="-40%" width="180%" height="180%">
                    <feGaussianBlur stdDeviation="5" result="b" />
                    <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                  <pattern id="hudGrid" width="34" height="34" patternUnits="userSpaceOnUse">
                    <path d="M34 0H0V34" fill="none" stroke="#7dd3fc" strokeOpacity="0.12" strokeWidth="0.8" />
                  </pattern>
                  <linearGradient id="scanFade" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
                    <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Satellite base, darkened + cooled for the HUD look */}
                <g>
                  <image href={groundSatellite} x={0} y={0} width={620} height={974} preserveAspectRatio="xMidYMid slice" opacity={0.75} />
                  <rect x={0} y={0} width={620} height={974} fill="#020617" opacity={0.55} />
                  <rect x={0} y={0} width={620} height={974} fill="url(#hudGrid)" />
                </g>

                {/* Sweeping scan line */}
                <rect x={0} y={0} width={620} height={90} fill="url(#scanFade)">
                  <animate attributeName="y" values="-90;974" dur="6s" repeatCount="indefinite" />
                </rect>

                {/* HUD frame */}
                <g stroke="#38bdf8" strokeOpacity={0.5} strokeWidth={2} fill="none">
                  <path d="M8 40 V8 H40" /><path d="M580 8 H612 V40" />
                  <path d="M612 934 V966 H580" /><path d="M40 966 H8 V934" />
                </g>

                {[...pitches]
                  .filter(p => PITCH_LAYOUT[p.number])
                  .sort((a, b) => PITCH_LAYOUT[a.number].z - PITCH_LAYOUT[b.number].z)
                  .map(p => {
                  const layout = PITCH_LAYOUT[p.number];
                  const { status, faLocked } = pitchPrimaryStatus(p.id);
                  const c = statusColor(status, faLocked);
                  const cx = layout.x + layout.w / 2;
                  const cy = layout.y + layout.h / 2;
                  const labelY = layout.labelTop ? layout.y + 28 : cy - 8;
                  const boxW = Math.min(layout.w * 0.5, 120);
                  const boxH = Math.min(layout.h * 0.16, 46);
                  return (
                    <g key={p.id} onClick={() => setDialogPitch(p)} className="cursor-pointer group">
                      <rect x={layout.x} y={layout.y} width={layout.w} height={layout.h} rx={4}
                        fill={c.fill} fillOpacity={0.28} stroke={c.stroke} strokeWidth={2.5}
                        filter="url(#pitchGlow)"
                        className="transition-all group-hover:brightness-150" />

                      {/* Pitch markings */}
                      <g stroke={c.stroke} strokeOpacity={0.55} strokeWidth={1.4} fill="none">
                        <line x1={layout.x} y1={cy} x2={layout.x + layout.w} y2={cy} />
                        <circle cx={cx} cy={cy} r={Math.min(layout.w, layout.h) * 0.16} />
                        <rect x={cx - boxW / 2} y={layout.y} width={boxW} height={boxH} />
                        <rect x={cx - boxW / 2} y={layout.y + layout.h - boxH} width={boxW} height={boxH} />
                      </g>

                      {/* Corner ticks */}
                      <g stroke={c.stroke} strokeOpacity={0.9} strokeWidth={2.5} fill="none">
                        <path d={`M${layout.x} ${layout.y + 16} V${layout.y} H${layout.x + 16}`} />
                        <path d={`M${layout.x + layout.w - 16} ${layout.y} H${layout.x + layout.w} V${layout.y + 16}`} />
                        <path d={`M${layout.x + layout.w} ${layout.y + layout.h - 16} V${layout.y + layout.h} H${layout.x + layout.w - 16}`} />
                        <path d={`M${layout.x + 16} ${layout.y + layout.h} H${layout.x} V${layout.y + layout.h - 16}`} />
                      </g>

                      {/* Status beacon */}
                      <circle cx={layout.x + 14} cy={layout.y + layout.h - 14} r={4} fill={c.stroke}>
                        <animate attributeName="opacity" values="1;0.2;1" dur="2s" repeatCount="indefinite" />
                      </circle>

                      <text x={cx} y={labelY} textAnchor="middle"
                        fill="#e2f5ff" className="font-display uppercase" fontSize={15} fontWeight={700}
                        letterSpacing="1.5" style={{ paintOrder: "stroke", stroke: "#020617", strokeWidth: 3 }}>
                        {p.name}
                      </text>
                      <text x={cx} y={labelY + 18} textAnchor="middle"
                        fill={c.text} className="font-display" fontSize={12} letterSpacing="2" opacity={0.95}
                        style={{ paintOrder: "stroke", stroke: "#020617", strokeWidth: 3 }}>
                        {p.format}
                      </text>
                      {faLocked && (
                        <g transform={`translate(${layout.x + layout.w - 24}, ${layout.y + 26})`}>
                          <circle r={9} fill="#020617" opacity={0.8} stroke="#fbbf24" strokeWidth={1} />
                          <text x={0} y={3} textAnchor="middle" fontSize={9} fill="#fbbf24">FA</text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            )}
            <p className="text-[11px] text-muted-foreground mt-3 text-center">
              Live satellite HUD of Itter Park with the painted pitch positions overlaid. Tap a pitch to book it.{" "}
              <a href="https://maps.app.goo.gl/ied9nHSnP8MW2wqq5" target="_blank" rel="noopener noreferrer" className="text-primary underline">Open in Google Maps</a>
            </p>

          </div>


          {/* Day timeline list */}
          <div className="mt-4 space-y-2">
            <h3 className="font-display uppercase tracking-wider text-sm text-foreground mb-2">Bookings on {format(parseISO(selectedDate), "EEE dd MMM")}</h3>
            {bookings.length === 0 && !loading && (
              <div className="text-sm text-muted-foreground bg-card border border-border rounded-lg p-4 text-center">No bookings on this day. All pitches are free.</div>
            )}
            {bookings.map(b => {
              const pitch = pitches.find(p => p.id === b.pitch_id);
              return (
                <div key={b.id} className="bg-card border border-border rounded-lg p-3 flex items-center gap-3 flex-wrap">
                  <StatusPill status={b.status} faLocked={!!b.fa_fixture_id} />
                  <div className="text-sm font-display tracking-wider">{pitch?.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{format(parseISO(b.start_time), "HH:mm")} – {format(parseISO(b.end_time), "HH:mm")}</div>
                  <div className="text-xs text-foreground">{b.age_group ? `${b.age_group}` : ""}{b.opponent ? ` vs ${b.opponent}` : ""}</div>
                  <div className="text-[11px] text-muted-foreground ml-auto uppercase">{b.purpose}</div>
                  {(isAdmin || (isCoach && b.requested_by === user?.id)) && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditBooking(b)} title="Edit booking" className="text-muted-foreground hover:text-primary p-1"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => deleteBooking(b.id)} title="Delete booking" className="text-muted-foreground hover:text-destructive p-1"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === "mine" && <MyBookingsTab userId={user?.id} pitches={pitches} />}

      {dialogPitch && (
        <BookingDialog
          pitch={dialogPitch}
          dayBookings={dayBookingsByPitch.get(dialogPitch.id) || []}
          overlapBookings={overlappingPitchIds(dialogPitch.number, pitches).flatMap(id => dayBookingsByPitch.get(id) || [])}
          pitches={pitches}
          selectedDate={selectedDate}
          onClose={() => setDialogPitch(null)}
          onCreated={() => { setDialogPitch(null); loadBookings(); }}
        />
      )}
      {editBooking && (
        <EditBookingDialog
          booking={editBooking}
          pitches={pitches}
          onClose={() => setEditBooking(null)}
          onSaved={() => { setEditBooking(null); loadBookings(); }}
        />
      )}
    </div>
  );
}
