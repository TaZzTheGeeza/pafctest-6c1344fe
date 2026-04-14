import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Plus, Trash2, Save, Loader2, BarChart3, Camera, X } from "lucide-react";
import { toast } from "sonner";

const ageGroups = [
  "U6", "U7", "U8 Black", "U8 Gold", "U9", "U10",
  "U11 Black", "U11 Gold", "U13 Black", "U13 Gold", "U14",
];

const POSITIONS = ["Goalkeeper", "Defender", "Midfielder", "Forward"];

interface PlayerStat {
  id?: string;
  first_name: string;
  shirt_number: number | null;
  age_group: string;
  team_name: string;
  goals: number;
  assists: number;
  appearances: number;
  potm_awards: number;
  photo_url?: string | null;
  position?: string | null;
  isNew?: boolean;
}

export function PlayerStatsForm({ allowedAgeGroups }: { allowedAgeGroups?: string[] }) {
  const visibleGroups = allowedAgeGroups && allowedAgeGroups.length > 0 ? allowedAgeGroups : ageGroups;
  const [selectedGroup, setSelectedGroup] = useState(visibleGroups.length === 1 ? visibleGroups[0] : "");
  const canEdit = !allowedAgeGroups || allowedAgeGroups.length === 0 || allowedAgeGroups.includes(selectedGroup);
  const [players, setPlayers] = useState<PlayerStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState<number | null>(null);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  useEffect(() => {
    if (selectedGroup) fetchPlayers();
  }, [selectedGroup]);

  const fetchPlayers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("player_stats")
      .select("*")
      .eq("age_group", selectedGroup)
      .order("shirt_number", { ascending: true });

    if (error) {
      toast.error("Failed to load players");
    } else {
      setPlayers((data || []).map((p: any) => ({ ...p, isNew: false })));
    }
    setLoading(false);
  };

  const addPlayer = () => {
    setPlayers([
      ...players,
      {
        first_name: "",
        shirt_number: null,
        age_group: selectedGroup,
        team_name: `Peterborough Athletic ${selectedGroup}`,
        goals: 0,
        assists: 0,
        appearances: 0,
        potm_awards: 0,
        photo_url: null,
        position: null,
        isNew: true,
      },
    ]);
  };

  const updatePlayer = (index: number, field: keyof PlayerStat, value: string | number | null) => {
    const updated = [...players];
    (updated[index] as any)[field] = value;
    setPlayers(updated);
  };

  const handlePhotoUpload = async (index: number, file: File) => {
    const player = players[index];
    if (!file) return;

    // Validate
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Image must be under 20MB");
      return;
    }

    setUploadingPhoto(index);

    try {
      // Resize to max 1024px
      const resized = await resizeImage(file, 1024);
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${selectedGroup.toLowerCase().replace(/\s+/g, "-")}/${player.first_name || `player-${index}`}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("player-photos")
        .upload(path, resized, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("player-photos")
        .getPublicUrl(path);

      updatePlayer(index, "photo_url", urlData.publicUrl);
      toast.success("Photo uploaded!");
    } catch (err: any) {
      toast.error("Upload failed: " + (err.message || "Unknown error"));
    } finally {
      setUploadingPhoto(null);
    }
  };

  const removePhoto = (index: number) => {
    updatePlayer(index, "photo_url", null);
  };

  const removePlayer = async (index: number) => {
    const player = players[index];
    if (player.id) {
      const { error } = await supabase.from("player_stats").delete().eq("id", player.id);
      if (error) {
        toast.error("Failed to remove player");
        return;
      }
    }
    setPlayers(players.filter((_, i) => i !== index));
    toast.success("Player removed");
  };

  const saveAll = async () => {
    if (players.some((p) => !p.first_name.trim())) {
      toast.error("All players need a first name");
      return;
    }
    setSaving(true);

    const newPlayers = players.filter((p) => p.isNew);
    const existingPlayers = players.filter((p) => !p.isNew && p.id);

    let hasError = false;

    if (newPlayers.length > 0) {
      const { error } = await supabase.from("player_stats").insert(
        newPlayers.map(({ isNew, id, ...p }) => p)
      );
      if (error) hasError = true;
    }

    for (const player of existingPlayers) {
      const { isNew, id, ...data } = player;
      const { error } = await supabase
        .from("player_stats")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", id!);
      if (error) hasError = true;
    }

    setSaving(false);
    if (hasError) {
      toast.error("Some updates failed");
    } else {
      toast.success("Player stats saved!");
      fetchPlayers();
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h3 className="font-display text-lg font-bold text-foreground">Player Stats</h3>
      </div>

      <div>
        <label className="block text-xs font-display tracking-wider text-muted-foreground mb-1">
          Select Age Group
        </label>
        <select
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
          className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground"
        >
          <option value="">Choose age group...</option>
          {visibleGroups.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      {selectedGroup && (
        <>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {players.map((player, i) => (
                  <div
                    key={player.id || `new-${i}`}
                    className="bg-secondary/50 rounded-lg p-3 space-y-2"
                  >
                    {/* Row 1: Photo + Name + Position + Shirt # */}
                    <div className="flex items-start gap-3">
                      {/* Photo thumbnail */}
                      <div className="relative shrink-0">
                        {player.photo_url ? (
                          <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-border">
                            <img src={player.photo_url} alt="" className="w-full h-full object-cover object-top" />
                            {canEdit && (
                              <button
                                onClick={() => removePhoto(i)}
                                className="absolute -top-1 -right-1 bg-destructive text-white rounded-full w-4 h-4 flex items-center justify-center"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                        ) : canEdit ? (
                          <button
                            onClick={() => fileInputRefs.current[i]?.click()}
                            disabled={uploadingPhoto === i}
                            className="w-14 h-14 rounded-lg border border-dashed border-border bg-secondary flex items-center justify-center hover:border-primary transition-colors"
                          >
                            {uploadingPhoto === i ? (
                              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                            ) : (
                              <Camera className="w-4 h-4 text-muted-foreground" />
                            )}
                          </button>
                        ) : (
                          <div className="w-14 h-14 rounded-lg border border-border bg-secondary flex items-center justify-center">
                            <Users className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                        <input
                          ref={(el) => { fileInputRefs.current[i] = el; }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handlePhotoUpload(i, f);
                            e.target.value = "";
                          }}
                        />
                      </div>

                      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2">
                        <input
                          value={player.first_name}
                          onChange={(e) => updatePlayer(i, "first_name", e.target.value)}
                          placeholder="First name"
                          disabled={!canEdit}
                          className="bg-secondary border border-border rounded px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground disabled:opacity-60 col-span-2 md:col-span-1"
                        />
                        <select
                          value={player.position || ""}
                          onChange={(e) => updatePlayer(i, "position", e.target.value || null)}
                          disabled={!canEdit}
                          className="bg-secondary border border-border rounded px-2 py-1.5 text-sm text-foreground disabled:opacity-60"
                        >
                          <option value="">Position...</option>
                          {POSITIONS.map((p) => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={player.shirt_number ?? ""}
                          onChange={(e) => updatePlayer(i, "shirt_number", e.target.value ? parseInt(e.target.value) : null)}
                          placeholder="Shirt #"
                          disabled={!canEdit}
                          className="bg-secondary border border-border rounded px-2 py-1.5 text-sm text-foreground text-center placeholder:text-muted-foreground disabled:opacity-60"
                        />
                        {canEdit && (
                          <button
                            onClick={() => removePlayer(i)}
                            className="text-destructive hover:text-destructive/80 transition-colors flex items-center justify-center md:justify-end"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Row 2: Stats */}
                    <div className="grid grid-cols-4 gap-2 pl-[68px]">
                      <div>
                        <label className="text-[9px] font-display tracking-wider text-muted-foreground uppercase block mb-0.5">Goals</label>
                        <input
                          type="number"
                          min="0"
                          value={player.goals}
                          onChange={(e) => updatePlayer(i, "goals", parseInt(e.target.value) || 0)}
                          disabled={!canEdit}
                          className="w-full bg-secondary border border-border rounded px-2 py-1.5 text-sm text-foreground text-center disabled:opacity-60"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-display tracking-wider text-muted-foreground uppercase block mb-0.5">Assists</label>
                        <input
                          type="number"
                          min="0"
                          value={player.assists}
                          onChange={(e) => updatePlayer(i, "assists", parseInt(e.target.value) || 0)}
                          disabled={!canEdit}
                          className="w-full bg-secondary border border-border rounded px-2 py-1.5 text-sm text-foreground text-center disabled:opacity-60"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-display tracking-wider text-muted-foreground uppercase block mb-0.5">Apps</label>
                        <input
                          type="number"
                          min="0"
                          value={player.appearances}
                          onChange={(e) => updatePlayer(i, "appearances", parseInt(e.target.value) || 0)}
                          disabled={!canEdit}
                          className="w-full bg-secondary border border-border rounded px-2 py-1.5 text-sm text-foreground text-center disabled:opacity-60"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-display tracking-wider text-muted-foreground uppercase block mb-0.5">POTM</label>
                        <input
                          type="number"
                          min="0"
                          value={player.potm_awards}
                          onChange={(e) => updatePlayer(i, "potm_awards", parseInt(e.target.value) || 0)}
                          disabled={!canEdit}
                          className="w-full bg-secondary border border-border rounded px-2 py-1.5 text-sm text-foreground text-center disabled:opacity-60"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {canEdit && (
                <>
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={addPlayer}
                      className="flex items-center gap-2 text-sm font-display tracking-wider text-primary hover:text-gold-light transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Add Player
                    </button>
                  </div>

                  <button
                    onClick={saveAll}
                    disabled={saving || players.length === 0}
                    className="w-full bg-primary text-primary-foreground font-display tracking-wider py-3 rounded-lg hover:bg-gold-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {saving ? "Saving..." : "Save All Stats"}
                  </button>
                </>
              )}

              {!canEdit && selectedGroup && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  You can only view stats for this age group. Editing is restricted to assigned coaches.
                </p>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

async function resizeImage(file: File, maxSize: number): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = (height / width) * maxSize;
          width = maxSize;
        } else {
          width = (width / height) * maxSize;
          height = maxSize;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.85);
    };
    img.src = URL.createObjectURL(file);
  });
}
