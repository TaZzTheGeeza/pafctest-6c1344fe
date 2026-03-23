import { Play, ExternalLink, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";

const featuredVideos = [
  {
    id: "2R_VL1zfm_Y",
    title: "U13 Gold vs Parkside Athletic U13",
    date: "15/03/26",
    duration: "1:14:33",
    views: "97 views",
    thumbnail: "https://i.ytimg.com/vi/2R_VL1zfm_Y/hqdefault.jpg",
  },
  {
    id: "Tp5LDzjtDcg",
    title: "U11 Gold vs Glinton U11",
    date: "15/03/26",
    duration: "59:36",
    views: "62 views",
    thumbnail: "https://i.ytimg.com/vi/Tp5LDzjtDcg/hqdefault.jpg",
  },
  {
    id: "I-sEJ4b8oBU",
    title: "U11 Gold vs Gunthorpe Harriers U11",
    date: "08/03/26",
    duration: "1:02:09",
    views: "25 views",
    thumbnail: "https://i.ytimg.com/vi/I-sEJ4b8oBU/hqdefault.jpg",
  },
  {
    id: "gPe1WO_pMlg",
    title: "U13 Gold vs Eunice U13",
    date: "01/03/26",
    duration: "1:13:42",
    views: "144 views",
    thumbnail: "https://i.ytimg.com/vi/gPe1WO_pMlg/hqdefault.jpg",
  },
  {
    id: "UZvcXdNO1l8",
    title: "U8 Gold vs Spalding United U8 Blue",
    date: "22/02/26",
    duration: "41:30",
    views: "59 views",
    thumbnail: "https://i.ytimg.com/vi/UZvcXdNO1l8/hqdefault.jpg",
  },
  {
    id: "t34-N5JVEo8",
    title: "U8 Gold vs FC Peterborough U8",
    date: "Recent",
    duration: "43:43",
    views: "74 views",
    thumbnail: "https://i.ytimg.com/vi/t34-N5JVEo8/hqdefault.jpg",
  },
];

export function YouTubeSection() {
  return (
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {featuredVideos.map((video, index) => (
            <a
              key={video.id}
              href={`https://www.youtube.com/watch?v=${video.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative rounded-xl overflow-hidden bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
            >
              {/* Thumbnail */}
              <div className="aspect-video relative overflow-hidden">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-background/30 group-hover:bg-background/10 transition-colors duration-300" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-destructive/90 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Play className="h-6 w-6 text-destructive-foreground ml-0.5" />
                  </div>
                </div>
                {/* Duration badge */}
                <span className="absolute bottom-2 right-2 bg-background/80 text-foreground text-xs font-mono px-2 py-0.5 rounded">
                  {video.duration}
                </span>
                {index === 0 && (
                  <span className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs font-display tracking-wider px-3 py-1 rounded-full">
                    LATEST
                  </span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-display text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">
                  {video.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5">
                  {video.views} · {video.date}
                </p>
              </div>
            </a>
          ))}
        </div>

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
  );
}
