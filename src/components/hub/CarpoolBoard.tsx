import { useState } from "react";
import { useTeamFixtures } from "@/hooks/useTeamFixtures";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Car, Loader2, Clock, MapPin, Plus, Trash2, Users, Hand, Check, X } from "lucide-react";

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

interface CarpoolRequest {
  id: string;
  user_id: string;
  team_slug: string;
  fixture_date: string;
  opponent: string;
  direction: string;
  passengers_count: number;
  pickup_location: string | null;
  notes: string | null;
  status: string;
  accepted_by: string | null;
  accepted_at: string | null;
}

type TabMode = "offers" | "requests";

export function CarpoolBoard({ teamSlug }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: teamData, isLoading: fixturesLoading } = useTeamFixtures(teamSlug);
  const [expandedFixture, setExpandedFixture] = useState<string | null>(null);
  const [expandedType, setExpandedType] = useState<TabMode>("offers");
  const [tabMode, setTabMode] = useState<TabMode>("offers");
  const [form, setForm] = useState({ direction: "both", seats: 2, pickup: "", notes: "" });
  const [reqForm, setReqForm] = useState({ direction: "both", passengers: 1, pickup: "", notes: "" });

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

  const { data: requests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ["carpool-requests", teamSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("carpool_requests")
        .select("*")
        .eq("team_slug", teamSlug)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as CarpoolRequest[];
    },
    enabled: !!user,
  });

  const allUserIds = [
    ...new Set([
      ...offers.map((o) => o.user_id),
      ...requests.map((r) => r.user_id),
      ...requests.filter((r) => r.accepted_by).map((r) => r.accepted_by!),
    ]),
  ];

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-for-carpool", teamSlug, allUserIds.join(",")],
    queryFn: async () => {
      if (!allUserIds.length) return [];
      const { data } = await supabase.from("profiles").select("id, full_name").in("id", allUserIds);
      return data || [];
    },
    enabled: allUserIds.length > 0,
  });

  const addOfferMutation = useMutation({
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

  const deleteOfferMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("carpool_offers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["carpool", teamSlug] }),
  });

  const addRequestMutation = useMutation({
    mutationFn: async ({ fixtureDate, opponent }: { fixtureDate: string; opponent: string }) => {
      const { error } = await supabase.from("carpool_requests").insert({
        user_id: user!.id,
        team_slug: teamSlug,
        fixture_date: fixtureDate,
        opponent,
        direction: reqForm.direction,
        passengers_count: reqForm.passengers,
        pickup_location: reqForm.pickup || null,
        notes: reqForm.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["carpool-requests", teamSlug] });
      setReqForm({ direction: "both", passengers: 1, pickup: "", notes: "" });
      setExpandedFixture(null);
    },
  });

  const deleteRequestMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("carpool_requests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["carpool-requests", teamSlug] }),
  });

  const acceptRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from("carpool_requests")
        .update({ accepted_by: user!.id, accepted_at: new Date().toISOString(), status: "accepted" })
        .eq("id", requestId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["carpool-requests", teamSlug] }),
  });

  const cancelAcceptMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from("carpool_requests")
        .update({ accepted_by: null, accepted_at: null, status: "open" })
        .eq("id", requestId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["carpool-requests", teamSlug] }),
  });

  const getName = (userId: string) => profiles.find((p) => p.id === userId)?.full_name || "Team Member";
  const fixtures = (teamData?.fixtures || []).filter((f) => f.type !== "result");

  if (fixturesLoading || offersLoading || requestsLoading) {
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

  const openRequestsCount = requests.filter((r) => r.status === "open").length;

  return (
    <div className="space-y-4">
      {/* Tab switcher */}
      <div className="flex bg-secondary/50 rounded-lg p-1 gap-1">
        <button
          onClick={() => setTabMode("offers")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-xs font-display tracking-wider transition-colors ${
            tabMode === "offers" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Car className="h-3.5 w-3.5" /> Lift Offers
        </button>
        <button
          onClick={() => setTabMode("requests")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-xs font-display tracking-wider transition-colors ${
            tabMode === "requests" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Hand className="h-3.5 w-3.5" /> Lift Requests
          {openRequestsCount > 0 && (
            <span className="bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none">
              {openRequestsCount}
            </span>
          )}
        </button>
      </div>

      {fixtures.map((fixture) => {
        const isHome = fixture.homeTeam.includes("Peterborough Ath");
        const opponent = isHome ? fixture.awayTeam : fixture.homeTeam;
        const fixtureId = `${fixture.date}::${opponent}`;
        const fixtureOffers = offers.filter((o) => o.fixture_date === fixture.date && o.opponent === opponent);
        const fixtureRequests = requests.filter((r) => r.fixture_date === fixture.date && r.opponent === opponent);
        const myOffer = fixtureOffers.find((o) => o.user_id === user?.id);
        const myRequest = fixtureRequests.find((r) => r.user_id === user?.id);
        const isExpanded = expandedFixture === fixtureId && expandedType === tabMode;
        const totalSeats = fixtureOffers.reduce((sum, o) => sum + o.seats_available, 0);
        const openReqs = fixtureRequests.filter((r) => r.status === "open").length;

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
                {tabMode === "offers" && (
                  <>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Car className="h-3 w-3" /> {fixtureOffers.length} offer{fixtureOffers.length !== 1 ? "s" : ""} · {totalSeats} seat{totalSeats !== 1 ? "s" : ""}
                    </span>
                    {!myOffer && (
                      <button
                        onClick={() => { setExpandedFixture(isExpanded ? null : fixtureId); setExpandedType("offers"); }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-display tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        <Plus className="h-3 w-3" /> Offer Lift
                      </button>
                    )}
                  </>
                )}
                {tabMode === "requests" && (
                  <>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Hand className="h-3 w-3" /> {openReqs} open request{openReqs !== 1 ? "s" : ""}
                    </span>
                    {!myRequest && (
                      <button
                        onClick={() => { setExpandedFixture(isExpanded ? null : fixtureId); setExpandedType("requests"); }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-display tracking-wider bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
                      >
                        <Plus className="h-3 w-3" /> Request Lift
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Offers list */}
            {tabMode === "offers" && fixtureOffers.length > 0 && (
              <div className="space-y-2 mt-3">
                {fixtureOffers.map((offer) => (
                  <div key={offer.id} className="flex items-center justify-between bg-secondary/50 rounded-lg px-3 py-2 text-xs">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-display font-bold text-foreground">{getName(offer.user_id)}</span>
                      <span className="text-muted-foreground">
                        {offer.direction === "to" ? "→ To match" : offer.direction === "from" ? "← From match" : "↔ Both ways"}
                      </span>
                      <span className="flex items-center gap-1 text-primary"><Users className="h-3 w-3" />{offer.seats_available} seat{offer.seats_available !== 1 ? "s" : ""}</span>
                      {offer.pickup_location && <span className="text-muted-foreground">📍 {offer.pickup_location}</span>}
                    </div>
                    {offer.user_id === user?.id && (
                      <button onClick={() => deleteOfferMutation.mutate(offer.id)} className="text-destructive hover:text-destructive/80 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Requests list */}
            {tabMode === "requests" && fixtureRequests.length > 0 && (
              <div className="space-y-2 mt-3">
                {fixtureRequests.map((req) => (
                  <div key={req.id} className={`rounded-lg px-3 py-2.5 text-xs border ${
                    req.status === "accepted" ? "bg-green-500/10 border-green-500/30" : "bg-secondary/50 border-border"
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-display font-bold text-foreground">{getName(req.user_id)}</span>
                        <span className="text-muted-foreground">
                          {req.direction === "to" ? "→ To match" : req.direction === "from" ? "← From match" : "↔ Both ways"}
                        </span>
                        <span className="flex items-center gap-1 text-primary">
                          <Users className="h-3 w-3" />{req.passengers_count} passenger{req.passengers_count !== 1 ? "s" : ""}
                        </span>
                        {req.pickup_location && <span className="text-muted-foreground">📍 {req.pickup_location}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        {req.status === "accepted" && (
                          <span className="text-green-500 flex items-center gap-1 font-display font-bold">
                            <Check className="h-3 w-3" /> {getName(req.accepted_by!)}
                          </span>
                        )}
                        {/* Accept button — visible to others when open */}
                        {req.status === "open" && req.user_id !== user?.id && (
                          <button
                            onClick={() => acceptRequestMutation.mutate(req.id)}
                            disabled={acceptRequestMutation.isPending}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-green-600 text-white hover:bg-green-500 transition-colors font-display tracking-wider"
                          >
                            <Check className="h-3 w-3" /> Accept
                          </button>
                        )}
                        {/* Cancel accept — visible to the accepter */}
                        {req.status === "accepted" && req.accepted_by === user?.id && (
                          <button
                            onClick={() => cancelAcceptMutation.mutate(req.id)}
                            className="text-destructive hover:text-destructive/80 transition-colors"
                            title="Cancel acceptance"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {/* Delete — visible to request owner */}
                        {req.user_id === user?.id && (
                          <button onClick={() => deleteRequestMutation.mutate(req.id)} className="text-destructive hover:text-destructive/80 transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    {req.notes && <p className="text-muted-foreground mt-1.5 italic">{req.notes}</p>}
                  </div>
                ))}
              </div>
            )}

            {tabMode === "requests" && fixtureRequests.length === 0 && (
              <p className="text-xs text-muted-foreground mt-2">No lift requests for this fixture yet.</p>
            )}

            {/* Add offer form */}
            {isExpanded && expandedType === "offers" && (
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
                  onClick={() => addOfferMutation.mutate({ fixtureDate: fixture.date, opponent })}
                  disabled={addOfferMutation.isPending}
                  className="w-full bg-primary text-primary-foreground rounded-lg py-2 text-xs font-display tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {addOfferMutation.isPending ? "Saving…" : "Offer Lift"}
                </button>
              </div>
            )}

            {/* Add request form */}
            {isExpanded && expandedType === "requests" && (
              <div className="mt-3 p-3 bg-secondary/30 rounded-lg space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-display tracking-wider text-muted-foreground uppercase block mb-1">Direction</label>
                    <select
                      value={reqForm.direction}
                      onChange={(e) => setReqForm({ ...reqForm, direction: e.target.value })}
                      className="w-full bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-foreground"
                    >
                      <option value="both">Both ways</option>
                      <option value="to">To match only</option>
                      <option value="from">From match only</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-display tracking-wider text-muted-foreground uppercase block mb-1">Passengers</label>
                    <input
                      type="number"
                      min={1}
                      max={6}
                      value={reqForm.passengers}
                      onChange={(e) => setReqForm({ ...reqForm, passengers: parseInt(e.target.value) || 1 })}
                      className="w-full bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-foreground"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-display tracking-wider text-muted-foreground uppercase block mb-1">Pickup Area</label>
                  <input
                    value={reqForm.pickup}
                    onChange={(e) => setReqForm({ ...reqForm, pickup: e.target.value })}
                    placeholder="e.g. Near Bretton Centre"
                    className="w-full bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-display tracking-wider text-muted-foreground uppercase block mb-1">Notes</label>
                  <input
                    value={reqForm.notes}
                    onChange={(e) => setReqForm({ ...reqForm, notes: e.target.value })}
                    placeholder="e.g. Need booster seat for U7"
                    className="w-full bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <button
                  onClick={() => addRequestMutation.mutate({ fixtureDate: fixture.date, opponent })}
                  disabled={addRequestMutation.isPending}
                  className="w-full bg-accent text-accent-foreground rounded-lg py-2 text-xs font-display tracking-wider hover:bg-accent/90 transition-colors disabled:opacity-50"
                >
                  {addRequestMutation.isPending ? "Saving…" : "Request Lift"}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
