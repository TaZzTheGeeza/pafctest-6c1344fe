import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Camera, Star, ArrowRight } from "lucide-react";

export function ShotOfTheDay() {
  const { data: shot } = useQuery({
    queryKey: ["shot-of-the-day"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournament_photos_public" as any)
        .select("*")
        .eq("featured", true)
        .order("featured_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
    staleTime: 1000 * 60 * 5,
  });

  if (!shot) return null;

  return (
    <section className="relative py-12 md:py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 mb-6">
          <Star className="h-5 w-5 text-primary fill-primary" />
          <h2 className="font-display text-2xl md:text-3xl font-bold tracking-wide uppercase">
            Shot of the Day
          </h2>
        </div>

        <Link
          to="/tournament"
          className="group block relative overflow-hidden rounded-2xl border border-border bg-card"
        >
          <div className="relative aspect-[16/9] md:aspect-[21/9] overflow-hidden">
            <img
              src={shot.preview_url}
              alt={shot.caption || "PAFC Tournament — Shot of the Day"}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

            <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
              <Star className="h-3 w-3 fill-current" />
              Featured
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
              <div className="flex items-end justify-between gap-4 flex-wrap">
                <div className="max-w-2xl">
                  {shot.caption && (
                    <p className="text-white/90 text-sm md:text-base font-medium mb-2 line-clamp-2">
                      {shot.caption}
                    </p>
                  )}
                  <h3 className="font-display text-white text-2xl md:text-4xl font-bold uppercase tracking-tight">
                    Relive the action
                  </h3>
                  <p className="text-white/70 text-sm md:text-base mt-1">
                    Hi-res action photos from PAFC Tournament — only £2 each.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full font-semibold text-sm group-hover:gap-3 transition-all">
                  <Camera className="h-4 w-4" />
                  View Gallery
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
