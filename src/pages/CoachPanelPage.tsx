import { useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Trophy, FileText, Upload, Star, CheckCircle, Loader2, ShieldX, BarChart3, Settings, AlertTriangle, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ManageSubmissionsForm } from "@/components/ManageSubmissionsForm";
import { PlayerStatsForm } from "@/components/PlayerStatsForm";
import { useUserAgeGroups } from "@/hooks/useUserAgeGroups";
import { useTeamFixtures, type FAFixture } from "@/hooks/useTeamFixtures";
import { useTeamRoster } from "@/hooks/useTeamRoster";
import { faTeamConfigs } from "@/lib/faFixtureConfig";
import { uploadPotmPhoto } from "@/lib/potmPhoto";
import { DateInput } from "@/components/ui/date-input";
import { POTMCardPreview } from "@/components/coach/POTMCardPreview";


const ALL_AGE_GROUPS = [
  "U7", "U8 Black", "U8 Gold", "U9", "U10",
  "U11 Black", "U11 Gold", "U13 Black", "U13 Gold", "U14",
];

const AGE_GROUP_TO_SLUG: Record<string, string> = {};
faTeamConfigs.forEach((c) => { AGE_GROUP_TO_SLUG[c.team] = c.slug; });

function FixtureSelect({ ageGroup, value, onChange, label = "Match (Opponent)" }: {
  ageGroup: string;
  value: string;
  onChange: (opponent: string, date: string) => void;
  label?: string;
}) {
  const slug = AGE_GROUP_TO_SLUG[ageGroup];
  const { data, isLoading } = useTeamFixtures(slug, { includeHistory: true });
  const [isManual, setIsManual] = useState(false);
  const [manualOpponent, setManualOpponent] = useState("");
  const [manualDate, setManualDate] = useState("");

  const getOpponent = (f: FAFixture) => {
    const isHome = f.homeTeam.includes("Peterborough Ath");
    return isHome ? f.awayTeam : f.homeTeam;
  };

  const getFixtureKey = (f: FAFixture) => `${f.date}|${getOpponent(f)}`;

  const hasRecordedScore = (f: FAFixture) =>
    typeof f.homeScore === "number" && typeof f.awayScore === "number";

  const renderFixtureLabel = (f: FAFixture) => {
    const opponent = getOpponent(f);
    return hasRecordedScore(f)
      ? `${f.date} — vs ${opponent} (${f.homeScore}-${f.awayScore})`
      : `${f.date} — vs ${opponent}`;
  };

  const dedupeFixtures = (fixtures: FAFixture[]) => {
    const seen = new Set<string>();
    return fixtures.filter((fixture) => {
      const key = getFixtureKey(fixture);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  // Split fixtures into past and upcoming based on date
  const parseFADate = (dateStr: string) => {
    const [d, m, y] = dateStr.split("/");
    const fullYear = y.length === 4 ? Number(y) : Number(`20${y}`);
    return new Date(fullYear, Number(m) - 1, Number(d));
  };
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const scoredResults = dedupeFixtures((data?.results || []).filter(hasRecordedScore));
  const scoredResultKeys = new Set(scoredResults.map(getFixtureKey));

  const pastFixtures = dedupeFixtures([
    ...(data?.results || []).filter((fixture) => !hasRecordedScore(fixture)),
    ...(data?.fixtures || []).filter((fixture) => parseFADate(fixture.date) < today),
  ]).filter((fixture) => !scoredResultKeys.has(getFixtureKey(fixture)));

  const pastFixtureKeys = new Set(pastFixtures.map(getFixtureKey));

  const upcomingFixtures = dedupeFixtures(
    (data?.fixtures || []).filter((fixture) => parseFADate(fixture.date) >= today),
  ).filter(
    (fixture) =>
      !scoredResultKeys.has(getFixtureKey(fixture)) &&
      !pastFixtureKeys.has(getFixtureKey(fixture)),
  );

  const allFixtures = [...scoredResults, ...pastFixtures, ...upcomingFixtures];

  if (!ageGroup) {
    return (
      <div>
        <label className="block text-xs font-display tracking-wider text-muted-foreground mb-1">{label}</label>
        <select disabled className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-muted-foreground">
          <option>Select an age group first</option>
        </select>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-display tracking-wider text-muted-foreground">{label}</label>
        <button
          type="button"
          onClick={() => {
            setIsManual(!isManual);
            if (!isManual) {
              onChange("", "");
            } else {
              setManualOpponent("");
              setManualDate("");
            }
          }}
          className="text-xs font-display text-primary hover:text-gold-light transition-colors"
        >
          {isManual ? "Select from fixtures" : "Enter manually"}
        </button>
      </div>

      {isManual ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-display tracking-wider text-muted-foreground mb-0.5">Opponent *</label>
            <input
              type="text"
              value={manualOpponent}
              onChange={(e) => {
                setManualOpponent(e.target.value);
                onChange(e.target.value, manualDate);
              }}
              placeholder="e.g. Yaxley FC"
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div>
            <label className="block text-[10px] font-display tracking-wider text-muted-foreground mb-0.5">Match Date *</label>
            <DateInput
              value={manualDate}
              onChange={(val) => {
                setManualDate(val);
                onChange(manualOpponent, val);
              }}
              placeholder="Select match date"
            />
          </div>
        </div>
      ) : (
        <select
          value={value}
          onChange={(e) => {
            const selected = allFixtures.find((f) => getFixtureKey(f) === e.target.value);
            if (selected) {
              onChange(getOpponent(selected), selected.date);
            } else {
              onChange("", "");
            }
          }}
          className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground"
        >
          <option value="">{isLoading ? "Loading fixtures..." : "Select a fixture"}</option>
          {scoredResults.length > 0 && (
            <optgroup label="Results">
              {scoredResults.map((f, i) => {
                const key = getFixtureKey(f);
                return (
                  <option key={`r-${i}`} value={key}>
                    {renderFixtureLabel(f)}
                  </option>
                );
              })}
            </optgroup>
          )}
          {pastFixtures.length > 0 && (
            <optgroup label="Past Fixtures (no result yet)">
              {pastFixtures.map((f, i) => {
                const key = getFixtureKey(f);
                return (
                  <option key={`pf-${i}`} value={key}>
                    {renderFixtureLabel(f)}
                  </option>
                );
              })}
            </optgroup>
          )}
          {upcomingFixtures.length > 0 && (
            <optgroup label="Upcoming Fixtures">
              {upcomingFixtures.map((f, i) => {
                const key = getFixtureKey(f);
                return (
                  <option key={`f-${i}`} value={key}>
                    {renderFixtureLabel(f)}
                  </option>
                );
              })}
            </optgroup>
          )}
        </select>
      )}
    </div>
  );
}

function NoAgeGroupsWarning() {
  return (
    <div className="bg-card border border-border rounded-xl p-8 text-center">
      <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
      <h3 className="font-display text-xl font-bold text-foreground mb-2">No Age Groups Assigned</h3>
      <p className="text-muted-foreground max-w-md mx-auto">
        You haven't been assigned to any age groups yet. Please contact a club admin to assign you to your team's age group.
      </p>
    </div>
  );
}

interface POTMEntry {
  player_name: string;
  shirt_number: string;
  reason: string;
  photoFile: File | null;
  photoPreview: string | null;
  croppedBlob: Blob | null;
}

export function POTMForm({ ageGroups }: { ageGroups: string[] }) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [fixtureKey, setFixtureKey] = useState("");
  const [ageGroup, setAgeGroup] = useState(ageGroups.length === 1 ? ageGroups[0] : "");
  const [matchDescription, setMatchDescription] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [entries, setEntries] = useState<POTMEntry[]>([
    { player_name: "", shirt_number: "", reason: "", photoFile: null, photoPreview: null, croppedBlob: null },
  ]);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const teamSlug = AGE_GROUP_TO_SLUG[ageGroup] || "";
  const { data: roster = [] } = useTeamRoster(teamSlug);
  const selectedNames = entries.map((e) => e.player_name).filter(Boolean);

  const addEntry = () => {
    setEntries((prev) => [
      ...prev,
      { player_name: "", shirt_number: "", reason: "", photoFile: null, photoPreview: null, croppedBlob: null },
    ]);
  };

  const removeEntry = (i: number) => {
    if (entries[i].photoPreview) URL.revokeObjectURL(entries[i].photoPreview!);
    setEntries(entries.filter((_, idx) => idx !== i));
  };

  const updateEntry = (i: number, field: keyof POTMEntry, value: string | File | Blob | null) => {
    setEntries((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  };

  const handlePhotoChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Photo must be under 20MB");
      return;
    }

    setEntries((prev) => {
      const next = [...prev];
      if (next[i].photoPreview) URL.revokeObjectURL(next[i].photoPreview!);
      next[i] = {
        ...next[i],
        photoFile: file,
        photoPreview: URL.createObjectURL(file),
        croppedBlob: null,
      };
      return next;
    });
  };

  const clearPhoto = (i: number) => {
    setEntries((prev) => {
      const next = [...prev];
      if (next[i].photoPreview) URL.revokeObjectURL(next[i].photoPreview!);
      next[i] = { ...next[i], photoFile: null, photoPreview: null, croppedBlob: null };
      return next;
    });

    if (fileInputRefs.current[i]) fileInputRefs.current[i]!.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validEntries = entries.filter((en) => en.player_name.trim());
    if (!ageGroup || validEntries.length === 0) {
      toast.error("Please select a team and add at least one player");
      return;
    }
    setSubmitting(true);

    try {
      for (const entry of validEntries) {
        let photo_url: string | null = null;
        const fileToUpload = entry.croppedBlob
          ? new File([entry.croppedBlob], "potm-cropped.png", { type: "image/png" })
          : entry.photoFile;

        if (fileToUpload) {
          photo_url = await uploadPotmPhoto(fileToUpload, {
            playerName: entry.player_name.trim(),
            awardDate: matchDate || new Date().toISOString().split("T")[0],
            teamSlug: AGE_GROUP_TO_SLUG[ageGroup],
            onStatus: (status) => {
              if (status === "processing") toast.info("Preparing photo...");
              if (status === "processed") toast.success("Photo ready");
              if (status === "fallback") toast.warning("Using original photo");
            },
          });
        }

        const { error } = await supabase.from("player_of_the_match").insert({
          player_name: entry.player_name.trim(),
          shirt_number: entry.shirt_number ? parseInt(entry.shirt_number) : null,
          team_name: `Peterborough Athletic ${ageGroup}`,
          age_group: ageGroup,
          match_description: matchDescription.trim() || null,
          reason: entry.reason.trim() || null,
          photo_url,
          award_date: matchDate || new Date().toISOString().split("T")[0],
        });
        if (error) throw error;
      }

      entries.forEach((en) => {
        if (en.photoPreview) URL.revokeObjectURL(en.photoPreview);
      });
      toast.success(`${validEntries.length} POTM award${validEntries.length > 1 ? "s" : ""} submitted!`);
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit POTM");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="font-display text-xl font-bold text-foreground mb-2">POTM Submitted!</h3>
        <p className="text-muted-foreground mb-4">The award(s) will appear on the Player of the Match wall.</p>
        <button
          onClick={() => {
            setSubmitted(false);
            setFixtureKey("");
            setMatchDescription("");
            setMatchDate("");
            setAgeGroup(ageGroups.length === 1 ? ageGroups[0] : "");
            setEntries([{ player_name: "", shirt_number: "", reason: "", photoFile: null, photoPreview: null, croppedBlob: null }]);
          }}
          className="text-sm font-display text-primary hover:text-gold-light transition-colors"
        >
          Submit another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <Star className="h-5 w-5 text-primary" />
        <h3 className="font-display text-lg font-bold text-foreground">Player of the Match</h3>
      </div>

      <div>
        <label className="block text-xs font-display tracking-wider text-muted-foreground mb-1">Team *</label>
        <select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground">
          <option value="">Select team</option>
          {ageGroups.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      <FixtureSelect
        ageGroup={ageGroup}
        value={fixtureKey}
        onChange={(opponent, date) => {
          setFixtureKey(`${date}|${opponent}`);
          setMatchDescription(opponent);
          if (date.includes("-")) {
            setMatchDate(date);
          } else if (date.includes("/")) {
            const [dd, mm, yy] = date.split("/");
            const fullYear = yy.length === 4 ? yy : `20${yy}`;
            setMatchDate(`${fullYear}-${mm}-${dd}`);
          }
        }}
      />

      {entries.map((entry, i) => (
        <div key={i} className="border border-border rounded-lg p-4 space-y-4 relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-display text-muted-foreground">POTM #{i + 1}</span>
            {entries.length > 1 && (
              <button type="button" onClick={() => removeEntry(i)} className="text-destructive hover:text-destructive/80 transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-display tracking-wider text-muted-foreground mb-1">Player Full Name *</label>
              <select
                value={entry.player_name}
                onChange={(e) => {
                  const selected = roster.find((p) => p.first_name === e.target.value);
                  updateEntry(i, "player_name", e.target.value);
                  if (selected?.shirt_number) updateEntry(i, "shirt_number", String(selected.shirt_number));
                }}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground"
              >
                <option value="">Select player</option>
                {roster
                  .filter((p) => !selectedNames.includes(p.first_name) || p.first_name === entry.player_name)
                  .map((p) => (
                    <option key={p.id} value={p.first_name}>
                      {p.shirt_number ? `#${p.shirt_number} ` : ""}{p.first_name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-display tracking-wider text-muted-foreground mb-1">Shirt Number</label>
              <input type="number" value={entry.shirt_number} onChange={(e) => updateEntry(i, "shirt_number", e.target.value)} placeholder="e.g. 7" className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-display tracking-wider text-muted-foreground mb-1">Reason for Award</label>
            <textarea value={entry.reason} onChange={(e) => updateEntry(i, "reason", e.target.value)} placeholder="What made this player stand out?" rows={2} className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none" />
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-display tracking-wider text-muted-foreground">Player Photo</label>
            <input
              id={`potm-photo-upload-${i}`}
              ref={(el) => { fileInputRefs.current[i] = el; }}
              type="file"
              accept="image/*"
              onChange={(e) => handlePhotoChange(i, e)}
              className="hidden"
            />

            {entry.photoPreview ? (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-border">
                    <img src={entry.photoPreview} alt="Preview" className="w-full h-full object-contain" />
                    <button type="button" onClick={() => clearPhoto(i)} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">×</button>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRefs.current[i]?.click()}
                    className="border border-border rounded-lg px-3 py-2 text-xs font-display text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                  >
                    Change photo
                  </button>
                </div>

                <POTMCardPreview
                  photoPreview={entry.photoPreview}
                  playerName={entry.player_name || "Player Name"}
                  shirtNumber={entry.shirt_number ? parseInt(entry.shirt_number) : null}
                  ageGroup={ageGroup || undefined}
                  onCroppedImage={(blob) => {
                    setEntries((prev) => {
                      const next = [...prev];
                      next[i] = { ...next[i], croppedBlob: blob };
                      return next;
                    });
                  }}
                />
              </div>
            ) : (
              <label
                htmlFor={`potm-photo-upload-${i}`}
                className="flex items-center gap-3 cursor-pointer bg-secondary border border-dashed border-border rounded-lg px-4 py-4 hover:border-primary/50 transition-colors"
              >
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Click to upload a photo</span>
              </label>
            )}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addEntry}
        className="w-full border border-dashed border-border rounded-lg py-2.5 text-sm font-display text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="h-4 w-4" /> Add Another POTM
      </button>

      <button type="submit" disabled={submitting} className="w-full bg-primary text-primary-foreground font-display tracking-wider py-3 rounded-lg hover:bg-gold-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
        {submitting ? "Submitting..." : `Submit POTM${entries.length > 1 ? ` (${entries.length})` : ""}`}
      </button>
    </form>
  );
}
interface GoalAssistEntry { playerId: string; count: number; }

export function MatchReportForm({ ageGroups }: { ageGroups: string[] }) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [fixtureKey, setFixtureKey] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [ageGroup, setAgeGroup] = useState(ageGroups.length === 1 ? ageGroups[0] : "");
  const [opponent, setOpponent] = useState("");
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [goalEntries, setGoalEntries] = useState<GoalAssistEntry[]>([]);
  const [assistEntries, setAssistEntries] = useState<GoalAssistEntry[]>([]);
  const [notes, setNotes] = useState("");

  const slug = AGE_GROUP_TO_SLUG[ageGroup];
  const { data: roster = [] } = useTeamRoster(slug);

  const addGoalEntry = () => setGoalEntries([...goalEntries, { playerId: "", count: 1 }]);
  const addAssistEntry = () => setAssistEntries([...assistEntries, { playerId: "", count: 1 }]);
  const removeGoalEntry = (i: number) => setGoalEntries(goalEntries.filter((_, idx) => idx !== i));
  const removeAssistEntry = (i: number) => setAssistEntries(assistEntries.filter((_, idx) => idx !== i));

  const updateGoalEntry = (i: number, field: keyof GoalAssistEntry, val: string | number) => {
    const next = [...goalEntries]; next[i] = { ...next[i], [field]: val }; setGoalEntries(next);
  };
  const updateAssistEntry = (i: number, field: keyof GoalAssistEntry, val: string | number) => {
    const next = [...assistEntries]; next[i] = { ...next[i], [field]: val }; setAssistEntries(next);
  };

  const buildText = (entries: GoalAssistEntry[]) =>
    entries.filter(e => e.playerId).map(e => {
      const p = roster.find(r => r.id === e.playerId);
      return p ? `${p.first_name}${e.count > 1 ? ` x${e.count}` : ""}` : "";
    }).filter(Boolean).join(", ");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ageGroup || !opponent) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (!slug) {
      toast.error("Could not map this age group to a team slug");
      return;
    }

    setSubmitting(true);

    try {
      const normalizedMatchDate = (() => {
        let d = matchDate || new Date().toISOString().split("T")[0];
        if (d.includes("/")) {
          const [dd, mm, yy] = d.split("/");
          d = `${yy.length === 4 ? yy : "20" + yy}-${mm}-${dd}`;
        }
        return d;
      })();

      const trimmedOpponent = opponent.trim();

      const { error: reportError } = await supabase.from("match_reports").insert({
        team_name: `Peterborough Athletic ${ageGroup}`,
        age_group: ageGroup,
        opponent: trimmedOpponent,
        home_score: parseInt(homeScore) || 0,
        away_score: parseInt(awayScore) || 0,
        goal_scorers: buildText(goalEntries) || null,
        assists: buildText(assistEntries) || null,
        notes: notes.trim() || null,
        match_date: normalizedMatchDate,
      });
      if (reportError) throw reportError;

      const playerMap = new Map<string, { goals: number; assists: number }>();

      for (const entry of goalEntries.filter((g) => g.playerId)) {
        const existing = playerMap.get(entry.playerId) || { goals: 0, assists: 0 };
        existing.goals += entry.count;
        playerMap.set(entry.playerId, existing);
      }

      for (const entry of assistEntries.filter((a) => a.playerId)) {
        const existing = playerMap.get(entry.playerId) || { goals: 0, assists: 0 };
        existing.assists += entry.count;
        playerMap.set(entry.playerId, existing);
      }

      if (playerMap.size > 0) {
        const matchStats = Array.from(playerMap.entries()).map(([playerId, stats]) => ({
          player_stat_id: playerId,
          team_slug: slug,
          match_date: normalizedMatchDate,
          opponent: trimmedOpponent,
          goals: stats.goals,
          assists: stats.assists,
        }));

        const { error: statsError } = await supabase
          .from("match_player_stats")
          .upsert(matchStats, { onConflict: "player_stat_id,match_date,opponent" });
        if (statsError) throw statsError;
      }

      toast.success("Match report submitted!");
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit match report");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmitted(false); setFixtureKey(""); setMatchDate("");
    setAgeGroup(ageGroups.length === 1 ? ageGroups[0] : "");
    setOpponent(""); setHomeScore(""); setAwayScore("");
    setGoalEntries([]); setAssistEntries([]); setNotes("");
  };

  if (submitted) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="font-display text-xl font-bold text-foreground mb-2">Match Report Submitted!</h3>
        <p className="text-muted-foreground mb-4">Thank you for reporting the result.</p>
        <button onClick={resetForm} className="text-sm font-display text-primary hover:text-gold-light transition-colors">
          Submit another
        </button>
      </div>
    );
  }

  const renderEntryList = (
    entries: GoalAssistEntry[],
    updateFn: (i: number, field: keyof GoalAssistEntry, val: string | number) => void,
    removeFn: (i: number) => void,
    addFn: () => void,
    label: string,
    emptyText: string,
  ) => (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-xs font-display tracking-wider text-muted-foreground">{label}</label>
        <button type="button" onClick={addFn} className="text-xs font-display text-primary hover:text-gold-light transition-colors flex items-center gap-1">
          <Plus className="h-3 w-3" /> Add
        </button>
      </div>
      {entries.length === 0 ? (
        <p className="text-xs text-muted-foreground italic py-2">{emptyText}</p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, i) => (
            <div key={i} className="flex items-center gap-2">
              <select
                value={entry.playerId}
                onChange={(e) => updateFn(i, "playerId", e.target.value)}
                className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground"
              >
                <option value="">Select player</option>
                {roster.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.shirt_number ? `#${p.shirt_number} ` : ""}{p.first_name}
                  </option>
                ))}
              </select>
              <input
                type="number" min="1" value={entry.count}
                onChange={(e) => updateFn(i, "count", parseInt(e.target.value) || 1)}
                className="w-16 bg-secondary border border-border rounded-lg px-2 py-2 text-sm text-foreground text-center"
              />
              <button type="button" onClick={() => removeFn(i)} className="p-1.5 text-destructive hover:text-destructive/80">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <FileText className="h-5 w-5 text-primary" />
        <h3 className="font-display text-lg font-bold text-foreground">Match Report</h3>
      </div>

      <div>
        <label className="block text-xs font-display tracking-wider text-muted-foreground mb-1">Team *</label>
        <select value={ageGroup} onChange={(e) => { setAgeGroup(e.target.value); setGoalEntries([]); setAssistEntries([]); }} className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground">
          <option value="">Select team</option>
          {ageGroups.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      <FixtureSelect
        ageGroup={ageGroup}
        value={fixtureKey}
        onChange={(opp, date) => {
          setFixtureKey(`${date}|${opp}`);
          if (date.includes("-")) {
            setMatchDate(date);
          } else if (date.includes("/")) {
            const [dd, mm, yy] = date.split("/");
            const fullYear = yy.length === 4 ? yy : `20${yy}`;
            setMatchDate(`${fullYear}-${mm}-${dd}`);
          }
          setOpponent(opp);
        }}
        label="Opponent *"
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-display tracking-wider text-muted-foreground mb-1">Our Score</label>
          <input type="number" min="0" value={homeScore} onChange={(e) => setHomeScore(e.target.value)} placeholder="0" className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground" />
        </div>
        <div>
          <label className="block text-xs font-display tracking-wider text-muted-foreground mb-1">Their Score</label>
          <input type="number" min="0" value={awayScore} onChange={(e) => setAwayScore(e.target.value)} placeholder="0" className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground" />
        </div>
      </div>

      {renderEntryList(goalEntries, updateGoalEntry, removeGoalEntry, addGoalEntry, "Goal Scorers", "No goals — click Add to log scorers")}
      {renderEntryList(assistEntries, updateAssistEntry, removeAssistEntry, addAssistEntry, "Assists", "No assists — click Add to log")}

      {roster.length === 0 && ageGroup && (
        <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 rounded-md p-2">
          ⚠️ No players in roster yet. Add players via the Stats tab first.
        </p>
      )}

      <div>
        <label className="block text-xs font-display tracking-wider text-muted-foreground mb-1">Match Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any additional notes about the match..." rows={3} className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none" />
      </div>

      <button type="submit" disabled={submitting} className="w-full bg-primary text-primary-foreground font-display tracking-wider py-3 rounded-lg hover:bg-gold-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
        {submitting ? "Submitting..." : "Submit Match Report"}
      </button>
    </form>
  );
}

export default function CoachPanelPage() {
  const { user, loading, isCoach, isAdmin, rolesLoading } = useAuth();
  const { assignedGroups, isLoading: ageGroupsLoading } = useUserAgeGroups();
  const [activeTab, setActiveTab] = useState<"potm" | "report" | "stats" | "manage">("potm");

  // Admins see all age groups, coaches see only their assigned ones
  const effectiveAgeGroups = isAdmin ? ALL_AGE_GROUPS : assignedGroups;

  if (loading || rolesLoading || ageGroupsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth?redirect=/coach-panel" replace />;
  }

  if (!isCoach) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-28 pb-16 flex items-center justify-center">
          <div className="text-center px-4">
            <ShieldX className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold font-display text-foreground mb-2">Access Denied</h1>
            <p className="text-muted-foreground max-w-md">
              You don't have coach permissions. Please contact a club admin to request access.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const hasAgeGroups = effectiveAgeGroups.length > 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex items-center justify-center gap-3 mb-2">
              <Trophy className="h-6 w-6 text-primary" />
              <h1 className="text-4xl md:text-5xl font-bold font-display text-center">
                <span className="text-gold-gradient">Coach</span> Panel
              </h1>
            </div>
            <p className="text-muted-foreground text-center mb-2">Submit match reports & Player of the Match awards</p>
            {hasAgeGroups && !isAdmin && (
              <p className="text-xs text-center text-primary/80 mb-6">
                Managing: {effectiveAgeGroups.join(", ")}
              </p>
            )}
            {isAdmin && (
              <p className="text-xs text-center text-primary/80 mb-6">
                Admin — All age groups
              </p>
            )}
          </motion.div>

          <div className="max-w-2xl mx-auto">
            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveTab("potm")}
                className={`flex-1 flex items-center justify-center gap-2 font-display text-sm tracking-wider py-3 rounded-lg border transition-all ${
                  activeTab === "potm" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                }`}
              >
                <Star className="h-4 w-4" />
                POTM
              </button>
              <button
                onClick={() => setActiveTab("report")}
                className={`flex-1 flex items-center justify-center gap-2 font-display text-sm tracking-wider py-3 rounded-lg border transition-all ${
                  activeTab === "report" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                }`}
              >
                <FileText className="h-4 w-4" />
                Match Report
              </button>
              <button
                onClick={() => setActiveTab("stats")}
                className={`flex-1 flex items-center justify-center gap-2 font-display text-sm tracking-wider py-3 rounded-lg border transition-all ${
                  activeTab === "stats" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                Player Stats
              </button>
              <button
                onClick={() => setActiveTab("manage")}
                className={`flex-1 flex items-center justify-center gap-2 font-display text-sm tracking-wider py-3 rounded-lg border transition-all ${
                  activeTab === "manage" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                }`}
              >
                <Settings className="h-4 w-4" />
                Manage
              </button>
            </div>

            {!hasAgeGroups ? (
              <NoAgeGroupsWarning />
            ) : (
              <>
                {activeTab === "potm" ? (
                  <POTMForm ageGroups={effectiveAgeGroups} />
                ) : activeTab === "report" ? (
                  <MatchReportForm ageGroups={effectiveAgeGroups} />
                ) : activeTab === "stats" ? (
                  <PlayerStatsForm allowedAgeGroups={effectiveAgeGroups} />
                ) : (
                  <ManageSubmissionsForm allowedAgeGroups={effectiveAgeGroups} />
                )}
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
