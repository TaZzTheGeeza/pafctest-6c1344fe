import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { uploadPotmPhoto } from "@/lib/potmPhoto";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Save, Camera, Trophy, X } from "lucide-react";
import { toast } from "sonner";
import type { MatchReport } from "@/components/MatchReportCard";

interface PotmRow {
  id: string;
  player_name: string;
  reason: string | null;
  photo_url: string | null;
  shirt_number: number | null;
}

export function MatchReportEditDialog({
  report,
  onClose,
  onSaved,
}: {
  report: MatchReport | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [home, setHome] = useState("0");
  const [away, setAway] = useState("0");
  const [scorers, setScorers] = useState("");
  const [assists, setAssists] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [awards, setAwards] = useState<PotmRow[]>([]);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (!report) return;
    setHome(String(report.home_score ?? 0));
    setAway(String(report.away_score ?? 0));
    setScorers(report.goal_scorers ?? "");
    setAssists(report.assists ?? "");
    setNotes(report.notes ?? "");

    supabase
      .from("player_of_the_match")
      .select("id, player_name, reason, photo_url, shirt_number")
      .eq("age_group", report.age_group)
      .eq("award_date", report.match_date)
      .then(({ data }) => setAwards((data as PotmRow[]) || []));
  }, [report]);

  const handlePhotoChange = async (award: PotmRow, file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Photo must be under 20MB");
      return;
    }
    setUploadingId(award.id);
    try {
      const photoUrl = await uploadPotmPhoto(file, {
        playerName: award.player_name,
        awardDate: report?.match_date,
      });
      const { error } = await supabase
        .from("player_of_the_match")
        .update({ photo_url: photoUrl })
        .eq("id", award.id);
      if (error) throw error;
      setAwards((prev) => prev.map((a) => (a.id === award.id ? { ...a, photo_url: photoUrl } : a)));
      toast.success("Photo updated");
      onSaved();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update photo");
    } finally {
      setUploadingId(null);
      if (fileInputs.current[award.id]) fileInputs.current[award.id]!.value = "";
    }
  };

  const handlePhotoRemove = async (award: PotmRow) => {
    if (!confirm(`Remove the photo for ${award.player_name}?`)) return;
    const { error } = await supabase
      .from("player_of_the_match")
      .update({ photo_url: null })
      .eq("id", award.id);
    if (error) {
      toast.error(error.message || "Failed to remove photo");
      return;
    }
    setAwards((prev) => prev.map((a) => (a.id === award.id ? { ...a, photo_url: null } : a)));
    toast.success("Photo removed");
    onSaved();
  };


  const handleSave = async () => {
    if (!report) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("match_reports")
        .update({
          home_score: parseInt(home) || 0,
          away_score: parseInt(away) || 0,
          goal_scorers: scorers.trim() || null,
          assists: assists.trim() || null,
          notes: notes.trim() || null,
        })
        .eq("id", report.id);
      if (error) throw error;

      for (const award of awards) {
        const { error: potmError } = await supabase
          .from("player_of_the_match")
          .update({ reason: award.reason?.trim() || null })
          .eq("id", award.id);
        if (potmError) throw potmError;
      }

      toast.success("Match report updated");
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update report");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!report} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Match Report</DialogTitle>
          <DialogDescription>
            {report && (
              <>
                {report.team_name} vs {report.opponent} -{" "}
                {new Date(report.match_date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">{report?.team_name} Score</Label>
              <Input type="number" min="0" value={home} onChange={(e) => setHome(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">{report?.opponent} Score</Label>
              <Input type="number" min="0" value={away} onChange={(e) => setAway(e.target.value)} />
            </div>
          </div>

          <div>
            <Label className="text-xs">Goal Scorers</Label>
            <Input value={scorers} onChange={(e) => setScorers(e.target.value)} placeholder="e.g. Sophie x2, Mia" />
          </div>

          <div>
            <Label className="text-xs">Assists</Label>
            <Input value={assists} onChange={(e) => setAssists(e.target.value)} placeholder="e.g. Lily, Ava" />
          </div>

          <div>
            <Label className="text-xs">Match Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Match summary, key moments..." />
          </div>

          {awards.length > 0 && (
            <div className="space-y-3 border-t border-border pt-4">
              <Label className="text-xs flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5 text-primary" />
                Player of the Match
              </Label>
              {awards.map((award) => (
                <div key={award.id} className="border border-border rounded-lg p-3 space-y-2">
                  <p className="text-sm font-semibold">
                    {award.player_name}
                    {award.shirt_number ? ` #${award.shirt_number}` : ""}
                  </p>
                  <div className="flex items-start gap-3">
                    {award.photo_url ? (
                      <div className="relative shrink-0">
                        <img
                          src={award.photo_url}
                          alt={award.player_name}
                          className="h-20 w-20 rounded-lg object-cover border border-border"
                        />
                        <button
                          type="button"
                          onClick={() => handlePhotoRemove(award)}
                          title="Remove photo"
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="h-20 w-20 shrink-0 rounded-lg border border-dashed border-border flex items-center justify-center text-[10px] text-muted-foreground text-center px-1">
                        No photo
                      </div>
                    )}
                    <div className="space-y-2 flex-1">
                      <input
                        ref={(el) => { fileInputs.current[award.id] = el; }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handlePhotoChange(award, file);
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        disabled={uploadingId === award.id}
                        onClick={() => fileInputs.current[award.id]?.click()}
                      >
                        {uploadingId === award.id ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                        ) : (
                          <Camera className="h-3.5 w-3.5 mr-1" />
                        )}
                        {award.photo_url ? "Change Photo" : "Add Photo"}
                      </Button>
                      <Textarea
                        rows={2}
                        className="text-sm"
                        placeholder="Reason for the award..."
                        value={award.reason ?? ""}
                        onChange={(e) =>
                          setAwards((prev) =>
                            prev.map((a) => (a.id === award.id ? { ...a, reason: e.target.value } : a))
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-[11px] text-muted-foreground">
            Note: This edits the public report only. To change individual player stats (goals/assists per player), use the Coach Panel.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
