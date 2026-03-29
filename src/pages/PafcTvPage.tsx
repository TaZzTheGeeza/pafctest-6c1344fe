import { useState, useEffect } from "react";
import { Play, ExternalLink, Youtube, Loader2, Eye, Clock, Tv, Signal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

interface Video {
  id: string;
  title: string;
  published: string;
  thumbnail: string;
  views: number;
}

const fallbackVideos: Video[] = [
  { id: "2R_VL1zfm_Y", title: "U13 Gold vs Parkside Athletic U13", published: "2026-03-17", thumbnail: "https://i.ytimg.com/vi/2R_VL1zfm_Y/hqdefault.jpg", views: 97 },
  { id: "Tp5LDzjtDcg", title: "U11 Gold vs Glinton U11", published: "2026-03-15", thumbnail: "https://i.ytimg.com/vi/Tp5LDzjtDcg/hqdefault.jpg", views: 62 },
  { id: "I-sEJ4b8oBU", title: "U11 Gold vs Gunthorpe Harriers U11", published: "2026-03-08", thumbnail: "https://i.ytimg.com/vi/I-sEJ4b8oBU/hqdefault.jpg", views: 25 },
  { id: "gPe1WO_pMlg", title: "U13 Gold vs Eunice U13", published: "2026-03-01", thumbnail: "https://i.ytimg.com/vi/gPe1WO_pMlg/hqdefault.jpg", views: 144 },
  { id: "UZvcXdNO1l8", title: "U8 Gold vs Spalding United U8 Blue", published: "2026-02-22", thumbnail: "https://i.ytimg.com/vi/UZvcXdNO1l8/hqdefault.jpg", views: 59 },
  { id: "t34-N5JVEo8", title: "U8 Gold vs FC Peterborough U8", published: "2026-02-15", thumbnail: "https://i.ytimg.com/vi/t34-N5JVEo8/hqdefault.jpg", views: 74 },
];

function formatTitle(raw: string): string {
  let title = raw.replace(/^PETERBOROUGH ATHLETIC\s*/i, "");
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
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return `${v}`;
}

function timeAgo(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  } catch {
    return "";
  }
}

const PafcTvPage = () => {
  const [videos, setVideos] = useState<Video[]>(fallbackVideos);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);

  useEffect(() => {
    async function fetchVideos() {
      try {
        const { data, error } = await supabase.functions.invoke("youtube-feed");
        if (error) throw error;
        if (data?.videos?.length) {
          setVideos(data.videos.slice(0, 12));
        }
      } catch (err) {
        console.warn("Using fallback video data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchVideos();
  }, []);

  const heroVideo = videos[0];
  const restVideos = videos.slice(1);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-20">

        {/* ── Broadcast-style Hero ── */}
        <section className="relative bg-background overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-destructive via-primary to-destructive" />

          <div className="container mx-auto px-4 py-8">
            {/* Top ticker bar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-destructive px-4 py-2 rounded-sm">
                  <Tv className="h-5 w-5 text-destructive-foreground" />
                  <span className="font-display text-lg tracking-widest text-destructive-foreground font-bold">
                    PAFC TV
                  </span>
                </div>
                <div className="hidden sm:flex items-center gap-2 bg-secondary px-3 py-2 rounded-sm">
                  <Signal className="h-3 w-3 text-primary animate-pulse" />
                  <span className="font-display text-xs tracking-wider text-muted-foreground uppercase">
                    On Demand
                  </span>
                </div>
              </div>
              <Button
                asChild
                size="sm"
                className="font-display tracking-wider bg-destructive hover:bg-destructive/90 text-destructive-foreground gap-2 rounded-sm"
              >
                <a
                  href="https://www.youtube.com/@PeterboroughAthleticFC"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Youtube className="h-4 w-4" />
                  SUBSCRIBE
                </a>
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-32">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Hero Feature */}
                {heroVideo && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 mb-8 rounded-sm overflow-hidden border border-border">
                    <button
                      onClick={() => setActiveVideo(heroVideo)}
                      className="lg:col-span-2 relative group aspect-video bg-secondary"
                    >
                      <img
                        src={heroVideo.thumbnail}
                        alt={heroVideo.title}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-20 h-20 rounded-full bg-destructive/90 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-2xl">
                          <Play className="h-8 w-8 text-destructive-foreground ml-1" fill="currentColor" />
                        </div>
                      </div>
                      <div className="absolute top-4 left-4 flex items-center gap-2">
                        <span className="bg-destructive text-destructive-foreground text-xs font-display tracking-widest px-3 py-1 rounded-sm font-bold">
                          LATEST
                        </span>
                      </div>
                    </button>
                    <div className="bg-card p-6 flex flex-col justify-between border-l border-border">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1 h-6 bg-destructive rounded-full" />
                          <span className="font-display text-xs tracking-widest text-destructive uppercase">
                            Featured Match
                          </span>
                        </div>
                        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground leading-tight mb-4">
                          {formatTitle(heroVideo.title)}
                        </h2>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{timeAgo(heroVideo.published)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            <span>{formatViews(heroVideo.views)} views</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => setActiveVideo(heroVideo)}
                        className="mt-6 font-display tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground gap-2 rounded-sm w-full"
                      >
                        <Play className="h-4 w-4" fill="currentColor" />
                        WATCH NOW
                      </Button>
                    </div>
                  </div>
                )}

                {/* Section divider */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-5 bg-primary rounded-full" />
                    <h3 className="font-display text-lg tracking-wider text-foreground uppercase">
                      More Matches
                    </h3>
                  </div>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* Video grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-10">
                  {restVideos.map((video) => (
                    <button
                      key={video.id}
                      onClick={() => setActiveVideo(video)}
                      className="group relative rounded-sm overflow-hidden bg-card border border-border hover:border-primary/50 transition-all duration-300 text-left"
                    >
                      <div className="aspect-video relative overflow-hidden">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="w-12 h-12 rounded-full bg-destructive/90 flex items-center justify-center shadow-lg">
                            <Play className="h-5 w-5 text-destructive-foreground ml-0.5" fill="currentColor" />
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent p-2">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {formatViews(video.views)}
                            </span>
                            <span>{formatDate(video.published)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-3">
                        <h4 className="font-display text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-tight line-clamp-2">
                          {formatTitle(video.title)}
                        </h4>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Bottom CTA bar */}
                <div className="border-t border-border pt-8 pb-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Youtube className="h-8 w-8 text-destructive" />
                      <div>
                        <p className="font-display text-sm tracking-wider text-foreground uppercase">
                          Never miss a match
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Subscribe to PAFC TV on YouTube for all the latest action
                        </p>
                      </div>
                    </div>
                    <Button
                      asChild
                      size="lg"
                      className="font-display tracking-wider bg-destructive hover:bg-destructive/90 text-destructive-foreground gap-2 rounded-sm"
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
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />

      {/* Video Player Modal */}
      <Dialog open={!!activeVideo} onOpenChange={() => setActiveVideo(null)}>
        <DialogContent className="max-w-5xl w-[95vw] p-0 bg-background border-border overflow-hidden rounded-sm">
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
              <div className="p-5 border-t border-border">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-display text-xl font-bold text-foreground">
                      {formatTitle(activeVideo.title)}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        {formatViews(activeVideo.views)} views
                      </span>
                      <span>·</span>
                      <span>{formatDate(activeVideo.published)}</span>
                    </p>
                  </div>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="font-display tracking-wider rounded-sm gap-1.5 shrink-0"
                  >
                    <a
                      href={`https://www.youtube.com/watch?v=${activeVideo.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Youtube className="h-4 w-4 text-destructive" />
                      YouTube
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PafcTvPage;
