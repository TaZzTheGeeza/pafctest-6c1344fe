import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trophy, Plus, Check, X, Edit, Megaphone, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { AdminTeamDetail } from "@/components/tournament/AdminTeamDetail";
import { toast } from "sonner";

const TournamentAdminPage = () => {
  const queryClient = useQueryClient();
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [showCreateTournament, setShowCreateTournament] = useState(false);
  const [showAddAgeGroup, setShowAddAgeGroup] = useState(false);
  const [showAddMatch, setShowAddMatch] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [tournamentForm, setTournamentForm] = useState({ name: "", description: "", venue: "", tournament_date: "", entry_fee: "", rules: "" });
  const [ageGroupForm, setAgeGroupForm] = useState({ age_group: "", max_teams: "", group_count: "2" });
  const [matchForm, setMatchForm] = useState({ age_group_id: "", group_id: "", home_team_id: "", away_team_id: "", match_time: "", pitch: "", stage: "group" });
  const [announcementText, setAnnouncementText] = useState("");

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-tournaments"] });
    queryClient.invalidateQueries({ queryKey: ["admin-age-groups"] });
    queryClient.invalidateQueries({ queryKey: ["admin-teams"] });
    queryClient.invalidateQueries({ queryKey: ["admin-groups"] });
    queryClient.invalidateQueries({ queryKey: ["admin-matches"] });
    queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
    // Also invalidate public queries
    queryClient.invalidateQueries({ queryKey: ["tournaments"] });
    queryClient.invalidateQueries({ queryKey: ["tournament-age-groups"] });
    queryClient.invalidateQueries({ queryKey: ["tournament-teams"] });
    queryClient.invalidateQueries({ queryKey: ["tournament-groups"] });
    queryClient.invalidateQueries({ queryKey: ["tournament-matches"] });
    queryClient.invalidateQueries({ queryKey: ["tournament-announcements"] });
  };

  const { data: tournaments } = useQuery({
    queryKey: ["admin-tournaments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tournaments").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const tournament = tournaments?.find(t => t.id === selectedTournament);

  const { data: ageGroups } = useQuery({
    queryKey: ["admin-age-groups", selectedTournament],
    queryFn: async () => {
      if (!selectedTournament) return [];
      const { data, error } = await supabase.from("tournament_age_groups").select("*").eq("tournament_id", selectedTournament).order("age_group");
      if (error) throw error;
      return data;
    },
    enabled: !!selectedTournament,
  });

  const { data: teams } = useQuery({
    queryKey: ["admin-teams", selectedTournament],
    queryFn: async () => {
      if (!ageGroups?.length) return [];
      const ids = ageGroups.map(ag => ag.id);
      const { data, error } = await supabase.from("tournament_teams").select("*").in("age_group_id", ids).order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: !!ageGroups?.length,
  });

  const { data: groups } = useQuery({
    queryKey: ["admin-groups", selectedTournament],
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
    queryKey: ["admin-matches", selectedTournament],
    queryFn: async () => {
      if (!ageGroups?.length) return [];
      const ids = ageGroups.map(ag => ag.id);
      const { data, error } = await supabase.from("tournament_matches").select("*").in("age_group_id", ids).order("match_time", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!ageGroups?.length,
  });

  // CREATE TOURNAMENT
  const createTournament = async () => {
    if (!tournamentForm.name.trim()) { toast.error("Name required"); return; }
    const { error } = await supabase.from("tournaments").insert({
      name: tournamentForm.name,
      description: tournamentForm.description || null,
      venue: tournamentForm.venue || null,
      tournament_date: tournamentForm.tournament_date || null,
      entry_fee_cents: tournamentForm.entry_fee ? Math.round(parseFloat(tournamentForm.entry_fee) * 100) : 0,
      rules: tournamentForm.rules || null,
    });
    if (error) { toast.error("Failed to create"); return; }
    toast.success("Tournament created!");
    setShowCreateTournament(false);
    setTournamentForm({ name: "", description: "", venue: "", tournament_date: "", entry_fee: "", rules: "" });
    invalidateAll();
  };

  // ACTIVATE/COMPLETE TOURNAMENT
  const setTournamentStatus = async (status: string) => {
    if (!selectedTournament) return;
    await supabase.from("tournaments").update({ status }).eq("id", selectedTournament);
    invalidateAll();
    toast.success(`Tournament ${status}`);
  };

  // ADD AGE GROUP
  const addAgeGroup = async () => {
    if (!ageGroupForm.age_group.trim() || !selectedTournament) return;
    await supabase.from("tournament_age_groups").insert({
      tournament_id: selectedTournament,
      age_group: ageGroupForm.age_group,
      max_teams: ageGroupForm.max_teams ? parseInt(ageGroupForm.max_teams) : null,
      group_count: parseInt(ageGroupForm.group_count) || 2,
    });
    setShowAddAgeGroup(false);
    setAgeGroupForm({ age_group: "", max_teams: "", group_count: "2" });
    invalidateAll();
    toast.success("Age group added");
  };

  // GENERATE GROUPS for age group
  const generateGroups = async (ageGroupId: string, count: number) => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let i = 0; i < count; i++) {
      await supabase.from("tournament_groups").insert({ age_group_id: ageGroupId, group_name: letters[i] });
    }
    invalidateAll();
    toast.success("Groups generated");
  };

  // ASSIGN TEAM TO GROUP
  const assignTeamToGroup = async (teamId: string, groupId: string | null) => {
    await supabase.from("tournament_teams").update({ group_id: groupId }).eq("id", teamId);
    invalidateAll();
  };

  // CONFIRM/REJECT TEAM
  const setTeamStatus = async (teamId: string, status: string) => {
    await supabase.from("tournament_teams").update({ status }).eq("id", teamId);
    invalidateAll();
    toast.success(`Team ${status}`);
  };

  // ADD MATCH
  const addMatch = async () => {
    if (!matchForm.age_group_id || !matchForm.home_team_id || !matchForm.away_team_id) { toast.error("Select teams"); return; }
    await supabase.from("tournament_matches").insert({
      age_group_id: matchForm.age_group_id,
      group_id: matchForm.group_id || null,
      home_team_id: matchForm.home_team_id,
      away_team_id: matchForm.away_team_id,
      match_time: matchForm.match_time || null,
      pitch: matchForm.pitch || null,
      stage: matchForm.stage,
    });
    setShowAddMatch(false);
    setMatchForm({ age_group_id: "", group_id: "", home_team_id: "", away_team_id: "", match_time: "", pitch: "", stage: "group" });
    invalidateAll();
    toast.success("Match added");
  };

  // UPDATE SCORE
  const updateScore = async (matchId: string, homeScore: number, awayScore: number) => {
    await supabase.from("tournament_matches").update({ home_score: homeScore, away_score: awayScore, status: "completed" }).eq("id", matchId);
    invalidateAll();
    toast.success("Score updated");
  };

  // POST ANNOUNCEMENT
  const postAnnouncement = async () => {
    if (!announcementText.trim() || !selectedTournament) return;
    await supabase.from("tournament_announcements").insert({ tournament_id: selectedTournament, message: announcementText });
    setAnnouncementText("");
    setShowAnnouncement(false);
    invalidateAll();
    toast.success("Announcement posted");
  };

  // DELETE MATCH
  const deleteMatch = async (matchId: string) => {
    await supabase.from("tournament_matches").delete().eq("id", matchId);
    invalidateAll();
    toast.success("Match deleted");
  };

  const getTeamName = (id: string) => teams?.find(t => t.id === id)?.team_name || "TBC";
  const getAgeGroupName = (id: string) => ageGroups?.find(ag => ag.id === id)?.age_group || "";

  const filteredTeamsForMatch = teams?.filter(t => t.age_group_id === matchForm.age_group_id && t.status === "confirmed") || [];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-display text-2xl font-bold text-primary flex items-center gap-2"><Trophy className="h-6 w-6" />Tournament Admin</h1>
            <Button onClick={() => setShowCreateTournament(true)}><Plus className="h-4 w-4 mr-1" />New Tournament</Button>
          </div>

          {/* Tournament selector */}
          <div className="mb-6">
            <Select value={selectedTournament} onValueChange={setSelectedTournament}>
              <SelectTrigger className="max-w-md"><SelectValue placeholder="Select a tournament" /></SelectTrigger>
              <SelectContent>
                {tournaments?.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name} <span className="text-muted-foreground">({t.status})</span></SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {tournament && (
            <div className="space-y-2 mb-6">
              <div className="flex gap-2 flex-wrap">
                <Badge variant={tournament.status === "active" ? "default" : "secondary"}>{tournament.status}</Badge>
                {tournament.status === "draft" && <Button size="sm" onClick={() => setTournamentStatus("active")}>Activate</Button>}
                {tournament.status === "active" && <Button size="sm" variant="outline" onClick={() => setTournamentStatus("completed")}>Mark Complete</Button>}
                <Button size="sm" variant="outline" onClick={() => setShowAnnouncement(true)}><Megaphone className="h-4 w-4 mr-1" />Announce</Button>
              </div>
            </div>
          )}

          {selectedTournament && (
            <Tabs defaultValue="age-groups" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4 gap-1">
                <TabsTrigger value="age-groups">Age Groups</TabsTrigger>
                <TabsTrigger value="teams">Teams</TabsTrigger>
                <TabsTrigger value="groups">Groups</TabsTrigger>
                <TabsTrigger value="matches">Matches</TabsTrigger>
              </TabsList>

              {/* AGE GROUPS TAB */}
              <TabsContent value="age-groups" className="space-y-4">
                <Button size="sm" onClick={() => setShowAddAgeGroup(true)}><Plus className="h-4 w-4 mr-1" />Add Age Group</Button>
                <div className="grid md:grid-cols-3 gap-4">
                  {ageGroups?.map(ag => {
                    const agGroups = groups?.filter(g => g.age_group_id === ag.id) || [];
                    return (
                      <Card key={ag.id}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{ag.age_group}</CardTitle>
                          <CardDescription>{ag.max_teams ? `Max ${ag.max_teams} teams` : "No limit"} · {ag.group_count} groups</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {agGroups.length === 0 ? (
                            <Button size="sm" variant="outline" onClick={() => generateGroups(ag.id, ag.group_count || 2)}>Generate Groups</Button>
                          ) : (
                            <div className="flex gap-1 flex-wrap">
                              {agGroups.map(g => <Badge key={g.id} variant="outline">Group {g.group_name}</Badge>)}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              {/* TEAMS TAB */}
              <TabsContent value="teams" className="space-y-4">
                {ageGroups?.map(ag => {
                  const agTeams = teams?.filter(t => t.age_group_id === ag.id) || [];
                  if (agTeams.length === 0) return null;
                  const agGroups = groups?.filter(g => g.age_group_id === ag.id) || [];
                  const confirmedCount = agTeams.filter(t => t.status === "confirmed").length;
                  const pendingCount = agTeams.filter(t => t.status === "pending").length;
                  return (
                    <Card key={ag.id}>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          {ag.age_group} — {agTeams.length} teams
                          <Badge variant="default" className="text-[10px]">{confirmedCount} confirmed</Badge>
                          {pendingCount > 0 && <Badge variant="secondary" className="text-[10px]">{pendingCount} pending</Badge>}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-8"></TableHead>
                              <TableHead>Team</TableHead>
                              <TableHead>Club</TableHead>
                              <TableHead>Manager</TableHead>
                              <TableHead>Players</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Group</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {agTeams.map(team => {
                              const isExpanded = expandedTeams.has(team.id);
                              const toggleExpand = () => {
                                setExpandedTeams(prev => {
                                  const next = new Set(prev);
                                  if (next.has(team.id)) next.delete(team.id);
                                  else next.add(team.id);
                                  return next;
                                });
                              };
                              return (
                                <>
                                  <TableRow key={team.id} className="cursor-pointer hover:bg-muted/50" onClick={toggleExpand}>
                                    <TableCell className="w-8">
                                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                                    </TableCell>
                                    <TableCell className="font-medium">{team.team_name}</TableCell>
                                    <TableCell className="text-xs">{team.club_name || "—"}</TableCell>
                                    <TableCell className="text-xs">{team.manager_name}</TableCell>
                                    <TableCell className="text-xs">{team.player_count || "—"}</TableCell>
                                    <TableCell>
                                      <Badge variant={team.status === "confirmed" ? "default" : team.status === "rejected" ? "destructive" : "secondary"}>{team.status}</Badge>
                                    </TableCell>
                                    <TableCell onClick={e => e.stopPropagation()}>
                                      <Select value={team.group_id || ""} onValueChange={v => assignTeamToGroup(team.id, v || null)}>
                                        <SelectTrigger className="h-8 w-24"><SelectValue placeholder="—" /></SelectTrigger>
                                        <SelectContent>
                                          {agGroups.map(g => <SelectItem key={g.id} value={g.id}>Group {g.group_name}</SelectItem>)}
                                        </SelectContent>
                                      </Select>
                                    </TableCell>
                                    <TableCell onClick={e => e.stopPropagation()}>
                                      <div className="flex gap-1">
                                        {team.status !== "confirmed" && (
                                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setTeamStatus(team.id, "confirmed")}><Check className="h-4 w-4 text-green-500" /></Button>
                                        )}
                                        {team.status !== "rejected" && (
                                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setTeamStatus(team.id, "rejected")}><X className="h-4 w-4 text-red-500" /></Button>
                                        )}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                  {isExpanded && (
                                    <TableRow key={`${team.id}-detail`}>
                                      <TableCell colSpan={8} className="p-0">
                                        <AdminTeamDetail teamId={team.id} team={team} />
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  );
                })}
                {(!teams || teams.length === 0) && <Card><CardContent className="pt-6 text-center text-muted-foreground">No team registrations yet</CardContent></Card>}
              </TabsContent>

              {/* GROUPS TAB */}
              <TabsContent value="groups" className="space-y-4">
                {ageGroups?.map(ag => {
                  const agGroups = groups?.filter(g => g.age_group_id === ag.id) || [];
                  const agTeams = teams?.filter(t => t.age_group_id === ag.id && t.status === "confirmed") || [];
                  if (agGroups.length === 0) return null;
                  return (
                    <div key={ag.id} className="space-y-3">
                      <h3 className="font-display text-lg font-bold">{ag.age_group}</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        {agGroups.map(g => {
                          const groupTeams = agTeams.filter(t => t.group_id === g.id);
                          return (
                            <Card key={g.id}>
                              <CardHeader className="pb-2"><CardTitle className="text-sm">Group {g.group_name}</CardTitle></CardHeader>
                              <CardContent>
                                {groupTeams.length === 0 ? (
                                  <p className="text-xs text-muted-foreground">No teams assigned yet. Assign in Teams tab.</p>
                                ) : (
                                  <ul className="space-y-1">
                                    {groupTeams.map(t => <li key={t.id} className="text-sm">{t.team_name}</li>)}
                                  </ul>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </TabsContent>

              {/* MATCHES TAB */}
              <TabsContent value="matches" className="space-y-4">
                <Button size="sm" onClick={() => setShowAddMatch(true)}><Plus className="h-4 w-4 mr-1" />Add Match</Button>
                {matches && matches.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Age Group</TableHead>
                        <TableHead>Stage</TableHead>
                        <TableHead>Home</TableHead>
                        <TableHead className="text-center">Score</TableHead>
                        <TableHead>Away</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Pitch</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {matches.map(m => (
                        <MatchRow key={m.id} match={m} getTeamName={getTeamName} getAgeGroupName={getAgeGroupName} onUpdateScore={updateScore} onDelete={deleteMatch} />
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <Card><CardContent className="pt-6 text-center text-muted-foreground">No matches created yet</CardContent></Card>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
      <Footer />

      {/* CREATE TOURNAMENT DIALOG */}
      <Dialog open={showCreateTournament} onOpenChange={setShowCreateTournament}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Tournament</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name *</Label><Input value={tournamentForm.name} onChange={e => setTournamentForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Description</Label><Textarea value={tournamentForm.description} onChange={e => setTournamentForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div><Label>Venue</Label><Input value={tournamentForm.venue} onChange={e => setTournamentForm(f => ({ ...f, venue: e.target.value }))} /></div>
            <div><Label>Date</Label><DateInput value={tournamentForm.tournament_date} onChange={val => setTournamentForm(f => ({ ...f, tournament_date: val }))} placeholder="Select date" /></div>
            <div><Label>Entry Fee (£)</Label><Input type="number" step="0.01" value={tournamentForm.entry_fee} onChange={e => setTournamentForm(f => ({ ...f, entry_fee: e.target.value }))} /></div>
            <div><Label>Rules</Label><Textarea value={tournamentForm.rules} onChange={e => setTournamentForm(f => ({ ...f, rules: e.target.value }))} /></div>
            <Button onClick={createTournament} className="w-full">Create Tournament</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ADD AGE GROUP DIALOG */}
      <Dialog open={showAddAgeGroup} onOpenChange={setShowAddAgeGroup}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Age Group</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Age Group (e.g. U7s, U8s)</Label><Input value={ageGroupForm.age_group} onChange={e => setAgeGroupForm(f => ({ ...f, age_group: e.target.value }))} /></div>
            <div><Label>Max Teams</Label><Input type="number" value={ageGroupForm.max_teams} onChange={e => setAgeGroupForm(f => ({ ...f, max_teams: e.target.value }))} /></div>
            <div><Label>Number of Groups</Label><Input type="number" min={1} max={8} value={ageGroupForm.group_count} onChange={e => setAgeGroupForm(f => ({ ...f, group_count: e.target.value }))} /></div>
            <Button onClick={addAgeGroup} className="w-full">Add Age Group</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ADD MATCH DIALOG */}
      <Dialog open={showAddMatch} onOpenChange={setShowAddMatch}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Match</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Age Group</Label>
              <Select value={matchForm.age_group_id} onValueChange={v => setMatchForm(f => ({ ...f, age_group_id: v, home_team_id: "", away_team_id: "", group_id: "" }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{ageGroups?.map(ag => <SelectItem key={ag.id} value={ag.id}>{ag.age_group}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Stage</Label>
              <Select value={matchForm.stage} onValueChange={v => setMatchForm(f => ({ ...f, stage: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="group">Group</SelectItem>
                  <SelectItem value="semi">Semi Final</SelectItem>
                  <SelectItem value="final">Final</SelectItem>
                  <SelectItem value="3rd-place">3rd Place</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {matchForm.stage === "group" && (
              <div>
                <Label>Group</Label>
                <Select value={matchForm.group_id} onValueChange={v => setMatchForm(f => ({ ...f, group_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{groups?.filter(g => g.age_group_id === matchForm.age_group_id).map(g => <SelectItem key={g.id} value={g.id}>Group {g.group_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Home Team</Label>
              <Select value={matchForm.home_team_id} onValueChange={v => setMatchForm(f => ({ ...f, home_team_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{filteredTeamsForMatch.map(t => <SelectItem key={t.id} value={t.id}>{t.team_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Away Team</Label>
              <Select value={matchForm.away_team_id} onValueChange={v => setMatchForm(f => ({ ...f, away_team_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{filteredTeamsForMatch.filter(t => t.id !== matchForm.home_team_id).map(t => <SelectItem key={t.id} value={t.id}>{t.team_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Time</Label><Input type="datetime-local" value={matchForm.match_time} onChange={e => setMatchForm(f => ({ ...f, match_time: e.target.value }))} /></div>
            <div><Label>Pitch</Label><Input value={matchForm.pitch} onChange={e => setMatchForm(f => ({ ...f, pitch: e.target.value }))} placeholder="e.g. Pitch 1" /></div>
            <Button onClick={addMatch} className="w-full">Add Match</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ANNOUNCEMENT DIALOG */}
      <Dialog open={showAnnouncement} onOpenChange={setShowAnnouncement}>
        <DialogContent>
          <DialogHeader><DialogTitle>Post Announcement</DialogTitle></DialogHeader>
          <Textarea value={announcementText} onChange={e => setAnnouncementText(e.target.value)} placeholder="Type your announcement..." rows={3} />
          <Button onClick={postAnnouncement} className="w-full">Post</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Match row component with inline score editing
function MatchRow({ match, getTeamName, getAgeGroupName, onUpdateScore, onDelete }: {
  match: any; getTeamName: (id: string) => string; getAgeGroupName: (id: string) => string;
  onUpdateScore: (id: string, h: number, a: number) => void; onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [h, setH] = useState(match.home_score?.toString() || "0");
  const [a, setA] = useState(match.away_score?.toString() || "0");

  return (
    <TableRow>
      <TableCell className="text-xs">{getAgeGroupName(match.age_group_id)}</TableCell>
      <TableCell><Badge variant="outline" className="text-xs capitalize">{match.stage}</Badge></TableCell>
      <TableCell className="text-xs font-medium">{getTeamName(match.home_team_id)}</TableCell>
      <TableCell className="text-center">
        {editing ? (
          <div className="flex items-center gap-1 justify-center">
            <Input type="number" min={0} className="w-12 h-7 text-center text-xs" value={h} onChange={e => setH(e.target.value)} />
            <span>-</span>
            <Input type="number" min={0} className="w-12 h-7 text-center text-xs" value={a} onChange={e => setA(e.target.value)} />
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { onUpdateScore(match.id, parseInt(h), parseInt(a)); setEditing(false); }}><Check className="h-3 w-3" /></Button>
          </div>
        ) : (
          <span className="text-xs">{match.status === "completed" ? `${match.home_score} - ${match.away_score}` : "vs"}</span>
        )}
      </TableCell>
      <TableCell className="text-xs font-medium">{getTeamName(match.away_team_id)}</TableCell>
      <TableCell className="text-xs">{match.match_time ? new Date(match.match_time).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}</TableCell>
      <TableCell className="text-xs">{match.pitch || "—"}</TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(!editing)}><Edit className="h-3 w-3" /></Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onDelete(match.id)}><Trash2 className="h-3 w-3 text-red-500" /></Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default TournamentAdminPage;
