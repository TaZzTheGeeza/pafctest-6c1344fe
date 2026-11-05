import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { faTeamConfigs } from "@/lib/faFixtureConfig";
import type { FAFixture } from "@/hooks/useTeamFixtures";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from "@/components/ui/alert-dialog";

export function DeleteFixtureButton({ teamSlug, fixture }: { teamSlug: string; fixture: FAFixture }) {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const config = faTeamConfigs.find((team) => team.slug === teamSlug);
  if (!isAdmin || !user || !config?.fixtureUrl) return null;

  const remove = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("fa_fixture_exclusions").insert({
        fixture_url: config.fixtureUrl, fixture_date: fixture.date,
        home_team: fixture.homeTeam, away_team: fixture.awayTeam, created_by: user.id,
      });
      if (error && error.code !== "23505") throw error;
      await queryClient.invalidateQueries({ queryKey: ["fa-fixtures"] });
      await queryClient.invalidateQueries({ queryKey: ["report-tracker"] });
      setOpen(false);
      toast.success("Fixture deleted");
    } catch {
      toast.error("Could not delete this fixture. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return <>
    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" title="Delete fixture" aria-label="Delete fixture" onClick={() => setOpen(true)}><Trash2 className="h-3.5 w-3.5" /></Button>
    <AlertDialog open={open} onOpenChange={(value) => { if (!saving) setOpen(value); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this fixture?</AlertDialogTitle>
          <AlertDialogDescription>{fixture.homeTeam} vs {fixture.awayTeam} on {fixture.date}. This removes the fixture from the club website and keeps it removed when the FA list refreshes. It does not change FA Full-Time or calendars already downloaded.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" disabled={saving} onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="destructive" disabled={saving} onClick={remove}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}Delete fixture</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>;
}