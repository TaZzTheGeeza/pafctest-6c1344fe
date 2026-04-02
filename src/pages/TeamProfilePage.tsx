import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Calendar, Trophy, Target, Shield, TrendingUp, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TournamentPhotoGallery } from "@/components/tournament/TournamentPhotoGallery";

const TeamProfilePage = () => {
  const { teamId } = useParams<{ teamId: string }>();

  const { data: team } = useQuery({
    queryKey: ["team-profile", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournament_teams")
        .select("*, tournament_age_groups(age_group, tournaments(name))")
        .eq("id", teamId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!teamId,
  });

  const { data: allTeams } = useQuery({
    queryKey: ["all-teams-for-profile", team?.age_group_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournament_teams")
        .select("id, team_name")
        .eq("age_group_id", team!.age_group_id)
        .eq("status", "confirmed");
      if (error) throw error;
      return data;
    },
    enabled: !!team?.age_group_id,
  });

  const { data: matches } = useQuery({
    queryKey: ["team-matches", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournament_matches")
        .select("*")
        .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
        .order("match_time", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!teamId,
  });

  const { data: group } = useQuery({
    queryKey: ["team-group", team?.group_id],
    queryFn: async () => {
      if (!team?.group_id) return null;
      const { data, error } = await supabase
        .from("tournament_groups")
        .select("*")
        .eq("id", team.group_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!team?.group_id,
  });

  const { data: groupTeams } = useQuery({
    queryKey: ["group-teams", team?.group_id],
    queryFn: async () => {
      if (!team?.group_id) return [];
      const { data, error } = await supabase
        .from("tournament_teams")
        .select("*")
        .eq("group_id", team.group_id)
        .eq("status", "confirmed");
      if (error) throw error;
      return data;
    },
    enabled: !!team?.group_id,
  });

  const { data: groupMatches } = useQuery({
    queryKey: ["group-matches-standings", team?.group_id],
    queryFn: async () => {
      if (!team?.group_id) return [];
      const { data, error } = await supabase
        .from("tournament_matches")
        .select("*")
        .eq("group_id", team.group_id)
        .eq("status", "completed");
      if (error) throw error;
      return data;
    },
    enabled: !!team?.group_id,
  });

  const getTeamName = (id: string) => allTeams?.find(t => t.id === id)?.team_name || "TBC";

  const completedMatches = matches?.filter(m => m.status === "completed") || [];
  const upcomingMatches = matches?.filter(m => m.status !== "completed") || [];

  // Stats
  const stats = completedMatches.reduce(
    (acc, m) => {
      const isHome = m.home_team_id === teamId;
      const scored = isHome ? (m.home_score ?? 0) : (m.away_score ?? 0);
      const conceded = isHome ? (m.away_score ?? 0) : (m.home_score ?? 0);
      acc.gf += scored;
      acc.ga += conceded;
      acc.played++;
      if (scored > conceded) acc.w++;
      else if (scored === conceded) acc.d++;
      else acc.l++;
      return acc;
    },
    { played: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 }
  );

  // Group standings
  const standings = (groupTeams || [])
    .map((t) => {
      const tMatches = (groupMatches || []).filter(
        (m) => m.home_team_id === t.id || m.away_team_id === t.id
      );
      let w = 0, d = 0, l = 0, gf = 0, ga = 0;
      tMatches.forEach((m) => {
        const isHome = m.home_team_id === t.id;
        const scored = isHome ? (m.home_score ?? 0) : (m.away_score ?? 0);
        const conceded = isHome ? (m.away_score ?? 0) : (m.home_score ?? 0);
        gf += scored; ga += conceded;
        if (scored > conceded) w++;
        else if (scored === conceded) d++;
        else l++;
      });
      return { team: t, p: tMatches.length, w, d, l, gf, ga, gd: gf - ga, pts: w * 3 + d };
    })
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);

  const teamPosition = standings.findIndex((s) => s.team.id === teamId) + 1;

  const stageLabel = (stage: string) => {
    switch (stage) {
      case "group": return "Group";
      case "semi": return "Semi Final";
      case "final": return "Final";
      case "3rd-place": return "3rd Place";
      default: return stage;
    }
  };

  if (!team) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-20 pb-12 flex items-center justify-center">
          <p className="text-muted-foreground">Loading team...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Back link */}
          <Link to="/tournament">
            <Button variant="ghost" size="sm" className="mb-4 -ml-2">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Tournament
            </Button>
          </Link>

          {/* Team header */}
          <div className="mb-8">
            <h1 className="font-display text-2xl md:text-4xl font-bold text-foreground">
              {team.team_name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <Badge variant="secondary">{(team as any).tournament_age_groups?.age_group}</Badge>
              {group && <Badge variant="outline">Group {group.group_name}</Badge>}
              <Badge className={team.status === "confirmed" ? "bg-green-600" : "bg-yellow-600"}>
                {team.status}
              </Badge>
            </div>
            {team.manager_name && (
              <p className="text-sm text-muted-foreground mt-2">Manager: {team.manager_name}</p>
            )}
          </div>

          {/* Stats cards */}
          {completedMatches.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <Card>
                <CardContent className="pt-4 pb-4 text-center">
                  <p className="text-2xl font-bold text-primary">{stats.played}</p>
                  <p className="text-xs text-muted-foreground">Played</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.w}</p>
                  <p className="text-xs text-muted-foreground">Wins</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4 text-center">
                  <p className="text-2xl font-bold text-primary">{stats.gf}</p>
                  <p className="text-xs text-muted-foreground">Goals For</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4 text-center">
                  <p className="text-2xl font-bold text-muted-foreground">{stats.gf - stats.ga}</p>
                  <p className="text-xs text-muted-foreground">Goal Diff</p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Upcoming fixtures */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />Upcoming Fixtures
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingMatches.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No upcoming fixtures</p>
                ) : (
                  <div className="space-y-3">
                    {upcomingMatches.map((m) => {
                      const isHome = m.home_team_id === teamId;
                      const opponent = isHome ? m.away_team_id : m.home_team_id;
                      return (
                        <div key={m.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                          <div>
                            <p className="text-sm font-medium">
                              {isHome ? "vs" : "@"} {getTeamName(opponent)}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="outline" className="text-[10px]">{stageLabel(m.stage)}</Badge>
                              {m.pitch && <span className="text-[10px] text-muted-foreground">Pitch {m.pitch}</span>}
                            </div>
                          </div>
                          {m.match_time && (
                            <div className="text-right">
                              <p className="text-sm font-mono font-semibold">
                                {new Date(m.match_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {new Date(m.match_time).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Results */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                {completedMatches.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No results yet</p>
                ) : (
                  <div className="space-y-2">
                    {completedMatches.map((m) => {
                      const isHome = m.home_team_id === teamId;
                      const scored = isHome ? m.home_score ?? 0 : m.away_score ?? 0;
                      const conceded = isHome ? m.away_score ?? 0 : m.home_score ?? 0;
                      const opponent = isHome ? m.away_team_id : m.home_team_id;
                      const result = scored > conceded ? "W" : scored < conceded ? "L" : "D";
                      const resultColor = result === "W" ? "bg-green-600" : result === "L" ? "bg-red-600" : "bg-yellow-600";

                      return (
                        <div key={m.id} className="flex items-center gap-3 rounded-lg border border-border p-2.5">
                          <span className={`${resultColor} text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded`}>
                            {result}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {isHome ? "vs" : "@"} {getTeamName(opponent)}
                            </p>
                            <Badge variant="outline" className="text-[10px]">{stageLabel(m.stage)}</Badge>
                          </div>
                          <span className="font-mono font-bold text-sm">{scored} - {conceded}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Group table */}
          {group && standings.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Group {group.group_name} Standings
                </CardTitle>
                {teamPosition > 0 && (
                  <CardDescription>
                    Your position: <strong>{teamPosition}{teamPosition === 1 ? "st" : teamPosition === 2 ? "nd" : teamPosition === 3 ? "rd" : "th"}</strong>
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[160px]">Team</TableHead>
                      <TableHead className="text-center w-8">P</TableHead>
                      <TableHead className="text-center w-8">W</TableHead>
                      <TableHead className="text-center w-8">D</TableHead>
                      <TableHead className="text-center w-8">L</TableHead>
                      <TableHead className="text-center w-10">GF</TableHead>
                      <TableHead className="text-center w-10">GA</TableHead>
                      <TableHead className="text-center w-10">GD</TableHead>
                      <TableHead className="text-center w-10 font-bold">Pts</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {standings.map((s) => (
                      <TableRow key={s.team.id} className={s.team.id === teamId ? "bg-primary/10 font-bold" : ""}>
                        <TableCell className="text-xs font-medium">{s.team.team_name}</TableCell>
                        <TableCell className="text-center text-xs">{s.p}</TableCell>
                        <TableCell className="text-center text-xs">{s.w}</TableCell>
                        <TableCell className="text-center text-xs">{s.d}</TableCell>
                        <TableCell className="text-center text-xs">{s.l}</TableCell>
                        <TableCell className="text-center text-xs">{s.gf}</TableCell>
                        <TableCell className="text-center text-xs">{s.ga}</TableCell>
                        <TableCell className="text-center text-xs">{s.gd}</TableCell>
                        <TableCell className="text-center text-xs font-bold">{s.pts}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TeamProfilePage;
