import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, Loader2, Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface AiReportContext {
  teamName: string;
  opponent: string;
  isHome: boolean;
  homeScore: number;
  awayScore: number;
  matchDate?: string;
  scorers?: string;
  assists?: string;
  potm?: string;
}

export function encodeWav(chunks: Float32Array[], sampleRate: number) {
  const length = chunks.reduce((n, c) => n + c.length, 0);
  const samples = new Float32Array(length);
  let offset = 0;
  for (const c of chunks) {
    samples.set(c, offset);
    offset += c.length;
  }
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeStr = (pos: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(pos + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, samples.length * 2, true);
  let pos = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(pos, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    pos += 2;
  }
  return new Blob([buffer], { type: "audio/wav" });
}

export function AiReportAssistant({
  context,
  notes,
  onNotesChange,
}: {
  context: AiReportContext;
  notes: string;
  onNotesChange: (text: string) => void;
}) {
  const [busy, setBusy] = useState<null | "short" | "standard" | "upbeat">(null);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const recRef = useRef<{
    stream: MediaStream;
    ctx: AudioContext;
    node: ScriptProcessorNode;
    source: MediaStreamAudioSourceNode;
    chunks: Float32Array[];
  } | null>(null);

  const generate = async (tone: "short" | "standard" | "upbeat") => {
    if (!context.opponent) {
      toast.error("Pick the fixture/opponent first.");
      return;
    }
    setBusy(tone);
    try {
      const { data, error } = await supabase.functions.invoke("generate-match-report", {
        body: { ...context, notes, tone },
      });
      if (error) throw new Error((data as any)?.error || error.message);
      if ((data as any)?.error) throw new Error((data as any).error);
      const report = (data as any)?.report as string;
      if (!report) throw new Error("No report returned");
      onNotesChange(report);
      toast.success("Draft written — check it over and edit anything you like.");
    } catch (e: any) {
      toast.error(e?.message || "Could not write the report");
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
      onNotesChange(notes ? `${notes.trim()} ${text}` : text);
      toast.success("Voice note added — tap Write report to turn it into a write-up.");
    } catch (e: any) {
      toast.error(e?.message || "Could not read that recording");
    } finally {
      setTranscribing(false);
    }
  };

  const disabled = busy !== null || transcribing || recording;

  return (
    <div className="rounded-lg border border-border bg-secondary/40 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <p className="text-xs font-display tracking-wider">AI Write-Up Helper</p>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Uses the score, scorers, assists and Player of the Match above. Add rough notes (typed or spoken)
        for more detail — you can edit the result before saving.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={() => generate("standard")} disabled={disabled} className="h-8 text-xs gap-1">
          {busy === "standard" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          Write report
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => generate("short")} disabled={disabled} className="h-8 text-xs">
          {busy === "short" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Short summary"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => generate("upbeat")} disabled={disabled} className="h-8 text-xs">
          {busy === "upbeat" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Upbeat tone"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={recording ? "destructive" : "outline"}
          onClick={recording ? stopRecording : startRecording}
          disabled={busy !== null || transcribing}
          className="h-8 text-xs gap-1"
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
