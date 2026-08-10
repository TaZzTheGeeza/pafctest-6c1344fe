import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { faTeamConfigs } from "@/lib/faFixtureConfig";
import { toast } from "sonner";
import { Loader2, RefreshCw, AlertTriangle, CheckCircle2, Eye } from "lucide-react";
import { format, parseISO } from "date-fns";

interface SyncResult {
  dryRun: boolean;
  homeFixturesFound: number;
  created: { team: string; opponent: string; kickOff: string; pitch: string; format: string }[];
  alreadySynced: { team: string; opponent: string; kickOff: string }[];
  clashes: {
    team: string;
    opponent: string;
    kickOff: string;
    format: string;
    reason: string;
    conflictsWith: string[];
  }[];
  skipped: { team: string; reason: string; detail?: string }[];
}

export function FaPitchSyncPanel({ onSynced }: { onSynced?: () => void }) {
  const [busy, setBusy] = useState<"preview" | "sync" | null>(null);
  const [result, setResult] = useState<SyncResult | null>(null);

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

      setResult(data as SyncResult);
      if (dryRun) {
        toast.success(`Preview: ${data.created.length} bookable, ${data.clashes.length} clash(es)`);
      } else {
        toast.success(`${data.created.length} booking request(s) created`);
        onSynced?.();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setBusy(null);
    }
  }

  const kick = (iso: string) => format(parseISO(iso), "EEE dd MMM · HH:mm");

  return (
    <div className="bg-card border border-border rounded-xl p-4 mb-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-sm uppercase tracking-wider">FA fixture sync</h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-xl">
            Pulls every team's home fixtures from FA Full-Time, sizes the pitch by age group
            (U8/U9 5v5, U10/U11 7v7, U12/U13 9v9, U14/U15 11v11) and raises booking requests.
            Fixtures that can't fit — too many home games at once — are listed as clashes.
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
            className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {busy === "sync" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Sync now
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

          {result.clashes.length > 0 && (
            <div className="border border-destructive/40 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-destructive font-display uppercase tracking-wider mb-2">
                <AlertTriangle className="h-3.5 w-3.5" /> Clashes to resolve
              </div>
              <ul className="space-y-1.5">
                {result.clashes.map((c, i) => (
                  <li key={i}>
                    <span className="font-medium">{c.team}</span> vs {c.opponent} · {kick(c.kickOff)} ({c.format})
                    <div className="text-muted-foreground">
                      {c.reason}
                      {c.conflictsWith.length > 0 && <> — conflicts with {c.conflictsWith.join(", ")}</>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.created.length > 0 && (
            <div className="border border-border rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-primary font-display uppercase tracking-wider mb-2">
                <CheckCircle2 className="h-3.5 w-3.5" /> {result.dryRun ? "Would book" : "Booking requests created"}
              </div>
              <ul className="space-y-1">
                {result.created.map((c, i) => (
                  <li key={i} className="text-muted-foreground">
                    <span className="text-foreground font-medium">{c.team}</span> vs {c.opponent} · {kick(c.kickOff)} · Pitch {c.pitch} ({c.format})
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.skipped.length > 0 && (
            <div className="text-muted-foreground">
              Skipped: {result.skipped.map((s) => `${s.team} (${s.reason})`).join(", ")}
            </div>
          )}
        </div>
      )}
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
