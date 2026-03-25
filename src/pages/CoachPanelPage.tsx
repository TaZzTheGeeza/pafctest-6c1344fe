import { useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, FileText, Upload, Star, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const ageGroups = [
  "U7s", "U8s Black", "U8s Gold", "U9s", "U10s",
  "U11s Black", "U11s Gold", "U13s Black", "U13s Gold", "U14s",
];

function POTMForm() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    player_name: "",
    shirt_number: "",
    team_name: "",
    age_group: "",
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
          onClick={() => { setSubmitted(false); setForm({ player_name: "", shirt_number: "", team_name: "", age_group: "", match_description: "", reason: "" }); setPhotoFile(null); setPhotoPreview(null); }}
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

      <div>
        <label className="block text-xs font-display tracking-wider text-muted-foreground mb-1">Match (Opponent)</label>
        <input value={form.match_description} onChange={(e) => setForm({ ...form, match_description: e.target.value })} placeholder="e.g. Thurlby Tigers U7 Yellow" className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground" />
      </div>

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

function MatchReportForm() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    team_name: "",
    age_group: "",
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
      match_date: new Date().toISOString().split("T")[0],
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
          onClick={() => { setSubmitted(false); setForm({ team_name: "", age_group: "", opponent: "", home_score: "", away_score: "", goal_scorers: "", assists: "", notes: "" }); }}
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

      <div>
        <label className="block text-xs font-display tracking-wider text-muted-foreground mb-1">Opponent *</label>
        <input value={form.opponent} onChange={(e) => setForm({ ...form, opponent: e.target.value })} placeholder="e.g. Thurlby Tigers U7 Yellow" className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground" />
      </div>

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
  const [activeTab, setActiveTab] = useState<"potm" | "report">("potm");

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
            <p className="text-muted-foreground text-center mb-8">Submit match reports & Player of the Match awards</p>
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
                Player of the Match
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
            </div>

            {activeTab === "potm" ? <POTMForm /> : <MatchReportForm />}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
