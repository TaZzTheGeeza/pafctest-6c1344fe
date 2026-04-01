import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Newspaper, Clock, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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

export function NewsBroadsheet({ articles, featured }: Props) {
  const topStories = articles.slice(0, 2);
  const columnStories = articles.slice(2);
  const leftCol = columnStories.filter((_, i) => i % 2 === 0);
  const rightCol = columnStories.filter((_, i) => i % 2 === 1);

  return (
    <div className="space-y-0">
      {/* Masthead */}
      <div className="text-center py-6 border-b-4 border-double border-foreground/30">
        <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground font-body mb-1">
          {format(new Date(), "EEEE, dd MMMM yyyy")}
        </p>
        <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight leading-none">
          THE PAFC <span className="text-gold-gradient">GAZETTE</span>
        </h1>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mt-2 font-body">
          Est. 2024 &bull; Official Club News &bull; Peterborough Athletic FC
        </p>
      </div>

      <Separator className="bg-foreground/20 h-px" />

      {/* Lead story */}
      {featured && (
        <Link to={`/news/${featured.slug}`} className="block group">
          <div className="py-6 border-b border-foreground/10">
            <div className="grid md:grid-cols-[1.4fr_1fr] gap-6">
              <div>
                <Badge variant="outline" className="mb-3 uppercase text-[10px] tracking-widest font-display border-primary text-primary">
                  {featured.category}
                </Badge>
                <h2 className="text-3xl md:text-5xl font-display font-bold leading-[1.1] group-hover:text-primary transition-colors mb-4">
                  {featured.title}
                </h2>
                {featured.excerpt && (
                  <p className="text-muted-foreground leading-relaxed text-base font-body mb-3 first-letter:text-4xl first-letter:font-display first-letter:font-bold first-letter:float-left first-letter:mr-2 first-letter:leading-none first-letter:text-primary">
                    {featured.excerpt}
                  </p>
                )}
                <div className="flex items-center gap-3 text-xs text-muted-foreground font-body">
                  <span className="font-semibold uppercase tracking-wider">By {featured.author_name}</span>
                  {featured.published_at && (
                    <>
                      <span>&bull;</span>
                      <span>{format(new Date(featured.published_at), "dd MMM yyyy, HH:mm")}</span>
                    </>
                  )}
                </div>
              </div>
              {featured.cover_image_url ? (
                <div className="overflow-hidden border border-border">
                  <img
                    src={featured.cover_image_url}
                    alt={featured.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 aspect-[4/3]"
                  />
                </div>
              ) : (
                <div className="bg-secondary flex items-center justify-center aspect-[4/3] border border-border">
                  <Newspaper className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>
          </div>
        </Link>
      )}

      {/* Secondary stories row */}
      {topStories.length > 0 && (
        <div className="grid md:grid-cols-2 divide-x divide-foreground/10 border-b border-foreground/10">
          {topStories.map((article) => (
            <Link key={article.id} to={`/news/${article.slug}`} className="block group p-6 first:pl-0 last:pr-0">
              <div className="flex gap-4">
                {article.cover_image_url && (
                  <img
                    src={article.cover_image_url}
                    alt={article.title}
                    className="w-24 h-24 object-cover flex-shrink-0 border border-border"
                  />
                )}
                <div>
                  <Badge variant="outline" className="mb-2 uppercase text-[9px] tracking-widest font-display">
                    {article.category}
                  </Badge>
                  <h3 className="font-display font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2 mb-1">
                    {article.title}
                  </h3>
                  {article.excerpt && (
                    <p className="text-muted-foreground text-sm line-clamp-2 font-body">{article.excerpt}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-2 uppercase tracking-wider font-body">
                    {article.author_name}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Two-column layout */}
      {columnStories.length > 0 && (
        <div className="grid md:grid-cols-2 divide-x divide-foreground/10 pt-4">
          {[leftCol, rightCol].map((col, ci) => (
            <div key={ci} className={ci === 0 ? "pr-6" : "pl-6"}>
              {col.map((article, i) => (
                <Link key={article.id} to={`/news/${article.slug}`} className="block group">
                  <div className={`py-4 ${i < col.length - 1 ? "border-b border-foreground/10" : ""}`}>
                    <h3 className="font-display font-bold text-base leading-tight group-hover:text-primary transition-colors line-clamp-2 mb-1">
                      {article.title}
                    </h3>
                    {article.excerpt && (
                      <p className="text-muted-foreground text-sm line-clamp-2 font-body">{article.excerpt}</p>
                    )}
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-2 font-body uppercase tracking-wider">
                      <span>{article.author_name}</span>
                      {article.published_at && (
                        <>
                          <span>&bull;</span>
                          <span>{format(new Date(article.published_at), "dd MMM")}</span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}

      {articles.length === 0 && !featured && (
        <div className="py-16 text-center">
          <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground font-body">No news articles yet.</p>
        </div>
      )}
    </div>
  );
}
