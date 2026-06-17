import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
// faTeamConfigs import removed — using local age-ordered list below
import { notifyTeamMembers } from "@/lib/notifyTeamMembers";

interface Props {
  teamSlug: string;
}

// Canonical age-ordered team list matching the Hub sidebar (U6 → U15).
const AVAILABILITY_TEAMS: { team: string; slug: string }[] = [
  { team: "U6", slug: "u6s" },
  { team: "U7", slug: "u7s" },
  { team: "U8", slug: "u8s" },
  { team: "U9 Black", slug: "u9s-black" },
  { team: "U9 Gold", slug: "u9s-gold" },
  { team: "U10", slug: "u10s" },
  { team: "U11", slug: "u11s" },
  { team: "U12 Black", slug: "u12s-black" },
  { team: "U12 Gold", slug: "u12s-gold" },
  { team: "U13", slug: "u13s" },
  { team: "U14 Black", slug: "u14s-black" },
  { team: "U14 Gold", slug: "u14s-gold" },
  { team: "U15", slug: "u15s" },
];

export function AddAvailabilityEventDialog({ teamSlug }: Props) {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("10:00");
  const [venue, setVenue] = useState("");
  const [selectedTeam, setSelectedTeam] = useState(teamSlug);
  const [repeat, setRepeat] = useState<"none" | "weekly" | "biweekly" | "monthly">("none");
  const [repeatUntil, setRepeatUntil] = useState("");

  const reset = () => {
    setTitle("");
    setEventDate("");
    setEventTime("10:00");
    setVenue("");
    setSelectedTeam(teamSlug);
    setRepeat("none");
    setRepeatUntil("");
  };

  const buildDates = (): Date[] => {
    const [sy, sm, sd] = eventDate.split("-").map(Number);
    const start = new Date(sy, sm - 1, sd);
    if (repeat === "none" || !repeatUntil) return [start];
    const [ey, em, ed] = repeatUntil.split("-").map(Number);
    const end = new Date(ey, em - 1, ed);
    if (end < start) return [start];
    const dates: Date[] = [];
    const cursor = new Date(start);
    while (cursor <= end && dates.length < 104) {
      dates.push(new Date(cursor));
      if (repeat === "weekly") cursor.setDate(cursor.getDate() + 7);
      else if (repeat === "biweekly") cursor.setDate(cursor.getDate() + 14);
      else if (repeat === "monthly") cursor.setMonth(cursor.getMonth() + 1);
    }
    return dates;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !eventDate || !user) return;

    const dates = buildDates();
    const rows = dates.map((d) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return {
        team_slug: selectedTeam,
        title,
        event_date: `${dd}/${mm}/${String(yyyy).slice(2)}`,
        event_time: eventTime,
        venue: venue || null,
        created_by: user.id,
      };
    });

    setSaving(true);
    const { error } = await supabase.from("hub_availability_events").insert(rows as any);

    setSaving(false);
    if (error) {
      toast.error("Failed to add event");
      console.error(error);
      return;
    }

    const friendlyFirst = dates[0].toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    const seriesLabel = dates.length > 1 ? ` (+${dates.length - 1} more)` : "";
    notifyTeamMembers({
      teamSlug: selectedTeam,
      excludeUserId: user.id,
      notification: {
        title: dates.length > 1 ? "New Recurring Availability Events" : "New Availability Event",
        message: `${title} — ${friendlyFirst}${seriesLabel}`,
        type: "event",
        link: "/hub?tab=availability",
      },
      email: {
        templateName: "availability-event-added",
        templateData: { eventTitle: dates.length > 1 ? `${title} (${dates.length} dates)` : title, eventDate: friendlyFirst, eventTime, venue: venue || undefined, teamName: selectedTeam },
        idempotencyPrefix: `avail-event-${selectedTeam}-${rows[0].event_date}-${Date.now()}`,
      },
    });

    toast.success(dates.length > 1 ? `${dates.length} events added` : "Event added to availability");
    queryClient.invalidateQueries({ queryKey: ["hub-availability-events"] });
    reset();
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display tracking-wider border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
      >
        <Plus className="h-3.5 w-3.5" /> Add Event
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-display text-sm font-bold text-foreground tracking-wider uppercase">
                Add Availability Event
              </h3>
              <button onClick={() => { setOpen(false); reset(); }} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-display text-muted-foreground mb-1 tracking-wider uppercase">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Friendly vs Manor FC"
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {isAdmin && (
                <div>
                  <label className="block text-xs font-display text-muted-foreground mb-1 tracking-wider uppercase">
                    Team
                  </label>
                  <select
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {AVAILABILITY_TEAMS.map((t) => (
                      <option key={t.slug} value={t.slug}>{t.team}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-display text-muted-foreground mb-1 tracking-wider uppercase">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    required
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-display text-muted-foreground mb-1 tracking-wider uppercase">
                    Time
                  </label>
                  <input
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-display text-muted-foreground mb-1 tracking-wider uppercase">
                  Venue
                </label>
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-display text-muted-foreground mb-1 tracking-wider uppercase">
                    Repeat
                  </label>
                  <select
                    value={repeat}
                    onChange={(e) => setRepeat(e.target.value as any)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="none">Does not repeat</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Every 2 weeks</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                {repeat !== "none" && (
                  <div>
                    <label className="block text-xs font-display text-muted-foreground mb-1 tracking-wider uppercase">
                      Until *
                    </label>
                    <input
                      type="date"
                      value={repeatUntil}
                      onChange={(e) => setRepeatUntil(e.target.value)}
                      min={eventDate || undefined}
                      required
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setOpen(false); reset(); }}
                  className="px-4 py-2 rounded-lg text-xs font-display tracking-wider border border-border text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !title || !eventDate}
                  className="px-4 py-2 rounded-lg text-xs font-display tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {saving ? "Adding…" : "Add Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
