import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Newspaper, Clock, User, Star, Trophy, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";

interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  author_name: string;
  category: string;
  is_published: boolean;
  published_at: string | null;
  is_featured: boolean;
  created_at: string;
}

interface Props {
  articles: NewsArticle[];
  featured: NewsArticle | undefined;
}

export function NewsMatchdayProgramme({ articles, featured }: Props) {
  const sidebarArticles = articles.slice(0, 3);
  const mainArticles = articles.slice(3);

  return (
    <div className="space-y-0">
      {/* Programme header band */}
      <div className="relative overflow-hidden rounded-t-xl bg-gold-gradient py-3 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="h-5 w-5 text-primary-foreground" />
            <span className="font-display text-sm uppercase tracking-[0.3em] text-primary-foreground font-bold">
              Official Matchday Programme
            </span>
          </div>
          <span className="font-body text-xs text-primary-foreground/80">
            {format(new Date(), "EEEE dd MMMM yyyy")}
          </span>
        </div>
      </div>

      {/* Main programme body */}
      <div className="border border-t-0 border-border rounded-b-xl bg-card overflow-hidden">
        {/* Title block */}
        <div className="relative px-6 md:px-10 py-8 border-b border-border">
          {/* Watermark crest effect */}
          <div className="absolute top-1/2 right-8 -translate-y-1/2 opacity-[0.04] pointer-events-none">
            <Trophy className="h-48 w-48" />
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight relative z-10">
            <span className="text-gold-gradient">PAFC</span>{" "}
            <span className="text-foreground">NEWS</span>
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="h-1 w-12 bg-gold-gradient rounded-full" />
            <p className="text-muted-foreground text-sm font-display uppercase tracking-[0.2em]">
              Latest from the club
            </p>
          </div>
        </div>

        {/* Featured article - programme cover style */}
        {featured && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <Link to={`/news/${featured.slug}`} className="block group">
              <div className="border-b border-border">
                <div className="grid md:grid-cols-[1fr_1.2fr]">
                  {/* Image side */}
                  <div className="relative overflow-hidden aspect-[4/3] md:aspect-auto md:min-h-[350px]">
                    {featured.cover_image_url ? (
                      <img
                        src={featured.cover_image_url}
                        alt={featured.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full bg-secondary flex items-center justify-center">
                        <Newspaper className="h-16 w-16 text-muted-foreground/30" />
                      </div>
                    )}
                    {/* Gold corner accent */}
                    <div className="absolute top-0 left-0 w-16 h-16">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gold-gradient" />
                      <div className="absolute top-0 left-0 h-full w-1 bg-gold-gradient" />
                    </div>
                  </div>

                  {/* Content side */}
                  <div className="p-6 md:p-8 flex flex-col justify-center relative">
                    {/* Subtle diagonal stripe pattern */}
                    <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
                      style={{
                        backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, currentColor 10px, currentColor 11px)"
                      }}
                    />
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center gap-1.5 bg-primary/15 text-primary px-3 py-1 rounded-sm">
                          <Star className="h-3 w-3 fill-primary" />
                          <span className="font-display uppercase text-[10px] tracking-widest font-bold">Lead Story</span>
                        </div>
                      </div>
                      <h2 className="text-2xl md:text-4xl font-display font-bold leading-[1.1] mb-4 group-hover:text-primary transition-colors">
                        {featured.title}
                      </h2>
                      {featured.excerpt && (
                        <p className="text-muted-foreground leading-relaxed mb-5 line-clamp-3">{featured.excerpt}</p>
                      )}
                      <Separator className="bg-border mb-4" />
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5 font-display uppercase tracking-wider">
                          <User className="h-3.5 w-3.5 text-primary" /> {featured.author_name}
                        </span>
                        {featured.published_at && (
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-primary" /> {format(new Date(featured.published_at), "dd MMM yyyy")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* Two-column programme layout */}
        <div className="grid md:grid-cols-[2fr_1fr] divide-y md:divide-y-0 md:divide-x divide-border">
          {/* Main column */}
          <div className="divide-y divide-border">
            {(sidebarArticles.length > 0 ? articles : []).map((article, i) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.08 * i }}
              >
                <Link to={`/news/${article.slug}`} className="block group">
                  <div className="flex gap-5 p-5 md:p-6 hover:bg-surface-elevated transition-colors">
                    {article.cover_image_url && (
                      <div className="relative flex-shrink-0 w-28 h-28 md:w-32 md:h-32 overflow-hidden rounded-sm">
                        <img
                          src={article.cover_image_url}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-0 left-0 w-6 h-6">
                          <div className="absolute top-0 left-0 w-full h-0.5 bg-primary" />
                          <div className="absolute top-0 left-0 h-full w-0.5 bg-primary" />
                        </div>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <Badge variant="outline" className="mb-2 font-display uppercase text-[9px] tracking-widest border-primary/30 text-primary">
                        {article.category}
                      </Badge>
                      <h3 className="font-display font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2 mb-1.5">
                        {article.title}
                      </h3>
                      {article.excerpt && (
                        <p className="text-muted-foreground text-sm line-clamp-2 mb-2">{article.excerpt}</p>
                      )}
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span>{article.author_name}</span>
                        {article.published_at && (
                          <>
                            <span className="text-primary">&bull;</span>
                            <span>{format(new Date(article.published_at), "dd MMM")}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Sidebar - "Also Inside" */}
          <div className="p-5 md:p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="h-5 w-1 bg-gold-gradient rounded-full" />
              <h3 className="font-display text-sm uppercase tracking-[0.2em] font-bold text-primary">Also Inside</h3>
            </div>
            <div className="space-y-4">
              {(sidebarArticles.length > 0 ? sidebarArticles : articles.slice(0, 3)).map((article, i) => (
                <motion.div
                  key={article.id + "-sidebar"}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * i }}
                >
                  <Link to={`/news/${article.slug}`} className="block group">
                    <div className="pb-4 border-b border-border last:border-b-0">
                      <div className="flex items-start gap-3">
                        <span className="font-display text-2xl font-bold text-primary/30 leading-none mt-0.5">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <h4 className="font-display font-bold text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2 mb-1">
                            {article.title}
                          </h4>
                          <span className="text-[10px] text-muted-foreground font-display uppercase tracking-wider">
                            {article.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Quick stats box */}
            <div className="mt-6 bg-secondary/50 rounded-lg p-4 border border-border">
              <h4 className="font-display text-xs uppercase tracking-[0.2em] text-primary mb-3 font-bold">Quick Stats</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Articles</span>
                  <span className="font-display font-bold text-primary">{articles.length + (featured ? 1 : 0)}</span>
                </div>
                <Separator className="bg-border" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Categories</span>
                  <span className="font-display font-bold text-primary">
                    {new Set([...articles.map(a => a.category), ...(featured ? [featured.category] : [])]).size}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
