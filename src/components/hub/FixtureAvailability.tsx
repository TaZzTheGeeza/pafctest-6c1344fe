import { useState } from "react";
import { useTeamFixtures, type FAFixture } from "@/hooks/useTeamFixtures";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, X, HelpCircle, Loader2, MapPin, Clock, Navigation, ChevronDown, ChevronUp, Trash2, CalendarPlus, Users, Send, Pencil } from "lucide-react";

import { toast } from "sonner";
import { AddAvailabilityEventDialog } from "./AddAvailabilityEventDialog";
import { ReminderPreviewDialog } from "./ReminderPreviewDialog";

interface Props {
  teamSlug: string;
}

type AvailabilityStatus = "available" | "unavailable" | "maybe" | "pending";

interface AvailabilityRecord {
  id: string;
  team_slug: string;
  fixture_date: string;
  opponent: string;
  user_id: string;
  status: string;
  note: string | null;
  responding_for: string | null;
}

interface CustomEvent {
  id: string;
  team_slug: string;
  title: string;
  event_date: string;
  event_time: string | null;
  venue: string | null;
  created_by: string;
}

interface Guardian {
  id: string;
  parent_user_id: string;
  player_name: string;
  team_slug: string;
  status: string;
}

interface AvailabilityItem {
  key: string;
  date: string;
  time: string;
  title: string;
  venue: string;
  isHome: boolean;
  opponent: string;
  isCustom: boolean;
  customEventId?: string;
}

function fixtureToItem(f: FAFixture): AvailabilityItem {
  const isHome = f.homeTeam.includes("Peterborough Ath");
  const opponent = isHome ? f.awayTeam : f.homeTeam;
  return {
    key: `fa-${f.date}-${opponent}`,
    date: f.date,
    time: f.time,
    title: `${isHome ? "vs" : "@"} ${opponent}`,
    venue: f.venue,
    isHome,
    opponent,
    isCustom: false,
  };
}

function customEventToItem(e: CustomEvent): AvailabilityItem {
  return {
    key: `custom-${e.id}`,
    date: e.event_date,
    time: e.event_time || "TBC",
    title: e.title,
    venue: e.venue || "",
    isHome: true,
    opponent: `custom::${e.id}`,
    isCustom: true,
    customEventId: e.id,
  };
}

export function FixtureAvailability({ teamSlug }: Props) {
  const { user, isCoach, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [expandedFixture, setExpandedFixture] = useState<string | null>(null);
  const [respondingForMap, setRespondingForMap] = useState<Record<string, string | null>>({});
  const [reminderItem, setReminderItem] = useState<AvailabilityItem | null>(null);
  const [editingVenue, setEditingVenue] = useState<string | null>(null);
  const [venueInput, setVenueInput] = useState("");
  const { data: teamData, isLoading: fixturesLoading } = useTeamFixtures(teamSlug);

  const getFriendlyDate = (date: string) => {
    const [dd, mm, yy] = date.split("/").map(Number);
    return new Date(2000 + yy, mm - 1, dd).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const { data: availability = [], isLoading: availLoading } = useQuery({
    queryKey: ["fixture-availability", teamSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fixture_availability")
        .select("*")
        .eq("team_slug", teamSlug);
      if (error) throw error;
      return data as AvailabilityRecord[];
    },
    enabled: !!user,
  });

  // Fetch guardian links for this user + team
  const { data: guardians = [] } = useQuery({
    queryKey: ["guardians", user?.id, teamSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guardians")
        .select("*")
        .eq("parent_user_id", user!.id)
        .eq("team_slug", teamSlug)
        .eq("status", "active");
      if (error) throw error;
      return data as Guardian[];
    },
    enabled: !!user,
  });

  const { data: customEvents = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["hub-availability-events", teamSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hub_availability_events")
        .select("*")
        .eq("team_slug", teamSlug);
      if (error) throw error;
      return (data || []) as CustomEvent[];
    },
    enabled: !!user,
  });

  const { data: venueOverrides = [] } = useQuery({
    queryKey: ["venue-overrides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("venue_address_overrides")
        .select("venue_name, full_address");
      if (error) throw error;
      return data as { venue_name: string; full_address: string }[];
    },
    staleTime: 1000 * 60 * 60,
  });

  const venueOverrideMap = Object.fromEntries(
    venueOverrides.map((v) => [v.venue_name.toUpperCase(), v.full_address])
  );

  const getDirectionsAddress = (venue: string) => {
    return venueOverrideMap[venue.toUpperCase()] || venue;
  };

  const venueOverrideMutation = useMutation({
    mutationFn: async ({ venueName, fullAddress }: { venueName: string; fullAddress: string }) => {
      const { error } = await supabase
        .from("venue_address_overrides")
        .upsert({ venue_name: venueName, full_address: fullAddress, updated_at: new Date().toISOString() }, { onConflict: "venue_name" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venue-overrides"] });
      setEditingVenue(null);
      toast.success("Venue address updated");
    },
    onError: () => toast.error("Failed to update venue address"),
  });

  const respondentIds = [...new Set(availability.map((a) => a.user_id))];
  const { data: profiles = [] } = useQuery({
    queryKey: ["availability-profiles", respondentIds.sort().join(",")],
    queryFn: async () => {
      if (respondentIds.length === 0) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", respondentIds);
      if (error) throw error;
      return data as { id: string; full_name: string | null }[];
    },
    enabled: respondentIds.length > 0 && (isCoach || isAdmin),
  });

  const mutation = useMutation({
    mutationFn: async ({
      fixtureDate,
      opponent,
      status,
      respondingFor,
    }: {
      fixtureDate: string;
      opponent: string;
      status: AvailabilityStatus;
      respondingFor: string | null;
    }) => {
      // When responding for a child, only one vote is allowed per child (regardless of which parent).
      // Remove any prior vote for that child first so the latest parent's response wins.
      if (respondingFor) {
        const { error: delError } = await supabase
          .from("fixture_availability")
          .delete()
          .eq("team_slug", teamSlug)
          .eq("fixture_date", fixtureDate)
          .eq("opponent", opponent)
          .eq("responding_for", respondingFor);
        if (delError) throw delError;

        const { error } = await supabase.from("fixture_availability").insert({
          team_slug: teamSlug,
          fixture_date: fixtureDate,
          opponent,
          user_id: user!.id,
          status,
          responding_for: respondingFor,
          updated_at: new Date().toISOString(),
        });
        if (error) throw error;
      } else {
        // Self-vote: one per user per fixture
        const { error } = await supabase.from("fixture_availability").upsert(
          {
            team_slug: teamSlug,
            fixture_date: fixtureDate,
            opponent,
            user_id: user!.id,
            status,
            responding_for: null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "team_slug,fixture_date,opponent,user_id" }
        );
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fixture-availability", teamSlug] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from("hub_availability_events")
        .delete()
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["hub-availability-events", teamSlug] }),
  });

  // Build unified list
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const faItems: AvailabilityItem[] = (teamData?.fixtures || [])
    .filter((f) => {
      const [dd, mm, yy] = f.date.split("/").map(Number);
      return new Date(2000 + yy, mm - 1, dd) >= today;
    })
    .map(fixtureToItem);

  const customItems: AvailabilityItem[] = customEvents
    .filter((e) => {
      const [dd, mm, yy] = e.event_date.split("/").map(Number);
      return new Date(2000 + yy, mm - 1, dd) >= today;
    })
    .map(customEventToItem);

  const allItems = [...faItems, ...customItems].sort((a, b) => {
    const [ad, am, ay] = a.date.split("/").map(Number);
    const [bd, bm, by] = b.date.split("/").map(Number);
    return new Date(2000 + ay, am - 1, ad).getTime() - new Date(2000 + by, bm - 1, bd).getTime();
  });

  if (fixturesLoading || availLoading || eventsLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading fixtures…
      </div>
    );
  }

  if (allItems.length === 0) {
    return (
      <div className="space-y-3">
        {(isCoach || isAdmin) && (
          <div className="flex justify-end">
            <AddAvailabilityEventDialog teamSlug={teamSlug} />
          </div>
        )}
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display text-lg font-bold text-foreground mb-2">No Upcoming Fixtures</h3>
          <p className="text-sm text-muted-foreground">There are no scheduled fixtures or events for this team right now.</p>
        </div>
      </div>
    );
  }

  function getSelectedRespondingFor(itemKey: string): string | null {
    // For parents, default to first child if not explicitly set
    if (hasGuardians && !(itemKey in respondingForMap) && guardians.length > 0) {
      return guardians[0].player_name;
    }
    return respondingForMap[itemKey] ?? null;
  }

  function getMyStatus(item: AvailabilityItem, respondingFor: string | null): AvailabilityStatus {
    const record = availability.find(
      (a) =>
        a.fixture_date === item.date &&
        a.opponent === item.opponent &&
        a.user_id === user?.id &&
        (a.responding_for || null) === respondingFor
    );
    return (record?.status as AvailabilityStatus) || "pending";
  }

  // Only show responses made on behalf of a child (player names),
  // never the parent/coach's own name. This avoids confusion about who is actually playing.
  const playersOnly = true;

  function normalizeName(name: string | null | undefined) {
    return (name || "").trim().toLowerCase().replace(/\s+/g, " ");
  }

  function getTeamSummary(item: AvailabilityItem) {
    let records = availability.filter((a) => a.fixture_date === item.date && a.opponent === item.opponent);
    if (playersOnly) {
      records = records.filter((r) => !!r.responding_for);
    }
    // Deduplicate: per child (normalized) or per user — case-insensitive child match
    const deduped = new Map<string, string>();
    records.forEach((r) => {
      const key = r.responding_for ? `child:${normalizeName(r.responding_for)}` : `user:${r.user_id}`;
      deduped.set(key, r.status);
    });
    const statuses = Array.from(deduped.values());
    return {
      available: statuses.filter((s) => s === "available").length,
      unavailable: statuses.filter((s) => s === "unavailable").length,
      maybe: statuses.filter((s) => s === "maybe").length,
    };
  }

  function getRespondents(item: AvailabilityItem, status: string) {
    let records = availability.filter((a) => a.fixture_date === item.date && a.opponent === item.opponent && a.status === status);
    if (playersOnly) {
      records = records.filter((r) => !!r.responding_for);
    }
    // Deduplicate by normalized child name — only show each child once (case-insensitive)
    const seen = new Set<string>();
    return records.filter((r) => {
      const key = r.responding_for ? `child:${normalizeName(r.responding_for)}` : `user:${r.user_id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).map((r) => {
      if (r.responding_for) {
        return r.responding_for.trim();
      }
      const profile = profiles.find((p) => p.id === r.user_id);
      return profile?.full_name || "Unknown";
    });
  }

  const hasGuardians = guardians.length > 0;
  const isParentOnly = hasGuardians;

  // Parents can ONLY respond for their linked children, not themselves
  const respondingOptions: { value: string | null; label: string }[] = isParentOnly
    ? guardians.map((g) => ({ value: g.player_name, label: g.player_name }))
    : [{ value: null, label: "Myself" }];

  const statusButtons: { status: AvailabilityStatus; icon: typeof Check; label: string; activeClass: string }[] = [
    { status: "available", icon: Check, label: "Available", activeClass: "bg-green-600 text-white border-green-600" },
    { status: "maybe", icon: HelpCircle, label: "Maybe", activeClass: "bg-amber-500 text-white border-amber-500" },
    { status: "unavailable", icon: X, label: "Unavailable", activeClass: "bg-red-600 text-white border-red-600" },
  ];

  return (
    <div className="space-y-3">
      {(isCoach || isAdmin) && (
        <div className="flex justify-end">
          <AddAvailabilityEventDialog teamSlug={teamSlug} />
        </div>
      )}

      {allItems.map((item) => {
        const selectedRespondingFor = getSelectedRespondingFor(item.key);
        const myStatus = getMyStatus(item, selectedRespondingFor);
        const summary = getTeamSummary(item);
        const isExpanded = expandedFixture === item.key;

        return (
          <div key={item.key} className="bg-card border border-border rounded-xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  {item.isCustom && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-display tracking-wider uppercase bg-accent text-accent-foreground">
                      <CalendarPlus className="h-2.5 w-2.5" />Event
                    </span>
                  )}
                  <p className="font-display text-sm font-bold text-foreground">
                    {item.title}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{item.date} · {item.time}</span>
                  {item.venue && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{item.venue}</span>}
                  {item.venue && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(getDirectionsAddress(item.venue))}`, '_system');
                      }}
                      className="text-[10px] text-primary hover:text-primary/80 flex items-center gap-0.5 transition-colors"
                    >
                      <Navigation className="w-2.5 h-2.5" />Directions
                    </button>
                  )}
                  {item.venue && (isCoach || isAdmin) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingVenue(item.key);
                        setVenueInput(venueOverrideMap[item.venue.toUpperCase()] || "");
                      }}
                      title="Edit venue address for directions"
                      className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-0.5 transition-colors"
                    >
                      <Pencil className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
                {editingVenue === item.key && item.venue && (
                  <div className="mt-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={venueInput}
                      onChange={(e) => setVenueInput(e.target.value)}
                      placeholder="Full address, e.g. Main Street, Cottesmore LE15 7DH"
                      className="flex-1 px-2 py-1 text-xs rounded border border-border bg-background text-foreground placeholder:text-muted-foreground"
                    />
                    <button
                      onClick={() => {
                        if (venueInput.trim()) {
                          venueOverrideMutation.mutate({ venueName: item.venue, fullAddress: venueInput.trim() });
                        }
                      }}
                      disabled={venueOverrideMutation.isPending}
                      className="px-2 py-1 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {venueOverrideMutation.isPending ? "Saving…" : "Save"}
                    </button>
                    <button
                      onClick={() => setEditingVenue(null)}
                      className="px-2 py-1 text-xs rounded border border-border text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {(isCoach || isAdmin) && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setReminderItem(item); }}
                    title="Preview & remind non-responders"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-xs font-semibold shadow-md"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Remind</span>
                  </button>
                )}
                {item.isCustom && (isCoach || isAdmin) && (
                  <button
                    onClick={() => {
                      if (confirm("Delete this event?")) {
                        deleteMutation.mutate(item.customEventId!);
                      }
                    }}
                    className="text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                {(isCoach || isAdmin) && (
                  <button
                    onClick={() => setExpandedFixture(isExpanded ? null : item.key)}
                    className="flex items-center gap-2 text-xs hover:opacity-80 transition-opacity"
                  >
                    <span className="flex items-center gap-1 text-green-500"><Check className="h-3 w-3" />{summary.available}</span>
                    <span className="flex items-center gap-1 text-amber-500"><HelpCircle className="h-3 w-3" />{summary.maybe}</span>
                    <span className="flex items-center gap-1 text-red-500"><X className="h-3 w-3" />{summary.unavailable}</span>
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                  </button>
                )}
              </div>
            </div>

            {/* Responding-for selector (only shown if user has linked children) */}
            {hasGuardians && (
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-display">Responding for:</span>
                <div className="flex gap-1.5 flex-wrap">
                  {respondingOptions.map((opt) => {
                    const isSelected = selectedRespondingFor === opt.value;
                    return (
                      <button
                        key={opt.value ?? "__self__"}
                        onClick={() =>
                          setRespondingForMap((prev) => ({ ...prev, [item.key]: opt.value }))
                        }
                        className={`px-2.5 py-1 rounded-md text-xs font-display tracking-wider border transition-colors ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {statusButtons.map(({ status, icon: Icon, label, activeClass }) => (
                <button
                  key={status}
                  onClick={() =>
                    mutation.mutate({
                      fixtureDate: item.date,
                      opponent: item.opponent,
                      status,
                      respondingFor: selectedRespondingFor,
                    })
                  }
                  disabled={mutation.isPending}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display tracking-wider border transition-colors ${
                    myStatus === status
                      ? activeClass
                      : "border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Show status chips for each person the user has responded for */}
            {hasGuardians && (
              <div className="mt-2 flex flex-wrap gap-2">
                {respondingOptions.map((opt) => {
                  const s = getMyStatus(item, opt.value);
                  if (s === "pending") return null;
                  const cfg = {
                    available: { label: "✓", bg: "bg-green-600/20 text-green-400" },
                    maybe: { label: "?", bg: "bg-amber-500/20 text-amber-400" },
                    unavailable: { label: "✗", bg: "bg-red-600/20 text-red-400" },
                    pending: { label: "", bg: "" },
                  }[s];
                  return (
                    <span
                      key={opt.value ?? "__self__"}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-display ${cfg.bg}`}
                    >
                      {cfg.label} {opt.label}
                    </span>
                  );
                })}
              </div>
            )}

            {isExpanded && (isCoach || isAdmin) && (
              <div className="mt-3 pt-3 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(["available", "maybe", "unavailable"] as const).map((status) => {
                  const names = getRespondents(item, status);
                  const config = {
                    available: { label: "Available", icon: Check, color: "text-green-500", bg: "bg-green-500/10" },
                    maybe: { label: "Maybe", icon: HelpCircle, color: "text-amber-500", bg: "bg-amber-500/10" },
                    unavailable: { label: "Unavailable", icon: X, color: "text-red-500", bg: "bg-red-500/10" },
                  }[status];
                  const StatusIcon = config.icon;

                  return (
                    <div key={status} className={`rounded-lg p-2.5 ${config.bg}`}>
                      <div className={`flex items-center gap-1.5 mb-2 ${config.color}`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        <span className="text-xs font-display font-bold tracking-wider uppercase">{config.label} ({names.length})</span>
                      </div>
                      {names.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">No responses</p>
                      ) : (
                        <ul className="space-y-0.5">
                          {names.map((name, idx) => (
                            <li key={idx} className="text-xs text-foreground">{name}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {reminderItem && (
        <ReminderPreviewDialog
          open={!!reminderItem}
          onClose={() => setReminderItem(null)}
          teamSlug={teamSlug}
          fixtureDate={reminderItem.date}
          opponent={reminderItem.opponent}
          itemTitle={reminderItem.title}
          itemTime={reminderItem.time}
          itemVenue={reminderItem.venue}
          friendlyDate={getFriendlyDate(reminderItem.date)}
        />
      )}
    </div>
  );
}
