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
import { DateInput } from "@/components/ui/date-input";
import { Trophy, Plus, Check, X, Edit, Megaphone, Trash2, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { AdminTeamDetail } from "@/components/tournament/AdminTeamDetail";
import { ChangeLogTab } from "@/components/tournament/ChangeLogTab";
import { toast } from "sonner";

const TournamentAdminPage = () => {
  const queryClient = useQueryClient();
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [showCreateTournament, setShowCreateTournament] = useState(false);
  const [showAddAgeGroup, setShowAddAgeGroup] = useState(false);
  const [editingAgeGroupId, setEditingAgeGroupId] = useState<string | null>(null);
  const [showAddMatch, setShowAddMatch] = useState(false);
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [tournamentForm, setTournamentForm] = useState({ name: "", description: "", venue: "", tournament_date: "", entry_fee: "", rules: "" });
  const [ageGroupForm, setAgeGroupForm] = useState({ age_group: "", max_teams: "", group_count: "2" });
  const [matchForm, setMatchForm] = useState({ age_group_id: "", group_id: "", home_team_id: "", away_team_id: "", match_time: "", pitch: "", stage: "group", referee: "" });
  const [teamForm, setTeamForm] = useState({ team_name: "", club_name: "", manager_name: "", manager_email: "", manager_phone: "", age_group_id: "", player_count: "", whatsapp_name: "", whatsapp_number: "", consent_rules: true, consent_photography: true });
  const [announcementText, setAnnouncementText] = useState("");
  const [matchFilterAge, setMatchFilterAge] = useState<string>("all");
  const [matchFilterPitch, setMatchFilterPitch] = useState<string>("all");
  const [matchFilterDay, setMatchFilterDay] = useState<string>("all");
  const [matchFilterStage, setMatchFilterStage] = useState<string>("all");
  const [matchFilterStatus, setMatchFilterStatus] = useState<string>("all");
  const [editingGroup, setEditingGroup] = useState<{ id: string; name: string } | null>(null);
  const [editingStandingId, setEditingStandingId] = useState<string | null>(null);
  const [standingForm, setStandingForm] = useState<{ p: string; w: string; d: string; l: string; gf: string; ga: string; pts: string }>({ p: "", w: "", d: "", l: "", gf: "", ga: "", pts: "" });
  const [editingTeam, setEditingTeam] = useState<any | null>(null);
  const [editTeamForm, setEditTeamForm] = useState({ team_name: "", club_name: "", county: "", club_org_id: "", league_division: "", team_category: "", manager_name: "", manager_email: "", manager_phone: "", secretary_name: "", secretary_email: "", secretary_phone: "", player_count: "", whatsapp_contacts: [{ name: "", number: "" }] as { name: string; number: string }[], consent_rules: true, consent_photography: true });
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
      const { data, error } = await supabase.from("tournament_age_groups").select("*").eq("tournament_id", selectedTournament);
      if (error) throw error;
      return (data || []).sort((a, b) => {
        const numA = parseInt(String(a.age_group).replace(/\D/g, "")) || 9999;
        const numB = parseInt(String(b.age_group).replace(/\D/g, "")) || 9999;
        return numA - numB;
      });
    },
    enabled: !!selectedTournament,
  });

  const { data: teams } = useQuery({
    queryKey: ["admin-teams", selectedTournament],
    queryFn: async () => {
      if (!ageGroups?.length) return [];
      const ids = ageGroups.map(ag => ag.id);
      const { data, error } = await supabase.from("tournament_teams").select("id, age_group_id, team_name, player_count, status, club_name, county, club_org_id, league_division, team_category, consent_rules, consent_photography, created_at, group_id").in("age_group_id", ids).order("created_at");
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

  // ADD or UPDATE AGE GROUP
  const addAgeGroup = async () => {
    if (!ageGroupForm.age_group.trim() || !selectedTournament) return;
    const payload = {
      age_group: ageGroupForm.age_group,
      max_teams: ageGroupForm.max_teams ? parseInt(ageGroupForm.max_teams) : null,
      group_count: parseInt(ageGroupForm.group_count) || 2,
    };
    if (editingAgeGroupId) {
      const { error } = await supabase.from("tournament_age_groups").update(payload).eq("id", editingAgeGroupId);
      if (error) { toast.error(error.message); return; }
      toast.success("Age group updated");
    } else {
      const { error } = await supabase.from("tournament_age_groups").insert({ tournament_id: selectedTournament, ...payload });
      if (error) { toast.error(error.message); return; }
      toast.success("Age group added");
    }
    setShowAddAgeGroup(false);
    setEditingAgeGroupId(null);
    setAgeGroupForm({ age_group: "", max_teams: "", group_count: "2" });
    invalidateAll();
  };

  const openEditAgeGroup = (ag: any) => {
    setEditingAgeGroupId(ag.id);
    setAgeGroupForm({
      age_group: ag.age_group || "",
      max_teams: ag.max_teams != null ? String(ag.max_teams) : "",
      group_count: ag.group_count != null ? String(ag.group_count) : "2",
    });
    setShowAddAgeGroup(true);
  };

  const deleteAgeGroup = async (ag: any) => {
    const teamCount = teams?.filter(t => t.age_group_id === ag.id).length ?? 0;
    const matchCount = matches?.filter(m => m.age_group_id === ag.id).length ?? 0;
    const warning = teamCount > 0 || matchCount > 0
      ? `This will also delete ${teamCount} team(s) and ${matchCount} match(es) in ${ag.age_group}. Continue?`
      : `Delete age group ${ag.age_group}?`;
    if (!confirm(warning)) return;
    // Cascade: matches -> teams -> groups -> age group
    await supabase.from("tournament_matches").delete().eq("age_group_id", ag.id);
    await supabase.from("tournament_teams").delete().eq("age_group_id", ag.id);
    await supabase.from("tournament_groups").delete().eq("age_group_id", ag.id);
    const { error } = await supabase.from("tournament_age_groups").delete().eq("id", ag.id);
    if (error) { toast.error(error.message); return; }
    invalidateAll();
    toast.success("Age group deleted");
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
      referee: matchForm.referee.trim() || null,
    });
    setShowAddMatch(false);
    setMatchForm({ age_group_id: "", group_id: "", home_team_id: "", away_team_id: "", match_time: "", pitch: "", stage: "group", referee: "" });
    invalidateAll();
    toast.success("Match added");
  };

  // UPDATE SCORE
  const updateScore = async (matchId: string, homeScore: number, awayScore: number) => {
    await supabase.from("tournament_matches").update({ home_score: homeScore, away_score: awayScore, status: "completed" }).eq("id", matchId);
    invalidateAll();
    toast.success("Score updated");
    // Auto-progress knockouts when group/semi results are entered
    progressKnockouts(true);
  };

  // CLEAR SCORE
  const clearScore = async (matchId: string) => {
    await supabase.from("tournament_matches").update({ home_score: null, away_score: null, status: "scheduled" }).eq("id", matchId);
    invalidateAll();
    toast.success("Score cleared");
  };

  // RESET KNOCKOUT MATCH (clear teams + score so it goes back to TBC vs TBC)
  const resetMatch = async (matchId: string) => {
    if (!confirm("Reset this match? Teams will revert to TBC and the score will be cleared.")) return;
    const { error } = await supabase.from("tournament_matches").update({
      home_team_id: null,
      away_team_id: null,
      home_score: null,
      away_score: null,
      status: "scheduled",
    }).eq("id", matchId);
    if (error) { toast.error("Failed to reset match"); return; }
    invalidateAll();
    toast.success("Match reset — teams cleared to TBC");
  };

  // ===== AUTO-PROGRESS KNOCKOUTS =====
  // Resolves placeholders like "U7 Group A 1st", "Winner SF1" into actual team IDs
  // based on completed group standings and semi-final winners.
  const progressKnockouts = async (silent = false) => {
    if (!ageGroups?.length) { if (!silent) toast.info("No age groups"); return; }
    const ids = ageGroups.map((ag: any) => ag.id);
    const [{ data: latestMatches }, { data: latestTeams }] = await Promise.all([
      supabase.from("tournament_matches").select("*").in("age_group_id", ids).order("match_time", { ascending: true }),
      supabase.from("tournament_teams").select("id, age_group_id, group_id, team_name").in("age_group_id", ids),
    ]);
    const allMatches: any[] = latestMatches || [];
    const allTeams: any[] = latestTeams || [];
    const allGroups: any[] = groups || [];

    const standingsFor = (groupId: string) => {
      const gt = allTeams.filter(t => t.group_id === groupId);
      const gm = allMatches.filter(m => m.group_id === groupId && m.status === "completed");
      return gt.map(team => {
        const played = gm.filter(m => m.home_team_id === team.id || m.away_team_id === team.id);
        let w = 0, d = 0, l = 0, gf = 0, ga = 0;
        played.forEach(m => {
          const isHome = m.home_team_id === team.id;
          const s = isHome ? (m.home_score ?? 0) : (m.away_score ?? 0);
          const c = isHome ? (m.away_score ?? 0) : (m.home_score ?? 0);
          gf += s; ga += c;
          if (s > c) w++; else if (s === c) d++; else l++;
        });
        return { team, p: played.length, w, d, l, gf, ga, gd: gf - ga, pts: w * 3 + d };
      }).sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
    };

    const resolve = (placeholder: string | null | undefined, ageGroupId: string): string | null => {
      if (!placeholder) return null;
      const gMatch = placeholder.match(/Group\s+(\w+)\s+(\d+)/i);
      if (gMatch) {
        const letter = gMatch[1].toUpperCase();
        const pos = parseInt(gMatch[2]);
        const grp = allGroups.find(g => g.age_group_id === ageGroupId && (g.group_name || "").toUpperCase() === letter);
        if (!grp) return null;
        const groupMatches = allMatches.filter(m => m.group_id === grp.id);
        if (groupMatches.length === 0) return null;
        // Only progress when ALL group matches are completed
        if (groupMatches.some(m => m.status !== "completed")) return null;
        const standings = standingsFor(grp.id);
        return standings[pos - 1]?.team?.id || null;
      }
      const sfMatch = placeholder.match(/SF\s*(\d+)/i);
      if (sfMatch) {
        const idx = parseInt(sfMatch[1]) - 1;
        const semis = allMatches
          .filter(m => m.age_group_id === ageGroupId && (m.stage === "semi-final" || m.stage === "semi"))
          .sort((a, b) => new Date(a.match_time || 0).getTime() - new Date(b.match_time || 0).getTime());
        const sem = semis[idx];
        if (!sem || sem.status !== "completed") return null;
        return (sem.home_score ?? 0) > (sem.away_score ?? 0) ? sem.home_team_id : sem.away_team_id;
      }
      return null;
    };

    let updated = 0;
    // Do semis first, then finals, so finals can resolve "Winner SF" placeholders in the same pass
    const ordered = [...allMatches].sort((a, b) => {
      const rank = (s: string) => s === "semi-final" || s === "semi" ? 0 : s === "3rd-place" ? 1 : s === "final" ? 2 : -1;
      return rank(a.stage) - rank(b.stage);
    });
    for (const m of ordered) {
      if (m.stage === "group") continue;
      const updates: any = {};
      if (!m.home_team_id && m.home_placeholder) {
        const id = resolve(m.home_placeholder, m.age_group_id);
        if (id) updates.home_team_id = id;
      }
      if (!m.away_team_id && m.away_placeholder) {
        const id = resolve(m.away_placeholder, m.age_group_id);
        if (id) updates.away_team_id = id;
      }
      if (Object.keys(updates).length) {
        const { error } = await supabase.from("tournament_matches").update(updates).eq("id", m.id);
        if (!error) {
          updated++;
          // Reflect change in local copy so later matches in this loop can see it
          Object.assign(m, updates);
        }
      }
    }
    if (updated > 0) {
      invalidateAll();
      if (!silent) toast.success(`Progressed ${updated} knockout match${updated === 1 ? "" : "es"}`);
    } else if (!silent) {
      toast.info("No knockout matches ready to progress");
    }
  };

  // UPDATE MATCH FIELDS (referee / pitch / time / teams / stage / group)
  const updateMatch = async (matchId: string, fields: Record<string, any>) => {
    const { error } = await supabase.from("tournament_matches").update(fields).eq("id", matchId);
    if (error) { toast.error(error.message); return; }
    invalidateAll();
    toast.success("Match updated");
  };

  // POST ANNOUNCEMENT
  const postAnnouncement = async () => {
    if (!announcementText.trim() || !selectedTournament) return;
    const message = announcementText.trim();
    await supabase.from("tournament_announcements").insert({ tournament_id: selectedTournament, message });

    // Email coaches & secretaries of every team in this tournament
    try {
      const teamIds = (teams || []).map(t => t.id);
      if (teamIds.length) {
        const contactResults = await Promise.all(
          teamIds.map(id => supabase.rpc("get_tournament_team_contacts", { _team_id: id }))
        );
        const contactTeams: any[] = [];
        for (const r of contactResults) {
          if (r.error) { console.error("contact rpc error", r.error); continue; }
          if (r.data) contactTeams.push(...(r.data as any[]));
        }

        const tournamentName = tournament?.name || "Tournament";
        const title = `${tournamentName} Announcement`;
        const recipients = new Map<string, string>(); // email -> name
        for (const t of contactTeams) {
          if (t.manager_email) recipients.set(String(t.manager_email).toLowerCase(), t.manager_name || "");
          if (t.secretary_email) recipients.set(String(t.secretary_email).toLowerCase(), t.secretary_name || "");
        }

        let sent = 0;
        await Promise.all(Array.from(recipients.entries()).map(async ([email]) => {
          try {
            await supabase.functions.invoke("send-transactional-email", {
              body: {
                templateName: "admin-broadcast",
                recipientEmail: email,
                idempotencyKey: `tournament-announce-${selectedTournament}-${Date.now()}-${email}`,
                templateData: { title, message },
              },
            });
            sent++;
          } catch (e) {
            console.error("Announcement email failed", email, e);
          }
        }));
        toast.success(`Announcement posted • ${sent} email${sent === 1 ? "" : "s"} sent`);
      } else {
        toast.success("Announcement posted");
      }
    } catch (e) {
      console.error(e);
      toast.success("Announcement posted (email dispatch failed)");
    }

    setAnnouncementText("");
    setShowAnnouncement(false);
    invalidateAll();
  };

  // NOTIFY: FIXTURES READY — emails all team coaches + secretaries with link to tournament page
  const notifyFixturesReady = async () => {
    if (!selectedTournament) return;
    const ageGroupIds = (ageGroups || []).map(ag => ag.id);
    if (!ageGroupIds.length) { toast.error("No teams to notify"); return; }
    if (!confirm("Email all team coaches & secretaries that fixtures are ready?")) return;

    // Fetch contacts via SECURITY DEFINER RPC (admin/coach only) per team
    const teamIds = (teams || []).map(t => t.id);
    if (!teamIds.length) { toast.error("No teams to notify"); return; }

    const contactResults = await Promise.all(
      teamIds.map(id => supabase.rpc("get_tournament_team_contacts", { _team_id: id }))
    );
    const contactTeams: any[] = [];
    for (const r of contactResults) {
      if (r.error) {
        console.error("contact rpc error", r.error);
        continue;
      }
      if (r.data) contactTeams.push(...(r.data as any[]));
    }

    const tournamentName = tournament?.name || "Tournament";
    const link = `https://www.pa-fc.uk/tournament`;
    const title = `${tournamentName} – Fixtures Now Available`;
    const message =
      `Great news — your fixtures for ${tournamentName} are now published and ready to view.\n\n` +
      `View the full schedule, group standings and match times here:\n${link}\n\n` +
      `Please check kick-off times carefully and arrive in good time. See you on the day!`;

    const recipients = new Set<string>();
    for (const t of contactTeams) {
      if (t.manager_email) recipients.add(String(t.manager_email).toLowerCase());
      if (t.secretary_email) recipients.add(String(t.secretary_email).toLowerCase());
    }

    if (!recipients.size) { toast.error("No coach/secretary emails on file"); return; }

    toast.info(`Sending to ${recipients.size} contact${recipients.size === 1 ? "" : "s"}...`);
    let sent = 0, failed = 0;
    await Promise.all(Array.from(recipients).map(async (email) => {
      try {
        await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "admin-broadcast",
            recipientEmail: email,
            idempotencyKey: `tournament-fixtures-ready-${selectedTournament}-${email}`,
            templateData: { title, message },
          },
        });
        sent++;
      } catch (e) {
        console.error("Fixtures-ready email failed", email, e);
        failed++;
      }
    }));
    toast.success(`Fixtures notification sent • ${sent} delivered${failed ? `, ${failed} failed` : ""}`);
  };

  // DELETE MATCH
  const deleteMatch = async (matchId: string) => {
    await supabase.from("tournament_matches").delete().eq("id", matchId);
    invalidateAll();
    toast.success("Match deleted");
  };

  // DELETE TEAM
  const deleteTeam = async (teamId: string, teamName: string) => {
    if (!confirm(`Delete "${teamName}"? This will also remove their players and any matches they're in.`)) return;
    // Delete players first
    await supabase.from("tournament_team_players").delete().eq("team_id", teamId);
    // Delete matches involving this team
    await supabase.from("tournament_matches").delete().or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`);
    // Delete the team
    const { error } = await supabase.from("tournament_teams").delete().eq("id", teamId);
    if (error) { toast.error("Failed to delete team"); return; }
    invalidateAll();
    toast.success(`"${teamName}" deleted`);
  };

  // OPEN EDIT TEAM (contact fields fetched separately via secure RPC)
  const openEditTeam = async (team: any) => {
    const { data: contactRows } = await supabase
      .rpc("get_tournament_team_contacts", { _team_id: team.id });
    const contact: any = Array.isArray(contactRows) && contactRows[0] ? contactRows[0] : {};
    const whatsappSource = Array.isArray(contact.whatsapp_contacts) ? contact.whatsapp_contacts : [];
    const whatsapp = whatsappSource.length > 0
      ? whatsappSource.map((c: any) => ({ name: c.name || "", number: c.number || "" }))
      : [{ name: "", number: "" }];
    setEditTeamForm({
      team_name: team.team_name || "",
      club_name: team.club_name || "",
      county: team.county || "",
      club_org_id: team.club_org_id || "",
      league_division: team.league_division || "",
      team_category: team.team_category || "",
      manager_name: contact.manager_name || "",
      manager_email: contact.manager_email || "",
      manager_phone: contact.manager_phone || "",
      secretary_name: contact.secretary_name || "",
      secretary_email: contact.secretary_email || "",
      secretary_phone: contact.secretary_phone || "",
      player_count: team.player_count?.toString() || "",
      whatsapp_contacts: whatsapp,
      consent_rules: team.consent_rules ?? true,
      consent_photography: team.consent_photography ?? true,
    });
    setEditingTeam(team);
  };


  // SAVE EDIT TEAM
  const saveEditTeam = async () => {
    if (!editingTeam) return;
    const whatsappContacts = editTeamForm.whatsapp_contacts.filter(c => c.name || c.number);
    const { error } = await supabase.from("tournament_teams").update({
      team_name: editTeamForm.team_name,
      club_name: editTeamForm.club_name || null,
      county: editTeamForm.county || null,
      club_org_id: editTeamForm.club_org_id || null,
      league_division: editTeamForm.league_division || null,
      team_category: editTeamForm.team_category || null,
      manager_name: editTeamForm.manager_name,
      manager_email: editTeamForm.manager_email,
      manager_phone: editTeamForm.manager_phone || null,
      secretary_name: editTeamForm.secretary_name || null,
      secretary_email: editTeamForm.secretary_email || null,
      secretary_phone: editTeamForm.secretary_phone || null,
      player_count: editTeamForm.player_count ? parseInt(editTeamForm.player_count) : null,
      whatsapp_contacts: whatsappContacts,
      consent_rules: editTeamForm.consent_rules,
      consent_photography: editTeamForm.consent_photography,
    }).eq("id", editingTeam.id);
    if (error) { toast.error("Failed to update team"); return; }
    setEditingTeam(null);
    invalidateAll();
    toast.success("Team updated");
  };

  // RENAME GROUP
  const renameGroup = async (groupId: string, newName: string) => {
    if (!newName.trim()) { toast.error("Group name required"); return; }
    await supabase.from("tournament_groups").update({ group_name: newName.trim() }).eq("id", groupId);
    setEditingGroup(null);
    invalidateAll();
    toast.success("Group renamed");
  };

  // ADD TEAM MANUALLY
  const addTeam = async () => {
    if (!teamForm.team_name.trim() || !teamForm.manager_name.trim() || !teamForm.manager_email.trim() || !teamForm.age_group_id) {
      toast.error("Team name, manager name, email & age group are required");
      return;
    }
    const whatsappContacts = teamForm.whatsapp_name.trim() || teamForm.whatsapp_number.trim()
      ? [{ name: teamForm.whatsapp_name.trim(), number: teamForm.whatsapp_number.trim() }]
      : [];
    const { error } = await supabase.from("tournament_teams").insert({
      team_name: teamForm.team_name,
      club_name: teamForm.club_name || null,
      manager_name: teamForm.manager_name,
      manager_email: teamForm.manager_email,
      manager_phone: teamForm.manager_phone || null,
      age_group_id: teamForm.age_group_id,
      player_count: teamForm.player_count ? parseInt(teamForm.player_count) : null,
      whatsapp_contacts: whatsappContacts,
      consent_rules: teamForm.consent_rules,
      consent_photography: teamForm.consent_photography,
      status: "confirmed",
    });
    if (error) { toast.error("Failed to add team"); console.error(error); return; }
    setShowAddTeam(false);
    setTeamForm({ team_name: "", club_name: "", manager_name: "", manager_email: "", manager_phone: "", age_group_id: "", player_count: "", whatsapp_name: "", whatsapp_number: "", consent_rules: true, consent_photography: true });
    invalidateAll();
    toast.success("Team added");
  };

  const deleteGroup = async (groupId: string) => {
    // Unassign teams from this group first
    const teamsInGroup = teams?.filter(t => t.group_id === groupId) || [];
    if (teamsInGroup.length > 0) {
      for (const t of teamsInGroup) {
        await supabase.from("tournament_teams").update({ group_id: null }).eq("id", t.id);
      }
    }
    // Delete matches referencing this group
    await supabase.from("tournament_matches").delete().eq("group_id", groupId);
    await supabase.from("tournament_groups").delete().eq("id", groupId);
    invalidateAll();
    toast.success("Group deleted");
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
                <Button size="sm" variant="outline" onClick={notifyFixturesReady}><Megaphone className="h-4 w-4 mr-1" />Notify: Fixtures Ready</Button>
              </div>
            </div>
          )}

          {selectedTournament && (
            <Tabs defaultValue="age-groups" className="space-y-4">
              <TabsList className="grid w-full grid-cols-5 gap-1">
                <TabsTrigger value="age-groups">Age Groups</TabsTrigger>
                <TabsTrigger value="teams">Teams</TabsTrigger>
                <TabsTrigger value="groups">Groups</TabsTrigger>
                <TabsTrigger value="matches">Matches</TabsTrigger>
                <TabsTrigger value="changelog">Change Log</TabsTrigger>
              </TabsList>

              {/* AGE GROUPS TAB */}
              <TabsContent value="age-groups" className="space-y-4">
                <Button size="sm" onClick={() => { setEditingAgeGroupId(null); setAgeGroupForm({ age_group: "", max_teams: "", group_count: "2" }); setShowAddAgeGroup(true); }}><Plus className="h-4 w-4 mr-1" />Add Age Group</Button>
                <div className="grid md:grid-cols-3 gap-4">
                  {ageGroups?.map(ag => {
                    const agGroups = groups?.filter(g => g.age_group_id === ag.id) || [];
                    return (
                      <Card key={ag.id}>
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <CardTitle className="text-base">{ag.age_group}</CardTitle>
                              <CardDescription>{ag.max_teams ? `Max ${ag.max_teams} teams` : "No limit"} · {ag.group_count} groups</CardDescription>
                            </div>
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditAgeGroup(ag)}><Edit className="h-3.5 w-3.5" /></Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteAgeGroup(ag)}><Trash2 className="h-3.5 w-3.5" /></Button>
                            </div>
                          </div>
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
                <Button size="sm" onClick={() => setShowAddTeam(true)}><Plus className="h-4 w-4 mr-1" />Add Team</Button>
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
                                    <TableCell className="text-xs text-muted-foreground">expand →</TableCell>
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
                                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditTeam(team)}><Edit className="h-4 w-4" /></Button>
                                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteTeam(team.id, team.team_name)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
                          const isEditing = editingGroup?.id === g.id;
                          return (
                            <Card key={g.id}>
                              <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                  {isEditing ? (
                                    <div className="flex items-center gap-2 flex-1">
                                      <Input
                                        value={editingGroup.name}
                                        onChange={e => setEditingGroup({ ...editingGroup, name: e.target.value })}
                                        className="h-8 text-sm w-24"
                                        autoFocus
                                        onKeyDown={e => { if (e.key === "Enter") renameGroup(g.id, editingGroup.name); if (e.key === "Escape") setEditingGroup(null); }}
                                      />
                                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => renameGroup(g.id, editingGroup.name)}>
                                        <Check className="h-3.5 w-3.5 text-primary" />
                                      </Button>
                                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditingGroup(null)}>
                                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <CardTitle className="text-sm">Group {g.group_name}</CardTitle>
                                  )}
                                  {!isEditing && (
                                    <div className="flex items-center gap-1">
                                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditingGroup({ id: g.id, name: g.group_name })}>
                                        <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                                      </Button>
                                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { if (confirm(`Delete Group ${g.group_name}? Teams will be unassigned and group matches deleted.`)) deleteGroup(g.id); }}>
                                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-2">
                                {groupTeams.length === 0 ? (
                                  <p className="text-xs text-muted-foreground">No teams assigned yet.</p>
                                ) : (() => {
                                  const groupMatches = (matches || []).filter(m => m.group_id === g.id && m.status === "completed");
                                  const standings = groupTeams.map(team => {
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
                                  return (
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead className="text-xs">Team</TableHead>
                                          <TableHead className="text-center w-8 text-xs">P</TableHead>
                                          <TableHead className="text-center w-8 text-xs">W</TableHead>
                                          <TableHead className="text-center w-8 text-xs">D</TableHead>
                                          <TableHead className="text-center w-8 text-xs">L</TableHead>
                                          <TableHead className="text-center w-10 text-xs">GD</TableHead>
                                          <TableHead className="text-center w-10 text-xs font-bold">Pts</TableHead>
                                          <TableHead className="w-8"></TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {standings.map((s, i) => (
                                          <TableRow key={s.team.id} className={i === 0 ? "bg-primary/5" : ""}>
                                            <TableCell className="font-medium text-xs py-1.5">{s.team.team_name}</TableCell>
                                            <TableCell className="text-center text-xs py-1.5">{s.p}</TableCell>
                                            <TableCell className="text-center text-xs py-1.5">{s.w}</TableCell>
                                            <TableCell className="text-center text-xs py-1.5">{s.d}</TableCell>
                                            <TableCell className="text-center text-xs py-1.5">{s.l}</TableCell>
                                            <TableCell className="text-center text-xs py-1.5">{s.gd}</TableCell>
                                            <TableCell className="text-center text-xs py-1.5 font-bold">{s.pts}</TableCell>
                                            <TableCell className="py-1.5 pr-2">
                                              <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-6 w-6"
                                                title="Remove from group"
                                                onClick={() => assignTeamToGroup(s.team.id, null)}
                                              >
                                                <X className="h-3 w-3 text-destructive" />
                                              </Button>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  );
                                })()}
                                {(() => {
                                  const unassigned = agTeams.filter(t => !t.group_id);
                                  if (unassigned.length === 0) return null;
                                  return (
                                    <Select value="" onValueChange={(v) => assignTeamToGroup(v, g.id)}>
                                      <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="+ Add team" /></SelectTrigger>
                                      <SelectContent>
                                        {unassigned.map(t => <SelectItem key={t.id} value={t.id}>{t.team_name}</SelectItem>)}
                                      </SelectContent>
                                    </Select>
                                  );
                                })()}
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
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" onClick={() => setShowAddMatch(true)}><Plus className="h-4 w-4 mr-1" />Add Match</Button>
                  <Button size="sm" variant="outline" onClick={() => progressKnockouts(false)}><Trophy className="h-4 w-4 mr-1" />Progress Knockouts</Button>
                </div>
                {(() => {
                  const pitches = Array.from(new Set((matches || []).map(m => m.pitch).filter(Boolean))) as string[];
                  const days = Array.from(new Set((matches || []).map(m => m.match_time ? new Date(m.match_time).toISOString().slice(0, 10) : null).filter(Boolean))) as string[];
                  const stages = Array.from(new Set((matches || []).map(m => m.stage).filter(Boolean))) as string[];
                  const filtered = (matches || []).filter(m => {
                    if (matchFilterAge !== "all" && m.age_group_id !== matchFilterAge) return false;
                    if (matchFilterPitch !== "all" && (m.pitch || "") !== matchFilterPitch) return false;
                    if (matchFilterDay !== "all") {
                      const d = m.match_time ? new Date(m.match_time).toISOString().slice(0, 10) : "";
                      if (d !== matchFilterDay) return false;
                    }
                    if (matchFilterStage !== "all" && (m.stage || "") !== matchFilterStage) return false;
                    if (matchFilterStatus !== "all" && (m.status || "scheduled") !== matchFilterStatus) return false;
                    return true;
                  });
                  const hasFilter = matchFilterAge !== "all" || matchFilterPitch !== "all" || matchFilterDay !== "all" || matchFilterStage !== "all" || matchFilterStatus !== "all";
                  return (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        <Select value={matchFilterAge} onValueChange={setMatchFilterAge}>
                          <SelectTrigger><SelectValue placeholder="Age group" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All age groups</SelectItem>
                            {ageGroups?.map(ag => <SelectItem key={ag.id} value={ag.id}>{ag.age_group}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Select value={matchFilterPitch} onValueChange={setMatchFilterPitch}>
                          <SelectTrigger><SelectValue placeholder="Pitch" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All pitches</SelectItem>
                            {pitches.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Select value={matchFilterDay} onValueChange={setMatchFilterDay}>
                          <SelectTrigger><SelectValue placeholder="Day" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All days</SelectItem>
                            {days.sort().map(d => <SelectItem key={d} value={d}>{new Date(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Select value={matchFilterStage} onValueChange={setMatchFilterStage}>
                          <SelectTrigger><SelectValue placeholder="Stage" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All stages</SelectItem>
                            {stages.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Select value={matchFilterStatus} onValueChange={setMatchFilterStatus}>
                          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {hasFilter && (
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>Showing {filtered.length} of {matches?.length ?? 0} matches</span>
                          <Button size="sm" variant="ghost" onClick={() => { setMatchFilterAge("all"); setMatchFilterPitch("all"); setMatchFilterDay("all"); setMatchFilterStage("all"); setMatchFilterStatus("all"); }}>Clear filters</Button>
                        </div>
                      )}
                      {filtered.length > 0 ? (
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
                              <TableHead>Referee</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filtered.map(m => (
                              <MatchRow
                                key={m.id}
                                match={m}
                                teams={teams || []}
                                groups={groups || []}
                                getTeamName={getTeamName}
                                getAgeGroupName={getAgeGroupName}
                                onUpdateScore={updateScore}
                                onClearScore={clearScore}
                                onUpdateMatch={updateMatch}
                                onDelete={deleteMatch}
                                onReset={resetMatch}
                              />
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <Card><CardContent className="pt-6 text-center text-muted-foreground">{hasFilter ? "No matches match the selected filters" : "No matches created yet"}</CardContent></Card>
                      )}
                    </>
                  );
                })()}
              </TabsContent>

              {/* CHANGE LOG TAB */}
              <TabsContent value="changelog" className="space-y-4">
                <ChangeLogTab />
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
      <Dialog open={showAddAgeGroup} onOpenChange={(o) => { setShowAddAgeGroup(o); if (!o) { setEditingAgeGroupId(null); setAgeGroupForm({ age_group: "", max_teams: "", group_count: "2" }); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingAgeGroupId ? "Edit Age Group" : "Add Age Group"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Age Group (e.g. U7s, U8s)</Label><Input value={ageGroupForm.age_group} onChange={e => setAgeGroupForm(f => ({ ...f, age_group: e.target.value }))} /></div>
            <div><Label>Max Teams</Label><Input type="number" value={ageGroupForm.max_teams} onChange={e => setAgeGroupForm(f => ({ ...f, max_teams: e.target.value }))} /></div>
            <div><Label>Number of Groups</Label><Input type="number" min={1} max={8} value={ageGroupForm.group_count} onChange={e => setAgeGroupForm(f => ({ ...f, group_count: e.target.value }))} /></div>
            <Button onClick={addAgeGroup} className="w-full">{editingAgeGroupId ? "Save Changes" : "Add Age Group"}</Button>
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
                  <SelectItem value="semi-final">Semi Final</SelectItem>
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
            <div><Label>Referee</Label><Input value={matchForm.referee} onChange={e => setMatchForm(f => ({ ...f, referee: e.target.value }))} placeholder="e.g. John Smith" /></div>
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
      {/* ADD TEAM DIALOG */}
      <Dialog open={showAddTeam} onOpenChange={setShowAddTeam}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Team Manually</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Age Group *</Label>
              <Select value={teamForm.age_group_id} onValueChange={v => setTeamForm(f => ({ ...f, age_group_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select age group" /></SelectTrigger>
                <SelectContent>
                  {ageGroups?.map(ag => <SelectItem key={ag.id} value={ag.id}>{ag.age_group}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Team Name *</Label>
              <Input value={teamForm.team_name} onChange={e => setTeamForm(f => ({ ...f, team_name: e.target.value }))} placeholder="e.g. Oakham Lions" />
            </div>
            <div>
              <Label>Club Name</Label>
              <Input value={teamForm.club_name} onChange={e => setTeamForm(f => ({ ...f, club_name: e.target.value }))} placeholder="e.g. Oakham FC" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Manager Name *</Label>
                <Input value={teamForm.manager_name} onChange={e => setTeamForm(f => ({ ...f, manager_name: e.target.value }))} placeholder="Full name" />
              </div>
              <div>
                <Label>Manager Email *</Label>
                <Input type="email" value={teamForm.manager_email} onChange={e => setTeamForm(f => ({ ...f, manager_email: e.target.value }))} placeholder="email@example.com" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Manager Phone</Label>
                <Input value={teamForm.manager_phone} onChange={e => setTeamForm(f => ({ ...f, manager_phone: e.target.value }))} placeholder="Optional" />
              </div>
              <div>
                <Label>Player Count</Label>
                <Input type="number" value={teamForm.player_count} onChange={e => setTeamForm(f => ({ ...f, player_count: e.target.value }))} placeholder="e.g. 10" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>WhatsApp Name</Label>
                <Input value={teamForm.whatsapp_name} onChange={e => setTeamForm(f => ({ ...f, whatsapp_name: e.target.value }))} placeholder="Contact name" />
              </div>
              <div>
                <Label>WhatsApp Number</Label>
                <Input value={teamForm.whatsapp_number} onChange={e => setTeamForm(f => ({ ...f, whatsapp_number: e.target.value }))} placeholder="e.g. 07700123456" />
              </div>
            </div>
            <div className="flex items-center gap-6 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={teamForm.consent_rules} onChange={e => setTeamForm(f => ({ ...f, consent_rules: e.target.checked }))} className="rounded border-border" />
                <span className="text-sm">Rules Consent</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={teamForm.consent_photography} onChange={e => setTeamForm(f => ({ ...f, consent_photography: e.target.checked }))} className="rounded border-border" />
                <span className="text-sm">Photography Consent</span>
              </label>
            </div>
            <Button onClick={addTeam} className="w-full">Add Team</Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* EDIT TEAM DIALOG */}
      <Dialog open={!!editingTeam} onOpenChange={open => { if (!open) setEditingTeam(null); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Team</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Team Name *</Label>
              <Input value={editTeamForm.team_name} onChange={e => setEditTeamForm(f => ({ ...f, team_name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Club Name</Label>
                <Input value={editTeamForm.club_name} onChange={e => setEditTeamForm(f => ({ ...f, club_name: e.target.value }))} />
              </div>
              <div>
                <Label>County</Label>
                <Input value={editTeamForm.county} onChange={e => setEditTeamForm(f => ({ ...f, county: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Org ID</Label>
                <Input value={editTeamForm.club_org_id} onChange={e => setEditTeamForm(f => ({ ...f, club_org_id: e.target.value }))} />
              </div>
              <div>
                <Label>League / Division</Label>
                <Input value={editTeamForm.league_division} onChange={e => setEditTeamForm(f => ({ ...f, league_division: e.target.value }))} />
              </div>
              <div>
                <Label>Category</Label>
                <Input value={editTeamForm.team_category} onChange={e => setEditTeamForm(f => ({ ...f, team_category: e.target.value }))} placeholder="e.g. boys" />
              </div>
            </div>
            <div className="border-t border-border pt-3">
              <p className="text-xs font-display font-bold uppercase tracking-wider text-muted-foreground mb-2">Manager</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Name *</Label>
                  <Input value={editTeamForm.manager_name} onChange={e => setEditTeamForm(f => ({ ...f, manager_name: e.target.value }))} />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input type="email" value={editTeamForm.manager_email} onChange={e => setEditTeamForm(f => ({ ...f, manager_email: e.target.value }))} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={editTeamForm.manager_phone} onChange={e => setEditTeamForm(f => ({ ...f, manager_phone: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="border-t border-border pt-3">
              <p className="text-xs font-display font-bold uppercase tracking-wider text-muted-foreground mb-2">Secretary</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Name</Label>
                  <Input value={editTeamForm.secretary_name} onChange={e => setEditTeamForm(f => ({ ...f, secretary_name: e.target.value }))} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={editTeamForm.secretary_email} onChange={e => setEditTeamForm(f => ({ ...f, secretary_email: e.target.value }))} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={editTeamForm.secretary_phone} onChange={e => setEditTeamForm(f => ({ ...f, secretary_phone: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="border-t border-border pt-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-display font-bold uppercase tracking-wider text-muted-foreground">WhatsApp Contacts</p>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditTeamForm(f => ({ ...f, whatsapp_contacts: [...f.whatsapp_contacts, { name: "", number: "" }] }))}>+ Add</Button>
              </div>
              {editTeamForm.whatsapp_contacts.map((c, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 mb-2">
                  <Input placeholder="Name" value={c.name} onChange={e => { const next = [...editTeamForm.whatsapp_contacts]; next[i] = { ...next[i], name: e.target.value }; setEditTeamForm(f => ({ ...f, whatsapp_contacts: next })); }} />
                  <Input placeholder="Number" value={c.number} onChange={e => { const next = [...editTeamForm.whatsapp_contacts]; next[i] = { ...next[i], number: e.target.value }; setEditTeamForm(f => ({ ...f, whatsapp_contacts: next })); }} />
                  {editTeamForm.whatsapp_contacts.length > 1 && (
                    <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => setEditTeamForm(f => ({ ...f, whatsapp_contacts: f.whatsapp_contacts.filter((_, idx) => idx !== i) }))}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                  )}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Player Count</Label>
                <Input type="number" value={editTeamForm.player_count} onChange={e => setEditTeamForm(f => ({ ...f, player_count: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-6 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editTeamForm.consent_rules} onChange={e => setEditTeamForm(f => ({ ...f, consent_rules: e.target.checked }))} className="rounded border-border" />
                <span className="text-sm">Rules Consent</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editTeamForm.consent_photography} onChange={e => setEditTeamForm(f => ({ ...f, consent_photography: e.target.checked }))} className="rounded border-border" />
                <span className="text-sm">Photography Consent</span>
              </label>
            </div>
            <Button onClick={saveEditTeam} className="w-full">Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Match row component with full inline editing
function MatchRow({ match, teams, groups, getTeamName, getAgeGroupName, onUpdateScore, onClearScore, onUpdateMatch, onDelete, onReset }: {
  match: any;
  teams: any[];
  groups: any[];
  getTeamName: (id: string) => string;
  getAgeGroupName: (id: string) => string;
  onUpdateScore: (id: string, h: number, a: number) => void;
  onClearScore: (id: string) => void;
  onUpdateMatch: (id: string, fields: Record<string, any>) => void;
  onDelete: (id: string) => void;
  onReset: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [h, setH] = useState(match.home_score?.toString() || "0");
  const [a, setA] = useState(match.away_score?.toString() || "0");
  const [referee, setReferee] = useState(match.referee || "");
  const [pitch, setPitch] = useState(match.pitch || "");
  const [matchTime, setMatchTime] = useState(
    match.match_time ? new Date(new Date(match.match_time).getTime() - new Date(match.match_time).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""
  );
  const [homeTeamId, setHomeTeamId] = useState(match.home_team_id || "");
  const [awayTeamId, setAwayTeamId] = useState(match.away_team_id || "");
  const [stage, setStage] = useState(match.stage || "group");

  const ageTeams = teams.filter(t => t.age_group_id === match.age_group_id && t.status === "confirmed");

  const saveAll = () => {
    const fields: Record<string, any> = {
      referee: referee.trim() || null,
      pitch: pitch.trim() || null,
      match_time: matchTime ? new Date(matchTime).toISOString() : null,
      home_team_id: homeTeamId || null,
      away_team_id: awayTeamId || null,
      stage,
    };
    const hNum = h === "" ? null : parseInt(h);
    const aNum = a === "" ? null : parseInt(a);
    if (hNum !== null && aNum !== null && !Number.isNaN(hNum) && !Number.isNaN(aNum)) {
      fields.home_score = hNum;
      fields.away_score = aNum;
      fields.status = "completed";
    }
    onUpdateMatch(match.id, fields);
    setEditing(false);
  };

  return (
    <>
      <TableRow>
        <TableCell className="text-xs">{getAgeGroupName(match.age_group_id)}</TableCell>
        <TableCell><Badge variant="outline" className="text-xs capitalize">{match.stage}</Badge></TableCell>
        <TableCell className="text-xs font-medium">{getTeamName(match.home_team_id)}</TableCell>
        <TableCell className="text-center">
          <div className="flex items-center gap-1 justify-center">
            <span className="text-xs">{match.status === "completed" ? `${match.home_score} - ${match.away_score}` : "vs"}</span>
            {match.status === "completed" && (
              <Button size="icon" variant="ghost" className="h-6 w-6" title="Clear score" onClick={() => onClearScore(match.id)}>
                <X className="h-3 w-3 text-destructive" />
              </Button>
            )}
          </div>
        </TableCell>
        <TableCell className="text-xs font-medium">{getTeamName(match.away_team_id)}</TableCell>
        <TableCell className="text-xs">{match.match_time ? new Date(match.match_time).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}</TableCell>
        <TableCell className="text-xs">{match.pitch || "—"}</TableCell>
        <TableCell className="text-xs">{match.referee || "—"}</TableCell>
        <TableCell>
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(!editing)} title="Edit"><Edit className="h-3 w-3" /></Button>
            {match.stage && match.stage !== "group" && (
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onReset(match.id)} title="Reset teams to TBC"><RotateCcw className="h-3 w-3 text-amber-500" /></Button>
            )}
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onDelete(match.id)} title="Delete"><Trash2 className="h-3 w-3 text-red-500" /></Button>
          </div>
        </TableCell>
      </TableRow>
      {editing && (
        <TableRow>
          <TableCell colSpan={9} className="bg-muted/30">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-2">
              <div>
                <Label className="text-[10px] text-muted-foreground">Stage</Label>
                <Select value={stage} onValueChange={setStage}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="group">Group</SelectItem>
                    <SelectItem value="semi-final">Semi Final</SelectItem>
                    <SelectItem value="final">Final</SelectItem>
                    <SelectItem value="3rd-place">3rd Place</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Home Team</Label>
                <Select value={homeTeamId} onValueChange={setHomeTeamId}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ageTeams.map(t => <SelectItem key={t.id} value={t.id}>{t.team_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Away Team</Label>
                <Select value={awayTeamId} onValueChange={setAwayTeamId}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ageTeams.filter(t => t.id !== homeTeamId).map(t => <SelectItem key={t.id} value={t.id}>{t.team_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Time</Label>
                <Input type="datetime-local" className="h-8 text-xs" value={matchTime} onChange={e => setMatchTime(e.target.value)} />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Pitch</Label>
                <Input className="h-8 text-xs" value={pitch} onChange={e => setPitch(e.target.value)} placeholder="e.g. 1" />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Referee</Label>
                <Input className="h-8 text-xs" value={referee} onChange={e => setReferee(e.target.value)} placeholder="Referee name" />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Score</Label>
                <div className="flex items-center gap-1">
                  <Input type="number" min={0} className="h-8 text-xs w-14" value={h} onChange={e => setH(e.target.value)} />
                  <span className="text-xs">-</span>
                  <Input type="number" min={0} className="h-8 text-xs w-14" value={a} onChange={e => setA(e.target.value)} />
                </div>
              </div>
              <div className="flex items-end gap-2">
                <Button size="sm" className="h-8" onClick={saveAll}>Save</Button>
                <Button size="sm" variant="outline" className="h-8" onClick={() => { onClearScore(match.id); setH("0"); setA("0"); }}>Clear Score</Button>
                <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export default TournamentAdminPage;
