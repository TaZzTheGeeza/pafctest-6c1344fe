import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { RoleGate } from "@/components/RoleGate";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Camera, Plus, Trash2, Upload, Lock, Globe, Pencil, ChevronLeft, Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Album {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  event_date: string | null;
  visibility: "public" | "hub";
}

interface Photo {
  id: string;
  album_id: string;
  url: string;
  caption: string | null;
  sort_order: number;
}

function AdminInner() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selected, setSelected] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Album | null>(null);
  const [form, setForm] = useState({ title: "", description: "", event_date: "", visibility: "public" as "public" | "hub", cover_url: "" });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; fileName: string } | null>(null);

  const loadAlbums = async () => {
    setLoading(true);
    const { data } = await supabase.from("gallery_albums").select("*").order("event_date", { ascending: false });
    setAlbums((data ?? []) as Album[]);
    setLoading(false);
  };

  useEffect(() => { loadAlbums(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", description: "", event_date: "", visibility: "public", cover_url: "" });
    setDialogOpen(true);
  };

  const openEdit = (a: Album) => {
    setEditing(a);
    setForm({
      title: a.title,
      description: a.description ?? "",
      event_date: a.event_date ?? "",
      visibility: a.visibility,
      cover_url: a.cover_url ?? "",
    });
    setDialogOpen(true);
  };

  const saveAlbum = async () => {
    if (!form.title.trim()) { toast.error("Title required"); return; }
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      event_date: form.event_date || null,
      visibility: form.visibility,
      cover_url: form.cover_url || null,
    };
    if (editing) {
      const { error } = await supabase.from("gallery_albums").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Album updated");
    } else {
      const { error } = await supabase.from("gallery_albums").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Album created");
    }
    setDialogOpen(false);
    loadAlbums();
  };

  const deleteAlbum = async (a: Album) => {
    if (!confirm(`Delete album "${a.title}" and all its photos?`)) return;
    await supabase.from("gallery_photos").delete().eq("album_id", a.id);
    const { error } = await supabase.from("gallery_albums").delete().eq("id", a.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Album deleted");
    if (selected?.id === a.id) { setSelected(null); setPhotos([]); }
    loadAlbums();
  };

  const openAlbum = async (a: Album) => {
    setSelected(a);
    const { data } = await supabase.from("gallery_photos").select("*").eq("album_id", a.id).order("sort_order");
    setPhotos((data ?? []) as Photo[]);
  };

  const uploadCover = async (file: File) => {
    const path = `covers/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error } = await supabase.storage.from("gallery-photos").upload(path, file);
    if (error) { toast.error(error.message); return; }
    const { data } = supabase.storage.from("gallery-photos").getPublicUrl(path);
    setForm((f) => ({ ...f, cover_url: data.publicUrl }));
    toast.success("Cover uploaded");
  };

  const uploadPhotos = async (files: FileList) => {
    if (!selected) return;
    const fileArr = Array.from(files);
    setUploading(true);
    setUploadProgress({ current: 0, total: fileArr.length, fileName: "" });
    let added = 0;
    for (let i = 0; i < fileArr.length; i++) {
      const file = fileArr[i];
      setUploadProgress({ current: i, total: fileArr.length, fileName: file.name });
      const path = `${selected.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("gallery-photos").upload(path, file);
      if (upErr) { toast.error(`${file.name}: ${upErr.message}`); continue; }
      const { data } = supabase.storage.from("gallery-photos").getPublicUrl(path);
      const { error: insErr } = await supabase.from("gallery_photos").insert({
        album_id: selected.id, url: data.publicUrl, sort_order: photos.length + added,
      });
      if (insErr) { toast.error(insErr.message); continue; }
      added++;
      setUploadProgress({ current: i + 1, total: fileArr.length, fileName: file.name });
    }
    setUploading(false);
    setUploadProgress(null);
    if (added) toast.success(`Uploaded ${added} photo${added > 1 ? "s" : ""}`);
    openAlbum(selected);
  };

  const deletePhoto = async (p: Photo) => {
    if (!confirm("Delete this photo?")) return;
    const { error } = await supabase.from("gallery_photos").delete().eq("id", p.id);
    if (error) { toast.error(error.message); return; }
    setPhotos(photos.filter((x) => x.id !== p.id));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold font-display text-gold-gradient">Gallery Admin</h1>
              <p className="text-muted-foreground text-sm mt-1">Create albums and upload photos</p>
            </div>
            {!selected && (
              <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> New Album</Button>
            )}
          </div>

          {selected ? (
            <div>
              <button onClick={() => { setSelected(null); setPhotos([]); }}
                className="inline-flex items-center gap-1 text-sm text-primary hover:text-gold-light mb-6">
                <ChevronLeft className="h-4 w-4" /> Back to albums
              </button>
              <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
                <div>
                  <h2 className="font-display text-2xl font-bold">{selected.title}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    {selected.visibility === "hub" ? (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400"><Lock className="h-3 w-3" /> Hub only</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400"><Globe className="h-3 w-3" /> Public</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(selected)} className="gap-1"><Pencil className="h-3.5 w-3.5" /> Edit</Button>
                  <label className="inline-flex">
                    <Button size="sm" className="gap-1 cursor-pointer" asChild disabled={uploading}>
                      <span>{uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} Upload photos</span>
                    </Button>
                    <input type="file" accept="image/*" multiple className="hidden"
                      onChange={(e) => e.target.files && uploadPhotos(e.target.files)} />
                  </label>
                </div>
              </div>

              {uploadProgress && (
                <div className="bg-card border border-border rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-display font-semibold flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      Uploading {uploadProgress.current} of {uploadProgress.total}
                    </span>
                    <span className="text-muted-foreground">
                      {Math.round((uploadProgress.current / uploadProgress.total) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                    />
                  </div>
                  {uploadProgress.fileName && (
                    <p className="text-xs text-muted-foreground mt-2 truncate">{uploadProgress.fileName}</p>
                  )}
                </div>
              )}

              {photos.length === 0 ? (
                <div className="bg-card border border-border rounded-lg p-12 text-center">
                  <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No photos yet — upload some above</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {photos.map((p) => (
                    <div key={p.id} className="relative aspect-square rounded-lg overflow-hidden group bg-secondary">
                      <img src={p.url} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => deletePhoto(p)}
                        className="absolute top-2 right-2 bg-black/70 hover:bg-destructive text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : loading ? (
            <div className="text-center text-muted-foreground py-12">Loading...</div>
          ) : albums.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-12 text-center">
              <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No albums yet</p>
              <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Create first album</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {albums.map((a) => (
                <div key={a.id} className="bg-card border border-border rounded-xl overflow-hidden group hover:border-primary/50 transition-colors">
                  <button onClick={() => openAlbum(a)} className="block w-full text-left">
                    {a.cover_url ? (
                      <div className="aspect-video overflow-hidden">
                        <img src={a.cover_url} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                    ) : (
                      <div className="aspect-video bg-secondary flex items-center justify-center">
                        <Camera className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </button>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-display text-lg font-bold">{a.title}</h3>
                      {a.visibility === "hub" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 shrink-0"><Lock className="h-2.5 w-2.5" /> Hub</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 shrink-0"><Globe className="h-2.5 w-2.5" /> Public</span>
                      )}
                    </div>
                    {a.event_date && <p className="text-xs text-muted-foreground">{format(new Date(a.event_date), "dd MMM yyyy")}</p>}
                    {a.description && <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{a.description}</p>}
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => openAlbum(a)}>
                        <Camera className="h-3.5 w-3.5" /> Photos
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEdit(a)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="outline" size="sm" onClick={() => deleteAlbum(a)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Album" : "New Album"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Tournament Day 2026" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div>
              <Label>Event Date</Label>
              <Input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
            </div>
            <div>
              <Label>Cover Image</Label>
              <div className="flex items-center gap-3 mt-1">
                {form.cover_url && <img src={form.cover_url} className="h-16 w-24 object-cover rounded" alt="" />}
                <label>
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span className="cursor-pointer">Upload cover</span>
                  </Button>
                  <input type="file" accept="image/*" className="hidden"
                    onChange={(e) => e.target.files?.[0] && uploadCover(e.target.files[0])} />
                </label>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="flex-1">
                <Label className="text-base flex items-center gap-2">
                  {form.visibility === "hub" ? <Lock className="h-4 w-4 text-amber-400" /> : <Globe className="h-4 w-4 text-emerald-400" />}
                  {form.visibility === "hub" ? "Hub members only" : "Public"}
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {form.visibility === "hub"
                    ? "Only signed-in members can view this album."
                    : "Anyone visiting the website can view this album."}
                </p>
              </div>
              <Switch
                checked={form.visibility === "hub"}
                onCheckedChange={(c) => setForm({ ...form, visibility: c ? "hub" : "public" })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveAlbum}>{editing ? "Save" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function GalleryAdminPage() {
  return (
    <RoleGate requiredRole="admin">
      <AdminInner />
    </RoleGate>
  );
}
