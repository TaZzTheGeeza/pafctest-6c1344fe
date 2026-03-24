import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Calendar, MapPin, ClipboardList, Megaphone, Shield } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const registrationSchema = z.object({
  team_name: z.string().trim().min(1, "Team name is required").max(100),
  manager_name: z.string().trim().min(1, "Manager name is required").max(100),
  manager_email: z.string().trim().email("Invalid email").max(255),
  manager_phone: z.string().trim().max(20).optional(),
  player_count: z.number().min(1).max(30).optional(),
});

const TournamentPage = () => {
  const [regForm, setRegForm] = useState({
    team_name: "", manager_name: "", manager_email: "", manager_phone: "", player_count: "", age_group_id: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const { data: tournaments } = useQuery({
    queryKey: ["tournaments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tournaments").select("*").in("status", ["active", "completed"]).order("tournament_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const activeTournament = tournaments?.find(t => t.status === "active") || tournaments?.[0];

  const { data: ageGroups } = useQuery({
    queryKey: ["tournament-age-groups", activeTournament?.id],
    queryFn: async () => {
      if (!activeTournament) return [];
      const { data, error } = await supabase.from("tournament_age_groups").select("*").eq("tournament_id", activeTournament.id).order("age_group");
      if (error) throw error;
      return data;
    },
    enabled: !!activeTournament,
  });

  const { data: teams } = useQuery({
    queryKey: ["tournament-teams", activeTournament?.id],
    queryFn: async () => {
      if (!ageGroups?.length) return [];
      const ids = ageGroups.map(ag => ag.id);
      const { data, error } = await supabase.from("tournament_teams").select("*").in("age_group_id", ids).eq("status", "confirmed");
      if (error) throw error;
      return data;
    },
    enabled: !!ageGroups?.length,
  });

  const { data: groups } = useQuery({
    queryKey: ["tournament-groups", activeTournament?.id],
    queryFn: async () => {
      if (!ageGroups?.length) return [];
      const ids = ageGroups.map(ag => ag.id);
      const { data, error } = await supabase.from("tournament_groups").select("*").in("age_group_id", ids);
      if (error) throw error;
      return data;
    },
    enabled: !!ageGroups?.length,
  });

  const { data: matches } = useQuery({
    queryKey: ["tournament-matches", activeTournament?.id],
    queryFn: async () => {
      if (!ageGroups?.length) return [];
      const ids = ageGroups.map(ag => ag.id);
      const { data, error } = await supabase.from("tournament_matches").select("*").in("age_group_id", ids).order("match_time", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!ageGroups?.length,
  });

  const { data: announcements } = useQuery({
    queryKey: ["tournament-announcements", activeTournament?.id],
    queryFn: async () => {
      if (!activeTournament) return [];
      const { data, error } = await supabase.from("tournament_announcements").select("*").eq("tournament_id", activeTournament.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!activeTournament,
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.age_group_id) { toast.error("Please select an age group"); return; }

    const parsed = registrationSchema.safeParse({
      ...regForm,
      player_count: regForm.player_count ? parseInt(regForm.player_count) : undefined,
    });
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }

    setSubmitting(true);
    const { error } = await supabase.from("tournament_teams").insert({
      age_group_id: regForm.age_group_id,
      team_name: parsed.data.team_name,
      manager_name: parsed.data.manager_name,
      manager_email: parsed.data.manager_email,
      manager_phone: parsed.data.manager_phone || null,
      player_count: parsed.data.player_count || null,
    });
    setSubmitting(false);

    if (error) { toast.error("Registration failed"); return; }
    toast.success("Team registered! We'll confirm your place shortly.");
    setRegForm({ team_name: "", manager_name: "", manager_email: "", manager_phone: "", player_count: "", age_group_id: "" });
  };

  // Calculate group standings
  const getStandings = (groupId: string) => {
    const groupTeams = teams?.filter(t => t.group_id === groupId) || [];
    const groupMatches = matches?.filter(m => m.group_id === groupId && m.status === "completed") || [];

    return groupTeams.map(team => {
      const played = groupMatches.filter(m => m.home_team_id === team.id || m.away_team_id === team.id);
      let w = 0, d = 0, l = 0, gf = 0, ga = 0;
      played.forEach(m => {
        const isHome = m.home_team_id === team.id;
        const scored = isHome ? (m.home_score ?? 0) : (m.away_score ?? 0);
        const conceded = isHome ? (m.away_score ?? 0) : (m.home_score ?? 0);
        gf += scored; ga += conceded;
        if (scored > conceded) w++; else if (scored === conceded) d++; else l++;
      });
      return { team, p: played.length, w, d, l, gf, ga, gd: gf - ga, pts: w * 3 + d };
    }).sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
  };

  const getTeamName = (id: string) => teams?.find(t => t.id === id)?.team_name || "TBC";

  const knockoutMatches = matches?.filter(m => m.stage !== "group") || [];
  const groupMatches = matches?.filter(m => m.stage === "group") || [];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20 pb-12">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-4">
              <Trophy className="h-8 w-8 text-primary" />
              <h1 className="font-display text-3xl md:text-4xl font-bold text-primary">Tournament Hub</h1>
            </div>
            {activeTournament && (
              <div className="flex flex-wrap justify-center gap-4 mt-4 text-sm text-muted-foreground">
                {activeTournament.tournament_date && (
                  <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{new Date(activeTournament.tournament_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
                )}
                {activeTournament.venue && (
                  <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{activeTournament.venue}</span>
                )}
              </div>
            )}
            {activeTournament?.description && <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">{activeTournament.description}</p>}
          </div>

          {!activeTournament ? (
            <Card className="max-w-lg mx-auto text-center">
              <CardContent className="pt-8 pb-8">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No tournaments scheduled at the moment. Check back soon!</p>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-1">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="groups">Groups</TabsTrigger>
                <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
                <TabsTrigger value="knockout">Knockout</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              {/* OVERVIEW */}
              <TabsContent value="overview" className="space-y-6">
                {announcements && announcements.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Megaphone className="h-5 w-5 text-primary" />Announcements</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      {announcements.map(a => (
                        <div key={a.id} className="border-l-2 border-primary pl-3">
                          <p className="text-sm">{a.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">{new Date(a.created_at).toLocaleString("en-GB")}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Users className="h-5 w-5 text-primary" />Age Groups</CardTitle></CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {ageGroups?.map(ag => (
                          <Badge key={ag.id} variant="secondary" className="text-sm">{ag.age_group}{ag.max_teams ? ` (max ${ag.max_teams} teams)` : ""}</Badge>
                        ))}
                      </div>
                      {(!ageGroups || ageGroups.length === 0) && <p className="text-sm text-muted-foreground">Age groups coming soon</p>}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" />Tournament Info</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      {activeTournament.entry_fee_cents > 0 && <p><strong>Entry Fee:</strong> £{(activeTournament.entry_fee_cents / 100).toFixed(2)} per team</p>}
                      <p><strong>Registered Teams:</strong> {teams?.length || 0}</p>
                      {activeTournament.rules && <div><strong>Rules:</strong><p className="mt-1 text-muted-foreground whitespace-pre-wrap">{activeTournament.rules}</p></div>}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* GROUPS */}
              <TabsContent value="groups" className="space-y-6">
                {ageGroups?.map(ag => {
                  const agGroups = groups?.filter(g => g.age_group_id === ag.id) || [];
                  if (agGroups.length === 0) return (
                    <Card key={ag.id}><CardHeader><CardTitle className="text-lg">{ag.age_group}</CardTitle><CardDescription>Groups not drawn yet</CardDescription></CardHeader></Card>
                  );
                  return (
                    <div key={ag.id} className="space-y-4">
                      <h3 className="font-display text-xl font-bold text-primary">{ag.age_group}</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        {agGroups.map(group => {
                          const standings = getStandings(group.id);
                          return (
                            <Card key={group.id}>
                              <CardHeader className="pb-2"><CardTitle className="text-base">Group {group.group_name}</CardTitle></CardHeader>
                              <CardContent>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="w-[140px]">Team</TableHead>
                                      <TableHead className="text-center w-8">P</TableHead>
                                      <TableHead className="text-center w-8">W</TableHead>
                                      <TableHead className="text-center w-8">D</TableHead>
                                      <TableHead className="text-center w-8">L</TableHead>
                                      <TableHead className="text-center w-10">GD</TableHead>
                                      <TableHead className="text-center w-10 font-bold">Pts</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {standings.map((s, i) => (
                                      <TableRow key={s.team.id} className={i === 0 ? "bg-primary/5" : ""}>
                                        <TableCell className="font-medium text-xs">{s.team.team_name}</TableCell>
                                        <TableCell className="text-center text-xs">{s.p}</TableCell>
                                        <TableCell className="text-center text-xs">{s.w}</TableCell>
                                        <TableCell className="text-center text-xs">{s.d}</TableCell>
                                        <TableCell className="text-center text-xs">{s.l}</TableCell>
                                        <TableCell className="text-center text-xs">{s.gd}</TableCell>
                                        <TableCell className="text-center text-xs font-bold">{s.pts}</TableCell>
                                      </TableRow>
                                    ))}
                                    {standings.length === 0 && (
                                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground text-xs">No teams assigned</TableCell></TableRow>
                                    )}
                                  </TableBody>
                                </Table>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {(!ageGroups || ageGroups.length === 0) && (
                  <Card><CardContent className="pt-6 text-center text-muted-foreground">No groups available yet</CardContent></Card>
                )}
              </TabsContent>

              {/* FIXTURES */}
              <TabsContent value="fixtures" className="space-y-4">
                {ageGroups?.map(ag => {
                  const agMatches = groupMatches.filter(m => m.age_group_id === ag.id);
                  if (agMatches.length === 0) return null;
                  return (
                    <div key={ag.id} className="space-y-3">
                      <h3 className="font-display text-xl font-bold text-primary">{ag.age_group}</h3>
                      <div className="space-y-2">
                        {agMatches.map(m => (
                          <Card key={m.id} className="p-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium flex-1 text-right">{getTeamName(m.home_team_id)}</span>
                              <div className="mx-4 text-center min-w-[60px]">
                                {m.status === "completed" ? (
                                  <span className="font-bold text-lg">{m.home_score} - {m.away_score}</span>
                                ) : (
                                  <span className="text-muted-foreground text-xs">{m.match_time ? new Date(m.match_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "TBC"}</span>
                                )}
                              </div>
                              <span className="font-medium flex-1">{getTeamName(m.away_team_id)}</span>
                            </div>
                            {m.pitch && <p className="text-xs text-muted-foreground text-center mt-1">Pitch: {m.pitch}</p>}
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {groupMatches.length === 0 && (
                  <Card><CardContent className="pt-6 text-center text-muted-foreground">Fixtures not yet published</CardContent></Card>
                )}
              </TabsContent>

              {/* KNOCKOUT */}
              <TabsContent value="knockout" className="space-y-4">
                {knockoutMatches.length === 0 ? (
                  <Card><CardContent className="pt-6 text-center text-muted-foreground">Knockout stages not started yet</CardContent></Card>
                ) : (
                  <>
                    {["semi", "final", "3rd-place"].map(stage => {
                      const stageMatches = knockoutMatches.filter(m => m.stage === stage);
                      if (stageMatches.length === 0) return null;
                      return (
                        <div key={stage} className="space-y-3">
                          <h3 className="font-display text-xl font-bold text-primary capitalize">
                            {stage === "semi" ? "Semi Finals" : stage === "final" ? "Final" : "3rd Place Play-off"}
                          </h3>
                          {ageGroups?.map(ag => {
                            const agStageMatches = stageMatches.filter(m => m.age_group_id === ag.id);
                            if (agStageMatches.length === 0) return null;
                            return (
                              <div key={ag.id} className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">{ag.age_group}</p>
                                {agStageMatches.map(m => (
                                  <Card key={m.id} className="p-4">
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="font-medium flex-1 text-right">{getTeamName(m.home_team_id)}</span>
                                      <div className="mx-4 text-center min-w-[60px]">
                                        {m.status === "completed" ? (
                                          <span className="font-bold text-xl">{m.home_score} - {m.away_score}</span>
                                        ) : (
                                          <Badge variant="outline">Upcoming</Badge>
                                        )}
                                      </div>
                                      <span className="font-medium flex-1">{getTeamName(m.away_team_id)}</span>
                                    </div>
                                    {m.pitch && <p className="text-xs text-muted-foreground text-center mt-2">Pitch: {m.pitch}</p>}
                                  </Card>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </>
                )}
              </TabsContent>

              {/* REGISTER */}
              <TabsContent value="register">
                <Card className="max-w-lg mx-auto">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" />Register Your Team</CardTitle>
                    <CardDescription>Enter your team details below. We'll confirm your place via email.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div>
                        <Label>Age Group *</Label>
                        <Select value={regForm.age_group_id} onValueChange={v => setRegForm(f => ({ ...f, age_group_id: v }))}>
                          <SelectTrigger><SelectValue placeholder="Select age group" /></SelectTrigger>
                          <SelectContent>
                            {ageGroups?.map(ag => <SelectItem key={ag.id} value={ag.id}>{ag.age_group}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Team Name *</Label>
                        <Input value={regForm.team_name} onChange={e => setRegForm(f => ({ ...f, team_name: e.target.value }))} maxLength={100} required />
                      </div>
                      <div>
                        <Label>Manager Name *</Label>
                        <Input value={regForm.manager_name} onChange={e => setRegForm(f => ({ ...f, manager_name: e.target.value }))} maxLength={100} required />
                      </div>
                      <div>
                        <Label>Manager Email *</Label>
                        <Input type="email" value={regForm.manager_email} onChange={e => setRegForm(f => ({ ...f, manager_email: e.target.value }))} maxLength={255} required />
                      </div>
                      <div>
                        <Label>Manager Phone</Label>
                        <Input value={regForm.manager_phone} onChange={e => setRegForm(f => ({ ...f, manager_phone: e.target.value }))} maxLength={20} />
                      </div>
                      <div>
                        <Label>Number of Players</Label>
                        <Input type="number" min={1} max={30} value={regForm.player_count} onChange={e => setRegForm(f => ({ ...f, player_count: e.target.value }))} />
                      </div>
                      <Button type="submit" className="w-full" disabled={submitting}>
                        {submitting ? "Registering..." : "Register Team"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TournamentPage;
