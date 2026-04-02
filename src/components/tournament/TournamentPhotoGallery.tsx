import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Download, Loader2, ShoppingCart, Lock } from "lucide-react";
import { toast } from "sonner";
import { TournamentPhotoUpload } from "./TournamentPhotoUpload";

interface TournamentPhotoGalleryProps {
  tournamentId: string;
  ageGroups: { id: string; age_group: string }[];
}

export function TournamentPhotoGallery({ tournamentId, ageGroups }: TournamentPhotoGalleryProps) {
  const { user, isAdmin } = useAuth();
  const [filterAgeGroup, setFilterAgeGroup] = useState("all");
  const [buyingPhotoId, setBuyingPhotoId] = useState<string | null>(null);
  const [downloadingPhotoId, setDownloadingPhotoId] = useState<string | null>(null);

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

    setBuyingPhotoId(photoId);
    try {
      const { data, error } = await supabase.functions.invoke("create-photo-checkout", {
        body: { photo_id: photoId },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to start purchase");
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
              <div className="relative aspect-[4/3]">
                <img
                  src={photo.preview_url}
                  alt={photo.caption || "Tournament action photo"}
                  className="w-full h-full object-cover"
                />
                {!owned && (
                  <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                    <Lock className="h-6 w-6 text-white/70" />
                  </div>
                )}
                {photo.age_group && (
                  <Badge className="absolute top-2 left-2 text-[10px]" variant="secondary">
                    {photo.age_group}
                  </Badge>
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
    </div>
  );
}
