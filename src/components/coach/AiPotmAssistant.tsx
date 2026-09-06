import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, Loader2, Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { encodeWav } from "./AiReportAssistant";

export interface AiPotmContext {
  playerName: string;
  teamName: string;
  opponent: string;
  isHome?: boolean;
  homeScore?: number;
  awayScore?: number;
  matchDate?: string;
  scorers?: string;
  assists?: string;
}

export function AiPotmAssistant({
  context,
  reason,
  onReasonChange,
}: {
  context: AiPotmContext;
  reason: string;
  onReasonChange: (text: string) => void;
}) {
  const [busy, setBusy] = useState<null | "standard" | "short" | "upbeat">(null);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const recRef = useRef<{
    stream: MediaStream;
    ctx: AudioContext;
    node: ScriptProcessorNode;
    source: MediaStreamAudioSourceNode;
    chunks: Float32Array[];
  } | null>(null);

  const generate = async (tone: "standard" | "short" | "upbeat") => {
    if (!context.playerName) {
      toast.error("Choose the player first.");
      return;
    }
    setBusy(tone);
    try {
      const { data, error } = await supabase.functions.invoke("generate-match-report", {
        body: { ...context, notes: reason, tone, mode: "potm" },
      });
      if (error) throw new Error((data as any)?.error || error.message);
      if ((data as any)?.error) throw new Error((data as any).error);
      const text = (data as any)?.report as string;
      if (!text) throw new Error("No write-up returned");
      onReasonChange(text);
      toast.success("Write-up drafted — edit anything you like.");
    } catch (e: any) {
      toast.error(e?.message || "Could not write the award reason");
    } finally {
      setBusy(null);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const node = ctx.createScriptProcessor(4096, 1, 1);
      const chunks: Float32Array[] = [];
      node.onaudioprocess = (e) => chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
      source.connect(node);
      node.connect(ctx.destination);
      recRef.current = { stream, ctx, node, source, chunks };
      setRecording(true);
    } catch {
      toast.error("Microphone access is needed to record your notes.");
    }
  };

  const stopRecording = async () => {
    const rec = recRef.current;
    recRef.current = null;
    setRecording(false);
    if (!rec) return;
    rec.stream.getTracks().forEach((t) => t.stop());
    rec.node.disconnect();
    rec.source.disconnect();
    const blob = encodeWav(rec.chunks, rec.ctx.sampleRate);
    await rec.ctx.close();
    if (blob.size < 4096) {
      toast.error("That recording was empty — please try again.");
      return;
    }
    setTranscribing(true);
    try {
      const form = new FormData();
      form.append("audio", blob, "recording.wav");
      const { data, error } = await supabase.functions.invoke("transcribe-match-note", { body: form });
      if (error) throw new Error((data as any)?.error || error.message);
      if ((data as any)?.error) throw new Error((data as any).error);
      const text = ((data as any)?.text || "").trim();
      if (!text) throw new Error("Nothing was picked up in that recording");
      onReasonChange(reason ? `${reason.trim()} ${text}` : text);
      toast.success("Voice note added — tap Write reason to polish it.");
    } catch (e: any) {
      toast.error(e?.message || "Could not read that recording");
    } finally {
      setTranscribing(false);
    }
  };

  const disabled = busy !== null || transcribing || recording;

  return (
    <div className="rounded-lg border border-border bg-secondary/40 p-2 space-y-2 mt-2">
      <div className="flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <p className="text-[11px] font-display tracking-wider">AI Write-Up Helper</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={() => generate("standard")} disabled={disabled} className="h-7 text-xs gap-1">
          {busy === "standard" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          Write reason
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => generate("short")} disabled={disabled} className="h-7 text-xs">
          {busy === "short" ? <Loader2 className="h-3 w-3 animate-spin" /> : "One line"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => generate("upbeat")} disabled={disabled} className="h-7 text-xs">
          {busy === "upbeat" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Upbeat tone"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={recording ? "destructive" : "outline"}
          onClick={recording ? stopRecording : startRecording}
          disabled={busy !== null || transcribing}
          className="h-7 text-xs gap-1"
        >
          {transcribing ? (
            <><Loader2 className="h-3 w-3 animate-spin" />Listening…</>
          ) : recording ? (
            <><Square className="h-3 w-3" />Stop &amp; add</>
          ) : (
            <><Mic className="h-3 w-3" />Voice note</>
          )}
        </Button>
      </div>
      {recording && <p className="text-[11px] text-primary">Recording… speak your notes, then tap Stop.</p>}
    </div>
  );
}
