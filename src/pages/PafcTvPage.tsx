import { useState, useEffect } from "react";
import { Play, ExternalLink, Youtube, Loader2, Eye, Users, Video } from "lucide-react";
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

// Extract age group from title (e.g. "U13", "U11", "U8")
function extractAgeGroup(title: string): string {
  const match = title.match(/U\d+/i);
  return match ? match[0].toUpperCase() : "Other";
}

const PafcTvPage = () => {
  const [videos, setVideos] = useState<Video[]>(fallbackVideos);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("All");

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

  // Get unique age groups for filter tabs
  const ageGroups = ["All", ...Array.from(new Set(videos.map((v) => extractAgeGroup(v.title)))).sort()];

  const filteredVideos =
    activeFilter === "All" ? videos : videos.filter((v) => extractAgeGroup(v.title) === activeFilter);

  const totalViews = videos.reduce((sum, v) => sum + v.views, 0);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-20">

        {/* ── Channel Banner ── */}
        <section className="relative h-48 md:h-64 overflow-hidden bg-secondary">
          {/* Texture overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-destructive/10" />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
        </section>

        {/* ── Channel Info Bar ── */}
        <section className="container mx-auto px-4 -mt-10 relative z-10 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
            {/* Channel avatar */}
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-card border-4 border-background flex items-center justify-center shadow-lg shrink-0">
              <Youtube className="h-10 w-10 md:h-12 md:w-12 text-destructive" />
            </div>
            <div className="flex-1 flex flex-col sm:flex-row sm:items-end justify-between gap-4 w-full">
              <div>
                <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground tracking-wide">
                  PAFC TV
                </h1>
                <div className="flex items-center gap-4 mt-1.5 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Video className="h-4 w-4" />
                    {videos.length} videos
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Eye className="h-4 w-4" />
                    {formatViews(totalViews)} total views
                  </span>
                </div>
              </div>
              <Button
                asChild
                className="font-display tracking-wider bg-destructive hover:bg-destructive/90 text-destructive-foreground gap-2 rounded-full px-6"
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
          </div>
        </section>

        {/* ── Filter Tabs ── */}
        <section className="border-b border-border sticky top-20 bg-background/95 backdrop-blur-sm z-20">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-1 overflow-x-auto pb-px scrollbar-none">
              {ageGroups.map((group) => (
                <button
                  key={group}
                  onClick={() => setActiveFilter(group)}
                  className={`font-display text-sm tracking-wider px-5 py-3 border-b-2 transition-colors whitespace-nowrap ${
                    activeFilter === group
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
                >
                  {group}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── Video Grid ── */}
        <section className="container mx-auto px-4 py-8">
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground font-display tracking-wider">No videos found for {activeFilter}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
              {filteredVideos.map((video) => (
                <button
                  key={video.id}
                  onClick={() => setActiveVideo(video)}
                  className="group text-left"
                >
                  {/* Thumbnail */}
                  <div className="aspect-video relative overflow-hidden rounded-xl bg-secondary">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-background/0 group-hover:bg-background/20 transition-colors duration-300" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-14 h-14 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center">
                        <Play className="h-6 w-6 text-foreground ml-0.5" fill="currentColor" />
                      </div>
                    </div>
                    {/* Age group badge */}
                    <div className="absolute top-2 right-2">
                      <span className="bg-background/80 backdrop-blur-sm text-foreground text-xs font-display tracking-wider px-2.5 py-1 rounded-md">
                        {extractAgeGroup(video.title)}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="mt-3 flex gap-3">
                    <div className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center shrink-0 mt-0.5">
                      <Youtube className="h-4 w-4 text-destructive" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-body text-sm font-medium text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                        {formatTitle(video.title)}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        PAFC TV
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatViews(video.views)} views · {timeAgo(video.published)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />

      {/* Video Player Modal */}
      <Dialog open={!!activeVideo} onOpenChange={() => setActiveVideo(null)}>
        <DialogContent className="max-w-5xl w-[95vw] p-0 bg-background border-border overflow-hidden rounded-xl">
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
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm text-muted-foreground flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" />
                      {formatViews(activeVideo.views)} views
                    </span>
                    <span>·</span>
                    <span>{formatDate(activeVideo.published)}</span>
                  </p>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="font-display tracking-wider rounded-full gap-1.5"
                  >
                    <a
                      href={`https://www.youtube.com/watch?v=${activeVideo.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Youtube className="h-4 w-4 text-destructive" />
                      Watch on YouTube
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
