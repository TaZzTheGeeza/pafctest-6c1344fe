import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { faTeamConfigs } from "@/lib/faFixtureConfig";
import { toast } from "sonner";
import { Loader2, RefreshCw, AlertTriangle, CheckCircle2, Eye, CalendarPlus } from "lucide-react";
import { format as fmtDate, parseISO } from "date-fns";

interface PitchRow {
  id: string;
  number: number;
  name: string;
  format: string;
}

interface RawItem {
  team: string;
  slug: string;
  opponent: string;
  format: string;
  faId?: string;
  startIso?: string;
  endIso?: string;
  kickOff: string;
  pitch?: string;
  pitchId?: string;
  durationMins?: number;
  competition?: string;
  reason?: string;
  conflictsWith?: string[];
}

interface SyncResult {
  dryRun: boolean;
  homeFixturesFound: number;
  created: RawItem[];
  alreadySynced: { team: string; opponent: string; kickOff: string }[];
  clashes: RawItem[];
  skipped: { team: string; reason: string; detail?: string }[];
  pitches?: PitchRow[];
}

interface Draft {
  key: string;
  kind: "bookable" | "clash";
  team: string;
  slug: string;
  opponent: string;
  format: string;
  faId: string;
  competition?: string;
  reason?: string;
  conflictsWith: string[];
  pitchId: string;
  startLocal: string; // yyyy-MM-ddTHH:mm
  durationMins: number;
  selected: boolean;
  status?: "free" | "clash" | "checking";
  statusDetail?: string;
}

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function FaPitchSyncPanel({ onSynced }: { onSynced?: () => void }) {
  const [busy, setBusy] = useState<"preview" | "sync" | "book" | null>(null);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [pitches, setPitches] = useState<PitchRow[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);

  const selectedCount = drafts.filter((d) => d.selected).length;

  async function run(dryRun: boolean) {
    setBusy(dryRun ? "preview" : "sync");
    try {
      const teams = faTeamConfigs
        .filter((c) => c.fixtureUrl)
        .map((c) => ({ team: c.team, slug: c.slug, fixtureUrl: c.fixtureUrl }));

      const { data, error } = await supabase.functions.invoke("sync-fa-pitch-bookings", {
        body: { teams, dryRun },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Sync failed");

      const res = data as SyncResult;
      setResult(res);
      setPitches(res.pitches || []);
      setDrafts(buildDrafts(res));

      if (dryRun) {
        toast.success(`Preview: ${res.created.length} bookable, ${res.clashes.length} clash(es)`);
      } else {
        toast.success(`${res.created.length} booking request(s) created`);
        onSynced?.();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setBusy(null);
    }
  }

  function buildDrafts(res: SyncResult): Draft[] {
    if (!res.dryRun) return [];
    const list: Draft[] = [];
    res.created.forEach((c, i) => {
      if (!c.faId || !c.startIso) return;
      list.push({
        key: `b${i}`,
        kind: "bookable",
        team: c.team,
        slug: c.slug,
        opponent: c.opponent,
        format: c.format,
        faId: c.faId,
        competition: c.competition,
        conflictsWith: [],
        pitchId: c.pitchId || "",
        startLocal: toLocalInput(c.startIso),
        durationMins: c.durationMins ?? (c.format === "9v9" || c.format === "11v11" ? 90 : 60),
        selected: true,
        status: "free",
      });
    });
    res.clashes.forEach((c, i) => {
      if (!c.faId || !c.startIso) return;
      list.push({
        key: `c${i}`,
        kind: "clash",
        team: c.team,
        slug: c.slug,
        opponent: c.opponent,
        format: c.format,
        faId: c.faId,
        competition: c.competition,
        reason: c.reason,
        conflictsWith: c.conflictsWith || [],
        pitchId: "",
        startLocal: toLocalInput(c.startIso),
        durationMins: c.durationMins ?? (c.format === "9v9" || c.format === "11v11" ? 90 : 60),
        selected: false,
        status: "clash",
        statusDetail: c.reason,
      });
    });
    return list;
  }

  function update(key: string, patch: Partial<Draft>) {
    setDrafts((prev) => prev.map((d) => (d.key === key ? { ...d, ...patch } : d)));
  }

  async function checkSlot(d: Draft) {
    if (!d.pitchId) {
      update(d.key, { status: "clash", statusDetail: "Pick a pitch first" });
      return;
    }
    update(d.key, { status: "checking", statusDetail: undefined });
    const start = new Date(d.startLocal);
    const end = new Date(start.getTime() + d.durationMins * 60000);
    const { data, error } = await (supabase as any).rpc("check_pitch_conflict", {
      _pitch_id: d.pitchId,
      _start: start.toISOString(),
      _end: end.toISOString(),
      _exclude_id: null,
    });
    if (error) {
      update(d.key, { status: "clash", statusDetail: error.message });
      return;
    }
    const conflicts = (data || []) as any[];
    if (conflicts.length === 0) {
      update(d.key, { status: "free", statusDetail: undefined, selected: true });
    } else {
      update(d.key, {
        status: "clash",
        selected: false,
        statusDetail: `Still clashes with ${conflicts
          .map((c) => `${c.age_group || "booking"}${c.opponent ? ` vs ${c.opponent}` : ""}`)
          .join(", ")}`,
      });
    }
  }

  async function bookSelected() {
    const items = drafts.filter((d) => d.selected && d.pitchId);
    if (items.length === 0) {
      toast.error("Nothing selected (each row needs a pitch)");
      return;
    }
    setBusy("book");
    try {
      const payload = items.map((d) => {
        const start = new Date(d.startLocal);
        return {
          faId: d.faId,
          team: d.team,
          slug: d.slug,
          opponent: d.opponent,
          competition: d.competition,
          pitchId: d.pitchId,
          startIso: start.toISOString(),
          endIso: new Date(start.getTime() + d.durationMins * 60000).toISOString(),
        };
      });
      const { data, error } = await supabase.functions.invoke("sync-fa-pitch-bookings", {
        body: { action: "book", items: payload },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Booking failed");

      const bookedIds = new Set((data.booked || []).map((b: any) => b.faId));
      (data.failed || []).forEach((f: any) =>
        toast.error(`${f.team || "Fixture"}: ${f.reason}`),
      );
      setDrafts((prev) => prev.filter((d) => !bookedIds.has(d.faId)));
      toast.success(`${data.booked?.length || 0} booking request(s) created`);
      onSynced?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Booking failed");
    } finally {
      setBusy(null);
    }
  }

  const kick = (iso: string) => fmtDate(parseISO(iso), "EEE dd MMM · HH:mm");
  const clashDrafts = useMemo(() => drafts.filter((d) => d.kind === "clash"), [drafts]);
  const bookableDrafts = useMemo(() => drafts.filter((d) => d.kind === "bookable"), [drafts]);

  return (
    <div className="bg-card border border-border rounded-xl p-4 mb-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-sm uppercase tracking-wider">FA fixture sync</h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-xl">
            Pulls every team's home fixtures from FA Full-Time, sizes the pitch by age group
            (U8/U9 5v5, U10/U11 7v7, U12/U13 9v9, U14/U15 11v11) and raises booking requests.
            Preview first, then pick pitches / kick-off times for anything that clashes.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => run(true)}
            disabled={busy !== null}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-md border border-border hover:bg-muted disabled:opacity-50"
          >
            {busy === "preview" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
            Preview
          </button>
          <button
            onClick={() => run(false)}
            disabled={busy !== null}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-md border border-border hover:bg-muted disabled:opacity-50"
          >
            {busy === "sync" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Auto-sync all
          </button>
          <button
            onClick={bookSelected}
            disabled={busy !== null || selectedCount === 0}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {busy === "book" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CalendarPlus className="h-3.5 w-3.5" />}
            Book selected ({selectedCount})
          </button>
        </div>
      </div>

      {result && (
        <div className="mt-4 space-y-3 text-xs">
          <div className="flex flex-wrap gap-2">
            <Pill label={`${result.homeFixturesFound} home fixtures`} />
            <Pill label={`${result.created.length} ${result.dryRun ? "bookable" : "created"}`} tone="good" />
            <Pill label={`${result.alreadySynced.length} already synced`} />
            <Pill label={`${result.clashes.length} clashes`} tone={result.clashes.length ? "bad" : undefined} />
          </div>

          {clashDrafts.length > 0 && (
            <div className="border border-destructive/40 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-destructive font-display uppercase tracking-wider">
                <AlertTriangle className="h-3.5 w-3.5" /> Clashes to resolve
              </div>
              {clashDrafts.map((d) => (
                <DraftRow key={d.key} d={d} pitches={pitches} update={update} check={checkSlot} />
              ))}
            </div>
          )}

          {bookableDrafts.length > 0 && (
            <div className="border border-border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-primary font-display uppercase tracking-wider">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Would book
                </div>
                <div className="flex gap-2">
                  <button
                    className="text-[11px] underline text-muted-foreground"
                    onClick={() =>
                      setDrafts((p) => p.map((x) => (x.kind === "bookable" ? { ...x, selected: true } : x)))
                    }
                  >
                    Select all
                  </button>
                  <button
                    className="text-[11px] underline text-muted-foreground"
                    onClick={() =>
                      setDrafts((p) => p.map((x) => (x.kind === "bookable" ? { ...x, selected: false } : x)))
                    }
                  >
                    Clear
                  </button>
                </div>
              </div>
              {bookableDrafts.map((d) => (
                <DraftRow key={d.key} d={d} pitches={pitches} update={update} check={checkSlot} />
              ))}
            </div>
          )}

          {!result.dryRun && result.created.length > 0 && (
            <div className="border border-border rounded-lg p-3">
              <div className="font-display uppercase tracking-wider mb-2 text-primary">Booking requests created</div>
              <ul className="space-y-1">
                {result.created.map((c, i) => (
                  <li key={i} className="text-muted-foreground">
                    <span className="text-foreground font-medium">{c.team}</span> vs {c.opponent} · {kick(c.kickOff)} · {c.pitch} ({c.format})
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.skipped.length > 0 && (
            <div className="border border-border rounded-lg p-3">
              <div className="font-display uppercase tracking-wider mb-2 text-muted-foreground">Skipped</div>
              <ul className="space-y-1">
                {result.skipped.map((s, i) => (
                  <li key={i} className="text-muted-foreground">
                    <span className="text-foreground font-medium">{s.team}</span> — {s.reason}
                    {s.detail ? `: ${s.detail}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DraftRow({
  d,
  pitches,
  update,
  check,
}: {
  d: Draft;
  pitches: PitchRow[];
  update: (key: string, patch: Partial<Draft>) => void;
  check: (d: Draft) => void;
}) {
  const sized = pitches.filter((p) => p.format === d.format);
  const others = pitches.filter((p) => p.format !== d.format);

  return (
    <div className="rounded-md border border-border/60 p-2">
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={d.selected}
          onChange={(e) => update(d.key, { selected: e.target.checked })}
          className="mt-0.5 accent-primary"
        />
        <div className="flex-1 min-w-0">
          <div className="truncate">
            <span className="font-medium text-foreground">{d.team}</span>{" "}
            <span className="text-muted-foreground">vs {d.opponent}</span>{" "}
            <span className="text-muted-foreground">({d.format})</span>
          </div>
          {d.statusDetail && (
            <div className={d.status === "free" ? "text-primary" : "text-destructive"}>{d.statusDetail}</div>
          )}
          {d.status === "free" && !d.statusDetail && <div className="text-primary">Slot free</div>}

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input
              type="datetime-local"
              value={d.startLocal}
              onChange={(e) => update(d.key, { startLocal: e.target.value, status: undefined, statusDetail: undefined })}
              className="bg-background border border-border rounded px-2 py-1 text-xs"
            />
            <select
              value={d.durationMins}
              onChange={(e) => update(d.key, { durationMins: Number(e.target.value), status: undefined })}
              className="bg-background border border-border rounded px-2 py-1 text-xs"
            >
              {[45, 60, 75, 90, 105, 120].map((m) => (
                <option key={m} value={m}>{m} min</option>
              ))}
            </select>
            <select
              value={d.pitchId}
              onChange={(e) => update(d.key, { pitchId: e.target.value, status: undefined, statusDetail: undefined })}
              className="bg-background border border-border rounded px-2 py-1 text-xs"
            >
              <option value="">Choose pitch…</option>
              {sized.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.format})</option>
              ))}
              {others.length > 0 && (
                <optgroup label="Other sizes">
                  {others.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.format})</option>
                  ))}
                </optgroup>
              )}
            </select>
            <button
              onClick={() => check(d)}
              className="text-xs px-2 py-1 rounded border border-border hover:bg-muted"
            >
              {d.status === "checking" ? "Checking…" : "Check slot"}
            </button>
          </div>

          {d.conflictsWith.length > 0 && (
            <div className="mt-1 text-muted-foreground">Conflicts with {d.conflictsWith.join(", ")}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Pill({ label, tone }: { label: string; tone?: "good" | "bad" }) {
  const cls =
    tone === "good"
      ? "bg-primary/15 text-primary"
      : tone === "bad"
        ? "bg-destructive/15 text-destructive"
        : "bg-muted text-muted-foreground";
  return <span className={`px-2 py-1 rounded ${cls}`}>{label}</span>;
}
