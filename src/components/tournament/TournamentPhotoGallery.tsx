import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCartStore } from "@/stores/cartStore";
import { storefrontApiRequest, STOREFRONT_PRODUCTS_QUERY, ShopifyProduct } from "@/lib/shopify";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Download, Loader2, ShoppingCart, X, Trash2, Pencil, Info, Star, Eye, ShieldCheck, Sparkles, LogIn, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { TournamentPhotoUpload } from "./TournamentPhotoUpload";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

interface TournamentPhotoGalleryProps {
  tournamentId: string;
  ageGroups: { id: string; age_group: string }[];
  defaultAgeGroup?: string;
}

const PHOTO_VARIANT_ID = "gid://shopify/ProductVariant/53198621409623";

export function TournamentPhotoGallery({ tournamentId, ageGroups, defaultAgeGroup }: TournamentPhotoGalleryProps) {
  const { user, isAdmin, isPhotographer } = useAuth();
  const queryClient = useQueryClient();
  const location = useLocation();
  const authHref = `/auth?redirect=${encodeURIComponent(location.pathname + location.search)}`;
  const [filterAgeGroup, setFilterAgeGroup] = useState(defaultAgeGroup || "all");
  const [filterDate, setFilterDate] = useState("all");
  const [buyingPhotoId, setBuyingPhotoId] = useState<string | null>(null);
  const [downloadingPhotoId, setDownloadingPhotoId] = useState<string | null>(null);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<any | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [editAgeGroup, setEditAgeGroup] = useState("");
  const [lightboxPhoto, setLightboxPhoto] = useState<any | null>(null);
  const [checkoutPhotoId, setCheckoutPhotoId] = useState<string | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [hasEntered, setHasEntered] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(`tourney-photos-entered-${tournamentId}`) === "1";
  });

  const handleEnter = () => {
    sessionStorage.setItem(`tourney-photos-entered-${tournamentId}`, "1");
    setHasEntered(true);
  };
  const addItem = useCartStore((s) => s.addItem);
  const isCartLoading = useCartStore((s) => s.isLoading);

  const { data: photoProduct } = useQuery({
    queryKey: ["shopify-photo-product"],
    queryFn: async () => {
      const res = await storefrontApiRequest(STOREFRONT_PRODUCTS_QUERY, {
        first: 1,
        query: "title:Tournament Action Photo",
      });
      const edges = res?.data?.products?.edges as ShopifyProduct[] | undefined;
      return edges?.[0] ?? null;
    },
    staleTime: 1000 * 60 * 30,
  });

  const dateKey = (p: any) => (p.photo_date || (p.created_at || "").slice(0, 10)) || "";

  const { data: photos, isLoading } = useQuery({
    queryKey: ["tournament-photos", tournamentId, filterAgeGroup, filterDate],
    queryFn: async () => {
      let query = supabase
        .from("tournament_photos_public" as any)
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("created_at", { ascending: false });

      if (filterAgeGroup !== "all") {
        query = query.eq("age_group", filterAgeGroup);
      }

      const { data, error } = await query;
      if (error) throw error;
      let rows = data as any[];
      if (filterDate !== "all") {
        rows = rows.filter((p: any) => dateKey(p) === filterDate);
      }
      return rows;
    },
  });

  // Build distinct list of dates from all photos for this tournament
  const { data: allDatesPhotos } = useQuery({
    queryKey: ["tournament-photo-dates", tournamentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournament_photos_public" as any)
        .select("created_at, photo_date")
        .eq("tournament_id", tournamentId);
      if (error) throw error;
      return data as any[];
    },
  });

  const availableDates = Array.from(
    new Set((allDatesPhotos || []).map((p: any) => dateKey(p)).filter(Boolean))
  ).sort((a, b) => b.localeCompare(a));

  const formatDateLabel = (iso: string) => {
    const d = new Date(iso + "T12:00:00");
    return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  };

  const { data: purchases } = useQuery({
    queryKey: ["photo-purchases", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("tournament_photo_purchases" as any)
        .select("photo_id")
        .eq("user_id", user.id);
      if (error) throw error;
      return (data as any[]).map((p: any) => p.photo_id as string);
    },
    enabled: !!user,
  });

  const purchasedIds = new Set(purchases || []);

  const startCheckout = async (photoId: string, name?: string, email?: string) => {
    setBuyingPhotoId(photoId);
    try {
      const body: Record<string, unknown> = { photo_id: photoId };
      if (name) body.buyer_name = name;
      if (email) body.buyer_email = email;
      const { data, error } = await supabase.functions.invoke("create-photo-checkout", { body });
      if (error || (data as any)?.error) {
        throw new Error((data as any)?.error || error?.message || "Could not start checkout");
      }
      const url = (data as any).url;
      if (!url) throw new Error("Checkout URL missing");
      window.location.href = url;
    } catch (err: any) {
      toast.error(err.message || "Failed to start checkout");
    } finally {
      setBuyingPhotoId(null);
    }
  };

  const handleBuy = async (photoId: string) => {
    if (user) { await startCheckout(photoId); return; }
    setCheckoutPhotoId(photoId);
  };

  const submitGuestCheckout = async () => {
    if (!checkoutPhotoId) return;
    const email = guestEmail.trim();
    const name = guestName.trim();
    if (!name) { toast.error("Please enter your name"); return; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { toast.error("Please enter a valid email"); return; }
    const photoId = checkoutPhotoId;
    setCheckoutPhotoId(null);
    await startCheckout(photoId, name, email);
  };

  const handleDownload = async (photoId: string) => {
    setDownloadingPhotoId(photoId);
    try {
      const { data, error } = await supabase.functions.invoke("download-photo", {
        body: { photo_id: photoId },
      });
      if (error) throw error;
      if (data?.download_url) {
        const link = document.createElement("a");
        link.href = data.download_url;
        link.target = "_blank";
        link.download = "";
        link.click();
        toast.success("Download started!");
      } else {
        throw new Error("No download URL");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to download");
    } finally {
      setDownloadingPhotoId(null);
    }
  };

  const handleDelete = async (photo: any) => {
    if (!confirm("Delete this photo? This cannot be undone.")) return;
    setDeletingPhotoId(photo.id);
    try {
      // Fetch storage_path from the underlying table (admin only)
      const { data: full } = await supabase
        .from("tournament_photos" as any)
        .select("storage_path")
        .eq("id", photo.id)
        .maybeSingle();
      const storagePath = (full as any)?.storage_path;
      if (storagePath) {
        await supabase.storage.from("tournament-photos").remove([storagePath]);
      }
      // Extract preview path from URL
      const previewUrl = new URL(photo.preview_url);
      const previewPath = previewUrl.pathname.split("/gallery-photos/")[1];
      if (previewPath) {
        await supabase.storage.from("gallery-photos").remove([decodeURIComponent(previewPath)]);
      }
      // Delete DB record
      const { error } = await supabase.from("tournament_photos" as any).delete().eq("id", photo.id);
      if (error) throw error;
      toast.success("Photo deleted");
      queryClient.invalidateQueries({ queryKey: ["tournament-photos"] });
      if (lightboxPhoto?.id === photo.id) setLightboxPhoto(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete photo");
    } finally {
      setDeletingPhotoId(null);
    }
  };

  const openEdit = (photo: any) => {
    setEditingPhoto(photo);
    setEditCaption(photo.caption || "");
    setEditAgeGroup(photo.age_group || "__general__");
  };

  const handleSaveEdit = async () => {
    if (!editingPhoto) return;
    try {
      const { error } = await supabase
        .from("tournament_photos" as any)
        .update({
          caption: editCaption || null,
          age_group: editAgeGroup && editAgeGroup !== "__general__" ? editAgeGroup : null,
        })
        .eq("id", editingPhoto.id);
      if (error) throw error;
      toast.success("Photo updated");
      queryClient.invalidateQueries({ queryKey: ["tournament-photos"] });
      setEditingPhoto(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to update photo");
    }
  };

  const handleToggleFeatured = async (photo: any) => {
    try {
      const next = !photo.featured;
      // If turning on, unfeature all others first so only one shot of the day is active
      if (next) {
        await supabase.from("tournament_photos" as any).update({ featured: false }).eq("featured", true);
      }
      const { error } = await supabase
        .from("tournament_photos" as any)
        .update({ featured: next, featured_at: next ? new Date().toISOString() : null })
        .eq("id", photo.id);
      if (error) throw error;
      toast.success(next ? "⭐ Set as Shot of the Day" : "Removed from Shot of the Day");
      queryClient.invalidateQueries({ queryKey: ["tournament-photos"] });
      queryClient.invalidateQueries({ queryKey: ["shot-of-the-day"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to update");
    }
  };

  if (!hasEntered) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-background via-background to-primary/5 p-6 md:p-10">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/20">
            <Camera className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="font-display font-bold text-2xl md:text-3xl tracking-tight">
              Tournament Action Photos
            </h2>
            <p className="text-muted-foreground text-sm md:text-base">
              Before you browse — a quick note about what you'll see.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 text-left">
            <div className="rounded-xl border border-border/60 bg-card/50 p-4 space-y-2">
              <Eye className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-sm">Previews are low-res</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Every photo on the next screen is a compressed, watermarked preview. Quality intentionally looks soft.
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-card/50 p-4 space-y-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-sm">Purchases are full quality</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Once bought, your download is the original high-resolution, watermark-free file — sharp, crisp and print-ready.
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-card/50 p-4 space-y-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-sm">£2 each — supports the club</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                All proceeds go straight back into PAFC. Downloads appear in <span className="text-foreground font-medium">My Profile → Purchases</span>.
              </p>
            </div>
          </div>

          <Button size="lg" onClick={handleEnter} className="font-semibold px-8">
            Enter Photo Gallery
          </Button>
          <p className="text-[11px] text-muted-foreground/70">
            By entering you understand previews are deliberately reduced in quality to protect the photographers' work.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!photos?.length) {
    return (
      <div className="text-center py-12">
        <Camera className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground">No photos available yet. Check back during the tournament!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!user && (
        <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
          <Mail className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">No account needed</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Buy as a guest — after checkout we'll email a secure download link to the address you provide.{' '}
              <Link to="/photos/claim" className="underline text-foreground">Lost your link?</Link>
            </p>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-display font-bold text-lg flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Action Photos
          </h3>
          <p className="text-sm text-muted-foreground">
            High-resolution action shots — £2 each. All proceeds go back into the club.
          </p>
          <div className="flex items-start gap-2 mt-2 bg-primary/10 border border-primary/20 rounded-lg px-3 py-2">
            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              After purchasing, collect your full-resolution downloads from{" "}
              <a href="/my-profile" className="text-primary font-semibold hover:underline">
                My Profile → Purchases
              </a>.
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={filterDate} onValueChange={setFilterDate}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All dates" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              {availableDates.map((d) => (
                <SelectItem key={d} value={d}>
                  {formatDateLabel(d)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterAgeGroup} onValueChange={setFilterAgeGroup}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All ages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ages</SelectItem>
              {ageGroups.map((ag) => (
                <SelectItem key={ag.id} value={ag.age_group}>
                  {ag.age_group}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {photos.map((photo: any) => {
          const owned = purchasedIds.has(photo.id);
          return (
            <Card key={photo.id} className="overflow-hidden group">
              <div
                className="relative aspect-[4/3] cursor-pointer"
                onClick={() => setLightboxPhoto(photo)}
              >
                <img
                  src={photo.preview_url}
                  alt={photo.caption || "Tournament action photo"}
                  className="w-full h-full object-cover"
                />
                {photo.age_group && (
                  <Badge className="absolute top-2 left-2 text-[10px]" variant="secondary">
                    {photo.age_group}
                  </Badge>
                )}
                {photo.featured && (
                  <Badge className="absolute bottom-2 left-2 text-[10px] bg-primary text-primary-foreground gap-1">
                    <Star className="h-3 w-3 fill-current" /> Shot of the Day
                  </Badge>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <span className="text-white text-xs font-medium bg-black/50 px-3 py-1.5 rounded-full">
                    Tap to view
                  </span>
                </div>
                {isAdmin && (
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant={photo.featured ? "default" : "secondary"}
                      className="h-7 w-7"
                      onClick={(e) => { e.stopPropagation(); handleToggleFeatured(photo); }}
                      title={photo.featured ? "Remove Shot of the Day" : "Set as Shot of the Day"}
                    >
                      <Star className={`h-3 w-3 ${photo.featured ? "fill-current" : ""}`} />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-7 w-7"
                      onClick={(e) => { e.stopPropagation(); openEdit(photo); }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-7 w-7"
                      onClick={(e) => { e.stopPropagation(); handleDelete(photo); }}
                      disabled={deletingPhotoId === photo.id}
                    >
                      {deletingPhotoId === photo.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
              <CardContent className="p-2.5">
                {photo.caption && (
                  <p className="text-xs text-muted-foreground truncate mb-2">{photo.caption}</p>
                )}
                {owned ? (
                  <Button
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => handleDownload(photo.id)}
                    disabled={downloadingPhotoId === photo.id}
                  >
                    {downloadingPhotoId === photo.id ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <Download className="h-3 w-3 mr-1" />
                    )}
                    Download
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs"
                    onClick={() => handleBuy(photo.id)}
                    disabled={buyingPhotoId === photo.id}
                  >
                    {buyingPhotoId === photo.id ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <ShoppingCart className="h-3 w-3 mr-1" />
                    )}
                    Buy · £2
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Lightbox */}
      <Dialog open={!!lightboxPhoto} onOpenChange={(open) => !open && setLightboxPhoto(null)}>
        <DialogContent className="max-w-4xl w-[95vw] p-0 bg-black/95 border-none" aria-describedby={undefined}>
          <VisuallyHidden.Root><DialogTitle>Photo Preview</DialogTitle></VisuallyHidden.Root>
          {lightboxPhoto && (
            <div className="relative">
              <img
                src={lightboxPhoto.preview_url}
                alt={lightboxPhoto.caption || "Tournament action photo"}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
              <div className="absolute top-3 right-3 flex gap-2">
                {isAdmin && (
                  <>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8"
                      onClick={() => { openEdit(lightboxPhoto); setLightboxPhoto(null); }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-8 w-8"
                      onClick={() => handleDelete(lightboxPhoto)}
                      disabled={deletingPhotoId === lightboxPhoto.id}
                    >
                      {deletingPhotoId === lightboxPhoto.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white hover:bg-white/20 h-8 w-8"
                  onClick={() => setLightboxPhoto(null)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="p-4 flex items-center justify-between gap-3">
                <div>
                  {lightboxPhoto.caption && (
                    <p className="text-white/80 text-sm">{lightboxPhoto.caption}</p>
                  )}
                  {lightboxPhoto.age_group && (
                    <Badge variant="secondary" className="mt-1">{lightboxPhoto.age_group}</Badge>
                  )}
                </div>
                {purchasedIds.has(lightboxPhoto.id) ? (
                  <Button
                    size="sm"
                    onClick={() => handleDownload(lightboxPhoto.id)}
                    disabled={downloadingPhotoId === lightboxPhoto.id}
                  >
                    {downloadingPhotoId === lightboxPhoto.id ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <Download className="h-3 w-3 mr-1" />
                    )}
                    Download Hi-Res
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleBuy(lightboxPhoto.id)}
                    disabled={buyingPhotoId === lightboxPhoto.id}
                  >
                    {buyingPhotoId === lightboxPhoto.id ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <ShoppingCart className="h-3 w-3 mr-1" />
                    )}
                    Buy Hi-Res · £2
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingPhoto} onOpenChange={(open) => !open && setEditingPhoto(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>Edit Photo</DialogTitle>
          <DialogDescription>Update caption and age group for this photo.</DialogDescription>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Caption</Label>
              <Input
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                placeholder="e.g. Semi-final action"
                maxLength={200}
              />
            </div>
            <div>
              <Label>Age Group</Label>
              <Select value={editAgeGroup} onValueChange={setEditAgeGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="General" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__general__">General</SelectItem>
                  {ageGroups.map((ag) => (
                    <SelectItem key={ag.id} value={ag.age_group}>
                      {ag.age_group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditingPhoto(null)}>Cancel</Button>
              <Button onClick={handleSaveEdit}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {(isAdmin || isPhotographer) && (
        <TournamentPhotoUpload tournamentId={tournamentId} ageGroups={ageGroups} />
      )}
    </div>
  );
}
