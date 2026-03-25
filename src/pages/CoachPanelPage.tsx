import { useState } from "react";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Trophy, FileText, Upload, Star, CheckCircle, Loader2, ShieldX, BarChart3, Settings, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { ManageSubmissionsForm } from "@/components/ManageSubmissionsForm";
import { PlayerStatsForm } from "@/components/PlayerStatsForm";
import { useUserAgeGroups } from "@/hooks/useUserAgeGroups";
import { useTeamFixtures, type FAFixture } from "@/hooks/useTeamFixtures";
import { faTeamConfigs } from "@/lib/faFixtureConfig";

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
  const { data, isLoading } = useTeamFixtures(slug);

  const allFixtures = [...(data?.results || []), ...(data?.fixtures || [])];
  
  const getOpponent = (f: FAFixture) => {
    const isHome = f.homeTeam.includes("Peterborough Ath");
    return isHome ? f.awayTeam : f.homeTeam;
  };

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
    <div>
      <label className="block text-xs font-display tracking-wider text-muted-foreground mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => {
          const selected = allFixtures.find((f) => `${f.date}|${getOpponent(f)}` === e.target.value);
          if (selected) {
            onChange(getOpponent(selected), selected.date);
          } else {
            onChange("", "");
          }
        }}
        className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground"
      >
        <option value="">{isLoading ? "Loading fixtures..." : "Select a fixture"}</option>
        {data?.results && data.results.length > 0 && (
          <optgroup label="Results">
            {data.results.map((f, i) => {
              const opp = getOpponent(f);
              const key = `${f.date}|${opp}`;
              return (
                <option key={`r-${i}`} value={key}>
                  {f.date} — vs {opp} ({f.homeScore}-{f.awayScore})
                </option>
              );
            })}
          </optgroup>
        )}
        {data?.fixtures && data.fixtures.length > 0 && (
          <optgroup label="Upcoming Fixtures">
            {data.fixtures.map((f, i) => {
              const opp = getOpponent(f);
              const key = `${f.date}|${opp}`;
              return (
                <option key={`f-${i}`} value={key}>
                  {f.date} — vs {opp}
                </option>
              );
            })}
          </optgroup>
        )}
      </select>
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

function POTMForm({ ageGroups }: { ageGroups: string[] }) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [fixtureKey, setFixtureKey] = useState("");
  const [form, setForm] = useState({
    player_name: "",
    shirt_number: "",
    team_name: "",
    age_group: ageGroups.length === 1 ? ageGroups[0] : "",
    match_description: "",
    reason: "",
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.player_name || !form.age_group || !form.team_name) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSubmitting(true);

    let photo_url: string | null = null;

    if (photoFile) {
      const fileExt = photoFile.name.split(".").pop();
      const filePath = `potm/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("club-photos")
        .upload(filePath, photoFile);

      if (uploadError) {
        toast.error("Failed to upload photo");
        setSubmitting(false);
        return;
      }

      const { data: urlData } = supabase.storage.from("club-photos").getPublicUrl(filePath);
      photo_url = urlData.publicUrl;
    }

    const { error } = await supabase.from("player_of_the_match").insert({
      player_name: form.player_name.trim(),
      shirt_number: form.shirt_number ? parseInt(form.shirt_number) : null,
      team_name: form.team_name.trim(),
      age_group: form.age_group,
      match_description: form.match_description.trim() || null,
      reason: form.reason.trim() || null,
      photo_url,
      award_date: new Date().toISOString().split("T")[0],
    });

    setSubmitting(false);
    if (error) {
      toast.error("Failed to submit POTM");
    } else {
      toast.success("Player of the Match submitted!");
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="font-display text-xl font-bold text-foreground mb-2">POTM Submitted!</h3>
        <p className="text-muted-foreground mb-4">The award will appear on the Player of the Match wall.</p>
        <button
          onClick={() => { setSubmitted(false); setFixtureKey(""); setForm({ player_name: "", shirt_number: "", team_name: "", age_group: ageGroups.length === 1 ? ageGroups[0] : "", match_description: "", reason: "" }); setPhotoFile(null); setPhotoPreview(null); }}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-display tracking-wider text-muted-foreground mb-1">Age Group *</label>
          <select value={form.age_group} onChange={(e) => setForm({ ...form, age_group: e.target.value })} className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground">
            <option value="">Select age group</option>
            {ageGroups.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-display tracking-wider text-muted-foreground mb-1">Team Name *</label>
          <input value={form.team_name} onChange={(e) => setForm({ ...form, team_name: e.target.value })} placeholder="e.g. Peterborough Athletic U9s" className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-display tracking-wider text-muted-foreground mb-1">Player Full Name *</label>
          <input value={form.player_name} onChange={(e) => setForm({ ...form, player_name: e.target.value })} placeholder="Full name" className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground" />
        </div>
        <div>
          <label className="block text-xs font-display tracking-wider text-muted-foreground mb-1">Shirt Number</label>
          <input type="number" value={form.shirt_number} onChange={(e) => setForm({ ...form, shirt_number: e.target.value })} placeholder="e.g. 7" className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground" />
        </div>
      </div>

      <FixtureSelect
        ageGroup={form.age_group}
        value={fixtureKey}
        onChange={(opponent, date) => {
          setFixtureKey(`${date}|${opponent}`);
          setForm({ ...form, match_description: opponent });
        }}
      />

      <div>
        <label className="block text-xs font-display tracking-wider text-muted-foreground mb-1">Reason for Award</label>
        <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="What made this player stand out?" rows={3} className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none" />
      </div>

      <div>
        <label className="block text-xs font-display tracking-wider text-muted-foreground mb-2">Player Photo</label>
        {photoPreview ? (
          <div className="relative w-32 h-32 rounded-lg overflow-hidden">
            <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
            <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview(null); }} className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">×</button>
          </div>
        ) : (
          <label className="flex items-center gap-3 cursor-pointer bg-secondary border border-dashed border-border rounded-lg px-4 py-6 hover:border-primary/50 transition-colors">
            <Upload className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Click to upload a photo</span>
            <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
          </label>
        )}
      </div>

      <button type="submit" disabled={submitting} className="w-full bg-primary text-primary-foreground font-display tracking-wider py-3 rounded-lg hover:bg-gold-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
        {submitting ? "Submitting..." : "Submit POTM"}
      </button>
    </form>
  );
}

function MatchReportForm({ ageGroups }: { ageGroups: string[] }) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [fixtureKey, setFixtureKey] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [form, setForm] = useState({
    team_name: "",
    age_group: ageGroups.length === 1 ? ageGroups[0] : "",
    opponent: "",
    home_score: "",
    away_score: "",
    goal_scorers: "",
    assists: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.team_name || !form.age_group || !form.opponent) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSubmitting(true);

    const { error } = await supabase.from("match_reports").insert({
      team_name: form.team_name.trim(),
      age_group: form.age_group,
      opponent: form.opponent.trim(),
      home_score: parseInt(form.home_score) || 0,
      away_score: parseInt(form.away_score) || 0,
      goal_scorers: form.goal_scorers.trim() || null,
      assists: form.assists.trim() || null,
      notes: form.notes.trim() || null,
      match_date: matchDate || new Date().toISOString().split("T")[0],
    });

    setSubmitting(false);
    if (error) {
      toast.error("Failed to submit match report");
    } else {
      toast.success("Match report submitted!");
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="font-display text-xl font-bold text-foreground mb-2">Match Report Submitted!</h3>
        <p className="text-muted-foreground mb-4">Thank you for reporting the result.</p>
        <button
          onClick={() => { setSubmitted(false); setFixtureKey(""); setMatchDate(""); setForm({ team_name: "", age_group: ageGroups.length === 1 ? ageGroups[0] : "", opponent: "", home_score: "", away_score: "", goal_scorers: "", assists: "", notes: "" }); }}
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
        <FileText className="h-5 w-5 text-primary" />
        <h3 className="font-display text-lg font-bold text-foreground">Match Report</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-display tracking-wider text-muted-foreground mb-1">Age Group *</label>
          <select value={form.age_group} onChange={(e) => setForm({ ...form, age_group: e.target.value })} className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground">
            <option value="">Select age group</option>
            {ageGroups.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-display tracking-wider text-muted-foreground mb-1">Your Team Name *</label>
          <input value={form.team_name} onChange={(e) => setForm({ ...form, team_name: e.target.value })} placeholder="e.g. Peterborough Athletic U9s" className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground" />
        </div>
      </div>

      <FixtureSelect
        ageGroup={form.age_group}
        value={fixtureKey}
        onChange={(opponent, date) => {
          setFixtureKey(`${date}|${opponent}`);
          setMatchDate(date);
          setForm({ ...form, opponent });
        }}
        label="Opponent *"
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-display tracking-wider text-muted-foreground mb-1">Our Score</label>
          <input type="number" min="0" value={form.home_score} onChange={(e) => setForm({ ...form, home_score: e.target.value })} placeholder="0" className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground" />
        </div>
        <div>
          <label className="block text-xs font-display tracking-wider text-muted-foreground mb-1">Their Score</label>
          <input type="number" min="0" value={form.away_score} onChange={(e) => setForm({ ...form, away_score: e.target.value })} placeholder="0" className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-display tracking-wider text-muted-foreground mb-1">Goal Scorers</label>
        <input value={form.goal_scorers} onChange={(e) => setForm({ ...form, goal_scorers: e.target.value })} placeholder="e.g. J. Smith (2), A. Jones (1)" className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground" />
      </div>

      <div>
        <label className="block text-xs font-display tracking-wider text-muted-foreground mb-1">Assists</label>
        <input value={form.assists} onChange={(e) => setForm({ ...form, assists: e.target.value })} placeholder="e.g. T. Brown, M. Wilson" className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground" />
      </div>

      <div>
        <label className="block text-xs font-display tracking-wider text-muted-foreground mb-1">Match Notes</label>
        <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any additional notes about the match..." rows={3} className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none" />
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
        <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
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
      <main className="flex-1 pt-24 pb-16">
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
