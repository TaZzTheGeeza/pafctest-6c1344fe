import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Newspaper, Clock, User, ArrowRight } from "lucide-react";
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

export function NewsEditorialBlog({ articles, featured }: Props) {
  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Featured article - full width hero */}
      {featured && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Link to={`/news/${featured.slug}`} className="block group">
            {/* Full-width image */}
            <div className="overflow-hidden rounded-2xl aspect-[21/9] mb-6">
              {featured.cover_image_url ? (
                <img
                  src={featured.cover_image_url}
                  alt={featured.title}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                />
              ) : (
                <div className="w-full h-full bg-secondary flex items-center justify-center">
                  <Newspaper className="h-16 w-16 text-muted-foreground/30" />
                </div>
              )}
            </div>

            {/* Content below image */}
            <div className="space-y-3">
              <span className="text-primary text-sm font-medium uppercase tracking-wider">
                {featured.category.replace("-", " ")}
              </span>
              <h2 className="text-3xl md:text-5xl font-display font-bold leading-[1.1] group-hover:text-primary transition-colors">
                {featured.title}
              </h2>
              {featured.excerpt && (
                <p className="text-muted-foreground text-lg leading-relaxed max-w-3xl">
                  {featured.excerpt}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
                <span className="font-medium text-foreground">{featured.author_name}</span>
                {featured.published_at && (
                  <>
                    <span className="text-border">·</span>
                    <span>{format(new Date(featured.published_at), "MMMM dd, yyyy")}</span>
                  </>
                )}
                <span className="text-border">·</span>
                <span>5 min read</span>
              </div>
            </div>
          </Link>
        </motion.div>
      )}

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Article feed - clean list */}
      <div className="space-y-0 divide-y divide-border">
        {articles.map((article, i) => (
          <motion.div
            key={article.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.4 }}
          >
            <Link to={`/news/${article.slug}`} className="block group py-8 first:pt-0">
              <div className="flex gap-6 items-start">
                {/* Text content */}
                <div className="flex-1 min-w-0 space-y-2">
                  <span className="text-primary text-xs font-medium uppercase tracking-wider">
                    {article.category.replace("-", " ")}
                  </span>
                  <h3 className="text-xl md:text-2xl font-display font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  {article.excerpt && (
                    <p className="text-muted-foreground line-clamp-2 leading-relaxed hidden md:block">
                      {article.excerpt}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-sm text-muted-foreground pt-1">
                    <span className="font-medium text-foreground text-xs">{article.author_name}</span>
                    {article.published_at && (
                      <>
                        <span className="text-border">·</span>
                        <span className="text-xs">{format(new Date(article.published_at), "MMM dd")}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Thumbnail */}
                {article.cover_image_url ? (
                  <div className="flex-shrink-0 w-28 h-28 md:w-36 md:h-28 overflow-hidden rounded-lg">
                    <img
                      src={article.cover_image_url}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ) : (
                  <div className="flex-shrink-0 w-28 h-28 md:w-36 md:h-28 bg-secondary rounded-lg flex items-center justify-center">
                    <Newspaper className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                )}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {articles.length === 0 && !featured && (
        <div className="py-20 text-center">
          <Newspaper className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">No stories yet.</p>
          <p className="text-muted-foreground/60 text-sm mt-1">Check back for the latest from PAFC.</p>
        </div>
      )}
    </div>
  );
}
