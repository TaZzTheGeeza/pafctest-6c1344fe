import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Upload, Loader2, Clock } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface TournamentPhotoUploadProps {
  tournamentId: string;
  ageGroups: { id: string; age_group: string }[];
}

// Rough throughput estimate per photo (upload full-res + generate preview + upload preview + insert row).
// Tuned to feel realistic on typical UK home broadband.
const SECONDS_PER_PHOTO_ESTIMATE = 4;

function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "—";
  seconds = Math.max(1, Math.round(seconds));
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return s ? `${m}m ${s}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm ? `${h}h ${rm}m` : `${h}h`;
}

export function TournamentPhotoUpload({ tournamentId, ageGroups }: TournamentPhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [ageGroup, setAgeGroup] = useState("");
  const [caption, setCaption] = useState("");
  const [photoDate, setPhotoDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedCount, setSelectedCount] = useState(0);
  const [selectedSize, setSelectedSize] = useState(0);
  const [progress, setProgress] = useState({ done: 0, total: 0, etaSeconds: 0 });
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Warn the user if they try to leave/close the tab mid-upload — navigating away
  // cancels in-flight uploads since they run entirely in the browser.
  useEffect(() => {
    if (!uploading) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
      return "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [uploading]);

  const refreshSelected = () => {
    const files = fileRef.current?.files;
    if (!files?.length) {
      setSelectedCount(0);
      setSelectedSize(0);
      return;
    }
    let size = 0;
    for (let i = 0; i < files.length; i++) size += files[i].size;
    setSelectedCount(files.length);
    setSelectedSize(size);
  };

  const createResizedPreview = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxW = 800;
        const scale = Math.min(maxW / img.width, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = "#ffffff";
        const fontSize = Math.max(canvas.width / 12, 20);
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const text = "PAFC";
        const spacingX = fontSize * 4;
        const spacingY = fontSize * 3;

        for (let row = -1; row < canvas.height / spacingY + 1; row++) {
          for (let col = -1; col < canvas.width / spacingX + 1; col++) {
            ctx.save();
            const x = col * spacingX + (row % 2 === 0 ? 0 : spacingX / 2);
            const y = row * spacingY;
            ctx.translate(x, y);
            ctx.rotate(-Math.PI / 6);
            ctx.fillText(text, 0, 0);
            ctx.restore();
          }
        }
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${Math.max(canvas.width / 5, 48)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-Math.PI / 6);
        ctx.fillText("PAFC PREVIEW", 0, 0);
        ctx.restore();

        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("Failed to create preview"))),
          "image/jpeg",
          0.8
        );
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const handleUpload = async () => {
    const files = fileRef.current?.files;
    if (!files?.length) {
      toast.error("Please select photos to upload");
      return;
    }

    setUploading(true);
    const total = files.length;
    setProgress({ done: 0, total, etaSeconds: total * SECONDS_PER_PHOTO_ESTIMATE });
    const startedAt = Date.now();
    let successCount = 0;
    let uploadFailCount = 0;
    let previewFailCount = 0;
    let insertFailCount = 0;
    let lastInsertError: string | null = null;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split(".").pop() || "jpg";
        const storagePath = `${tournamentId}/${Date.now()}-${i}.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from("tournament-photos")
          .upload(storagePath, file);
        if (uploadErr) {
          console.error("Upload error:", uploadErr);
          uploadFailCount++;
          continue;
        }

        let previewBlob: Blob;
        try {
          previewBlob = await createResizedPreview(file);
        } catch (e) {
          console.error("Preview generation error:", e);
          previewFailCount++;
          continue;
        }

        const previewPath = `tournament-previews/${tournamentId}/${Date.now()}-${i}.jpg`;
        const { error: previewErr } = await supabase.storage
          .from("gallery-photos")
          .upload(previewPath, previewBlob, { contentType: "image/jpeg" });

        if (previewErr) {
          console.error("Preview upload error:", previewErr);
          previewFailCount++;
          continue;
        }

        const { data: previewUrl } = supabase.storage
          .from("gallery-photos")
          .getPublicUrl(previewPath);

        const { error: insertErr } = await supabase
          .from("tournament_photos" as any)
          .insert({
            tournament_id: tournamentId,
            age_group: ageGroup && ageGroup !== "__general__" ? ageGroup : null,
            caption: caption || null,
            preview_url: previewUrl.publicUrl,
            storage_path: storagePath,
            price_cents: 200,
            photo_date: photoDate || null,
          });

        if (insertErr) {
          console.error("DB insert error:", insertErr, { storagePath });
          insertFailCount++;
          lastInsertError = insertErr.message;
        } else {
          successCount++;
        }

        // Update progress + ETA using observed per-photo time
        const done = i + 1;
        const elapsedSec = (Date.now() - startedAt) / 1000;
        const avgPerPhoto = elapsedSec / done;
        const remaining = total - done;
        setProgress({ done, total, etaSeconds: Math.round(avgPerPhoto * remaining) });
      }

      const failTotal = uploadFailCount + previewFailCount + insertFailCount;
      if (successCount > 0 && failTotal === 0) {
        toast.success(`${successCount} photo(s) uploaded successfully`);
      } else if (successCount > 0 && failTotal > 0) {
        toast.warning(
          `${successCount} uploaded, ${failTotal} failed (upload: ${uploadFailCount}, preview: ${previewFailCount}, db: ${insertFailCount})`
        );
      } else {
        toast.error(
          `No photos saved. ${insertFailCount > 0 ? `DB error: ${lastInsertError}` : "Check console for details."}`
        );
      }

      if (successCount > 0) {
        queryClient.invalidateQueries({ queryKey: ["tournament-photos"] });
        setCaption("");
        if (fileRef.current) fileRef.current.value = "";
        setSelectedCount(0);
        setSelectedSize(0);
      }
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      setProgress({ done: 0, total: 0, etaSeconds: 0 });
    }
  };

  const estimatedTotal = selectedCount * SECONDS_PER_PHOTO_ESTIMATE;
  const percent = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Camera className="h-4 w-4 text-primary" />
          Upload Tournament Photos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Age Group (optional)</Label>
          <Select value={ageGroup} onValueChange={setAgeGroup}>
            <SelectTrigger>
              <SelectValue placeholder="All / General" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__general__">General</SelectItem>
              {ageGroups.map((ag) => (
                <SelectItem key={ag.id} value={ag.age_group}>
                  {ag.age_group}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Date taken</Label>
          <Input
            type="date"
            value={photoDate}
            onChange={(e) => setPhotoDate(e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Buyers filter the gallery by this date — set it to the match day.
          </p>
        </div>

        <div>
          <Label>Caption (optional, applies to all)</Label>
          <Input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="e.g. Semi-final action"
            maxLength={200}
          />
        </div>

        <div>
          <Label>Photos</Label>
          <Input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="cursor-pointer"
            onChange={refreshSelected}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Select multiple photos. Watermarked previews are generated automatically.
          </p>

          {selectedCount > 0 && !uploading && (
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>
                {selectedCount} photo{selectedCount === 1 ? "" : "s"} ·{" "}
                {(selectedSize / (1024 * 1024)).toFixed(1)} MB · est. {formatDuration(estimatedTotal)} to upload
              </span>
            </div>
          )}
        </div>

        {uploading && progress.total > 0 && (
          <div className="space-y-2 rounded-md border border-border/50 bg-muted/30 p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">
                Uploading {progress.done} / {progress.total}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {progress.done === 0
                  ? `est. ${formatDuration(progress.total * SECONDS_PER_PHOTO_ESTIMATE)}`
                  : progress.done < progress.total
                  ? `~${formatDuration(progress.etaSeconds)} remaining`
                  : "Finishing…"}
              </span>
            </div>
            <Progress value={percent} />
          </div>
        )}

        <Button onClick={handleUpload} disabled={uploading} className="w-full">
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Uploading… {percent}%
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload Photos
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
