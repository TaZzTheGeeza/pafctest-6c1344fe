import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";
import { ScenarioMedia, findScenario } from "@/lib/homeworkScenarios";
import { uploadHomeworkMedia } from "@/lib/homework";

export default function ScenarioMediaEditor({ id, media, onChange }: { id: string; media: ScenarioMedia; onChange: (media: ScenarioMedia) => void }) {
  const scenario = findScenario(id);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  if (!scenario) return null;
  const upload = async (file: File | undefined, label?: string) => {
    if (!file) return;
    setBusy(label || "photo"); setError("");
    try {
      const result = await uploadHomeworkMedia(file, "drill");
      if (label && result.type !== "video") throw new Error("Choose a video for this outcome.");
      onChange(label ? { ...media, videos: { ...media.videos, [label]: result.path } } : { ...media, photo: result.path });
    } catch (e) { setError(e instanceof Error ? e.message : "Upload failed."); }
    finally { setBusy(null); }
  };
  return <div className="space-y-3 border-t border-border pt-3">
    <p className="text-xs text-muted-foreground">Scenario photo and outcome videos are included. Replace them with your own clips if needed (videos up to 60MB).</p>
    {[{ label: "Scenario photo", key: undefined }, ...scenario.choices.map((c, i) => ({ label: `${String.fromCharCode(65 + i)}: ${c.label}`, key: c.label }))].map((item) => <div key={item.label} className="space-y-1"><label className="text-xs block">{item.label}<Input type="file" accept={item.key ? "video/*" : "image/jpeg,image/png,image/webp"} disabled={!!busy} onChange={(e) => upload(e.target.files?.[0], item.key)} className="mt-1 h-auto text-xs" /></label>
      {(item.key ? media.videos?.[item.key] : media.photo) && <Button size="sm" variant="ghost" onClick={() => {
        if (!item.key) onChange({ ...media, photo: undefined });
        else { const videos = { ...media.videos }; delete videos[item.key]; onChange({ ...media, videos }); }
      }}><X /> Use included media</Button>}</div>)}
    {busy && <p className="text-xs flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Uploading...</p>}
    {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
  </div>;
}