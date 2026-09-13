import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { SEO } from "@/components/SEO";
import { MatchReportCard, type MatchReport, type POTMAward } from "@/components/MatchReportCard";
import { MatchReportEditDialog } from "@/components/MatchReportEditDialog";

const CURRENT_SEASON = "2026/27";

const ResultsPage = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterTeam, setFilterTeam] = useState<string>("all");
  const [season, setSeason] = useState<string>(CURRENT_SEASON);
  const { user, isCoach, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState<MatchReport | null>(null);

  const canManage = (report: MatchReport) =>
    season === CURRENT_SEASON &&
    (isAdmin || (isCoach && !!user && report.created_by === user.id));

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["match-reports-public"] });

  const handleDelete = async (report: MatchReport) => {
    if (!confirm("Delete this match report? This cannot be undone.")) return;
    const { error } = await supabase.from("match_reports").delete().eq("id", report.id);
    if (error) {
      toast.error(error.message || "Failed to delete report");
      return;
    }
    toast.success("Match report deleted");
    refresh();
  };

  const { data: reports, isLoading } = useQuery({
    queryKey: ["match-reports-public", season],
    queryFn: async () => {
      if (season === CURRENT_SEASON) {
        const { data, error } = await supabase
          .from("match_reports")
          .select("*")
          .order("match_date", { ascending: false });
        if (error) throw error;
        return data as MatchReport[];
      }
      const { data, error } = await supabase
        .from("match_reports_history")
        .select("*")
        .eq("season", season)
        .order("match_date", { ascending: false });
      if (error) throw error;
      return data as MatchReport[];
    },
  });

  const { data: archivedSeasons } = useQuery({
    queryKey: ["match-reports-seasons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("match_reports_history")
        .select("season");
      if (error) throw error;
      const unique = [...new Set((data || []).map((r: any) => r.season as string))];
      return unique.sort().reverse();
    },
  });

  const { data: potmAwards } = useQuery({
    queryKey: ["potm-awards-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("player_of_the_match")
        .select("*");
      if (error) throw error;
      return data as POTMAward[];
    },
  });

  const teamNames = [...new Set(reports?.map((r) => r.team_name) || [])].sort();
  const filtered = filterTeam === "all"
    ? reports
    : reports?.filter((r) => r.team_name === filterTeam);

  const findPOTM = (report: MatchReport) =>
    potmAwards?.filter(
      (p) =>
        p.age_group === report.age_group &&
        p.award_date === report.match_date
      ) || [];

  return (
    <div className="min-h-screen flex flex-col">
      <SEO title="Results & Match Reports | Peterborough Athletic FC" description="Latest match results, reports and Player of the Match awards from Peterborough Athletic FC teams U6-U16." keywords="Peterborough Athletic FC results, PAFC match reports, Peterborough junior football results, player of the match Peterborough" path="/results" />
      <Navbar />
      <main className="flex-1 pt-28 pb-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            <span className="text-gold-gradient">Match</span> Results
          </h1>
          <p className="text-muted-foreground mb-8">Season {season}</p>

          {/* Filters */}
          <div className="mb-6 flex flex-wrap gap-3">
            <Select value={season} onValueChange={setSeason}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Season" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={CURRENT_SEASON}>{CURRENT_SEASON} (Current)</SelectItem>
                {archivedSeasons?.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterTeam} onValueChange={setFilterTeam}>
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="Team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {teamNames.map((tn) => (
                  <SelectItem key={tn} value={tn}>{tn}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <p className="text-muted-foreground text-center py-12">Loading results...</p>
          ) : !filtered?.length ? (
            <p className="text-muted-foreground text-center py-12">
              {season === CURRENT_SEASON
                ? "No results submitted yet for this season."
                : `No results archived for ${season}.`}
            </p>
          ) : (
            <div className="space-y-3">
              {filtered.map((report) => (
                <MatchReportCard
                  key={report.id}
                  report={report}
                  potmPlayers={findPOTM(report)}
                  expanded={expandedId === report.id}
                  onToggle={() => setExpandedId(expandedId === report.id ? null : report.id)}
                  canEdit={canManage(report)}
                  onEdit={setEditing}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <MatchReportEditDialog
        report={editing}
        onClose={() => setEditing(null)}
        onSaved={refresh}
      />

      <Footer />
    </div>
  );
};

export default ResultsPage;
