import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { faTeamConfigs } from "@/lib/faFixtureConfig";

interface Props {
  teamSlug: string;
}

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

  const reset = () => {
    setTitle("");
    setEventDate("");
    setEventTime("10:00");
    setVenue("");
    setSelectedTeam(teamSlug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !eventDate || !user) return;

    // Convert YYYY-MM-DD to DD/MM/YY to match FA fixture format
    const [yyyy, mm, dd] = eventDate.split("-");
    const formattedDate = `${dd}/${mm}/${yyyy.slice(2)}`;

    setSaving(true);
    const { error } = await supabase.from("hub_availability_events").insert({
      team_slug: selectedTeam,
      title,
      event_date: formattedDate,
      event_time: eventTime,
      venue: venue || null,
      created_by: user.id,
    } as any);

    setSaving(false);
    if (error) {
      toast.error("Failed to add event");
      console.error(error);
      return;
    }

    toast.success("Event added to availability");
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
                    {faTeamConfigs.map((t) => (
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
