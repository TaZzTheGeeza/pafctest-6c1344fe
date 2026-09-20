import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { toast } from "sonner";
import { notifyTeamMembers } from "@/lib/notifyTeamMembers";
import { CLUB_TEAMS } from "@/lib/teamConfig";

interface Props {
  teamSlug: string;
  /** Fixture date exactly as shown on the fixture list (dd/mm/yy). */
  fixtureDate: string;
  opponent: string;
  title: string;
  currentTime: string;
  currentVenue: string;
  onClose: () => void;
}

function friendly(date: string) {
  const [dd, mm, yy] = date.split("/").map(Number);
  if (!dd || !mm) return date;
  return new Date(2000 + yy, mm - 1, dd).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function EditFaFixtureDialog({
  teamSlug,
  fixtureDate,
  opponent,
  title,
  currentTime,
  currentVenue,
  onClose,
}: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [kickoff, setKickoff] = useState(/^\d{1,2}:\d{2}/.test(currentTime) ? currentTime.slice(0, 5) : "");
  const [venue, setVenue] = useState(currentVenue || "");
  const [venueAddress, setVenueAddress] = useState("");
  const [note, setNote] = useState("");
  const [notify, setNotify] = useState(true);

  const teamName = CLUB_TEAMS.find((t) => t.slug === teamSlug)?.name || teamSlug;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["fa-fixtures"] });
    queryClient.invalidateQueries({ queryKey: ["venue-overrides"] });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    const { error } = await supabase.from("fa_fixture_overrides").upsert(
      {
        team_slug: teamSlug,
        fixture_date: fixtureDate,
        opponent,
        kickoff_time: kickoff || null,
        venue: venue.trim() || null,
        note: note.trim() || null,
        created_by: user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "team_slug,fixture_date,opponent" },
    );

    if (!error && venue.trim() && venueAddress.trim()) {
      await supabase.from("venue_address_overrides").upsert(
        {
          venue_name: venue.trim(),
          full_address: venueAddress.trim(),
          source: "manual",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "venue_name" },
      );
    }

    setSaving(false);
    if (error) {
      console.error(error);
      toast.error("Could not save the change - please try again");
      return;
    }

    const changes: string[] = [];
    if (kickoff && kickoff !== currentTime.slice(0, 5)) changes.push(`Kick-off: ${currentTime || "TBC"} to ${kickoff}`);
    if (venue.trim() && venue.trim() !== (currentVenue || "")) changes.push(`Venue: ${currentVenue || "TBC"} to ${venue.trim()}`);
    if (note.trim()) changes.push(note.trim());

    if (notify && changes.length > 0) {
      notifyTeamMembers({
        teamSlug,
        excludeUserId: user.id,
        notification: {
          title: "Fixture Change",
          message: `${title} on ${friendly(fixtureDate)}. ${changes.join(". ")}`,
          type: "event",
          link: `/hub?tab=availability&team=${encodeURIComponent(teamSlug)}&date=${encodeURIComponent(fixtureDate)}&opponent=${encodeURIComponent(opponent)}`,
        },
        email: {
          templateName: "availability-event-added",
          templateData: {
            eventTitle: `Fixture change: ${title}`,
            eventDate: friendly(fixtureDate),
            eventTime: kickoff || currentTime,
            venue: venue.trim() || undefined,
            teamName,
          },
          idempotencyPrefix: `fa-fixture-change-${teamSlug}-${fixtureDate}-${Date.now()}`,
        },
      });
    }

    refresh();
    toast.success(notify && changes.length > 0 ? "Fixture updated and everyone notified" : "Fixture updated");
    onClose();
  };

  const handleReset = async () => {
    if (!confirm("Remove your changes and go back to the FA details?")) return;
    setSaving(true);
    const { error } = await supabase
      .from("fa_fixture_overrides")
      .delete()
      .eq("team_slug", teamSlug)
      .eq("fixture_date", fixtureDate)
      .eq("opponent", opponent);
    setSaving(false);
    if (error) {
      toast.error("Could not remove the change");
      return;
    }
    refresh();
    toast.success("Back to the FA details");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-display text-sm font-bold text-foreground tracking-wider uppercase">Change Fixture Details</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-4 space-y-4">
          <p className="text-xs text-muted-foreground">
            {title} · {friendly(fixtureDate)}. Use this for late kick-off or venue changes. The date and opponent stay as the FA has them.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-display text-muted-foreground mb-1 tracking-wider uppercase">Kick-off</label>
              <input
                type="time"
                value={kickoff}
                onChange={(e) => setKickoff(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs font-display text-muted-foreground mb-1 tracking-wider uppercase">Venue</label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g. Itter Park"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
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

          <div>
            <label className="block text-xs font-display text-muted-foreground mb-1 tracking-wider uppercase">Message to parents</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Optional, e.g. Pitch waterlogged, moved to the 3G"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="accent-primary" />
            Let everyone in the team know about this change
          </label>

          <div className="flex justify-between gap-2 pt-2">
            <button
              type="button"
              onClick={handleReset}
              disabled={saving}
              className="px-3 py-2 rounded-lg text-xs font-display tracking-wider border border-border text-muted-foreground hover:text-destructive transition-colors"
            >
              Reset to FA
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-display tracking-wider border border-border text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg text-xs font-display tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
