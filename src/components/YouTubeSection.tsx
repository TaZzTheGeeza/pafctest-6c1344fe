import { Play, ExternalLink, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";

const featuredVideos = [
  {
    id: "latest-1",
    title: "Match Day Highlights",
    thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    description: "Catch the best moments from our latest fixtures",
  },
  {
    id: "latest-2",
    title: "Training Sessions",
    thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    description: "Watch the kids develop their skills on the pitch",
  },
  {
    id: "latest-3",
    title: "Goals of the Month",
    thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    description: "The best goals scored by our young lions",
  },
];

export function YouTubeSection() {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Subtle diagonal accent */}
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
            Follow our YouTube channel for match day highlights, training clips, and all the best moments from our young lions on the pitch.
          </p>
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {featuredVideos.map((video, index) => (
            <a
              key={video.id}
              href="https://www.youtube.com/@PeterboroughAthleticFC"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative rounded-xl overflow-hidden bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
            >
              {/* Thumbnail placeholder */}
              <div className="aspect-video bg-secondary relative flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Play className="h-7 w-7 text-primary-foreground ml-1" />
                </div>
                {index === 0 && (
                  <span className="absolute top-3 left-3 bg-destructive text-destructive-foreground text-xs font-display tracking-wider px-3 py-1 rounded-full">
                    LATEST
                  </span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-display text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                  {video.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">{video.description}</p>
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
