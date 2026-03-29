import { useState } from "react";
import { useTeamFixtures, type FAFixture } from "@/hooks/useTeamFixtures";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, X, HelpCircle, Loader2, MapPin, Clock, Users, Navigation, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";

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
}

function fixtureKey(f: FAFixture) {
  return `${f.date}::${f.homeTeam.includes("Peterborough Ath") ? f.awayTeam : f.homeTeam}`;
}

export function FixtureAvailability({ teamSlug }: Props) {
  const { user, isCoach, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [expandedFixture, setExpandedFixture] = useState<string | null>(null);
  const { data: teamData, isLoading: fixturesLoading } = useTeamFixtures(teamSlug);

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

  // Fetch profiles for all users who have responded
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
    mutationFn: async ({ fixtureDate, opponent, status }: { fixtureDate: string; opponent: string; status: AvailabilityStatus }) => {
      const { error } = await supabase.from("fixture_availability").upsert(
        {
          team_slug: teamSlug,
          fixture_date: fixtureDate,
          opponent,
          user_id: user!.id,
          status,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "team_slug,fixture_date,opponent,user_id" }
      );
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fixture-availability", teamSlug] }),
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingFixtures = (teamData?.fixtures || []).filter((f) => {
    const [dd, mm, yy] = f.date.split("/").map(Number);
    const fDate = new Date(2000 + yy, mm - 1, dd);
    return fDate >= today;
  });

  if (fixturesLoading || availLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading fixtures…
      </div>
    );
  }

  if (upcomingFixtures.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-display text-lg font-bold text-foreground mb-2">No Upcoming Fixtures</h3>
        <p className="text-sm text-muted-foreground">There are no scheduled fixtures for this team right now.</p>
      </div>
    );
  }

  function getMyStatus(fixture: FAFixture): AvailabilityStatus {
    const opponent = fixture.homeTeam.includes("Peterborough Ath") ? fixture.awayTeam : fixture.homeTeam;
    const record = availability.find(
      (a) => a.fixture_date === fixture.date && a.opponent === opponent && a.user_id === user?.id
    );
    return (record?.status as AvailabilityStatus) || "pending";
  }

  function getTeamSummary(fixture: FAFixture) {
    const opponent = fixture.homeTeam.includes("Peterborough Ath") ? fixture.awayTeam : fixture.homeTeam;
    const records = availability.filter((a) => a.fixture_date === fixture.date && a.opponent === opponent);
    return {
      available: records.filter((r) => r.status === "available").length,
      unavailable: records.filter((r) => r.status === "unavailable").length,
      maybe: records.filter((r) => r.status === "maybe").length,
    };
  }

  const statusButtons: { status: AvailabilityStatus; icon: typeof Check; label: string; activeClass: string }[] = [
    { status: "available", icon: Check, label: "Available", activeClass: "bg-green-600 text-white border-green-600" },
    { status: "maybe", icon: HelpCircle, label: "Maybe", activeClass: "bg-amber-500 text-white border-amber-500" },
    { status: "unavailable", icon: X, label: "Unavailable", activeClass: "bg-red-600 text-white border-red-600" },
  ];

  function getRespondents(fixture: FAFixture, status: string) {
    const opponent = fixture.homeTeam.includes("Peterborough Ath") ? fixture.awayTeam : fixture.homeTeam;
    const records = availability.filter((a) => a.fixture_date === fixture.date && a.opponent === opponent && a.status === status);
    return records.map((r) => {
      const profile = profiles.find((p) => p.id === r.user_id);
      return profile?.full_name || "Unknown";
    });
  }

  function getFixtureKey(fixture: FAFixture) {
    const opponent = fixture.homeTeam.includes("Peterborough Ath") ? fixture.awayTeam : fixture.homeTeam;
    return `${fixture.date}::${opponent}`;
  }

  return (
    <div className="space-y-3">
      {upcomingFixtures.map((fixture, i) => {
        const isHome = fixture.homeTeam.includes("Peterborough Ath");
        const opponent = isHome ? fixture.awayTeam : fixture.homeTeam;
        const myStatus = getMyStatus(fixture);
        const summary = getTeamSummary(fixture);
        const fKey = getFixtureKey(fixture);
        const isExpanded = expandedFixture === fKey;
          <div key={`${fixture.date}-${opponent}`} className="bg-card border border-border rounded-xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <p className="font-display text-sm font-bold text-foreground">
                  {isHome ? "vs" : "@"} {opponent}
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{fixture.date} · {fixture.time}</span>
                  {fixture.venue && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{fixture.venue}</span>}
                  {fixture.venue && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fixture.venue)}`, '_system');
                      }}
                      className="text-[10px] text-primary hover:text-primary/80 flex items-center gap-0.5 transition-colors"
                    >
                      <Navigation className="w-2.5 h-2.5" />Directions
                    </button>
                  )}
                </div>
              </div>

              {(isCoach || isAdmin) && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1 text-green-500"><Check className="h-3 w-3" />{summary.available}</span>
                  <span className="flex items-center gap-1 text-amber-500"><HelpCircle className="h-3 w-3" />{summary.maybe}</span>
                  <span className="flex items-center gap-1 text-red-500"><X className="h-3 w-3" />{summary.unavailable}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {statusButtons.map(({ status, icon: Icon, label, activeClass }) => (
                <button
                  key={status}
                  onClick={() => mutation.mutate({ fixtureDate: fixture.date, opponent, status })}
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
          </div>
        );
      })}
    </div>
  );
}
