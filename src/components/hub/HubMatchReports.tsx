import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MatchReportCard, type MatchReport, type POTMAward } from "@/components/MatchReportCard";
import { CLUB_TEAMS } from "@/lib/teamConfig";
import { ClipboardList } from "lucide-react";

export function HubMatchReports({ teamSlug }: { teamSlug: string }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const teamName = CLUB_TEAMS.find((t) => t.slug === teamSlug)?.name || "";

  const { data: reports, isLoading } = useQuery({
    queryKey: ["hub-match-reports", teamSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("match_reports")
        .select("*")
        .eq("team_name", `Peterborough Athletic ${teamName}`)
        .order("match_date", { ascending: false });
      if (error) throw error;
      return data as MatchReport[];
    },
    enabled: !!teamName,
  });

  const { data: potmAwards } = useQuery({
    queryKey: ["hub-potm-awards", teamSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("player_of_the_match")
        .select("*")
        .eq("age_group", teamName);
      if (error) throw error;
      return data as POTMAward[];
    },
    enabled: !!teamName,
  });

  const findPOTM = (report: MatchReport) =>
    potmAwards?.filter(
      (p) => p.age_group === report.age_group && p.award_date === report.match_date
    ) || [];

  if (isLoading) {
    return <p className="text-muted-foreground text-center py-12">Loading match reports...</p>;
  }

  if (!reports?.length) {
    return (
      <div className="text-center py-12 space-y-2">
        <ClipboardList className="h-10 w-10 text-muted-foreground/40 mx-auto" />
        <p className="text-muted-foreground">No match reports yet for this team.</p>
        <p className="text-xs text-muted-foreground/60">
          Reports submitted by your coach will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <MatchReportCard
          key={report.id}
          report={report}
          potmPlayers={findPOTM(report)}
          expanded={expandedId === report.id}
          onToggle={() => setExpandedId(expandedId === report.id ? null : report.id)}
        />
      ))}
    </div>
  );
}
