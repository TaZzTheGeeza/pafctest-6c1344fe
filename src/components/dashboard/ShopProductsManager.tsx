import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Package, Plus, Pencil, Loader2, Trash2, Upload, Eye, EyeOff, GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ShopProduct {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  image_url: string | null;
  sizes: string[];
  tags: string[];
  requires_initials: boolean;
  active: boolean;
  sort_order: number;
}

const TAG_OPTIONS = ["players", "supporters", "coaches"];

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  sizes: "",
  tags: [] as string[],
  requires_initials: false,
  active: true,
  sort_order: 0,
  image_url: "",
};

export function ShopProductsManager() {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ShopProduct | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("shop_products" as any)
      .select("*")
      .order("sort_order")
      .order("name");
    if (error) {
      toast.error("Failed to load products");
    } else {
      setProducts((data as any as ShopProduct[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, sort_order: products.length + 1 });
    setDialogOpen(true);
  };

  const openEdit = (p: ShopProduct) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description || "",
      price: (p.price_cents / 100).toFixed(2),
      sizes: (p.sizes || []).join(", "),
      tags: p.tags || [],
      requires_initials: !!p.requires_initials,
      active: p.active,
      sort_order: p.sort_order || 0,
      image_url: p.image_url || "",
    });
    setDialogOpen(true);
  };

  const uploadImage = async (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Image must be under 20MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `shop/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("club-photos").upload(path, file, {
        contentType: file.type,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("club-photos").getPublicUrl(path);
      setForm((f) => ({ ...f, image_url: data.publicUrl }));
      toast.success("Image uploaded");
    } catch (e: any) {
      toast.error(e.message || "Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    const priceCents = Math.round(parseFloat(form.price) * 100);
    if (!form.name.trim() || isNaN(priceCents) || priceCents <= 0) {
      toast.error("Please enter a name and a valid price");
      return;
    }
    setSaving(true);
    const record = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price_cents: priceCents,
      sizes: form.sizes.split(",").map((s) => s.trim()).filter(Boolean),
      tags: form.tags,
      requires_initials: form.requires_initials,
      active: form.active,
      sort_order: form.sort_order,
      image_url: form.image_url || null,
      updated_at: new Date().toISOString(),
    };
    try {
      if (editing) {
        const { error } = await supabase
          .from("shop_products" as any)
          .update(record as any)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("shop_products" as any)
          .insert({ id: crypto.randomUUID(), ...record } as any);
        if (error) throw error;
      }
      toast.success(editing ? "Product updated" : "Product added");
      setDialogOpen(false);
      fetchProducts();
    } catch (e: any) {
      toast.error(e.message || "Could not save product");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (p: ShopProduct) => {
    const { error } = await supabase
      .from("shop_products" as any)
      .update({ active: !p.active, updated_at: new Date().toISOString() } as any)
      .eq("id", p.id);
    if (error) {
      toast.error("Could not update product");
    } else {
      setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, active: !p.active } : x)));
    }
  };

  const remove = async (p: ShopProduct) => {
    if (!confirm(`Delete "${p.name}"? Existing orders keep their details.`)) return;
    setDeleting(p.id);
    const { error } = await supabase.from("shop_products" as any).delete().eq("id", p.id);
    if (error) {
      toast.error(error.message || "Could not delete — try hiding it instead");
    } else {
      setProducts((prev) => prev.filter((x) => x.id !== p.id));
      toast.success("Product deleted");
    }
    setDeleting(null);
  };

  const toggleTag = (tag: string) =>
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-display font-bold text-foreground">Shop Products</h2>
          <p className="text-xs text-muted-foreground">
            Manage what parents can buy in the club shop. Old Shopify products were imported automatically.
          </p>
        </div>
        <Button onClick={openCreate} className="bg-gold-gradient text-primary-foreground font-display tracking-wider">
          <Plus className="h-4 w-4 mr-1" /> Add Product
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No products yet</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl divide-y divide-border">
          {products.map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-3">
              <GripVertical className="h-4 w-4 text-muted-foreground/40 flex-shrink-0 hidden sm:block" />
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} className="w-12 h-12 rounded-lg object-cover border border-border flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                  <Package className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  £{(p.price_cents / 100).toFixed(2)}
                  {p.sizes?.length > 0 && ` · ${p.sizes.length} sizes`}
                  {p.tags?.length > 0 && ` · ${p.tags.join(", ")}`}
                </p>
              </div>
              <Badge className={`${p.active ? "bg-emerald-500/15 text-emerald-400" : "bg-secondary/60 text-muted-foreground"} border-0 text-[10px]`}>
                {p.active ? "Live" : "Hidden"}
              </Badge>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" onClick={() => toggleActive(p)} title={p.active ? "Hide from shop" : "Show in shop"}>
                  {p.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(p)} disabled={deleting === p.id} className="text-destructive hover:text-destructive">
                  {deleting === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editing ? "Edit Product" : "Add Product"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground font-display">Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. PAFC Training Hoodie"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-display">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground font-display">Price (£)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="25.00"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-display">Sort Order</label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value || "0", 10) })}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-display">Sizes (comma separated, leave blank for one-size)</label>
              <input
                value={form.sizes}
                onChange={(e) => setForm({ ...form, sizes: e.target.value })}
                placeholder="5-6 Years, 7-8 Years, S, M, L"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-display block mb-1.5">Categories</label>
              <div className="flex flex-wrap gap-2">
                {TAG_OPTIONS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-xs font-display tracking-wide capitalize transition-colors ${
                      form.tags.includes(tag)
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-display block mb-1.5">Product Image</label>
              <div className="flex items-center gap-3">
                {form.image_url && (
                  <img src={form.image_url} alt="Product" className="w-16 h-16 rounded-lg object-cover border border-border" />
                )}
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])}
                  />
                  <span className="inline-flex items-center gap-1.5 text-xs bg-secondary px-3 py-2 rounded-lg hover:bg-secondary/80 text-foreground">
                    {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    {form.image_url ? "Replace image" : "Upload image"}
                  </span>
                </label>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={form.requires_initials}
                onChange={(e) => setForm({ ...form, requires_initials: e.target.checked })}
                className="accent-primary"
              />
              Requires initials (personalisation)
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="accent-primary"
              />
              Live in the shop
            </label>
            <Button onClick={save} disabled={saving || uploading} className="w-full bg-gold-gradient text-primary-foreground font-display tracking-wider">
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editing ? "Save Changes" : "Add Product"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
