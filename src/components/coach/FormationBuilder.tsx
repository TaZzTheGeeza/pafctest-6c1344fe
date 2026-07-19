import { useMemo, useRef, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { X, Star, StarHalf, ChevronsUpDown, Pencil, Save, Trash2, Plus, Minus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCustomFormations, useInvalidateCustomFormations, type CustomFormation } from "@/hooks/useCustomFormations";
import type { RosterPlayer } from "@/hooks/useTeamRoster";
import {
  FORMATIONS,
  findFormation,
  getFormationsForFormat,
  type FormationFormat,
  type Formation,
  type SlotDef,
} from "@/lib/formations";

const FORMAT_SLOT_COUNTS: Record<FormationFormat, number> = { "5v5": 5, "7v7": 7, "9v9": 9, "11v11": 11 };

export interface PositionEntry {
  player_id: string;
  slot_id: string;         // "" for bench
  role: "starter" | "sub";
  notes?: string;
  guest_name?: string;     // for fill-in players not in the roster
}

const GUEST_PREFIX = "guest:";
export const isGuestId = (id: string) => id.startsWith(GUEST_PREFIX);



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
  teamSlug?: string;
}

const CUSTOM_PREFIX = "custom:";
const isCustomRef = (v: string) => v.startsWith(CUSTOM_PREFIX);
const customIdFromRef = (v: string) => v.slice(CUSTOM_PREFIX.length);

export function FormationBuilder({
  roster, format, onFormatChange, formationName, onFormationChange,
  positions, onChange, captainId, onCaptainChange, viceCaptainId, onViceCaptainChange,
  teamSlug,
}: Props) {
  const { user } = useAuth();
  const { data: customFormations = [] } = useCustomFormations(teamSlug ?? "", format);
  const invalidateCustom = useInvalidateCustomFormations();

  const activeCustom: CustomFormation | undefined = isCustomRef(formationName)
    ? customFormations.find((c) => c.id === customIdFromRef(formationName))
    : undefined;

  const formation: Formation | undefined = activeCustom
    ? { name: activeCustom.name, format: activeCustom.format, slots: activeCustom.slots }
    : findFormation(formationName, format);

  // ----- editor state -----
  const [editing, setEditing] = useState(false);
  const [draftSlots, setDraftSlots] = useState<SlotDef[]>([]);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveMode, setSaveMode] = useState<"new" | "update">("new");
  const [saving, setSaving] = useState(false);
  const pitchRef = useRef<HTMLDivElement | null>(null);
  const dragSlotIdRef = useRef<string | null>(null);

  const slots: SlotDef[] = editing ? draftSlots : (formation?.slots ?? []);

  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [notesFor, setNotesFor] = useState<string | null>(null); // player_id
  const [pickerSlotId, setPickerSlotId] = useState<string | null>(null);


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
    if (isGuestId(id)) {
      const entry = byPlayer.get(id);
      return entry?.guest_name || "Fill-in";
    }
    const p = roster.find((r) => r.id === id);
    if (!p) return "?";
    return p.first_name;
  };
  const playerNumber = (id: string) => {
    if (isGuestId(id)) return "G";
    return roster.find((r) => r.id === id)?.shirt_number ?? null;
  };

  const addGuest = () => {
    const name = window.prompt("Fill-in player name")?.trim();
    if (!name) return;
    const id = `${GUEST_PREFIX}${crypto.randomUUID()}`;
    onChange([...positions, { player_id: id, slot_id: "", role: "sub", guest_name: name }]);
    setSelectedPlayerId(id);
  };


  const startersOnPitch = positions.filter((p) => p.slot_id).length;
  const requiredStarters = slots.length;

  const bench = positions.filter((p) => !p.slot_id);
  const rosterNotInSquad = roster.filter((r) => !byPlayer.has(r.id));

  const maxSlots = FORMAT_SLOT_COUNTS[format];
  const canEditActiveCustom = !!activeCustom && !!user && activeCustom.user_id === user.id;

  const startEditNew = () => {
    const base: SlotDef[] = formation?.slots?.length
      ? formation.slots.map((s) => ({ ...s }))
      : [{ id: "gk", label: "GK", x: 50, y: 8 }];
    setDraftSlots(base);
    setEditing(true);
  };
  const cancelEdit = () => { setEditing(false); setDraftSlots([]); };

  const addSlot = () => {
    if (draftSlots.length >= maxSlots) { toast.error(`Max ${maxSlots} positions for ${format}`); return; }
    const id = `s${Date.now()}${Math.floor(Math.random() * 100)}`;
    setDraftSlots([...draftSlots, { id, label: "POS", x: 50, y: 50 }]);
  };
  const removeSlot = (id: string) => setDraftSlots(draftSlots.filter((s) => s.id !== id));
  const updateSlot = (id: string, patch: Partial<SlotDef>) =>
    setDraftSlots(draftSlots.map((s) => s.id === id ? { ...s, ...patch } : s));

  const onSlotPointerDown = (e: React.PointerEvent, id: string) => {
    if (!editing) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragSlotIdRef.current = id;
  };
  const onSlotPointerMove = (e: React.PointerEvent) => {
    const id = dragSlotIdRef.current;
    if (!editing || !id || !pitchRef.current) return;
    const rect = pitchRef.current.getBoundingClientRect();
    const x = Math.max(6, Math.min(94, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(4, Math.min(96, ((e.clientY - rect.top) / rect.height) * 100));
    updateSlot(id, { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
  };
  const onSlotPointerUp = () => { dragSlotIdRef.current = null; };

  const openSaveNew = () => {
    setSaveMode("new");
    setSaveName("");
    setSaveOpen(true);
  };
  const openSaveUpdate = () => {
    if (!activeCustom) return;
    setSaveMode("update");
    setSaveName(activeCustom.name);
    setSaveOpen(true);
  };

  const persistFormation = async () => {
    if (!user) { toast.error("Sign in required"); return; }
    const name = saveName.trim();
    if (!name) { toast.error("Give it a name"); return; }
    if (draftSlots.length < 2) { toast.error("Add at least 2 positions"); return; }
    setSaving(true);
    try {
      if (saveMode === "update" && activeCustom) {
        const { error } = await supabase
          .from("custom_formations")
          .update({ name, slots: draftSlots as any, format })
          .eq("id", activeCustom.id);
        if (error) throw error;
        toast.success("Formation updated");
        invalidateCustom();
        setEditing(false);
        setDraftSlots([]);
        setSaveOpen(false);
      } else {
        const { data, error } = await supabase
          .from("custom_formations")
          .insert({
            user_id: user.id,
            team_slug: teamSlug ?? null,
            name,
            format,
            slots: draftSlots as any,
          })
          .select("id")
          .single();
        if (error) throw error;
        toast.success("Formation saved");
        invalidateCustom();
        setEditing(false);
        setDraftSlots([]);
        setSaveOpen(false);
        if (data?.id) onFormationChange(`${CUSTOM_PREFIX}${data.id}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const deleteCustom = async () => {
    if (!activeCustom) return;
    if (!confirm(`Delete formation "${activeCustom.name}"?`)) return;
    const { error } = await supabase.from("custom_formations").delete().eq("id", activeCustom.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Formation deleted");
    invalidateCustom();
    const fallback = getFormationsForFormat(format)[0]?.name ?? "";
    onFormationChange(fallback);
  };


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
          <Select value={formationName} onValueChange={onFormationChange} disabled={editing}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel className="text-[10px]">Standard</SelectLabel>
                {getFormationsForFormat(format).map((f) => (
                  <SelectItem key={f.name} value={f.name}>{f.name}</SelectItem>
                ))}
              </SelectGroup>
              {customFormations.length > 0 && (
                <SelectGroup>
                  <SelectLabel className="text-[10px]">My custom</SelectLabel>
                  {customFormations.map((f) => (
                    <SelectItem key={f.id} value={`${CUSTOM_PREFIX}${f.id}`}>
                      ★ {f.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Custom formation toolbar */}
      <div className="flex flex-wrap items-center gap-1.5">
        {!editing && (
          <>
            <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={startEditNew}>
              <Sparkles className="h-3 w-3 mr-1" />
              {activeCustom ? "Duplicate & edit" : "Create custom"}
            </Button>
            {canEditActiveCustom && (
              <>
                <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setDraftSlots(activeCustom!.slots.map((s) => ({ ...s }))); setEditing(true); }}>
                  <Pencil className="h-3 w-3 mr-1" />Edit "{activeCustom!.name}"
                </Button>
                <Button type="button" size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={deleteCustom}>
                  <Trash2 className="h-3 w-3 mr-1" />Delete
                </Button>
              </>
            )}
          </>
        )}
        {editing && (
          <>
            <span className="text-[11px] text-muted-foreground mr-1">
              Drag positions on the pitch · {draftSlots.length}/{maxSlots}
            </span>
            <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={addSlot} disabled={draftSlots.length >= maxSlots}>
              <Plus className="h-3 w-3 mr-1" />Add
            </Button>
            {canEditActiveCustom && (
              <Button type="button" size="sm" variant="secondary" className="h-7 text-xs" onClick={openSaveUpdate}>
                <Save className="h-3 w-3 mr-1" />Update
              </Button>
            )}
            <Button type="button" size="sm" className="h-7 text-xs" onClick={openSaveNew}>
              <Save className="h-3 w-3 mr-1" />Save as…
            </Button>
            <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={cancelEdit}>
              Cancel
            </Button>
          </>
        )}
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
        ref={pitchRef}
        className="relative w-full rounded-lg overflow-hidden border border-border select-none"
        style={{ aspectRatio: "3 / 4", background: "linear-gradient(180deg, #0d3d1a 0%, #0a2f14 100%)", touchAction: editing ? "none" : "auto" }}
      >
        {/* Pitch markings */}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
          <g stroke="rgba(255,255,255,0.35)" strokeWidth="0.3" fill="none">
            <rect x="2" y="2" width="96" height="96" />
            <line x1="2" y1="50" x2="98" y2="50" />
            <circle cx="50" cy="50" r="9" />
            <rect x="25" y="2" width="50" height="14" />
            <rect x="38" y="2" width="24" height="6" />
            <rect x="25" y="84" width="50" height="14" />
            <rect x="38" y="92" width="24" height="6" />
          </g>
        </svg>

        {slots.map((s) => {
          const filled = bySlot.get(s.id);
          return (
            <div
              key={s.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${s.x}%`, top: `${s.y}%`, width: "18%", aspectRatio: "1 / 1" }}
            >
              <button
                type="button"
                onClick={() => {
                  if (editing) return;
                  if (selectedPlayerId) { setPlayerToSlot(selectedPlayerId, s.id); return; }
                  setPickerSlotId(s.id);
                }}

                onPointerDown={(e) => onSlotPointerDown(e, s.id)}
                onPointerMove={onSlotPointerMove}
                onPointerUp={onSlotPointerUp}
                onPointerCancel={onSlotPointerUp}
                className={`w-full h-full rounded-full flex flex-col items-center justify-center text-center transition-all ${editing ? "cursor-move" : ""}`}
              >
                {filled && !editing ? (
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
                  <div className={`w-full h-full rounded-full border-2 ${editing ? "border-yellow-400 bg-yellow-400/20" : "border-dashed border-white/40 hover:border-white/80"} flex items-center justify-center`}>
                    <input
                      type="text"
                      value={s.label}
                      readOnly={!editing}
                      onChange={(e) => updateSlot(s.id, { label: e.target.value.slice(0, 4).toUpperCase() })}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      className="w-10 bg-transparent text-center text-[10px] text-white/90 font-semibold outline-none border-0 p-0"
                    />
                  </div>
                )}
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={() => removeSlot(s.id)}
                  className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow"
                  aria-label="Remove position"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
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
        <div className="flex items-center justify-between">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Roster ({rosterNotInSquad.length} not selected)
          </Label>
          <Button type="button" size="sm" variant="outline" className="h-6 text-[11px]" onClick={addGuest}>
            <Plus className="h-3 w-3 mr-1" />Add fill-in
          </Button>
        </div>
        {roster.length === 0 && rosterNotInSquad.length === 0 ? null : null}

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

      {/* Save custom formation dialog */}
      <Dialog open={saveOpen} onOpenChange={(v) => !saving && setSaveOpen(v)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">
              {saveMode === "update" ? "Update formation" : "Save custom formation"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-xs">Name</Label>
            <Input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder={`e.g. Diamond ${format}`}
              maxLength={40}
            />
            <p className="text-[11px] text-muted-foreground">
              Saved for {teamSlug ? `team ${teamSlug}` : "your account"} · {format}
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSaveOpen(false)} disabled={saving}>Cancel</Button>
            <Button size="sm" onClick={persistFormation} disabled={saving}>
              {saving ? "Saving…" : (saveMode === "update" ? "Update" : "Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Slot player picker */}
      <Dialog open={!!pickerSlotId} onOpenChange={(v) => !v && setPickerSlotId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">
              {pickerSlotId && bySlot.get(pickerSlotId)
                ? `Change ${slots.find((s) => s.id === pickerSlotId)?.label ?? "position"}`
                : `Assign ${slots.find((s) => s.id === pickerSlotId)?.label ?? "position"}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {pickerSlotId && bySlot.get(pickerSlotId) && (
              <div className="rounded-md bg-secondary/60 px-2 py-1.5 text-xs flex items-center justify-between">
                <span>Currently: <span className="font-semibold">{playerLabel(bySlot.get(pickerSlotId)!.player_id)}</span></span>
                <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive"
                  onClick={() => {
                    removeFromPitch(bySlot.get(pickerSlotId!)!.player_id);
                    setPickerSlotId(null);
                  }}>
                  <X className="h-3 w-3 mr-1" />Remove
                </Button>
              </div>
            )}
            <Button
              type="button" size="sm" variant="outline" className="w-full justify-start h-8 text-xs"
              onClick={() => {
                const name = window.prompt("Fill-in player name")?.trim();
                if (!name || !pickerSlotId) return;
                const id = `${GUEST_PREFIX}${crypto.randomUUID()}`;
                onChange([
                  ...positions.filter((p) => p.slot_id !== pickerSlotId),
                  { player_id: id, slot_id: pickerSlotId, role: "starter", guest_name: name },
                ]);
                setPickerSlotId(null);
              }}
            >
              <Plus className="h-3 w-3 mr-1" />Add fill-in player…
            </Button>
            <div className="max-h-64 overflow-y-auto space-y-1 rounded-md border border-border p-1">
              {roster.length === 0 && bench.length === 0 && (
                <p className="text-[11px] text-muted-foreground italic p-2">
                  No players in roster yet.
                </p>
              )}
              {roster.map((r) => {
                const entry = byPlayer.get(r.id);
                const placedElsewhere = entry?.slot_id && entry.slot_id !== pickerSlotId;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      if (pickerSlotId) setPlayerToSlot(r.id, pickerSlotId);
                      setPickerSlotId(null);
                    }}
                    className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded hover:bg-muted text-left text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-xs opacity-70 w-6 text-center">{r.shirt_number ?? "-"}</span>
                      <span className="font-medium">{r.first_name}</span>
                    </span>
                    {placedElsewhere && (
                      <span className="text-[10px] text-muted-foreground">
                        on pitch — will swap
                      </span>
                    )}
                    {entry?.slot_id === "" && (
                      <span className="text-[10px] text-primary">on bench</span>
                    )}
                  </button>
                );
              })}
              {bench.filter((b) => isGuestId(b.player_id)).map((b) => (
                <button
                  key={b.player_id}
                  type="button"
                  onClick={() => {
                    if (pickerSlotId) setPlayerToSlot(b.player_id, pickerSlotId);
                    setPickerSlotId(null);
                  }}
                  className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded hover:bg-muted text-left text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-xs opacity-70 w-6 text-center">G</span>
                    <span className="font-medium italic">{b.guest_name}</span>
                  </span>
                  <span className="text-[10px] text-primary">fill-in</span>
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setPickerSlotId(null)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>

  );
}
