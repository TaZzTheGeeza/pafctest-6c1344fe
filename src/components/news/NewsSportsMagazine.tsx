import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Newspaper, Clock, User, ChevronRight, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

const categoryColor: Record<string, string> = {
  "match-report": "bg-red-500/20 text-red-400 border-red-500/30",
  transfer: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  community: "bg-green-500/20 text-green-400 border-green-500/30",
  youth: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  announcement: "bg-primary/20 text-primary border-primary/30",
  general: "bg-muted text-muted-foreground border-border",
};

export function NewsSportsMagazine({ articles, featured }: Props) {
  return (
    <div className="space-y-8">
      {/* Hero featured article - full bleed */}
      {featured && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
          <Link to={`/news/${featured.slug}`} className="block group relative">
            <div className="relative overflow-hidden rounded-2xl min-h-[420px] md:min-h-[500px]">
              {featured.cover_image_url ? (
                <img
                  src={featured.cover_image_url}
                  alt={featured.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-secondary" />
              )}
              {/* Dark overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              
              {/* Content overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
                <div className="flex items-center gap-3 mb-4">
                  <Badge className="bg-primary text-primary-foreground font-display uppercase text-xs tracking-wider px-3 py-1 rounded-full">
                    <Flame className="h-3 w-3 mr-1" /> Featured
                  </Badge>
                  <Badge className={`font-display uppercase text-xs tracking-wider px-3 py-1 rounded-full border ${categoryColor[featured.category] || categoryColor.general}`}>
                    {featured.category}
                  </Badge>
                </div>
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold leading-[1.05] text-white mb-4 max-w-4xl drop-shadow-lg">
                  {featured.title}
                </h2>
                {featured.excerpt && (
                  <p className="text-white/80 text-base md:text-lg max-w-2xl mb-4 line-clamp-2">{featured.excerpt}</p>
                )}
                <div className="flex items-center gap-4 text-white/60 text-sm">
                  <span className="flex items-center gap-1.5 font-medium">
                    <User className="h-4 w-4" /> {featured.author_name}
                  </span>
                  {featured.published_at && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" /> {format(new Date(featured.published_at), "dd MMM yyyy")}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-primary font-display uppercase tracking-wider text-xs group-hover:gap-2 transition-all">
                    Read More <ChevronRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      )}

      {/* Article grid - magazine card style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {articles.map((article, i) => (
          <motion.div
            key={article.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 * i, duration: 0.4 }}
          >
            <Link to={`/news/${article.slug}`} className="block group h-full">
              <div className="bg-card rounded-xl overflow-hidden h-full flex flex-col border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.3)] hover:-translate-y-1">
                {/* Image area */}
                <div className="relative overflow-hidden aspect-[16/10]">
                  {article.cover_image_url ? (
                    <img
                      src={article.cover_image_url}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
                      <Newspaper className="h-10 w-10 text-muted-foreground/50" />
                    </div>
                  )}
                  {/* Category badge on image */}
                  <div className="absolute top-3 left-3">
                    <Badge className={`font-display uppercase text-[10px] tracking-widest px-2.5 py-0.5 rounded-full border backdrop-blur-sm ${categoryColor[article.category] || categoryColor.general}`}>
                      {article.category}
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-display font-bold text-xl leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  {article.excerpt && (
                    <p className="text-muted-foreground text-sm line-clamp-2 mb-4 flex-1">{article.excerpt}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-3">
                    <span className="font-medium">{article.author_name}</span>
                    <div className="flex items-center gap-1.5">
                      {article.published_at && (
                        <span>{format(new Date(article.published_at), "dd MMM yyyy")}</span>
                      )}
                      <ChevronRight className="h-3.5 w-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {articles.length === 0 && !featured && (
        <div className="py-16 text-center">
          <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No news articles yet.</p>
        </div>
      )}
    </div>
  );
}
