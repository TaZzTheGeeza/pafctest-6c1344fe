import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RichTextEditor from "@/components/RichTextEditor";
import { ArrowLeft, Save, Eye, Trash2, Loader2, ImagePlus } from "lucide-react";
import { Link } from "react-router-dom";

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "match-report", label: "Match Report" },
  { value: "transfer", label: "Transfer" },
  { value: "community", label: "Community" },
  { value: "youth", label: "Youth" },
  { value: "announcement", label: "Announcement" },
];

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 80);
}

export default function NewsEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAdmin, isNewsEditor } = useAuth();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [category, setCategory] = useState("general");
  const [isPublished, setIsPublished] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data: article, isLoading } = useQuery({
    queryKey: ["news-article-edit", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_articles")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: isEditMode,
  });

  useEffect(() => {
    if (article) {
      setTitle(article.title);
      setSlug(article.slug);
      setSlugManual(true);
      setExcerpt(article.excerpt || "");
      setContent(article.content);
      setCoverImageUrl(article.cover_image_url || "");
      setCategory(article.category);
      setIsPublished(article.is_published);
      setIsFeatured(article.is_featured);
    }
  }, [article]);

  useEffect(() => {
    if (!slugManual && title) {
      setSlug(slugify(title));
    }
  }, [title, slugManual]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `news/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("club-photos").upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("club-photos").getPublicUrl(path);
      setCoverImageUrl(publicUrl);
      toast.success("Image uploaded");
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (publish?: boolean) => {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }
    if (!user) return;

    setSaving(true);
    const shouldPublish = publish ?? isPublished;

    const payload = {
      title: title.trim(),
      slug: slug.trim() || slugify(title),
      excerpt: excerpt.trim() || null,
      content,
      cover_image_url: coverImageUrl || null,
      category,
      is_published: shouldPublish,
      is_featured: isFeatured,
      published_at: shouldPublish ? (article?.published_at || new Date().toISOString()) : null,
      updated_at: new Date().toISOString(),
    };

    try {
      if (isEditMode) {
        const { error } = await supabase
          .from("news_articles")
          .update(payload)
          .eq("id", id!);
        if (error) throw error;
        toast.success("Article updated");
      } else {
        const profile = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
        const authorName = profile.data?.full_name || user.email || "Unknown";

        const { error } = await supabase
          .from("news_articles")
          .insert({
            ...payload,
            author_id: user.id,
            author_name: authorName,
          });
        if (error) throw error;
        toast.success("Article created");
      }

      queryClient.invalidateQueries({ queryKey: ["news-articles"] });
      queryClient.invalidateQueries({ queryKey: ["news-article"] });
      navigate("/news");
    } catch (err: any) {
      toast.error(err.message || "Failed to save article");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditMode || !isAdmin) return;
    if (!confirm("Are you sure you want to delete this article?")) return;

    const { error } = await supabase.from("news_articles").delete().eq("id", id!);
    if (error) {
      toast.error("Failed to delete");
      return;
    }
    toast.success("Article deleted");
    queryClient.invalidateQueries({ queryKey: ["news-articles"] });
    navigate("/news");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-28 pb-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link to="/news" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to News
          </Link>

          <h1 className="text-3xl font-bold font-display mb-8">
            {isEditMode ? "Edit Article" : "New Article"}
          </h1>

          <div className="space-y-6">
            {/* Title */}
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Breaking: PAFC wins championship..."
                className="text-lg font-display mt-1"
              />
            </div>

            {/* Slug */}
            <div>
              <Label htmlFor="slug">URL Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => { setSlug(e.target.value); setSlugManual(true); }}
                placeholder="article-url-slug"
                className="mt-1 font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">/news/{slug || "..."}</p>
            </div>

            {/* Category & Featured */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-6 pt-6">
                <div className="flex items-center gap-2">
                  <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
                  <Label>Featured</Label>
                </div>
              </div>
            </div>

            {/* Cover image */}
            <div>
              <Label>Cover Image</Label>
              <div className="mt-1 space-y-2">
                {coverImageUrl && (
                  <div className="relative rounded-lg overflow-hidden border border-border max-h-48">
                    <img src={coverImageUrl} alt="Cover" className="w-full max-h-48 object-cover" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setCoverImageUrl("")}
                    >
                      Remove
                    </Button>
                  </div>
                )}
                <div className="flex gap-2">
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    <Button type="button" variant="outline" size="sm" className="gap-1.5" asChild>
                      <span>
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                        Upload Image
                      </span>
                    </Button>
                  </label>
                  <Input
                    placeholder="Or paste image URL..."
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Excerpt */}
            <div>
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="A short summary for article previews..."
                className="mt-1"
                rows={2}
              />
            </div>

            {/* Content */}
            <div>
              <Label>Content *</Label>
              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="Write your article..."
                className="mt-1 min-h-[300px]"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-border">
              <div>
                {isEditMode && isAdmin && (
                  <Button variant="destructive" onClick={handleDelete} className="gap-1.5">
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleSave(false)}
                  disabled={saving}
                  className="gap-1.5"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Draft
                </Button>
                <Button
                  onClick={() => handleSave(true)}
                  disabled={saving}
                  className="gap-1.5"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                  {isPublished ? "Update & Publish" : "Publish"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
