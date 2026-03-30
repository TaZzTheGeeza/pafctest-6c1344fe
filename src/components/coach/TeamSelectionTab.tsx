import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useTeamRoster } from "@/hooks/useTeamRoster";
import { notifyTeamMembers } from "@/lib/notifyTeamMembers";
import type { FAFixture } from "@/hooks/useTeamFixtures";

export function TeamSelectionTab({
  teamSlug, opponent, fixture,
}: {
  teamSlug: string; opponent: string; fixture: FAFixture;
}) {
  const { data: roster = [] } = useTeamRoster(teamSlug);
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [formation, setFormation] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: existing } = useQuery({
    queryKey: ["team-selection", teamSlug, fixture.date, opponent],
    queryFn: async () => {
      const { data } = await supabase
        .from("team_selections")
        .select("*")
        .eq("team_slug", teamSlug)
        .eq("fixture_date", fixture.date)
        .eq("opponent", opponent)
        .maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (existing) {
      const parsed = existing.players as string[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Match saved names to roster IDs
        const ids = new Set<string>();
        for (const name of parsed) {
          const match = roster.find(r => r.first_name === name || r.id === name);
          if (match) ids.add(match.id);
        }
        setSelectedIds(ids);
      }
      if (existing.formation) setFormation(existing.formation);
      if (existing.notes) setNotes(existing.notes);
    }
  }, [existing, roster]);

  const togglePlayer = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSave = async () => {
    if (selectedIds.size === 0) { toast.error("Select at least one player"); return; }
    setSaving(true);
    try {
      const selectedPlayers = roster
        .filter(r => selectedIds.has(r.id))
        .map(r => r.first_name);

      const payload = {
        team_slug: teamSlug,
        fixture_date: fixture.date,
        opponent,
        players: selectedPlayers,
        formation: formation || null,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        const { error } = await supabase.from("team_selections").update(payload).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("team_selections").insert(payload);
        if (error) throw error;
      }

      // Save appearances to match_player_stats
      const [d, m, y] = fixture.date.split("/");
      const matchDate = y.length === 4 ? `${y}-${m}-${d}` : `20${y}-${m}-${d}`;

      const appearanceStats = Array.from(selectedIds).map(playerId => ({
        player_stat_id: playerId,
        team_slug: teamSlug,
        match_date: matchDate,
        opponent,
        appeared: true,
        goals: 0,
        assists: 0,
        potm: false,
      }));

      const { error: statsError } = await supabase
        .from("match_player_stats")
        .upsert(appearanceStats, { onConflict: "player_stat_id,match_date,opponent" });
      if (statsError) throw statsError;

      queryClient.invalidateQueries({ queryKey: ["team-roster"] });
      queryClient.invalidateQueries({ queryKey: ["team-selection", teamSlug, fixture.date, opponent] });

      // Notify team members
      notifyTeamMembers({
        teamSlug,
        notification: {
          title: "Squad Announced",
          message: `Team selection published for vs ${opponent}`,
          type: "info",
          link: "/hub?tab=availability",
        },
        email: {
          templateName: "team-selection-published",
          templateData: {
            opponent,
            fixtureDate: fixture.date,
            formation: formation || undefined,
            teamName: teamSlug,
            playerCount: selectedIds.size,
          },
          idempotencyPrefix: `team-sel-${teamSlug}-${fixture.date}-${opponent}`,
        },
      });

      toast.success("Squad & appearances saved!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 pt-2">
      <div>
        <Label className="text-xs">Formation</Label>
        <Select value={formation} onValueChange={setFormation}>
          <SelectTrigger><SelectValue placeholder="Select formation" /></SelectTrigger>
          <SelectContent>
            {["4-4-2", "4-3-3", "3-5-2", "4-2-3-1", "3-4-3", "5-3-2", "4-5-1"].map((f) => (
              <SelectItem key={f} value={f}>{f}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs">Select Squad ({selectedIds.size} selected)</Label>
        </div>
        {roster.length === 0 ? (
          <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 rounded-md p-2">
            ⚠️ No players in roster. Add players via the Coach Panel first.
          </p>
        ) : (
          <div className="space-y-1 max-h-52 overflow-y-auto border border-border rounded-md p-2">
            {roster.map((p) => (
              <label
                key={p.id}
                className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                  selectedIds.has(p.id) ? "bg-primary/10" : "hover:bg-secondary/50"
                }`}
              >
                <Checkbox
                  checked={selectedIds.has(p.id)}
                  onCheckedChange={() => togglePlayer(p.id)}
                />
                <span className="text-xs text-muted-foreground w-6 text-right font-mono">
                  {p.shirt_number ?? "-"}
                </span>
                <span className="text-sm font-medium">{p.first_name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div>
        <Label className="text-xs">Squad Notes</Label>
        <Textarea
          placeholder="Substitutions, positioning notes..."
          value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
        />
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Users className="h-4 w-4 mr-2" />}
        Save Squad & Record Appearances
      </Button>
    </div>
  );
}
