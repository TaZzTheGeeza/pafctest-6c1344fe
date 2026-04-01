import { useState, useMemo } from "react"; // rebuilt
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { Newspaper, Plus, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NewsFlipbook } from "@/components/news/NewsFlipbook";

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

  // Group articles by month
  const monthlyEditions = useMemo(() => {
    const published = articles.filter((a) => a.is_published);
    const filtered =
      selectedCategory === "all"
        ? published
        : published.filter((a) => a.category === selectedCategory);

    const groups: Record<string, NewsArticle[]> = {};
    filtered.forEach((article) => {
      const date = article.published_at || article.created_at;
      const key = format(new Date(date), "yyyy-MM");
      if (!groups[key]) groups[key] = [];
      groups[key].push(article);
    });

    // Sort months descending
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, arts]) => ({
        key,
        label: format(parseISO(key + "-01"), "MMMM yyyy"),
        articles: arts,
      }));
  }, [articles, selectedCategory]);

  // Track which month edition is selected
  const [editionIndex, setEditionIndex] = useState(0);
  const currentEdition = monthlyEditions[editionIndex];

  const drafts = articles.filter((a) => !a.is_published);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-2">
              <div />
              {canEdit && (
                <Link to="/news/editor">
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" /> New Article
                  </Button>
                </Link>
              )}
            </div>

            {/* Category filter */}
            <div className="flex flex-wrap gap-2 mt-4">
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat.value}
                  variant={selectedCategory === cat.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedCategory(cat.value);
                    setEditionIndex(0);
                  }}
                  className="font-display uppercase tracking-wider text-xs"
                >
                  {cat.label}
                </Button>
              ))}
            </div>
          </motion.div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="bg-card rounded-lg w-[420px] h-[580px] animate-pulse border border-border" />
            </div>
          ) : monthlyEditions.length === 0 ? (
            <div className="max-w-2xl mx-auto bg-card border border-border rounded-lg p-12 text-center">
              <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No news articles yet. Check back for the latest updates!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Edition selector */}
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditionIndex((i) => Math.min(i + 1, monthlyEditions.length - 1))}
                  disabled={editionIndex >= monthlyEditions.length - 1}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" /> Older
                </Button>

                <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-4 py-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  <span className="font-display uppercase tracking-wider text-sm font-bold">
                    {currentEdition?.label}
                  </span>
                  <Badge variant="secondary" className="text-[10px] ml-1">
                    {currentEdition?.articles.length} articles
                  </Badge>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditionIndex((i) => Math.max(i - 1, 0))}
                  disabled={editionIndex <= 0}
                  className="gap-1"
                >
                  Newer <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Flipbook */}
              {currentEdition && (
                <NewsFlipbook
                  key={currentEdition.key}
                  articles={currentEdition.articles.filter((a) => !a.is_featured)}
                  featured={currentEdition.articles.find((a) => a.is_featured)}
                  monthLabel={currentEdition.label}
                />
              )}

              {/* Edition thumbnails */}
              {monthlyEditions.length > 1 && (
                <div className="flex justify-center">
                  <div className="flex gap-2 overflow-x-auto py-2 px-4">
                    {monthlyEditions.map((edition, i) => (
                      <button
                        key={edition.key}
                        onClick={() => setEditionIndex(i)}
                        className={`flex-shrink-0 px-3 py-2 rounded-lg border text-xs font-display uppercase tracking-wider transition-all ${
                          i === editionIndex
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-card text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        {format(parseISO(edition.key + "-01"), "MMM yy")}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Drafts section for editors */}
              {canEdit && drafts.length > 0 && (
                <div className="mt-12">
                  <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                    <Newspaper className="h-5 w-5 text-muted-foreground" /> Drafts
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {drafts.map((article) => (
                      <Link
                        key={article.id}
                        to={`/news/editor/${article.id}`}
                        className="block group"
                      >
                        <div className="bg-card border border-dashed border-border rounded-lg p-4 hover:border-primary/40 transition-colors">
                          <Badge variant="secondary" className="mb-2 text-xs">
                            Draft
                          </Badge>
                          <h3 className="font-display font-bold group-hover:text-primary transition-colors line-clamp-1">
                            {article.title}
                          </h3>
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
