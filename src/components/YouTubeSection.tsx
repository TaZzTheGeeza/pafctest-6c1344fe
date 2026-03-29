import { useState, useEffect } from "react";
import { Play, ExternalLink, Youtube, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

interface Video {
  id: string;
  title: string;
  published: string;
  thumbnail: string;
  views: number;
}

// Fallback data in case the feed fails
const fallbackVideos: Video[] = [
  { id: "2R_VL1zfm_Y", title: "U13 Gold vs Parkside Athletic U13", published: "2026-03-17", thumbnail: "https://i.ytimg.com/vi/2R_VL1zfm_Y/hqdefault.jpg", views: 97 },
  { id: "Tp5LDzjtDcg", title: "U11 Gold vs Glinton U11", published: "2026-03-15", thumbnail: "https://i.ytimg.com/vi/Tp5LDzjtDcg/hqdefault.jpg", views: 62 },
  { id: "I-sEJ4b8oBU", title: "U11 Gold vs Gunthorpe Harriers U11", published: "2026-03-08", thumbnail: "https://i.ytimg.com/vi/I-sEJ4b8oBU/hqdefault.jpg", views: 25 },
  { id: "gPe1WO_pMlg", title: "U13 Gold vs Eunice U13", published: "2026-03-01", thumbnail: "https://i.ytimg.com/vi/gPe1WO_pMlg/hqdefault.jpg", views: 144 },
  { id: "UZvcXdNO1l8", title: "U8 Gold vs Spalding United U8 Blue", published: "2026-02-22", thumbnail: "https://i.ytimg.com/vi/UZvcXdNO1l8/hqdefault.jpg", views: 59 },
  { id: "t34-N5JVEo8", title: "U8 Gold vs FC Peterborough U8", published: "2026-02-15", thumbnail: "https://i.ytimg.com/vi/t34-N5JVEo8/hqdefault.jpg", views: 74 },
];

function formatTitle(raw: string): string {
  // Clean up titles like "PETERBOROUGH ATHLETIC U13 GOLD VS PARKSIDE ATHLETIC U13 - 15/03/26"
  let title = raw.replace(/^PETERBOROUGH ATHLETIC\s*/i, "");
  // Title case
  return title
    .split(" ")
    .map((w) => {
      if (w === "VS" || w === "vs") return "vs";
      if (w === "-") return "·";
      if (/^U\d+/i.test(w)) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    });
  } catch {
    return "";
  }
}

function formatViews(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k views`;
  return `${v} views`;
}

export function YouTubeSection() {
  const [videos, setVideos] = useState<Video[]>(fallbackVideos);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);

  useEffect(() => {
    async function fetchVideos() {
      try {
        const { data, error } = await supabase.functions.invoke("youtube-feed");
        if (error) throw error;
        if (data?.videos?.length) {
          setVideos(data.videos.slice(0, 6));
        }
      } catch (err) {
        console.warn("Using fallback video data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchVideos();
  }, []);

  return (
    <>
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/20 to-transparent" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-destructive/10 text-destructive px-4 py-2 rounded-full mb-4">
              <Youtube className="h-5 w-5" />
              <span className="font-display text-sm tracking-wider uppercase">PAFC TV</span>
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              WATCH THE <span className="text-primary">ACTION</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Catch all the match day action from our young lions — full game footage uploaded after every fixture.
            </p>
          </div>

          {/* Video Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {videos.map((video, index) => (
                <button
                  key={video.id}
                  onClick={() => setActiveVideo(video)}
                  className="group relative rounded-xl overflow-hidden bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 text-left"
                >
                  {/* Thumbnail */}
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-background/30 group-hover:bg-background/10 transition-colors duration-300" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-destructive/90 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                        <Play className="h-6 w-6 text-destructive-foreground ml-0.5" />
                      </div>
                    </div>
                    {index === 0 && (
                      <span className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs font-display tracking-wider px-3 py-1 rounded-full">
                        LATEST
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-display text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">
                      {formatTitle(video.title)}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {formatViews(video.views)} · {formatDate(video.published)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Subscribe CTA */}
          <div className="text-center">
            <Button
              asChild
              size="lg"
              className="font-display tracking-wider bg-destructive hover:bg-destructive/90 text-destructive-foreground gap-2"
            >
              <a
                href="https://www.youtube.com/@PeterboroughAthleticFC"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Youtube className="h-5 w-5" />
                SUBSCRIBE TO OUR CHANNEL
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Video Player Modal */}
      <Dialog open={!!activeVideo} onOpenChange={() => setActiveVideo(null)}>
        <DialogContent className="max-w-4xl w-[95vw] p-0 bg-background border-border overflow-hidden">
          {activeVideo && (
            <div>
              <div className="aspect-video w-full">
                <iframe
                  src={`https://www.youtube.com/embed/${activeVideo.id}?autoplay=1&rel=0`}
                  title={activeVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
              <div className="p-4">
                <h3 className="font-display text-lg font-semibold text-foreground">
                  {formatTitle(activeVideo.title)}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatViews(activeVideo.views)} · {formatDate(activeVideo.published)}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
