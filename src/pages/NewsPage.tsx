import { useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Newspaper, Plus, Clock, User, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
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

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "general", label: "General" },
  { value: "match-report", label: "Match Reports" },
  { value: "transfer", label: "Transfers" },
  { value: "community", label: "Community" },
  { value: "youth", label: "Youth" },
  { value: "announcement", label: "Announcements" },
];

export default function NewsPage() {
  const { isNewsEditor, isAdmin } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const canEdit = isNewsEditor || isAdmin;

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["news-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_articles")
        .select("*")
        .order("published_at", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data as NewsArticle[];
    },
  });

  const filtered = selectedCategory === "all"
    ? articles
    : articles.filter((a) => a.category === selectedCategory);

  const featured = filtered.find((a) => a.is_featured && a.is_published);
  const rest = filtered.filter((a) => a !== featured);
  const published = rest.filter((a) => a.is_published);
  const drafts = rest.filter((a) => !a.is_published);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-4xl md:text-6xl font-bold font-display tracking-tight">
                  <span className="text-gold-gradient">PAFC</span> NEWS
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Separator className="w-16 bg-primary" />
                  <p className="text-muted-foreground text-sm uppercase tracking-widest font-display">
                    Club news, reports &amp; updates
                  </p>
                </div>
              </div>
              {canEdit && (
                <Link to="/news/editor">
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" /> New Article
                  </Button>
                </Link>
              )}
            </div>

            {/* Category filter */}
            <div className="flex flex-wrap gap-2 mt-6">
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat.value}
                  variant={selectedCategory === cat.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.value)}
                  className="font-display uppercase tracking-wider text-xs"
                >
                  {cat.label}
                </Button>
              ))}
            </div>
          </motion.div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card rounded-lg h-72 animate-pulse border border-border" />
              ))}
            </div>
          ) : published.length === 0 && !featured ? (
            <div className="max-w-2xl mx-auto bg-card border border-border rounded-lg p-12 text-center">
              <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No news articles yet. Check back for the latest updates!</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Featured article - hero style */}
              {featured && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <Link to={`/news/${featured.slug}`} className="block group">
                    <div className="relative overflow-hidden rounded-xl border border-border bg-card">
                      <div className="grid md:grid-cols-2">
                        {featured.cover_image_url ? (
                          <div className="aspect-[16/10] md:aspect-auto md:min-h-[360px] overflow-hidden">
                            <img
                              src={featured.cover_image_url}
                              alt={featured.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                        ) : (
                          <div className="aspect-[16/10] md:aspect-auto md:min-h-[360px] bg-secondary flex items-center justify-center">
                            <Newspaper className="h-16 w-16 text-muted-foreground" />
                          </div>
                        )}
                        <div className="p-6 md:p-8 flex flex-col justify-center">
                          <div className="flex items-center gap-2 mb-3">
                            <Badge variant="default" className="bg-primary text-primary-foreground font-display uppercase text-xs">
                              <Star className="h-3 w-3 mr-1" /> Featured
                            </Badge>
                            <Badge variant="outline" className="font-display uppercase text-xs">
                              {featured.category}
                            </Badge>
                          </div>
                          <h2 className="text-2xl md:text-3xl font-bold font-display leading-tight mb-3 group-hover:text-primary transition-colors">
                            {featured.title}
                          </h2>
                          {featured.excerpt && (
                            <p className="text-muted-foreground line-clamp-3 mb-4">{featured.excerpt}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-auto">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" /> {featured.author_name}
                            </span>
                            {featured.published_at && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {format(new Date(featured.published_at), "dd MMM yyyy")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )}

              {/* Article grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {published.map((article, i) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i }}
                  >
                    <Link to={`/news/${article.slug}`} className="block group h-full">
                      <article className="bg-card border border-border rounded-lg overflow-hidden h-full flex flex-col hover:border-primary/40 transition-colors">
                        {article.cover_image_url ? (
                          <div className="aspect-[16/9] overflow-hidden">
                            <img
                              src={article.cover_image_url}
                              alt={article.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                        ) : (
                          <div className="aspect-[16/9] bg-secondary flex items-center justify-center">
                            <Newspaper className="h-10 w-10 text-muted-foreground" />
                          </div>
                        )}
                        <div className="p-5 flex flex-col flex-1">
                          <Badge variant="outline" className="w-fit mb-2 font-display uppercase text-[10px] tracking-wider">
                            {article.category}
                          </Badge>
                          <h3 className="font-display font-bold text-lg leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
                            {article.title}
                          </h3>
                          {article.excerpt && (
                            <p className="text-muted-foreground text-sm line-clamp-2 mb-4 flex-1">{article.excerpt}</p>
                          )}
                          <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-3 border-t border-border">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" /> {article.author_name}
                            </span>
                            {article.published_at && (
                              <span>{format(new Date(article.published_at), "dd MMM yyyy")}</span>
                            )}
                          </div>
                        </div>
                      </article>
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Drafts section for editors */}
              {canEdit && drafts.length > 0 && (
                <div className="mt-12">
                  <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                    <Newspaper className="h-5 w-5 text-muted-foreground" /> Drafts
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {drafts.map((article) => (
                      <Link key={article.id} to={`/news/editor/${article.id}`} className="block group">
                        <div className="bg-card border border-dashed border-border rounded-lg p-4 hover:border-primary/40 transition-colors">
                          <Badge variant="secondary" className="mb-2 text-xs">Draft</Badge>
                          <h3 className="font-display font-bold group-hover:text-primary transition-colors line-clamp-1">{article.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(article.created_at), "dd MMM yyyy")}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
