import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { toast } from "sonner";
import {
  ArrowLeft, Upload, FileText, Loader2, CheckCircle2,
  Users, X
} from "lucide-react";

const DOC_TYPES = [
  { value: "medical", label: "Medical Form" },
  { value: "consent", label: "Consent Form" },
  { value: "emergency_contact", label: "Emergency Contact" },
  { value: "registration", label: "Registration" },
  { value: "id_document", label: "ID Document" },
  { value: "general", label: "General" },
];

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
}

export default function BulkDocumentUploadPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [docTitle, setDocTitle] = useState("");
  const [docType, setDocType] = useState("general");
  const [docNotes, setDocNotes] = useState("");
  const [docExpiry, setDocExpiry] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    const { data } = await supabase.from("profiles").select("id, full_name, email").order("full_name");
    setUsers(data ?? []);
    setLoading(false);
  }

  function toggleUser(id: string) {
    setSelectedUsers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    }
  }

  async function handleBulkUpload() {
    if (!docTitle.trim()) { toast.error("Document title is required"); return; }
    if (selectedUsers.size === 0) { toast.error("Select at least one player"); return; }

    setUploading(true);
    setProgress({ done: 0, total: selectedUsers.size });

    let fileUrl: string | null = null;
    if (docFile) {
      const ext = docFile.name.split(".").pop();
      const path = `player-docs/bulk/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("club-photos").upload(path, docFile);
      if (uploadError) { toast.error("Failed to upload file"); setUploading(false); return; }
      const { data: urlData } = supabase.storage.from("club-photos").getPublicUrl(path);
      fileUrl = urlData.publicUrl;
    }

    const docs = Array.from(selectedUsers).map(userId => ({
      user_id: userId,
      title: docTitle,
      document_type: docType,
      notes: docNotes || null,
      expiry_date: docExpiry || null,
      file_url: fileUrl,
      uploaded_by: user?.id,
    }));

    const { error } = await supabase.from("player_documents").insert(docs);

    if (error) {
      toast.error("Failed to upload documents");
    } else {
      toast.success(`Document added to ${selectedUsers.size} player(s)`);
      setDocTitle("");
      setDocType("general");
      setDocNotes("");
      setDocExpiry("");
      setDocFile(null);
      setSelectedUsers(new Set());
    }
    setProgress({ done: selectedUsers.size, total: selectedUsers.size });
    setUploading(false);
  }

  const filteredUsers = users.filter(u =>
    !search ||
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>

          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-primary/20">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">Bulk Document Upload</h1>
              <p className="text-sm text-muted-foreground">Upload the same document for multiple players at once</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Document Details */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-display tracking-wider uppercase text-muted-foreground mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Document Details
              </h3>
              <div className="space-y-3">
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
                  <input
                    type="date"
                    value={docExpiry}
                    onChange={e => setDocExpiry(e.target.value)}
                    placeholder="Expiry date"
                    className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                  />
                </div>
                <textarea
                  value={docNotes}
                  onChange={e => setDocNotes(e.target.value)}
                  placeholder="Notes..."
                  rows={2}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none"
                />
                <label className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-lg text-sm text-muted-foreground cursor-pointer hover:border-primary transition-colors">
                  <Upload className="h-4 w-4" />
                  {docFile ? docFile.name : "Attach file (shared across all selected players)"}
                  <input type="file" className="hidden" onChange={e => setDocFile(e.target.files?.[0] || null)} />
                </label>
                {docFile && (
                  <button onClick={() => setDocFile(null)} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1">
                    <X className="h-3 w-3" /> Remove file
                  </button>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-display font-bold text-foreground">{selectedUsers.size}</span> player(s) selected
                  </p>
                  {selectedUsers.size > 0 && (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  )}
                </div>
                <button
                  onClick={handleBulkUpload}
                  disabled={uploading || selectedUsers.size === 0 || !docTitle.trim()}
                  className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-display font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</>
                  ) : (
                    <><Upload className="h-4 w-4" /> Upload to {selectedUsers.size} Player(s)</>
                  )}
                </button>
              </div>
            </div>

            {/* Player Selection */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-display tracking-wider uppercase text-muted-foreground mb-4 flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> Select Players
              </h3>
              <div className="space-y-3">
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search players..."
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                />
                <div className="flex items-center justify-between">
                  <button onClick={selectAll} className="text-xs text-primary hover:underline font-display">
                    {selectedUsers.size === filteredUsers.length ? "Deselect All" : "Select All"}
                  </button>
                  <span className="text-xs text-muted-foreground">{filteredUsers.length} players</span>
                </div>
                {loading ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                ) : (
                  <div className="max-h-[400px] overflow-y-auto space-y-1">
                    {filteredUsers.map(u => (
                      <button
                        key={u.id}
                        onClick={() => toggleUser(u.id)}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all ${
                          selectedUsers.has(u.id)
                            ? "bg-primary/10 border border-primary/30"
                            : "bg-secondary/20 border border-transparent hover:bg-secondary/40"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                          selectedUsers.has(u.id) ? "border-primary bg-primary" : "border-border"
                        }`}>
                          {selectedUsers.has(u.id) && <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-display font-semibold text-foreground truncate">{u.full_name || "Unnamed"}</p>
                          <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
