import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Plus, Trash2, Save, Loader2, BarChart3 } from "lucide-react";
import { toast } from "sonner";

const ageGroups = [
  "U7", "U8 Black", "U8 Gold", "U9", "U10",
  "U11 Black", "U11 Gold", "U13 Black", "U13 Gold", "U14",
];

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
  isNew?: boolean;
}

export function PlayerStatsForm({ allowedAgeGroups }: { allowedAgeGroups?: string[] }) {
  const visibleGroups = allowedAgeGroups && allowedAgeGroups.length > 0 ? allowedAgeGroups : ageGroups;
  const [selectedGroup, setSelectedGroup] = useState(visibleGroups.length === 1 ? visibleGroups[0] : "");
  const [players, setPlayers] = useState<PlayerStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

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
      setPlayers((data || []).map((p) => ({ ...p, isNew: false })));
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
        isNew: true,
      },
    ]);
  };

  const updatePlayer = (index: number, field: keyof PlayerStat, value: string | number | null) => {
    const updated = [...players];
    (updated[index] as any)[field] = value;
    setPlayers(updated);
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
              {/* Header */}
              <div className="hidden md:grid grid-cols-[1fr_80px_70px_70px_70px_70px_40px] gap-2 text-[10px] font-display tracking-widest text-muted-foreground uppercase px-1">
                <span>Name</span>
                <span className="text-center">Shirt #</span>
                <span className="text-center">Goals</span>
                <span className="text-center">Assists</span>
                <span className="text-center">Apps</span>
                <span className="text-center">POTM</span>
                <span></span>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {players.map((player, i) => (
                  <div
                    key={player.id || `new-${i}`}
                    className="grid grid-cols-2 md:grid-cols-[1fr_80px_70px_70px_70px_70px_40px] gap-2 bg-secondary/50 rounded-lg p-2 items-center"
                  >
                    <input
                      value={player.first_name}
                      onChange={(e) => updatePlayer(i, "first_name", e.target.value)}
                      placeholder="First name"
                      className="bg-secondary border border-border rounded px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground col-span-2 md:col-span-1"
                    />
                    <input
                      type="number"
                      value={player.shirt_number ?? ""}
                      onChange={(e) => updatePlayer(i, "shirt_number", e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="#"
                      className="bg-secondary border border-border rounded px-2 py-1.5 text-sm text-foreground text-center placeholder:text-muted-foreground"
                    />
                    <input
                      type="number"
                      min="0"
                      value={player.goals}
                      onChange={(e) => updatePlayer(i, "goals", parseInt(e.target.value) || 0)}
                      className="bg-secondary border border-border rounded px-2 py-1.5 text-sm text-foreground text-center"
                    />
                    <input
                      type="number"
                      min="0"
                      value={player.assists}
                      onChange={(e) => updatePlayer(i, "assists", parseInt(e.target.value) || 0)}
                      className="bg-secondary border border-border rounded px-2 py-1.5 text-sm text-foreground text-center"
                    />
                    <input
                      type="number"
                      min="0"
                      value={player.appearances}
                      onChange={(e) => updatePlayer(i, "appearances", parseInt(e.target.value) || 0)}
                      className="bg-secondary border border-border rounded px-2 py-1.5 text-sm text-foreground text-center"
                    />
                    <input
                      type="number"
                      min="0"
                      value={player.potm_awards}
                      onChange={(e) => updatePlayer(i, "potm_awards", parseInt(e.target.value) || 0)}
                      className="bg-secondary border border-border rounded px-2 py-1.5 text-sm text-foreground text-center"
                    />
                    <button
                      onClick={() => removePlayer(i)}
                      className="text-destructive hover:text-destructive/80 transition-colors flex items-center justify-center"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

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
        </>
      )}
    </div>
  );
}
