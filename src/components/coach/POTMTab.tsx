import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trophy, Loader2, Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTeamRoster, getAgeGroup } from "@/hooks/useTeamRoster";
import type { FAFixture } from "@/hooks/useTeamFixtures";

export function POTMTab({
  teamSlug, teamName, opponent, fixture,
}: {
  teamSlug: string; teamName: string; opponent: string; fixture: FAFixture;
}) {
  const { data: roster = [] } = useTeamRoster(teamSlug);
  const queryClient = useQueryClient();
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedPlayer = roster.find(p => p.id === selectedPlayerId);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo must be under 5MB");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const clearPhoto = () => {
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async () => {
    if (!selectedPlayerId) { toast.error("Select a player"); return; }
    if (!selectedPlayer) return;
    setSaving(true);
    try {
      const [d, m, y] = fixture.date.split("/");
      const awardDate = `20${y}-${m}-${d}`;
      const matchDate = awardDate;

      let photoUrl: string | null = null;

      // Upload photo if attached
      if (photoFile) {
        const ext = photoFile.name.split(".").pop() || "jpg";
        const path = `potm/${teamSlug}/${awardDate}-${selectedPlayer.first_name}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("club-photos")
          .upload(path, photoFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("club-photos").getPublicUrl(path);
        photoUrl = urlData.publicUrl;
      }

      // Save POTM award
      const { error } = await supabase.from("player_of_the_match").insert({
        player_name: selectedPlayer.first_name,
        team_name: teamName,
        age_group: getAgeGroup(teamSlug),
        shirt_number: selectedPlayer.shirt_number,
        match_description: `vs ${opponent}`,
        reason: reason || null,
        award_date: awardDate,
        photo_url: photoUrl,
      });
      if (error) throw error;

      // Update match_player_stats with POTM flag
      const { error: statsError } = await supabase
        .from("match_player_stats")
        .upsert({
          player_stat_id: selectedPlayerId,
          team_slug: teamSlug,
          match_date: matchDate,
          opponent,
          potm: true,
          goals: 0,
          assists: 0,
          appeared: false,
        }, { onConflict: "player_stat_id,match_date,opponent" });

      if (statsError) throw statsError;

      queryClient.invalidateQueries({ queryKey: ["team-roster"] });
      clearPhoto();
      toast.success("POTM saved & stats updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save POTM");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 pt-2">
      <div>
        <Label className="text-xs">Select Player</Label>
        <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
          <SelectTrigger>
            <SelectValue placeholder="Choose from roster" />
          </SelectTrigger>
          <SelectContent>
            {roster.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.shirt_number ? `#${p.shirt_number} ` : ""}{p.first_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs">Reason for Award</Label>
        <Textarea
          placeholder="Outstanding performance, great tackles..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
        />
      </div>

      <div>
        <Label className="text-xs">Attach Photo</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoSelect}
          className="hidden"
        />
        {photoPreview ? (
          <div className="relative inline-block mt-1">
            <img src={photoPreview} alt="POTM preview" className="h-24 w-24 object-cover rounded-lg border border-border" />
            <button
              type="button"
              onClick={clearPhoto}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-1 w-full"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="h-4 w-4 mr-2" />
            Add Photo
          </Button>
        )}
      </div>

      {roster.length === 0 && (
        <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 rounded-md p-2">
          ⚠️ No players in roster. Add players via Coach Panel to select POTM.
        </p>
      )}

      <Button onClick={handleSave} disabled={saving || roster.length === 0} className="w-full">
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trophy className="h-4 w-4 mr-2" />}
        Save Player of the Match
      </Button>
    </div>
  );
}