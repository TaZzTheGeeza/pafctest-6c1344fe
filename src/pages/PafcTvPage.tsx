import { useState, useEffect } from "react";
import { Play, ExternalLink, Youtube, Loader2, Eye, Calendar, Search, SlidersHorizontal, Film } from "lucide-react";
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
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
  } catch {
    return "";
  }
}

function extractAgeGroup(title: string): string {
  const match = title.match(/U\d+/i);
  return match ? match[0].toUpperCase() : "Other";
}

// Try to extract opponent name
function extractOpponent(title: string): { team: string; opponent: string } {
  const cleaned = title.replace(/^PETERBOROUGH ATHLETIC\s*/i, "");
  const parts = cleaned.split(/\s+vs\s+/i);
  if (parts.length === 2) {
    return {
      team: parts[0].trim().split(" ").map(w => /^U\d+/i.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" "),
      opponent: parts[1].trim().replace(/\s*·.*$/, "").split(" ").map(w => /^U\d+/i.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" "),
    };
  }
  return { team: "PAFC", opponent: cleaned };
}

const PafcTvPage = () => {
  const [videos, setVideos] = useState<Video[]>(fallbackVideos);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

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

  const ageGroups = ["All", ...Array.from(new Set(videos.map((v) => extractAgeGroup(v.title)))).sort()];

  const filteredVideos = videos.filter((v) => {
    const matchesFilter = activeFilter === "All" || extractAgeGroup(v.title) === activeFilter;
    const matchesSearch = !searchQuery || v.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const featuredVideo = filteredVideos[0];
  const gridVideos = filteredVideos.slice(1);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-20">

        {/* ── Page Header ── */}
        <section className="border-b border-border">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Film className="h-5 w-5 text-primary" />
                  <span className="font-display text-sm tracking-widest text-primary uppercase">Match Centre</span>
                </div>
                <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground tracking-wide">
                  PAFC TV
                </h1>
                <p className="text-muted-foreground mt-2 text-sm">
                  Full match footage from every fixture — find your team's games below
                </p>
              </div>
              <Button
                asChild
                className="font-display tracking-wider bg-destructive hover:bg-destructive/90 text-destructive-foreground gap-2 rounded-sm self-start md:self-auto"
              >
                <a
                  href="https://www.youtube.com/@PeterboroughAthleticFC"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Youtube className="h-4 w-4" />
                  SUBSCRIBE
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* ── Filters & Search Bar ── */}
        <section className="border-b border-border bg-card/50 sticky top-20 z-20 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {/* Age group pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <SlidersHorizontal className="h-4 w-4 text-muted-foreground mr-1 hidden sm:block" />
                {ageGroups.map((group) => (
                  <button
                    key={group}
                    onClick={() => setActiveFilter(group)}
                    className={`font-display text-xs tracking-wider px-3.5 py-1.5 rounded-sm border transition-all ${
                      activeFilter === group
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-transparent text-muted-foreground border-border hover:border-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {group}
                  </button>
                ))}
              </div>
              {/* Search */}
              <div className="relative sm:ml-auto w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search matches..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-56 bg-secondary border border-border rounded-sm pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                />
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8">
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="text-center py-20">
              <Film className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-display tracking-wider">No matches found</p>
              <p className="text-sm text-muted-foreground mt-1">Try a different filter or search term</p>
            </div>
          ) : (
            <>
              {/* ── Featured Match ── */}
              {featuredVideo && (
                <div className="mb-10">
                  <button
                    onClick={() => setActiveVideo(featuredVideo)}
                    className="w-full group grid grid-cols-1 lg:grid-cols-5 gap-0 rounded-lg overflow-hidden border border-border hover:border-primary/40 transition-all bg-card"
                  >
                    {/* Thumbnail - takes 3 cols */}
                    <div className="lg:col-span-3 aspect-video relative overflow-hidden">
                      <img
                        src={featuredVideo.thumbnail}
                        alt={featuredVideo.title}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/20 group-hover:to-card/10 transition-colors" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-2xl">
                          <Play className="h-8 w-8 text-primary-foreground ml-1" fill="currentColor" />
                        </div>
                      </div>
                      <span className="absolute top-3 left-3 bg-destructive text-destructive-foreground text-xs font-display tracking-widest px-3 py-1 rounded-sm font-bold">
                        LATEST
                      </span>
                    </div>
                    {/* Match info panel - takes 2 cols */}
                    <div className="lg:col-span-2 p-6 lg:p-8 flex flex-col justify-center text-left border-t lg:border-t-0 lg:border-l border-border">
                      <span className="font-display text-xs tracking-widest text-primary uppercase mb-3">
                        Featured Match
                      </span>

                      {/* VS layout */}
                      <div className="space-y-3 mb-6">
                        <div>
                          <span className="font-display text-xs tracking-wider text-muted-foreground uppercase">PAFC</span>
                          <h2 className="font-display text-xl md:text-2xl font-bold text-foreground leading-tight">
                            {extractOpponent(featuredVideo.title).team}
                          </h2>
                        </div>
                        <div className="font-display text-lg text-primary font-bold">VS</div>
                        <div>
                          <span className="font-display text-xs tracking-wider text-muted-foreground uppercase">Opposition</span>
                          <h2 className="font-display text-xl md:text-2xl font-bold text-foreground leading-tight">
                            {extractOpponent(featuredVideo.title).opponent}
                          </h2>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          {formatDate(featuredVideo.published)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Eye className="h-4 w-4" />
                          {formatViews(featuredVideo.views)} views
                        </span>
                      </div>
                    </div>
                  </button>
                </div>
              )}

              {/* ── Match List Grid ── */}
              <div className="flex items-center gap-3 mb-5">
                <h3 className="font-display text-sm tracking-widest text-muted-foreground uppercase">
                  {activeFilter === "All" ? "All Matches" : `${activeFilter} Matches`}
                </h3>
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">{filteredVideos.length} videos</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
                {gridVideos.map((video) => {
                  const { team, opponent } = extractOpponent(video.title);
                  return (
                    <button
                      key={video.id}
                      onClick={() => setActiveVideo(video)}
                      className="group text-left rounded-lg overflow-hidden border border-border hover:border-primary/40 bg-card transition-all duration-300"
                    >
                      <div className="aspect-video relative overflow-hidden">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center shadow-lg">
                            <Play className="h-6 w-6 text-primary-foreground ml-0.5" fill="currentColor" />
                          </div>
                        </div>
                        <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm text-foreground text-xs font-display tracking-wider px-2 py-0.5 rounded-sm">
                          {extractAgeGroup(video.title)}
                        </div>
                      </div>
                      {/* Match info strip */}
                      <div className="p-4">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-display text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                            {team}
                          </span>
                          <span className="font-display text-xs text-primary font-bold shrink-0">VS</span>
                          <span className="font-display text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate text-right">
                            {opponent}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(video.published)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {formatViews(video.views)}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
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
                    className="font-display tracking-wider rounded-sm gap-1.5"
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
