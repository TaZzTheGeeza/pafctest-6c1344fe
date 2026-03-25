import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trophy, Loader2, Camera, X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTeamRoster, getAgeGroup } from "@/hooks/useTeamRoster";
import type { FAFixture } from "@/hooks/useTeamFixtures";

/** Resize image to max dimension and return as base64 data URI (PNG) */
function resizeImageToBase64(file: File, maxDim = 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/png");
      console.log("[POTM] Resized image to", width, "x", height, "base64 length:", dataUrl.length);
      resolve(dataUrl);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image for resizing"));
    };
    img.src = url;
  });
}

function base64ToBlob(base64: string): Blob {
  const parts = base64.split(",");
  const mime = parts[0]?.match(/:(.*?);/)?.[1] || "image/png";
  const raw = atob(parts[1]);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

interface POTMEntry {
  playerId: string;
  reason: string;
  photoFile: File | null;
  photoPreview: string | null;
}

export function POTMTab({
  teamSlug, teamName, opponent, fixture,
}: {
  teamSlug: string; teamName: string; opponent: string; fixture: FAFixture;
}) {
  const { data: roster = [] } = useTeamRoster(teamSlug);
  const queryClient = useQueryClient();
  const [entries, setEntries] = useState<POTMEntry[]>([
    { playerId: "", reason: "", photoFile: null, photoPreview: null },
  ]);
  const [saving, setSaving] = useState(false);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const addEntry = () => {
    setEntries([...entries, { playerId: "", reason: "", photoFile: null, photoPreview: null }]);
  };

  const removeEntry = (i: number) => {
    const entry = entries[i];
    if (entry.photoPreview) URL.revokeObjectURL(entry.photoPreview);
    setEntries(entries.filter((_, idx) => idx !== i));
  };

  const updateEntry = (i: number, field: keyof POTMEntry, val: any) => {
    const next = [...entries];
    next[i] = { ...next[i], [field]: val };
    setEntries(next);
  };

  const handlePhotoSelect = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo must be under 5MB");
      return;
    }
    const next = [...entries];
    if (next[i].photoPreview) URL.revokeObjectURL(next[i].photoPreview!);
    next[i] = { ...next[i], photoFile: file, photoPreview: URL.createObjectURL(file) };
    setEntries(next);
  };

  const clearPhoto = (i: number) => {
    const next = [...entries];
    if (next[i].photoPreview) URL.revokeObjectURL(next[i].photoPreview!);
    next[i] = { ...next[i], photoFile: null, photoPreview: null };
    setEntries(next);
    if (fileInputRefs.current[i]) fileInputRefs.current[i]!.value = "";
  };

  const selectedIds = entries.map(e => e.playerId).filter(Boolean);

  const handleSave = async () => {
    const validEntries = entries.filter(e => e.playerId);
    if (validEntries.length === 0) { toast.error("Select at least one player"); return; }
    setSaving(true);
    try {
      const [d, m, y] = fixture.date.split("/");
      const awardDate = `20${y}-${m}-${d}`;
      const ageGroup = getAgeGroup(teamSlug);

      for (const entry of validEntries) {
        const player = roster.find(p => p.id === entry.playerId);
        if (!player) continue;

        let photoUrl: string | null = null;
        if (entry.photoFile) {
          // Resize image and convert to base64 (keeps payload under edge function limits)
          const base64 = await resizeImageToBase64(entry.photoFile, 1024);
          console.log("[POTM] Base64 data URI length being sent:", base64.length);
          
          let finalBase64 = base64;
          try {
            toast.info("Removing background — this may take a moment...");
            const { data: bgData, error: bgError } = await supabase.functions.invoke(
              "remove-background",
              { body: { imageBase64: base64 } }
            );
            
            console.log("[POTM] Background removal response:", { error: bgError, hasData: !!bgData, keys: bgData ? Object.keys(bgData) : null });
            
            if (bgError) {
              console.error("[POTM] Background removal error:", bgError);
              toast.warning("Background removal failed, using original photo");
            } else if (bgData?.imageBase64) {
              finalBase64 = bgData.imageBase64.startsWith("data:")
                ? bgData.imageBase64
                : `data:image/png;base64,${bgData.imageBase64}`;
              console.log("[POTM] Background removed successfully, result length:", finalBase64.length);
              toast.success("Background removed!");
            } else {
              console.warn("[POTM] No image in response:", JSON.stringify(bgData).substring(0, 300));
              toast.warning(bgData?.textResponse || "Background removal returned no image, using original");
            }
          } catch (bgErr) {
            console.error("[POTM] Background removal exception:", bgErr);
            toast.warning("Background removal failed, using original photo");
          }

          // Upload the processed image as PNG
          const path = `potm/${teamSlug}/${awardDate}-${player.first_name}.png`;
          const blob = base64ToBlob(finalBase64);
          const { error: uploadError } = await supabase.storage
            .from("club-photos")
            .upload(path, blob, { upsert: true, contentType: "image/png" });
          if (uploadError) throw uploadError;
          const { data: urlData } = supabase.storage.from("club-photos").getPublicUrl(path);
          photoUrl = urlData.publicUrl;
        }

        const { error } = await supabase.from("player_of_the_match").insert({
          player_name: player.first_name,
          team_name: teamName,
          age_group: ageGroup,
          shirt_number: player.shirt_number,
          match_description: `vs ${opponent}`,
          reason: entry.reason || null,
          award_date: awardDate,
          photo_url: photoUrl,
        });
        if (error) throw error;

        const { error: statsError } = await supabase
          .from("match_player_stats")
          .upsert({
            player_stat_id: entry.playerId,
            team_slug: teamSlug,
            match_date: awardDate,
            opponent,
            potm: true,
            goals: 0,
            assists: 0,
            appeared: false,
          }, { onConflict: "player_stat_id,match_date,opponent" });
        if (statsError) throw statsError;
      }

      queryClient.invalidateQueries({ queryKey: ["team-roster"] });
      // Reset
      entries.forEach(e => { if (e.photoPreview) URL.revokeObjectURL(e.photoPreview); });
      setEntries([{ playerId: "", reason: "", photoFile: null, photoPreview: null }]);
      toast.success(`${validEntries.length} POTM award${validEntries.length > 1 ? "s" : ""} saved!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to save POTM");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 pt-2">
      {entries.map((entry, i) => {
        const player = roster.find(p => p.id === entry.playerId);
        return (
          <div key={i} className="border border-border rounded-lg p-3 space-y-3 relative">
            {entries.length > 1 && (
              <div className="flex items-center justify-between">
                <span className="text-xs font-display text-muted-foreground">POTM #{i + 1}</span>
                <Button size="sm" variant="ghost" onClick={() => removeEntry(i)} className="h-6 w-6 p-0">
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            )}

            <div>
              <Label className="text-xs">Select Player</Label>
              <Select value={entry.playerId} onValueChange={(v) => updateEntry(i, "playerId", v)}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Choose from roster" />
                </SelectTrigger>
                <SelectContent>
                  {roster
                    .filter(p => !selectedIds.includes(p.id) || p.id === entry.playerId)
                    .map((p) => (
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
                placeholder="Outstanding performance..."
                value={entry.reason}
                onChange={(e) => updateEntry(i, "reason", e.target.value)}
                rows={2}
                className="text-sm"
              />
            </div>

            <div>
              <Label className="text-xs">Attach Photo</Label>
              <input
                ref={(el) => { fileInputRefs.current[i] = el; }}
                type="file"
                accept="image/*"
                onChange={(e) => handlePhotoSelect(i, e)}
                className="hidden"
              />
              {entry.photoPreview ? (
                <div className="relative inline-block mt-1">
                  <img src={entry.photoPreview} alt="POTM preview" className="h-20 w-20 object-cover rounded-lg border border-border" />
                  <button
                    type="button"
                    onClick={() => clearPhoto(i)}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-1 w-full h-8 text-xs"
                  onClick={() => fileInputRefs.current[i]?.click()}
                >
                  <Camera className="h-3.5 w-3.5 mr-1" />
                  Add Photo
                </Button>
              )}
            </div>
          </div>
        );
      })}

      <Button type="button" variant="outline" size="sm" onClick={addEntry} className="w-full gap-1">
        <Plus className="h-3.5 w-3.5" /> Add Another POTM
      </Button>

      {roster.length === 0 && (
        <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 rounded-md p-2">
          ⚠️ No players in roster. Add players via Coach Panel to select POTM.
        </p>
      )}

      <Button onClick={handleSave} disabled={saving || roster.length === 0} className="w-full">
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trophy className="h-4 w-4 mr-2" />}
        Save POTM Award{entries.filter(e => e.playerId).length > 1 ? "s" : ""}
      </Button>
    </div>
  );
}
