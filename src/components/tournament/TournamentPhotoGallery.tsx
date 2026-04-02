import { useState } from "react";
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
import { Camera, Download, Loader2, ShoppingCart, X, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { TournamentPhotoUpload } from "./TournamentPhotoUpload";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

interface TournamentPhotoGalleryProps {
  tournamentId: string;
  ageGroups: { id: string; age_group: string }[];
}

const PHOTO_VARIANT_ID = "gid://shopify/ProductVariant/53198621409623";

export function TournamentPhotoGallery({ tournamentId, ageGroups }: TournamentPhotoGalleryProps) {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [filterAgeGroup, setFilterAgeGroup] = useState("all");
  const [buyingPhotoId, setBuyingPhotoId] = useState<string | null>(null);
  const [downloadingPhotoId, setDownloadingPhotoId] = useState<string | null>(null);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<any | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [editAgeGroup, setEditAgeGroup] = useState("");
  const [lightboxPhoto, setLightboxPhoto] = useState<any | null>(null);
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

  const { data: photos, isLoading } = useQuery({
    queryKey: ["tournament-photos", tournamentId, filterAgeGroup],
    queryFn: async () => {
      let query = supabase
        .from("tournament_photos" as any)
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("created_at", { ascending: false });

      if (filterAgeGroup !== "all") {
        query = query.eq("age_group", filterAgeGroup);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
  });

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

  const handleBuy = async (photoId: string) => {
    if (!user) {
      toast.error("Please log in to purchase photos");
      return;
    }
    if (!photoProduct) {
      toast.error("Photo product not available, please try again");
      return;
    }

    const photo = photos?.find((p: any) => p.id === photoId);

    setBuyingPhotoId(photoId);
    try {
      await addItem({
        product: photoProduct,
        variantId: PHOTO_VARIANT_ID,
        variantTitle: "Tournament Action Photo",
        price: { amount: "2.00", currencyCode: "GBP" },
        quantity: 1,
        selectedOptions: [],
        attributes: [
          { key: "photo_id", value: photoId },
          { key: "user_id", value: user.id },
        ],
        customImageUrl: photo?.preview_url,
      });
      toast.success("Photo added to cart!", {
        description: "Head to checkout when you're ready.",
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to add to cart");
    } finally {
      setBuyingPhotoId(null);
    }
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
      // Delete from storage buckets
      await supabase.storage.from("tournament-photos").remove([photo.storage_path]);
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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-display font-bold text-lg flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Action Photos
          </h3>
          <p className="text-sm text-muted-foreground">
            High-resolution action shots — £2 each. All proceeds go back into the club.
          </p>
        </div>
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
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <span className="text-white text-xs font-medium bg-black/50 px-3 py-1.5 rounded-full">
                    Tap to view
                  </span>
                </div>
                {isAdmin && (
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                    disabled={buyingPhotoId === photo.id || isCartLoading}
                  >
                    {buyingPhotoId === photo.id || isCartLoading ? (
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
                    disabled={buyingPhotoId === lightboxPhoto.id || isCartLoading}
                  >
                    {buyingPhotoId === lightboxPhoto.id || isCartLoading ? (
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

      {isAdmin && (
        <TournamentPhotoUpload tournamentId={tournamentId} ageGroups={ageGroups} />
      )}
    </div>
  );
}
