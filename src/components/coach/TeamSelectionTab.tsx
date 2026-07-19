import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Save, Send, Presentation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useTeamRoster } from "@/hooks/useTeamRoster";
import { notifyTeamMembers } from "@/lib/notifyTeamMembers";
import type { FAFixture } from "@/hooks/useTeamFixtures";
import { FormationBuilder, type PositionEntry } from "@/components/coach/FormationBuilder";
import { formatForTeam, getFormationsForFormat, type FormationFormat } from "@/lib/formations";

export function TeamSelectionTab({
  teamSlug, opponent, fixture,
}: {
  teamSlug: string; opponent: string; fixture: FAFixture;
}) {
  const { data: roster = [] } = useTeamRoster(teamSlug);
  const queryClient = useQueryClient();

  const defaultFormat = useMemo(() => formatForTeam(teamSlug), [teamSlug]);
  const [format, setFormat] = useState<FormationFormat>(defaultFormat);
  const [formationName, setFormationName] = useState<string>(
    getFormationsForFormat(defaultFormat)[0]?.name ?? ""
  );
  const [positions, setPositions] = useState<PositionEntry[]>([]);
  const [captainId, setCaptainId] = useState<string | null>(null);
  const [viceCaptainId, setViceCaptainId] = useState<string | null>(null);
  const [oppositionFormation, setOppositionFormation] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

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
    if (!existing) return;
    const rec = existing as any;
    if (rec.formation_format) setFormat(rec.formation_format as FormationFormat);
    if (rec.formation) setFormationName(rec.formation);
    if (Array.isArray(rec.positions)) setPositions(rec.positions as PositionEntry[]);
    else if (Array.isArray(rec.players)) {
      // legacy migration: names → bench-only entries
      const legacy: PositionEntry[] = [];
      for (const name of rec.players as string[]) {
        const match = roster.find((r) => r.first_name === name || r.id === name);
        if (match) legacy.push({ player_id: match.id, slot_id: "", role: "sub" });
      }
      setPositions(legacy);
    }
    if (rec.captain_id) setCaptainId(rec.captain_id);
    if (rec.vice_captain_id) setViceCaptainId(rec.vice_captain_id);
    if (rec.opposition_formation) setOppositionFormation(rec.opposition_formation);
    if (rec.notes) setNotes(rec.notes);
  }, [existing, roster]);

  const buildPayload = (status: "draft" | "published") => {
    // legacy `players` column: keep in sync with names of everyone in squad
    const legacyNames = positions
      .map((p) => p.guest_name || roster.find((r) => r.id === p.player_id)?.first_name)
      .filter(Boolean) as string[];

    return {
      team_slug: teamSlug,
      fixture_date: fixture.date,
      opponent,
      players: legacyNames,
      positions: positions as any,
      formation: formationName || null,
      formation_format: format,
      opposition_formation: oppositionFormation || null,
      captain_id: captainId,
      vice_captain_id: viceCaptainId,
      status,
      published_at: status === "published" ? new Date().toISOString() : null,
      notes: notes || null,
      updated_at: new Date().toISOString(),
    };
  };

  const persist = async (status: "draft" | "published") => {
    if (positions.length === 0) { toast.error("Select at least one player"); return null; }
    const payload = buildPayload(status);
    let id = (existing as any)?.id ?? null;
    if (id) {
      const { error } = await supabase.from("team_selections").update(payload).eq("id", id);
      if (error) throw error;
    } else {
      const { data, error } = await supabase.from("team_selections").insert(payload).select("id").single();
      if (error) throw error;
      id = data?.id ?? null;
    }
    return id;
  };

  const recordAppearances = async () => {
    const [d, m, y] = fixture.date.split("/");
    const matchDate = y.length === 4 ? `${y}-${m}-${d}` : `20${y}-${m}-${d}`;
    const appearanceStats = positions.map((p) => ({
      player_stat_id: p.player_id,
      team_slug: teamSlug,
      match_date: matchDate,
      opponent,
      appeared: true,
      goals: 0,
      assists: 0,
      potm: false,
    }));
    if (appearanceStats.length === 0) return;
    const { error } = await supabase
      .from("match_player_stats")
      .upsert(appearanceStats, { onConflict: "player_stat_id,match_date,opponent" });
    if (error) throw error;
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await persist("draft");
      await recordAppearances();
      queryClient.invalidateQueries({ queryKey: ["team-roster"] });
      queryClient.invalidateQueries({ queryKey: ["team-selection", teamSlug, fixture.date, opponent] });
      toast.success("Squad saved as draft");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const id = await persist("published");
      await recordAppearances();
      queryClient.invalidateQueries({ queryKey: ["team-roster"] });
      queryClient.invalidateQueries({ queryKey: ["team-selection", teamSlug, fixture.date, opponent] });
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
            formation: formationName || undefined,
            teamName: teamSlug,
            playerCount: positions.length,
          },
          idempotencyPrefix: `team-sel-${teamSlug}-${fixture.date}-${opponent}`,
        },
      });
      toast.success("Squad published to the team!");
    } catch (err: any) {
      toast.error(err.message || "Failed to publish");
    } finally {
      setPublishing(false);
    }
  };

  const openReveal = async () => {
    // ensure at least a draft exists before opening reveal
    try {
      const id = await persist(((existing as any)?.status ?? "draft") as any);
      const revealId = id ?? (existing as any)?.id;
      if (!revealId) { toast.error("Save first"); return; }
      window.open(`/lineup-reveal/${revealId}`, "_blank");
    } catch (err: any) {
      toast.error(err.message || "Failed to open reveal");
    }
  };

  const status = (existing as any)?.status ?? "draft";

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          vs <span className="font-semibold text-foreground">{opponent}</span> · {fixture.date}
        </div>
        <Badge variant={status === "published" ? "default" : "secondary"} className="text-[10px]">
          {status === "published" ? "PUBLISHED" : "DRAFT"}
        </Badge>
      </div>

      <FormationBuilder
        roster={roster}
        format={format}
        onFormatChange={(f) => {
          setFormat(f);
          const first = getFormationsForFormat(f)[0]?.name ?? "";
          setFormationName(first);
          // clear pitch placements since slot IDs differ across formats
          setPositions((prev) => prev.map((p) => ({ ...p, slot_id: "", role: "sub" as const })));
        }}
        formationName={formationName}
        onFormationChange={(name) => {
          setFormationName(name);
          setPositions((prev) => prev.map((p) => ({ ...p, slot_id: "", role: "sub" as const })));
        }}
        positions={positions}
        onChange={setPositions}
        captainId={captainId}
        onCaptainChange={setCaptainId}
        viceCaptainId={viceCaptainId}
        onViceCaptainChange={setViceCaptainId}
        teamSlug={teamSlug}
      />

      <div>
        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Opposition shape (optional)
        </Label>
        <input
          type="text"
          value={oppositionFormation}
          onChange={(e) => setOppositionFormation(e.target.value)}
          placeholder="e.g. 4-4-2, likely to press high"
          className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
        />
      </div>

      <div>
        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Team talk / notes</Label>
        <Textarea
          placeholder="Substitutions, set-piece plans, pre-match message..."
          value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Button variant="outline" onClick={handleSaveDraft} disabled={saving || publishing} size="sm">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />}
          Save draft
        </Button>
        <Button variant="secondary" onClick={openReveal} disabled={saving || publishing} size="sm">
          <Presentation className="h-3.5 w-3.5 mr-1" />
          Reveal
        </Button>
        <Button onClick={handlePublish} disabled={saving || publishing} size="sm">
          {publishing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Send className="h-3.5 w-3.5 mr-1" />}
          Publish
        </Button>
      </div>
    </div>
  );
}
