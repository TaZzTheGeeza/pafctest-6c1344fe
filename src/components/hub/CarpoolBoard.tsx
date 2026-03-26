import { useState } from "react";
import { useTeamFixtures, type FAFixture } from "@/hooks/useTeamFixtures";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Car, Loader2, Clock, MapPin, Plus, Trash2, Users } from "lucide-react";

interface Props {
  teamSlug: string;
}

interface CarpoolOffer {
  id: string;
  user_id: string;
  team_slug: string;
  fixture_date: string;
  opponent: string;
  direction: string;
  seats_available: number;
  pickup_location: string | null;
  notes: string | null;
}

export function CarpoolBoard({ teamSlug }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: teamData, isLoading: fixturesLoading } = useTeamFixtures(teamSlug);
  const [expandedFixture, setExpandedFixture] = useState<string | null>(null);
  const [form, setForm] = useState({ direction: "both", seats: 2, pickup: "", notes: "" });

  const { data: offers = [], isLoading: offersLoading } = useQuery({
    queryKey: ["carpool", teamSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("carpool_offers")
        .select("*")
        .eq("team_slug", teamSlug)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as CarpoolOffer[];
    },
    enabled: !!user,
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-for-carpool", teamSlug],
    queryFn: async () => {
      const userIds = [...new Set(offers.map((o) => o.user_id))];
      if (!userIds.length) return [];
      const { data } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
      return data || [];
    },
    enabled: offers.length > 0,
  });

  const addMutation = useMutation({
    mutationFn: async ({ fixtureDate, opponent }: { fixtureDate: string; opponent: string }) => {
      const { error } = await supabase.from("carpool_offers").insert({
        user_id: user!.id,
        team_slug: teamSlug,
        fixture_date: fixtureDate,
        opponent,
        direction: form.direction,
        seats_available: form.seats,
        pickup_location: form.pickup || null,
        notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["carpool", teamSlug] });
      setForm({ direction: "both", seats: 2, pickup: "", notes: "" });
      setExpandedFixture(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("carpool_offers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["carpool", teamSlug] }),
  });

  const getName = (userId: string) => profiles.find((p) => p.id === userId)?.full_name || "Team Member";
  const fixtures = teamData?.fixtures || [];

  if (fixturesLoading || offersLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
      </div>
    );
  }

  if (fixtures.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-display text-lg font-bold text-foreground mb-2">No Upcoming Fixtures</h3>
        <p className="text-sm text-muted-foreground">Carpool coordination will appear when fixtures are scheduled.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {fixtures.map((fixture) => {
        const isHome = fixture.homeTeam.includes("Peterborough Ath");
        const opponent = isHome ? fixture.awayTeam : fixture.homeTeam;
        const fixtureId = `${fixture.date}::${opponent}`;
        const fixtureOffers = offers.filter((o) => o.fixture_date === fixture.date && o.opponent === opponent);
        const myOffer = fixtureOffers.find((o) => o.user_id === user?.id);
        const isExpanded = expandedFixture === fixtureId;
        const totalSeats = fixtureOffers.reduce((sum, o) => sum + o.seats_available, 0);

        return (
          <div key={fixtureId} className="bg-card border border-border rounded-xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
              <div>
                <p className="font-display text-sm font-bold text-foreground">
                  {isHome ? "vs" : "@"} {opponent}
                </p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{fixture.date} · {fixture.time}</span>
                  {fixture.venue && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{fixture.venue}</span>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Car className="h-3 w-3" /> {fixtureOffers.length} offer{fixtureOffers.length !== 1 ? "s" : ""} · {totalSeats} seat{totalSeats !== 1 ? "s" : ""}
                </span>
                {!myOffer && (
                  <button
                    onClick={() => setExpandedFixture(isExpanded ? null : fixtureId)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-display tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="h-3 w-3" /> Offer Lift
                  </button>
                )}
              </div>
            </div>

            {fixtureOffers.length > 0 && (
              <div className="space-y-2 mt-3">
                {fixtureOffers.map((offer) => (
                  <div key={offer.id} className="flex items-center justify-between bg-secondary/50 rounded-lg px-3 py-2 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-display font-bold text-foreground">{getName(offer.user_id)}</span>
                      <span className="text-muted-foreground">
                        {offer.direction === "to" ? "→ To match" : offer.direction === "from" ? "← From match" : "↔ Both ways"}
                      </span>
                      <span className="flex items-center gap-1 text-primary"><Users className="h-3 w-3" />{offer.seats_available} seat{offer.seats_available !== 1 ? "s" : ""}</span>
                      {offer.pickup_location && <span className="text-muted-foreground">📍 {offer.pickup_location}</span>}
                    </div>
                    {offer.user_id === user?.id && (
                      <button onClick={() => deleteMutation.mutate(offer.id)} className="text-red-500 hover:text-red-400 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {isExpanded && (
              <div className="mt-3 p-3 bg-secondary/30 rounded-lg space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-display tracking-wider text-muted-foreground uppercase block mb-1">Direction</label>
                    <select
                      value={form.direction}
                      onChange={(e) => setForm({ ...form, direction: e.target.value })}
                      className="w-full bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-foreground"
                    >
                      <option value="both">Both ways</option>
                      <option value="to">To match only</option>
                      <option value="from">From match only</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-display tracking-wider text-muted-foreground uppercase block mb-1">Seats</label>
                    <input
                      type="number"
                      min={1}
                      max={8}
                      value={form.seats}
                      onChange={(e) => setForm({ ...form, seats: parseInt(e.target.value) || 1 })}
                      className="w-full bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-foreground"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-display tracking-wider text-muted-foreground uppercase block mb-1">Pickup Location</label>
                  <input
                    value={form.pickup}
                    onChange={(e) => setForm({ ...form, pickup: e.target.value })}
                    placeholder="e.g. Tesco car park, Werrington"
                    className="w-full bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-display tracking-wider text-muted-foreground uppercase block mb-1">Notes</label>
                  <input
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="e.g. Can take booster seats"
                    className="w-full bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <button
                  onClick={() => addMutation.mutate({ fixtureDate: fixture.date, opponent })}
                  disabled={addMutation.isPending}
                  className="w-full bg-primary text-primary-foreground rounded-lg py-2 text-xs font-display tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {addMutation.isPending ? "Saving…" : "Offer Lift"}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
