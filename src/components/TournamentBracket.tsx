import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";

interface Match {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
  stage: string;
  pitch: string | null;
  age_group_id: string;
}

interface TournamentBracketProps {
  matches: Match[];
  getTeamName: (id: string) => string;
  ageGroupLabel: string;
}

const MatchCard = ({ match, getTeamName, isFinal }: { match: Match; getTeamName: (id: string) => string; isFinal?: boolean }) => {
  const completed = match.status === "completed";
  const homeWin = completed && (match.home_score ?? 0) > (match.away_score ?? 0);
  const awayWin = completed && (match.away_score ?? 0) > (match.home_score ?? 0);

  return (
    <div className={`rounded-lg border overflow-hidden text-xs ${isFinal ? "border-primary shadow-md" : "border-border"}`}>
      {isFinal && (
        <div className="bg-primary text-primary-foreground text-center text-[10px] font-bold py-0.5 tracking-wider uppercase flex items-center justify-center gap-1">
          <Trophy className="h-3 w-3" /> Final
        </div>
      )}
      <div className={`flex items-center justify-between px-2.5 py-1.5 border-b border-border ${homeWin ? "bg-primary/10 font-bold" : "bg-card"}`}>
        <span className="truncate flex-1 mr-2">{getTeamName(match.home_team_id)}</span>
        <span className="font-mono font-bold tabular-nums">{completed ? match.home_score : "-"}</span>
      </div>
      <div className={`flex items-center justify-between px-2.5 py-1.5 ${awayWin ? "bg-primary/10 font-bold" : "bg-card"}`}>
        <span className="truncate flex-1 mr-2">{getTeamName(match.away_team_id)}</span>
        <span className="font-mono font-bold tabular-nums">{completed ? match.away_score : "-"}</span>
      </div>
    </div>
  );
};

export const TournamentBracket = ({ matches, getTeamName, ageGroupLabel }: TournamentBracketProps) => {
  const semis = matches.filter(m => m.stage === "semi");
  const final_ = matches.find(m => m.stage === "final");
  const thirdPlace = matches.find(m => m.stage === "3rd-place");

  if (semis.length === 0 && !final_) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-muted-foreground">{ageGroupLabel}</h4>

      {/* Bracket layout */}
      <div className="relative flex items-center justify-center gap-0 overflow-x-auto py-2">
        {/* Semi Finals Column */}
        <div className="flex flex-col justify-center gap-8 min-w-[160px] md:min-w-[200px]">
          {semis[0] && <MatchCard match={semis[0]} getTeamName={getTeamName} />}
          {semis[1] && <MatchCard match={semis[1]} getTeamName={getTeamName} />}
        </div>

        {/* Connector lines */}
        <div className="relative w-8 md:w-12 flex-shrink-0">
          <svg viewBox="0 0 40 120" className="w-full h-[120px] text-border" preserveAspectRatio="none">
            {/* Top semi to center */}
            <path d="M 0 25 L 15 25 L 15 60 L 40 60" fill="none" stroke="currentColor" strokeWidth="2" />
            {/* Bottom semi to center */}
            <path d="M 0 95 L 15 95 L 15 60 L 40 60" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>

        {/* Final Column */}
        <div className="min-w-[160px] md:min-w-[200px] flex flex-col justify-center">
          {final_ ? (
            <MatchCard match={final_} getTeamName={getTeamName} isFinal />
          ) : (
            <div className="rounded-lg border border-dashed border-muted-foreground/30 px-3 py-4 text-center text-xs text-muted-foreground">
              Final TBC
            </div>
          )}
        </div>
      </div>

      {/* 3rd place */}
      {thirdPlace && (
        <div className="max-w-[200px] mx-auto mt-2">
          <p className="text-[10px] text-muted-foreground text-center mb-1 uppercase tracking-wider font-semibold">3rd Place</p>
          <MatchCard match={thirdPlace} getTeamName={getTeamName} />
        </div>
      )}
    </div>
  );
};
