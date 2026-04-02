import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Upload, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface TournamentPhotoUploadProps {
  tournamentId: string;
  ageGroups: { id: string; age_group: string }[];
}

export function TournamentPhotoUpload({ tournamentId, ageGroups }: TournamentPhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [ageGroup, setAgeGroup] = useState("");
  const [caption, setCaption] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

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
    let successCount = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split(".").pop() || "jpg";
        const storagePath = `${tournamentId}/${Date.now()}-${i}.${ext}`;

        // Upload full-res to private bucket
        const { error: uploadErr } = await supabase.storage
          .from("tournament-photos")
          .upload(storagePath, file);
        if (uploadErr) {
          console.error("Upload error:", uploadErr);
          continue;
        }

        // Create resized preview and upload to public gallery-photos bucket
        const previewBlob = await createResizedPreview(file);
        const previewPath = `tournament-previews/${tournamentId}/${Date.now()}-${i}.jpg`;
        const { error: previewErr } = await supabase.storage
          .from("gallery-photos")
          .upload(previewPath, previewBlob, { contentType: "image/jpeg" });

        if (previewErr) {
          console.error("Preview upload error:", previewErr);
          continue;
        }

        const { data: previewUrl } = supabase.storage
          .from("gallery-photos")
          .getPublicUrl(previewPath);

        // Insert photo record
        const { error: insertErr } = await supabase
          .from("tournament_photos" as any)
          .insert({
            tournament_id: tournamentId,
            age_group: ageGroup && ageGroup !== "__general__" ? ageGroup : null,
            caption: caption || null,
            preview_url: previewUrl.publicUrl,
            storage_path: storagePath,
            price_cents: 200,
          });

        if (!insertErr) successCount++;
      }

      if (successCount > 0) {
        toast.success(`${successCount} photo(s) uploaded successfully`);
        queryClient.invalidateQueries({ queryKey: ["tournament-photos"] });
        setCaption("");
        if (fileRef.current) fileRef.current.value = "";
      } else {
        toast.error("No photos were uploaded successfully");
      }
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

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
          />
          <p className="text-xs text-muted-foreground mt-1">
            Select multiple photos. Watermarked previews are generated automatically.
          </p>
        </div>

        <Button onClick={handleUpload} disabled={uploading} className="w-full">
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Uploading...
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
