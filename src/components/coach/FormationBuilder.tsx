import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Star, StarHalf, ChevronsUpDown } from "lucide-react";
import type { RosterPlayer } from "@/hooks/useTeamRoster";
import {
  FORMATIONS,
  findFormation,
  getFormationsForFormat,
  type FormationFormat,
  type Formation,
  type SlotDef,
} from "@/lib/formations";

export interface PositionEntry {
  player_id: string;
  slot_id: string;         // "" for bench
  role: "starter" | "sub";
  notes?: string;
}

interface Props {
  roster: RosterPlayer[];
  format: FormationFormat;
  onFormatChange: (f: FormationFormat) => void;
  formationName: string;
  onFormationChange: (name: string) => void;
  positions: PositionEntry[];
  onChange: (positions: PositionEntry[]) => void;
  captainId: string | null;
  onCaptainChange: (id: string | null) => void;
  viceCaptainId: string | null;
  onViceCaptainChange: (id: string | null) => void;
}

export function FormationBuilder({
  roster, format, onFormatChange, formationName, onFormationChange,
  positions, onChange, captainId, onCaptainChange, viceCaptainId, onViceCaptainChange,
}: Props) {
  const formation: Formation | undefined = findFormation(formationName, format);
  const slots: SlotDef[] = formation?.slots ?? [];

  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [notesFor, setNotesFor] = useState<string | null>(null); // player_id

  const byPlayer = useMemo(() => {
    const m = new Map<string, PositionEntry>();
    positions.forEach((p) => m.set(p.player_id, p));
    return m;
  }, [positions]);

  const bySlot = useMemo(() => {
    const m = new Map<string, PositionEntry>();
    positions.forEach((p) => { if (p.slot_id) m.set(p.slot_id, p); });
    return m;
  }, [positions]);

  const availableRoster = roster; // include everyone; visual state shows placed vs bench

  const setPlayerToSlot = (playerId: string, slotId: string | "") => {
    const others = positions.filter((p) => p.player_id !== playerId && p.slot_id !== slotId);
    const entry: PositionEntry = {
      player_id: playerId,
      slot_id: slotId,
      role: slotId ? "starter" : "sub",
      notes: byPlayer.get(playerId)?.notes,
    };
    // if a slot was already filled, kick the old occupant to bench
    const evicted = bySlot.get(slotId);
    const cleared = evicted && evicted.player_id !== playerId
      ? [...others, { ...evicted, slot_id: "", role: "sub" as const }]
      : others;
    onChange([...cleared, entry]);
    setSelectedPlayerId(null);
  };

  const removeFromPitch = (playerId: string) => {
    onChange(
      positions.map((p) =>
        p.player_id === playerId ? { ...p, slot_id: "", role: "sub" as const } : p
      )
    );
  };

  const addToBench = (playerId: string) => {
    if (byPlayer.has(playerId)) return;
    onChange([...positions, { player_id: playerId, slot_id: "", role: "sub" }]);
  };

  const removeFromSquad = (playerId: string) => {
    onChange(positions.filter((p) => p.player_id !== playerId));
    if (captainId === playerId) onCaptainChange(null);
    if (viceCaptainId === playerId) onViceCaptainChange(null);
  };

  const setNotes = (playerId: string, notes: string) => {
    onChange(positions.map((p) => p.player_id === playerId ? { ...p, notes } : p));
  };

  const playerLabel = (id: string) => {
    const p = roster.find((r) => r.id === id);
    if (!p) return "?";
    return p.first_name;
  };
  const playerNumber = (id: string) => roster.find((r) => r.id === id)?.shirt_number ?? null;

  const startersOnPitch = positions.filter((p) => p.slot_id).length;
  const requiredStarters = slots.length;

  const bench = positions.filter((p) => !p.slot_id);
  const rosterNotInSquad = roster.filter((r) => !byPlayer.has(r.id));

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Format</Label>
          <Select value={format} onValueChange={(v) => onFormatChange(v as FormationFormat)}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="5v5">5v5</SelectItem>
              <SelectItem value="7v7">7v7</SelectItem>
              <SelectItem value="9v9">9v9</SelectItem>
              <SelectItem value="11v11">11v11</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Formation</Label>
          <Select value={formationName} onValueChange={onFormationChange}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {getFormationsForFormat(format).map((f) => (
                <SelectItem key={f.name} value={f.name}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{startersOnPitch} / {requiredStarters} on pitch · {bench.length} on bench</span>
        {selectedPlayerId && (
          <span className="text-primary font-medium">
            Tap a position for {playerLabel(selectedPlayerId)}
          </span>
        )}
      </div>

      {/* Pitch */}
      <div
        className="relative w-full rounded-lg overflow-hidden border border-border select-none"
        style={{ aspectRatio: "3 / 4", background: "linear-gradient(180deg, #0d3d1a 0%, #0a2f14 100%)" }}
      >
        {/* Pitch markings */}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
          <g stroke="rgba(255,255,255,0.35)" strokeWidth="0.3" fill="none">
            <rect x="2" y="2" width="96" height="96" />
            <line x1="2" y1="50" x2="98" y2="50" />
            <circle cx="50" cy="50" r="9" />
            {/* Own box */}
            <rect x="25" y="2" width="50" height="14" />
            <rect x="38" y="2" width="24" height="6" />
            {/* Opp box */}
            <rect x="25" y="84" width="50" height="14" />
            <rect x="38" y="92" width="24" height="6" />
          </g>
        </svg>

        {/* Empty slots */}
        {slots.map((s) => {
          const filled = bySlot.get(s.id);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                if (selectedPlayerId) setPlayerToSlot(selectedPlayerId, s.id);
                else if (filled) removeFromPitch(filled.player_id);
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full flex flex-col items-center justify-center text-center transition-all"
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                width: "18%",
                aspectRatio: "1 / 1",
              }}
            >
              {filled ? (
                <div className="relative w-full h-full rounded-full bg-primary text-primary-foreground flex flex-col items-center justify-center shadow-lg ring-2 ring-primary/50 hover:ring-white/70">
                  <span className="text-[10px] font-mono opacity-80 leading-none">
                    {playerNumber(filled.player_id) ?? s.label}
                  </span>
                  <span className="text-[11px] font-bold leading-tight px-1 truncate max-w-full">
                    {playerLabel(filled.player_id)}
                  </span>
                  {captainId === filled.player_id && (
                    <Star className="absolute -top-1 -right-1 h-3.5 w-3.5 fill-yellow-400 stroke-yellow-500" />
                  )}
                  {viceCaptainId === filled.player_id && (
                    <StarHalf className="absolute -top-1 -right-1 h-3.5 w-3.5 fill-yellow-300 stroke-yellow-400" />
                  )}
                </div>
              ) : (
                <div className="w-full h-full rounded-full border-2 border-dashed border-white/40 hover:border-white/80 flex items-center justify-center">
                  <span className="text-[10px] text-white/70 font-semibold">{s.label}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Placed player toolbar */}
      {positions.some((p) => p.slot_id) && (
        <div className="rounded-md border border-border bg-card/50 p-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            Tap a starter to set captain, vice, or add role note
          </p>
          <div className="flex flex-wrap gap-1.5">
            {positions.filter((p) => p.slot_id).map((p) => (
              <div key={p.player_id} className="flex items-center gap-1 bg-secondary/60 rounded-full pl-2 pr-1 py-0.5 text-xs">
                <span className="font-medium">{playerLabel(p.player_id)}</span>
                <button
                  type="button"
                  onClick={() => onCaptainChange(captainId === p.player_id ? null : p.player_id)}
                  title="Captain"
                  className={`p-0.5 rounded-full ${captainId === p.player_id ? "text-yellow-500" : "text-muted-foreground hover:text-yellow-500"}`}
                >
                  <Star className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => onViceCaptainChange(viceCaptainId === p.player_id ? null : p.player_id)}
                  title="Vice captain"
                  className={`p-0.5 rounded-full ${viceCaptainId === p.player_id ? "text-yellow-400" : "text-muted-foreground hover:text-yellow-400"}`}
                >
                  <StarHalf className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setNotesFor(p.player_id)}
                  title="Role note"
                  className="p-0.5 rounded-full text-muted-foreground hover:text-primary"
                >
                  <ChevronsUpDown className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bench */}
      <div>
        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Subs bench ({bench.length})</Label>
        <div className="mt-1 flex flex-wrap gap-1.5 min-h-[36px] rounded-md border border-dashed border-border p-2">
          {bench.length === 0 && (
            <span className="text-[11px] text-muted-foreground italic">No subs yet — pick from roster below</span>
          )}
          {bench.map((p) => (
            <button
              key={p.player_id}
              type="button"
              onClick={() => setSelectedPlayerId(selectedPlayerId === p.player_id ? null : p.player_id)}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs transition-colors ${
                selectedPlayerId === p.player_id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary hover:bg-secondary/80"
              }`}
            >
              <span className="font-mono opacity-70">{playerNumber(p.player_id) ?? "-"}</span>
              <span className="font-medium">{playerLabel(p.player_id)}</span>
              <span
                role="button"
                aria-label="remove"
                onClick={(e) => { e.stopPropagation(); removeFromSquad(p.player_id); }}
                className="opacity-60 hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Roster picker */}
      <div>
        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Roster ({rosterNotInSquad.length} not selected)
        </Label>
        {roster.length === 0 ? (
          <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 rounded-md p-2 mt-1">
            No players in roster. Add players via the Coach Panel first.
          </p>
        ) : (
          <div className="mt-1 flex flex-wrap gap-1.5 max-h-40 overflow-y-auto rounded-md border border-border p-2">
            {rosterNotInSquad.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => { addToBench(r.id); setSelectedPlayerId(r.id); }}
                className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs bg-muted/50 hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <span className="font-mono opacity-70">{r.shirt_number ?? "-"}</span>
                <span className="font-medium">{r.first_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Role note dialog */}
      <Dialog open={!!notesFor} onOpenChange={(v) => !v && setNotesFor(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">
              Role note for {notesFor ? playerLabel(notesFor) : ""}
            </DialogTitle>
          </DialogHeader>
          <Textarea
            value={notesFor ? (byPlayer.get(notesFor)?.notes ?? "") : ""}
            onChange={(e) => notesFor && setNotes(notesFor, e.target.value)}
            placeholder="e.g. 'Track back', 'Stay wide', 'Take corners'..."
            rows={3}
          />
          <Button size="sm" onClick={() => setNotesFor(null)}>Done</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
