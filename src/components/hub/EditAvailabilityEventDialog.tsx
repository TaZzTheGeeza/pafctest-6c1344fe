import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { toast } from "sonner";
import { notifyTeamMembers } from "@/lib/notifyTeamMembers";

interface EventRow {
  id: string;
  team_slug: string;
  title: string;
  event_date: string; // dd/mm/yy
  event_time: string | null;
  venue: string | null;
}

interface Props {
  event: EventRow;
  onClose: () => void;
}

const AVAILABILITY_TEAMS: { team: string; slug: string }[] = [
  { team: "U6", slug: "u6s" },
  { team: "U7", slug: "u7s" },
  { team: "U8 Black", slug: "u8s-black" },
  { team: "U8 Gold", slug: "u8s-gold" },
  { team: "U9 Black", slug: "u9s-black" },
  { team: "U9 Gold", slug: "u9s-gold" },
  { team: "U10", slug: "u10s" },
  { team: "U11", slug: "u11s" },
  { team: "U12 Black", slug: "u12s-black" },
  { team: "U12 Gold", slug: "u12s-gold" },
  { team: "U12 White", slug: "u12s-white" },
  { team: "U13", slug: "u13s" },
  { team: "U14 Black", slug: "u14s-black" },
  { team: "U14 Gold", slug: "u14s-gold" },
  { team: "U15", slug: "u15s" },
];

function toInputDate(ddmmyy: string): string {
  const m = (ddmmyy || "").match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!m) return "";
  const yyyy = m[3].length === 2 ? `20${m[3]}` : m[3];
  return `${yyyy}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

function toStoredDate(input: string): string {
  const [y, m, d] = input.split("-");
  return `${d}/${m}/${y.slice(2)}`;
}

function friendly(input: string): string {
  const [y, m, d] = input.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function EditAvailabilityEventDialog({ event, onClose }: Props) {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState(event.title);
  const [eventDate, setEventDate] = useState(toInputDate(event.event_date));
  const [eventTime, setEventTime] = useState(event.event_time || "10:00");
  const [venue, setVenue] = useState(event.venue || "");
  const [venueAddress, setVenueAddress] = useState("");
  const [selectedTeam, setSelectedTeam] = useState(event.team_slug);
  const [notify, setNotify] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !eventDate || !user) return;

    setSaving(true);
    const { error } = await supabase
      .from("hub_availability_events")
      .update({
        title,
        event_date: toStoredDate(eventDate),
        event_time: eventTime || null,
        venue: venue || null,
        team_slug: selectedTeam,
      })
      .eq("id", event.id);

    if (!error && venue && venueAddress.trim()) {
      await supabase.from("venue_address_overrides").upsert(
        {
          venue_name: venue,
          full_address: venueAddress.trim(),
          source: "manual",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "venue_name" },
      );
      queryClient.invalidateQueries({ queryKey: ["venue-overrides"] });
    }

    setSaving(false);
    if (error) {
      console.error(error);
      toast.error("Failed to update event");
      return;
    }

    const changes: string[] = [];
    if (title !== event.title) changes.push(`Title: ${event.title} to ${title}`);
    if (toStoredDate(eventDate) !== event.event_date) changes.push(`Date: ${event.event_date} to ${friendly(eventDate)}`);
    if ((eventTime || "") !== (event.event_time || "")) changes.push(`Time: ${event.event_time || "TBC"} to ${eventTime || "TBC"}`);
    if ((venue || "") !== (event.venue || "")) changes.push(`Venue: ${event.venue || "TBC"} to ${venue || "TBC"}`);

    if (notify && changes.length > 0) {
      const link = `/hub?tab=availability&team=${encodeURIComponent(selectedTeam)}&event=${event.id}`;
      notifyTeamMembers({
        teamSlug: selectedTeam,
        excludeUserId: user.id,
        notification: {
          title: "Event Updated",
          message: `${title} - ${friendly(eventDate)}${eventTime ? ` at ${eventTime}` : ""}. ${changes.join(". ")}`,
          type: "event",
          link,
        },
        email: {
          templateName: "availability-event-added",
          templateData: {
            eventTitle: `Updated: ${title}`,
            eventDate: friendly(eventDate),
            eventTime,
            venue: venue || undefined,
            teamName: selectedTeam,
          },
          idempotencyPrefix: `avail-event-updated-${event.id}-${Date.now()}`,
        },
      });
      if (selectedTeam !== event.team_slug) {
        notifyTeamMembers({
          teamSlug: event.team_slug,
          excludeUserId: user.id,
          notification: {
            title: "Event Moved",
            message: `${title} on ${friendly(eventDate)} has been moved to another team's calendar.`,
            type: "event",
            link: `/hub?tab=availability&team=${encodeURIComponent(event.team_slug)}`,
          },
        });
      }
    }

    toast.success(notify && changes.length > 0 ? "Event updated and everyone notified" : "Event updated");
    queryClient.invalidateQueries({ queryKey: ["hub-availability-events"] });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-display text-sm font-bold text-foreground tracking-wider uppercase">Edit Event</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-display text-muted-foreground mb-1 tracking-wider uppercase">Event Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {isAdmin && (
            <div>
              <label className="block text-xs font-display text-muted-foreground mb-1 tracking-wider uppercase">Team</label>
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
              <label className="block text-xs font-display text-muted-foreground mb-1 tracking-wider uppercase">Date *</label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs font-display text-muted-foreground mb-1 tracking-wider uppercase">Time</label>
              <input
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-display text-muted-foreground mb-1 tracking-wider uppercase">Venue</label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g. Jack Hunt School"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="block text-xs font-display text-muted-foreground mb-1 tracking-wider uppercase">Full address for directions</label>
            <input
              type="text"
              value={venueAddress}
              onChange={(e) => setVenueAddress(e.target.value)}
              placeholder="Optional, e.g. Bradwell Road, Peterborough PE3 9WP"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="accent-primary" />
            Notify everyone in the team about these changes
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-display tracking-wider border border-border text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title || !eventDate}
              className="px-4 py-2 rounded-lg text-xs font-display tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
