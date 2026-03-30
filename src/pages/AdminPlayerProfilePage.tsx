import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { toast } from "sonner";
import {
  ArrowLeft, User, Shield, Trophy, FileText, Calendar,
  Plus, Trash2, Loader2, Upload, Clock, MapPin, Car,
  Activity, Award, Star, X
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { DateInput } from "@/components/ui/date-input";

type AppRole = string;

const ROLE_CONFIG: Record<AppRole, { label: string; color: string }> = {
  admin: { label: "Admin", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  coach: { label: "Coach", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  player: { label: "Player", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  user: { label: "User", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  treasurer: { label: "Treasurer", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
};

const DOC_TYPES = [
  { value: "medical", label: "Medical Form" },
  { value: "consent", label: "Consent Form" },
  { value: "emergency_contact", label: "Emergency Contact" },
  { value: "registration", label: "Registration" },
  { value: "id_document", label: "ID Document" },
  { value: "general", label: "General" },
];

interface PlayerDocument {
  id: string;
  title: string;
  document_type: string;
  file_url: string | null;
  notes: string | null;
  expiry_date: string | null;
  created_at: string;
}

interface PlayerStat {
  id: string;
  first_name: string;
  team_name: string;
  age_group: string;
  goals: number;
  assists: number;
  appearances: number;
  potm_awards: number;
  shirt_number: number | null;
}

interface POTMAward {
  id: string;
  player_name: string;
  team_name: string;
  age_group: string;
  award_date: string;
  match_description: string | null;
  reason: string | null;
}

interface AvailabilityRecord {
  id: string;
  opponent: string;
  fixture_date: string;
  status: string;
  team_slug: string;
  note: string | null;
}

export default function AdminPlayerProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ id: string; full_name: string | null; email: string | null; created_at: string } | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [ageGroups, setAgeGroups] = useState<string[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStat[]>([]);
  const [potmAwards, setPotmAwards] = useState<POTMAward[]>([]);
  const [documents, setDocuments] = useState<PlayerDocument[]>([]);
  const [availability, setAvailability] = useState<AvailabilityRecord[]>([]);
  const [teamMemberships, setTeamMemberships] = useState<{ team_slug: string; role: string }[]>([]);
  const [activeTab, setActiveTab] = useState("overview");

  // Document form state
  const [showDocForm, setShowDocForm] = useState(false);
  const [docTitle, setDocTitle] = useState("");
  const [docType, setDocType] = useState("general");
  const [docNotes, setDocNotes] = useState("");
  const [docExpiry, setDocExpiry] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (userId) loadAll();
  }, [userId]);

  async function loadAll() {
    setLoading(true);
    const [profileRes, rolesRes, ageRes, statsRes, potmRes, docsRes, availRes, teamRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId!).single(),
      supabase.from("user_roles").select("role").eq("user_id", userId!),
      supabase.from("user_age_groups").select("age_group").eq("user_id", userId!),
      supabase.from("player_stats").select("*"),
      supabase.from("player_of_the_match").select("*").order("award_date", { ascending: false }),
      supabase.from("player_documents").select("*").eq("user_id", userId!).order("created_at", { ascending: false }),
      supabase.from("fixture_availability").select("*").eq("user_id", userId!).order("fixture_date", { ascending: false }).limit(20),
      supabase.from("team_members").select("team_slug, role").eq("user_id", userId!),
    ]);

    setProfile(profileRes.data);
    setRoles((rolesRes.data ?? []).map(r => r.role));
    setAgeGroups((ageRes.data ?? []).map(a => a.age_group));
    setPlayerStats(statsRes.data ?? []);
    setPotmAwards(potmRes.data ?? []);
    setDocuments(docsRes.data ?? []);
    setAvailability(availRes.data ?? []);
    setTeamMemberships(teamRes.data ?? []);
    setLoading(false);
  }

  // Match player name from profile to POTM awards
  const playerName = profile?.full_name || "";
  const matchedPotm = potmAwards.filter(p =>
    p.player_name.toLowerCase() === playerName.toLowerCase()
  );

  // Match player stats by name
  const matchedStats = playerStats.filter(s =>
    s.first_name.toLowerCase() === playerName.toLowerCase()
  );

  const totalGoals = matchedStats.reduce((s, p) => s + p.goals, 0);
  const totalAssists = matchedStats.reduce((s, p) => s + p.assists, 0);
  const totalApps = matchedStats.reduce((s, p) => s + p.appearances, 0);
  const totalPotm = matchedStats.reduce((s, p) => s + p.potm_awards, 0);

  async function uploadDocument() {
    if (!docTitle.trim()) { toast.error("Title is required"); return; }
    setUploading(true);

    let fileUrl: string | null = null;
    if (docFile) {
      const ext = docFile.name.split(".").pop();
      const path = `player-docs/${userId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("club-photos").upload(path, docFile);
      if (uploadError) { toast.error("Failed to upload file"); setUploading(false); return; }
      const { data: urlData } = supabase.storage.from("club-photos").getPublicUrl(path);
      fileUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from("player_documents").insert({
      user_id: userId!,
      title: docTitle,
      document_type: docType,
      notes: docNotes || null,
      expiry_date: docExpiry || null,
      file_url: fileUrl,
      uploaded_by: currentUser?.id,
    });

    if (error) toast.error("Failed to save document");
    else {
      toast.success("Document added");
      setShowDocForm(false);
      setDocTitle(""); setDocType("general"); setDocNotes(""); setDocExpiry(""); setDocFile(null);
      loadAll();
    }
    setUploading(false);
  }

  async function deleteDocument(id: string) {
    const { error } = await supabase.from("player_documents").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Document removed"); loadAll(); }
  }

  const TABS = [
    { key: "overview", label: "Overview", icon: User },
    { key: "stats", label: "Stats & History", icon: Activity },
    { key: "documents", label: "Documents", icon: FileText },
    { key: "availability", label: "Availability", icon: Calendar },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Player not found</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="max-w-5xl mx-auto px-4">
          {/* Back link */}
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>

          {/* Player Header */}
          <div className="bg-card border border-border rounded-xl p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary font-display text-2xl font-bold shrink-0">
                {(profile.full_name || profile.email || "?")[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-display font-bold text-foreground">
                  {profile.full_name || "Unnamed Player"}
                </h1>
                <p className="text-sm text-muted-foreground mb-3">{profile.email}</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {roles.map(role => (
                    <span key={role} className={`px-2.5 py-1 rounded-full text-xs font-display border ${ROLE_CONFIG[role].color}`}>
                      {ROLE_CONFIG[role].label}
                    </span>
                  ))}
                  {roles.length === 0 && <span className="text-xs text-muted-foreground italic">No roles assigned</span>}
                </div>
                {ageGroups.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {ageGroups.map(ag => (
                      <span key={ag} className="px-2 py-0.5 rounded-full text-xs bg-secondary text-secondary-foreground">{ag}</span>
                    ))}
                  </div>
                )}
                {teamMemberships.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {teamMemberships.map(tm => (
                      <span key={tm.team_slug} className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/20">
                        {tm.team_slug} ({tm.role})
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p>Joined</p>
                <p className="font-display">{new Date(profile.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-border">
              {[
                { label: "Appearances", value: totalApps, icon: Activity, color: "text-foreground" },
                { label: "Goals", value: totalGoals, icon: Trophy, color: "text-amber-400" },
                { label: "Assists", value: totalAssists, icon: Star, color: "text-emerald-400" },
                { label: "POTM Awards", value: totalPotm, icon: Award, color: "text-primary" },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <s.icon className={`h-5 w-5 mx-auto mb-1 ${s.color}`} />
                  <p className={`text-xl font-display font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-card border border-border rounded-xl p-1 overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-display transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              {/* Recent POTM */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="text-sm font-display tracking-wider uppercase text-muted-foreground mb-4 flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" /> Player of the Match Awards
                </h3>
                {matchedPotm.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No POTM awards yet</p>
                ) : (
                  <div className="space-y-3">
                    {matchedPotm.slice(0, 5).map(p => (
                      <div key={p.id} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
                        <Award className="h-5 w-5 text-amber-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-display font-semibold text-foreground">{p.match_description || p.team_name}</p>
                          <p className="text-xs text-muted-foreground">{p.reason}</p>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">{new Date(p.award_date).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Documents */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="text-sm font-display tracking-wider uppercase text-muted-foreground mb-4 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> Recent Documents
                </h3>
                {documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No documents uploaded yet</p>
                ) : (
                  <div className="space-y-2">
                    {documents.slice(0, 3).map(d => (
                      <div key={d.id} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-display font-semibold text-foreground truncate">{d.title}</p>
                          <p className="text-xs text-muted-foreground capitalize">{d.document_type.replace("_", " ")}</p>
                        </div>
                        {d.expiry_date && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${new Date(d.expiry_date) < new Date() ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                            {new Date(d.expiry_date) < new Date() ? "Expired" : `Exp: ${new Date(d.expiry_date).toLocaleDateString()}`}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "stats" && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-display tracking-wider uppercase text-muted-foreground mb-4 flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Performance by Team
              </h3>
              {matchedStats.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No player stats found for this user</p>
              ) : (
                <div className="space-y-4">
                  {matchedStats.map(s => (
                    <div key={s.id} className="p-4 bg-secondary/30 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm font-display font-bold text-foreground">{s.team_name}</p>
                          <p className="text-xs text-muted-foreground">{s.age_group} {s.shirt_number ? `• #${s.shirt_number}` : ""}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        {[
                          { label: "Apps", value: s.appearances },
                          { label: "Goals", value: s.goals },
                          { label: "Assists", value: s.assists },
                          { label: "POTM", value: s.potm_awards },
                        ].map(stat => (
                          <div key={stat.label} className="text-center">
                            <p className="text-lg font-display font-bold text-foreground">{stat.value}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">{stat.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "documents" && (
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-display tracking-wider uppercase text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> Player Documents
                </h3>
                <button
                  onClick={() => setShowDocForm(!showDocForm)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-display hover:bg-primary/90 transition-colors"
                >
                  {showDocForm ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                  {showDocForm ? "Cancel" : "Add Document"}
                </button>
              </div>

              {/* Add Document Form */}
              {showDocForm && (
                <div className="p-4 bg-secondary/30 rounded-lg mb-4 space-y-3">
                  <input
                    value={docTitle}
                    onChange={e => setDocTitle(e.target.value)}
                    placeholder="Document title..."
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={docType}
                      onChange={e => setDocType(e.target.value)}
                      className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                    >
                      {DOC_TYPES.map(dt => <option key={dt.value} value={dt.value}>{dt.label}</option>)}
                    </select>
                    <DateInput value={docExpiry} onChange={setDocExpiry} placeholder="Expiry date" />
                  </div>
                  <textarea
                    value={docNotes}
                    onChange={e => setDocNotes(e.target.value)}
                    placeholder="Notes..."
                    rows={2}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none"
                  />
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-lg text-sm text-muted-foreground cursor-pointer hover:border-primary transition-colors">
                      <Upload className="h-4 w-4" />
                      {docFile ? docFile.name : "Attach file"}
                      <input type="file" className="hidden" onChange={e => setDocFile(e.target.files?.[0] || null)} />
                    </label>
                    <button
                      onClick={uploadDocument}
                      disabled={uploading}
                      className="ml-auto px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-display hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Document"}
                    </button>
                  </div>
                </div>
              )}

              {/* Document List */}
              {documents.length === 0 ? (
                <p className="text-sm text-muted-foreground italic py-8 text-center">No documents uploaded yet</p>
              ) : (
                <div className="space-y-2">
                  {documents.map(d => (
                    <div key={d.id} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg group">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-display font-semibold text-foreground truncate">{d.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {d.document_type.replace("_", " ")}
                          {d.notes && ` • ${d.notes}`}
                        </p>
                      </div>
                      {d.expiry_date && (
                        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${new Date(d.expiry_date) < new Date() ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                          {new Date(d.expiry_date) < new Date() ? "Expired" : new Date(d.expiry_date).toLocaleDateString()}
                        </span>
                      )}
                      {d.file_url && (
                        <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline shrink-0">View</a>
                      )}
                      <button onClick={() => deleteDocument(d.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all shrink-0">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "availability" && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-display tracking-wider uppercase text-muted-foreground mb-4 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" /> Fixture Availability History
              </h3>
              {availability.length === 0 ? (
                <p className="text-sm text-muted-foreground italic py-8 text-center">No availability records</p>
              ) : (
                <div className="space-y-2">
                  {availability.map(a => (
                    <div key={a.id} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        a.status === "available" ? "bg-emerald-400" :
                        a.status === "unavailable" ? "bg-red-400" : "bg-amber-400"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-display font-semibold text-foreground">vs {a.opponent}</p>
                        <p className="text-xs text-muted-foreground">{a.team_slug} • {a.fixture_date}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                        a.status === "available" ? "bg-emerald-500/20 text-emerald-400" :
                        a.status === "unavailable" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
                      }`}>
                        {a.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
