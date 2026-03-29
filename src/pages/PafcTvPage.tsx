import { useState, useEffect } from "react";
import { Play, ExternalLink, Youtube, Loader2, Eye, ChevronRight } from "lucide-react";
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

        {loading ? (
          <div className="flex items-center justify-center py-40">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* ── Cinematic Hero ── */}
            {heroVideo && (
              <section className="relative h-[70vh] min-h-[480px] overflow-hidden">
                <img
                  src={`https://i.ytimg.com/vi/${heroVideo.id}/maxresdefault.jpg`}
                  alt={heroVideo.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {/* Heavy gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/20" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40" />

                <div className="relative h-full container mx-auto px-4 flex items-end pb-16">
                  <div className="max-w-xl space-y-5">
                    <div className="flex items-center gap-3">
                      <span className="bg-destructive text-destructive-foreground text-xs font-display tracking-widest px-3 py-1 rounded-full font-bold">
                        NEW
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {timeAgo(heroVideo.published)}
                      </span>
                    </div>
                    <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-[1.1]">
                      {formatTitle(heroVideo.title)}
                    </h1>
                    <p className="text-muted-foreground text-sm flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {formatViews(heroVideo.views)} views
                      </span>
                      <span>·</span>
                      <span>{formatDate(heroVideo.published)}</span>
                    </p>
                    <div className="flex items-center gap-3 pt-2">
                      <Button
                        onClick={() => setActiveVideo(heroVideo)}
                        size="lg"
                        className="font-display tracking-wider bg-foreground text-background hover:bg-foreground/90 gap-2 rounded-full px-8"
                      >
                        <Play className="h-5 w-5" fill="currentColor" />
                        PLAY
                      </Button>
                      <Button
                        asChild
                        size="lg"
                        variant="outline"
                        className="font-display tracking-wider border-muted-foreground/30 text-foreground hover:bg-secondary rounded-full px-8 gap-2"
                      >
                        <a
                          href={`https://www.youtube.com/watch?v=${heroVideo.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Youtube className="h-5 w-5 text-destructive" />
                          YOUTUBE
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ── Content Rows ── */}
            <section className="container mx-auto px-4 py-10 space-y-10">
              {/* Recent Matches Row */}
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-display text-xl tracking-wider text-foreground uppercase">
                    Recent Matches
                  </h2>
                  <a
                    href="https://www.youtube.com/@PeterboroughAthleticFC"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1 font-display tracking-wider"
                  >
                    View All <ChevronRight className="h-4 w-4" />
                  </a>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {restVideos.map((video) => (
                    <button
                      key={video.id}
                      onClick={() => setActiveVideo(video)}
                      className="group text-left rounded-lg overflow-hidden transition-transform duration-300 hover:scale-[1.03]"
                    >
                      <div className="aspect-video relative overflow-hidden rounded-lg">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover transition-all duration-500 group-hover:brightness-75"
                          loading="lazy"
                        />
                        {/* Play icon on hover */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="w-12 h-12 rounded-full bg-foreground/90 flex items-center justify-center backdrop-blur-sm">
                            <Play className="h-5 w-5 text-background ml-0.5" fill="currentColor" />
                          </div>
                        </div>
                      </div>
                      <div className="pt-2.5 pb-1 px-0.5">
                        <h4 className="font-body text-sm font-medium text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                          {formatTitle(video.title)}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatViews(video.views)} views · {timeAgo(video.published)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subscribe Banner */}
              <div className="relative rounded-xl overflow-hidden bg-gradient-to-r from-secondary via-card to-secondary border border-border p-8 md:p-12">
                <div className="absolute top-0 right-0 w-64 h-64 bg-destructive/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                      <Youtube className="h-8 w-8 text-destructive" />
                    </div>
                    <div>
                      <h3 className="font-display text-2xl font-bold text-foreground tracking-wider">
                        NEVER MISS A MATCH
                      </h3>
                      <p className="text-muted-foreground text-sm mt-1">
                        Subscribe to PAFC TV on YouTube — full match footage uploaded after every game
                      </p>
                    </div>
                  </div>
                  <Button
                    asChild
                    size="lg"
                    className="font-display tracking-wider bg-destructive hover:bg-destructive/90 text-destructive-foreground gap-2 rounded-full px-8 shrink-0"
                  >
                    <a
                      href="https://www.youtube.com/@PeterboroughAthleticFC"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Youtube className="h-5 w-5" />
                      SUBSCRIBE
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
      <Footer />

      {/* Video Player Modal */}
      <Dialog open={!!activeVideo} onOpenChange={() => setActiveVideo(null)}>
        <DialogContent className="max-w-5xl w-[95vw] p-0 bg-background border-border overflow-hidden rounded-lg">
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
              <div className="p-5">
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PafcTvPage;
