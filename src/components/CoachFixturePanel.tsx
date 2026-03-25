import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, Trophy, Users, FileText } from "lucide-react";
import type { FAFixture } from "@/hooks/useTeamFixtures";
import { MatchReportTab } from "@/components/coach/MatchReportTab";
import { POTMTab } from "@/components/coach/POTMTab";
import { TeamSelectionTab } from "@/components/coach/TeamSelectionTab";
import { TrainingNotesTab } from "@/components/coach/TrainingNotesTab";

interface CoachFixturePanelProps {
  open: boolean;
  onClose: () => void;
  fixture: FAFixture;
  teamSlug: string;
  teamName: string;
}

export function CoachFixturePanel({ open, onClose, fixture, teamSlug, teamName }: CoachFixturePanelProps) {
  const isResult = fixture.type === "result";
  const isHome = fixture.homeTeam.includes("Peterborough Ath");
  const opponent = isHome ? fixture.awayTeam : fixture.homeTeam;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">
            <span className="text-primary">{teamName}</span> vs {opponent}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">{fixture.date} · {fixture.time} · {fixture.venue || "TBC"}</p>
        </DialogHeader>

        <Tabs defaultValue={isResult ? "report" : "selection"} className="mt-2">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="report" className="text-xs gap-1">
              <ClipboardList className="h-3 w-3" />Report
            </TabsTrigger>
            <TabsTrigger value="potm" className="text-xs gap-1">
              <Trophy className="h-3 w-3" />POTM
            </TabsTrigger>
            <TabsTrigger value="selection" className="text-xs gap-1">
              <Users className="h-3 w-3" />Squad
            </TabsTrigger>
            <TabsTrigger value="notes" className="text-xs gap-1">
              <FileText className="h-3 w-3" />Notes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="report">
            <MatchReportTab
              teamSlug={teamSlug}
              teamName={teamName}
              opponent={opponent}
              fixture={fixture}
              isHome={isHome}
            />
          </TabsContent>

          <TabsContent value="potm">
            <POTMTab
              teamSlug={teamSlug}
              teamName={teamName}
              opponent={opponent}
              fixture={fixture}
            />
          </TabsContent>

          <TabsContent value="selection">
            <TeamSelectionTab
              teamSlug={teamSlug}
              opponent={opponent}
              fixture={fixture}
            />
          </TabsContent>

          <TabsContent value="notes">
            <TrainingNotesTab
              teamSlug={teamSlug}
              opponent={opponent}
              fixture={fixture}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
