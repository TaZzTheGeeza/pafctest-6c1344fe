import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TeamAccessRequest } from "@/components/hub/TeamAccessRequest";
import {
  User, Trophy, FileText, Calendar, Loader2,
  Activity, Award, Star, ArrowLeft, Camera, Pencil, Check, X, UserPlus, Shield
} from "lucide-react";
import { toast } from "sonner";

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

export default function MyProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ full_name: string | null; email: string | null; created_at: string; avatar_url?: string | null } | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [ageGroups, setAgeGroups] = useState<string[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStat[]>([]);
  const [potmAwards, setPotmAwards] = useState<POTMAward[]>([]);
  const [documents, setDocuments] = useState<PlayerDocument[]>([]);
  const [availability, setAvailability] = useState<AvailabilityRecord[]>([]);
  const [teamMemberships, setTeamMemberships] = useState<{ team_slug: string; role: string }[]>([]);
  const [activeTab, setActiveTab] = useState("overview");

  // Edit state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) loadAll();
  }, [user]);

  async function loadAll() {
    if (!user) return;
    setLoading(true);
    const [profileRes, rolesRes, ageRes, statsRes, potmRes, docsRes, availRes, teamRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("user_roles").select("role").eq("user_id", user.id),
      supabase.from("user_age_groups").select("age_group").eq("user_id", user.id),
      supabase.from("player_stats").select("*"),
      supabase.from("player_of_the_match").select("*").order("award_date", { ascending: false }),
      supabase.from("player_documents").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("fixture_availability").select("*").eq("user_id", user.id).order("fixture_date", { ascending: false }).limit(20),
      supabase.from("team_members").select("team_slug, role").eq("user_id", user.id),
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

  const playerName = profile?.full_name || "";
  const matchedPotm = potmAwards.filter(p => p.player_name.toLowerCase() === playerName.toLowerCase());
  const matchedStats = playerStats.filter(s => s.first_name.toLowerCase() === playerName.toLowerCase());

  const totalGoals = matchedStats.reduce((s, p) => s + p.goals, 0);
  const totalAssists = matchedStats.reduce((s, p) => s + p.assists, 0);
  const totalApps = matchedStats.reduce((s, p) => s + p.appearances, 0);
  const totalPotm = matchedStats.reduce((s, p) => s + p.potm_awards, 0);

  async function handleSaveName() {
    if (!user || !editName.trim()) return;
    setSavingName(true);
    const { error } = await supabase.from("profiles").update({ full_name: editName.trim() }).eq("id", user.id);
    if (error) {
      toast.error("Failed to update name");
    } else {
      setProfile(prev => prev ? { ...prev, full_name: editName.trim() } : prev);
      toast.success("Name updated");
      setIsEditingName(false);
    }
    setSavingName(false);
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Image must be under 20MB");
      return;
    }

    setUploadingPhoto(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error("Failed to upload photo");
      setUploadingPhoto(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl } as any)
      .eq("id", user.id);

    if (updateError) {
      toast.error("Failed to save photo");
    } else {
      setProfile(prev => prev ? { ...prev, avatar_url: avatarUrl } : prev);
      toast.success("Profile photo updated");
    }
    setUploadingPhoto(false);
  }

  const TABS = [
    { key: "overview", label: "Overview", icon: User },
    { key: "stats", label: "Stats", icon: Activity },
    { key: "documents", label: "Documents", icon: FileText },
    { key: "availability", label: "Availability", icon: Calendar },
    { key: "access", label: "Team Access", icon: UserPlus },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="max-w-5xl mx-auto px-4">
          <Link to="/player-hub" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to Player Hub
          </Link>

          {/* Header */}
          <div className="bg-card border border-border rounded-xl p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              {/* Avatar with upload */}
              <div className="relative group shrink-0">
                {(profile as any)?.avatar_url ? (
                  <img
                    src={(profile as any).avatar_url}
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover border-2 border-primary/30"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary font-display text-2xl font-bold">
                    {(profile?.full_name || profile?.email || "?")[0].toUpperCase()}
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {uploadingPhoto ? (
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                  ) : (
                    <Camera className="h-5 w-5 text-white" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>

              <div className="flex-1">
                {/* Editable name */}
                <div className="flex items-center gap-2 mb-1">
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="bg-secondary border border-border rounded-lg px-3 py-1.5 text-lg font-display font-bold text-foreground"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setIsEditingName(false); }}
                      />
                      <button onClick={handleSaveName} disabled={savingName} className="text-green-500 hover:text-green-400"><Check className="h-4 w-4" /></button>
                      <button onClick={() => setIsEditingName(false)} className="text-red-500 hover:text-red-400"><X className="h-4 w-4" /></button>
                    </div>
                  ) : (
                    <>
                      <h1 className="text-2xl font-display font-bold text-foreground">{profile?.full_name || "My Profile"}</h1>
                      <button
                        onClick={() => { setEditName(profile?.full_name || ""); setIsEditingName(true); }}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-3">{profile?.email}</p>

                {/* Roles */}
                {roles.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {roles.map(r => (
                      <span key={r} className="px-2 py-0.5 rounded-full text-xs bg-accent text-accent-foreground capitalize flex items-center gap-1">
                        <Shield className="h-2.5 w-2.5" />{r}
                      </span>
                    ))}
                  </div>
                )}

                {ageGroups.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {ageGroups.map(ag => (
                      <span key={ag} className="px-2 py-0.5 rounded-full text-xs bg-secondary text-secondary-foreground">{ag}</span>
                    ))}
                  </div>
                )}
                {teamMemberships.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {teamMemberships.map(tm => (
                      <span key={tm.team_slug} className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/20">
                        {tm.team_slug} ({tm.role})
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

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
                  activeTab === tab.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Overview */}
          {activeTab === "overview" && (
            <div className="space-y-4">
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

              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="text-sm font-display tracking-wider uppercase text-muted-foreground mb-4 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> My Documents
                </h3>
                {documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No documents uploaded yet</p>
                ) : (
                  <div className="space-y-2">
                    {documents.slice(0, 5).map(d => (
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
                        {d.file_url && (
                          <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline shrink-0">View</a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stats */}
          {activeTab === "stats" && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-display tracking-wider uppercase text-muted-foreground mb-4 flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Performance by Team
              </h3>
              {matchedStats.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No stats found</p>
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

          {/* Documents */}
          {activeTab === "documents" && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-display tracking-wider uppercase text-muted-foreground mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> All Documents
              </h3>
              {documents.length === 0 ? (
                <p className="text-sm text-muted-foreground italic py-8 text-center">No documents uploaded yet</p>
              ) : (
                <div className="space-y-2">
                  {documents.map(d => (
                    <div key={d.id} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
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
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Availability */}
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

          {/* Team Access Requests */}
          {activeTab === "access" && (
            <div>
              <div className="bg-card border border-border rounded-xl p-5 mb-4">
                <h3 className="text-sm font-display tracking-wider uppercase text-muted-foreground mb-2 flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-primary" /> Request Additional Team Access
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Need access to another team? Submit a new request below — you can request Parent or Coach roles for any team at any time.
                </p>
              </div>
              <TeamAccessRequest />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
