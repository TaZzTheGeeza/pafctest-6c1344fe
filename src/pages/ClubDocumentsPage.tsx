import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  FileText, Upload, Loader2, Trash2, Download, X, Plus,
  Calendar, User
} from "lucide-react";

const DOC_CATEGORIES = [
  { value: "general", label: "General" },
  { value: "policy", label: "Policy" },
  { value: "form", label: "Form" },
  { value: "safeguarding", label: "Safeguarding" },
  { value: "training", label: "Training" },
  { value: "finance", label: "Finance" },
];

interface ClubDocument {
  id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  document_category: string;
  uploaded_by: string;
  created_at: string;
}

export default function ClubDocumentsPage() {
  const { user, isAdmin } = useAuth();
  const [documents, setDocuments] = useState<ClubDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [canUpload, setCanUpload] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [file, setFile] = useState<File | null>(null);
  const [uploaderNames, setUploaderNames] = useState<Record<string, string>>({});

  useEffect(() => {
    loadDocuments();
    if (user) checkUploadPermission();
  }, [user]);

  async function loadDocuments() {
    setLoading(true);
    const { data } = await supabase
      .from("club_documents")
      .select("*")
      .order("created_at", { ascending: false });
    const docs = (data ?? []) as ClubDocument[];
    setDocuments(docs);

    // Load uploader names
    const uploaderIds = [...new Set(docs.map(d => d.uploaded_by))];
    if (uploaderIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", uploaderIds);
      const names: Record<string, string> = {};
      profiles?.forEach(p => { names[p.id] = p.full_name || "Unknown"; });
      setUploaderNames(names);
    }
    setLoading(false);
  }

  async function checkUploadPermission() {
    if (isAdmin) { setCanUpload(true); return; }
    const { data } = await supabase
      .from("document_upload_permissions")
      .select("id")
      .eq("user_id", user!.id)
      .maybeSingle();
    setCanUpload(!!data);
  }

  async function handleUpload() {
    if (!title.trim()) { toast.error("Title is required"); return; }
    if (!file) { toast.error("Please attach a file"); return; }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `club-docs/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("club-photos").upload(path, file);
    if (uploadError) { toast.error("File upload failed"); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("club-photos").getPublicUrl(path);

    const { error } = await supabase.from("club_documents").insert({
      title: title.trim(),
      description: description.trim() || null,
      document_category: category,
      file_url: urlData.publicUrl,
      uploaded_by: user!.id,
    });

    if (error) {
      toast.error("Failed to save document");
    } else {
      toast.success("Document uploaded successfully");
      setTitle(""); setDescription(""); setCategory("general"); setFile(null); setShowUpload(false);
      loadDocuments();
    }
    setUploading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this document?")) return;
    const { error } = await supabase.from("club_documents").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Document deleted"); setDocuments(prev => prev.filter(d => d.id !== id)); }
  }

  const canDelete = (doc: ClubDocument) => isAdmin || doc.uploaded_by === user?.id;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl md:text-5xl font-bold font-display text-center mb-2">
              Club <span className="text-gold-gradient">Documents</span>
            </h1>
            <p className="text-muted-foreground text-center mb-8">Policies, forms, and official club documentation</p>
          </motion.div>

          {/* Upload button */}
          {canUpload && (
            <div className="max-w-3xl mx-auto mb-6">
              {!showUpload ? (
                <button
                  onClick={() => setShowUpload(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-display font-semibold hover:bg-primary/90 transition-colors"
                >
                  <Plus className="h-4 w-4" /> Upload Document
                </button>
              ) : (
                <div className="bg-card border border-border rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-display font-semibold text-foreground">Upload New Document</h3>
                    <button onClick={() => setShowUpload(false)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Document title..."
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                    >
                      {DOC_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    <label className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-lg text-sm text-muted-foreground cursor-pointer hover:border-primary transition-colors">
                      <Upload className="h-4 w-4" />
                      {file ? file.name : "Choose file..."}
                      <input type="file" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Description (optional)..."
                    rows={2}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none"
                  />
                  <button
                    onClick={handleUpload}
                    disabled={uploading || !title.trim() || !file}
                    className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-display font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</> : <><Upload className="h-4 w-4" /> Upload</>}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Documents list */}
          <div className="max-w-3xl mx-auto space-y-3">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : documents.length === 0 ? (
              <div className="bg-card border border-border rounded-lg p-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No documents uploaded yet.</p>
              </div>
            ) : (
              documents.map(doc => (
                <div key={doc.id} className="bg-card border border-border rounded-lg p-4 flex items-start gap-4 hover:border-primary/30 transition-colors">
                  <div className="p-2.5 rounded-lg bg-primary/10 shrink-0">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-display font-semibold text-foreground">{doc.title}</h3>
                    {doc.description && <p className="text-xs text-muted-foreground mt-0.5">{doc.description}</p>}
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary/50 border border-border text-[10px] font-display uppercase tracking-wider">
                        {DOC_CATEGORIES.find(c => c.value === doc.document_category)?.label || doc.document_category}
                      </span>
                      <span className="inline-flex items-center gap-1"><User className="h-3 w-3" />{uploaderNames[doc.uploaded_by] || "Unknown"}</span>
                      <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(doc.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {doc.file_url && (
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    )}
                    {canDelete(doc) && (
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
