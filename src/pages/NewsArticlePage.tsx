import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link, Navigate } from "react-router-dom";
import { format } from "date-fns";
import { Clock, User, ArrowLeft, Pencil, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import DOMPurify from "dompurify";

export default function NewsArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const { isNewsEditor, isAdmin, user } = useAuth();

  const { data: article, isLoading, error } = useQuery({
    queryKey: ["news-article", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_articles")
        .select("*")
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-28 pb-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="h-8 w-48 bg-card animate-pulse rounded mb-4" />
            <div className="h-64 bg-card animate-pulse rounded mb-6" />
            <div className="space-y-3">
              <div className="h-4 bg-card animate-pulse rounded w-full" />
              <div className="h-4 bg-card animate-pulse rounded w-3/4" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!article || error) return <Navigate to="/news" replace />;

  const canEditThis = isAdmin || (isNewsEditor && user?.id === article.author_id);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <article className="container mx-auto px-4 max-w-4xl">
          {/* Back link */}
          <Link to="/news" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to News
          </Link>

          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="font-display uppercase text-xs tracking-wider">
                <Tag className="h-3 w-3 mr-1" />
                {article.category}
              </Badge>
              {!article.is_published && (
                <Badge variant="secondary">Draft</Badge>
              )}
            </div>

            <h1 className="text-3xl md:text-5xl font-bold font-display leading-tight mb-4">
              {article.title}
            </h1>

            {article.excerpt && (
              <p className="text-lg text-muted-foreground mb-4">{article.excerpt}</p>
            )}

            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <User className="h-4 w-4" /> {article.author_name}
                </span>
                {article.published_at && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {format(new Date(article.published_at), "EEEE, dd MMMM yyyy 'at' HH:mm")}
                  </span>
                )}
              </div>
              {canEditThis && (
                <Link to={`/news/editor/${article.id}`}>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                </Link>
              )}
            </div>

            <Separator className="mt-6" />
          </header>

          {/* Cover image */}
          {article.cover_image_url && (
            <div className="mb-8 rounded-xl overflow-hidden border border-border">
              <img
                src={article.cover_image_url}
                alt={article.title}
                className="w-full max-h-[500px] object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div
            className="prose prose-invert prose-lg max-w-none
              prose-headings:font-display
              prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
              prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
              prose-p:text-foreground/90 prose-p:leading-relaxed
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-strong:text-foreground
              prose-ul:space-y-1 prose-ol:space-y-1
              prose-li:text-foreground/90
              prose-blockquote:border-primary prose-blockquote:bg-card prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
              prose-img:rounded-lg
            "
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content) }}
          />
        </article>
      </main>
      <Footer />
    </div>
  );
}
