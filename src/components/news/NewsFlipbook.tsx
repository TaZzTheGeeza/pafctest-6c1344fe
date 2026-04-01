import { forwardRef, useRef, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Newspaper, Clock, User, Star, Trophy, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

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
  monthLabel: string;
}

/* ── Cover page ── */
function CoverPage({ monthLabel, articleCount }: { monthLabel: string; articleCount: number }) {
  return (
    <div className="h-full flex flex-col relative overflow-hidden rounded-lg border border-border bg-card">
      <div className="bg-gold-gradient py-3 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary-foreground" />
          <span className="font-display text-xs uppercase tracking-[0.3em] text-primary-foreground font-bold">
            Official Programme
          </span>
        </div>
        <span className="font-body text-[10px] text-primary-foreground/80 uppercase tracking-wider">Est. 2024</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative px-8 py-10">
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
          <Trophy className="h-[300px] w-[300px]" />
        </div>
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, transparent, transparent 10px, currentColor 10px, currentColor 11px)",
          }}
        />

        <div className="relative z-10 text-center space-y-6">
          <div className="space-y-1">
            <h1 className="text-5xl md:text-6xl font-display font-bold tracking-tight">
              <span className="text-gold-gradient">PAFC</span>
            </h1>
            <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-foreground">NEWS</h2>
          </div>

          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-12 bg-primary/40" />
            <span className="text-primary font-display text-sm uppercase tracking-[0.3em] font-bold">{monthLabel}</span>
            <div className="h-px w-12 bg-primary/40" />
          </div>

          <p className="text-muted-foreground text-sm font-body">
            {articleCount} {articleCount === 1 ? "story" : "stories"} inside
          </p>

          <div className="mt-8 flex items-center justify-center gap-2 text-muted-foreground/60 text-xs">
            <BookOpen className="h-4 w-4" />
            <span className="font-body">Use arrows to turn pages</span>
          </div>
        </div>
      </div>

      <div className="bg-gold-gradient py-2 px-6">
        <p className="text-center text-[10px] text-primary-foreground/80 uppercase tracking-[0.2em] font-display">
          Peterborough Athletic Football Club
        </p>
      </div>
    </div>
  );
}

/* ── Article page ── */
function ArticlePage({ article, pageNum }: { article: NewsArticle; pageNum: number }) {
  return (
    <div className="h-full flex flex-col rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-2 border-b border-border/50">
        <span className="text-[10px] text-muted-foreground font-display uppercase tracking-widest">PAFC News</span>
        <span className="text-[10px] text-muted-foreground font-body">Page {pageNum}</span>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {article.cover_image_url ? (
          <div className="h-[40%] overflow-hidden relative flex-shrink-0">
            <img src={article.cover_image_url} alt={article.title} className="w-full h-full object-cover" />
            <div className="absolute top-0 left-0 w-12 h-12">
              <div className="absolute top-0 left-0 w-full h-0.5 bg-primary" />
              <div className="absolute top-0 left-0 h-full w-0.5 bg-primary" />
            </div>
          </div>
        ) : (
          <div className="h-[30%] bg-secondary/50 flex items-center justify-center flex-shrink-0">
            <Newspaper className="h-10 w-10 text-muted-foreground/20" />
          </div>
        )}

        <div className="flex-1 p-5 flex flex-col overflow-hidden">
          <Badge
            variant="outline"
            className="w-fit mb-2 font-display uppercase text-[9px] tracking-widest border-primary/30 text-primary"
          >
            {article.category}
          </Badge>

          <h3 className="font-display font-bold text-xl md:text-2xl leading-tight mb-3">{article.title}</h3>

          {article.excerpt && (
            <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-4 first-letter:text-2xl first-letter:font-display first-letter:font-bold first-letter:float-left first-letter:mr-1.5 first-letter:leading-none first-letter:text-primary">
              {article.excerpt}
            </p>
          )}

          <div className="mt-auto pt-3 border-t border-border/50">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <User className="h-3 w-3 text-primary" /> {article.author_name}
              </span>
              {article.published_at && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-primary" /> {format(new Date(article.published_at), "dd MMM yyyy")}
                </span>
              )}
            </div>
            <Link
              to={`/news/${article.slug}`}
              className="inline-flex items-center gap-1 mt-2 text-primary text-xs font-display uppercase tracking-wider hover:underline"
            >
              Read full article →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Back cover ── */
function BackCover() {
  return (
    <div className="h-full flex flex-col items-center justify-center relative rounded-lg border border-border bg-card">
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
        <Trophy className="h-[300px] w-[300px]" />
      </div>
      <div className="relative z-10 text-center space-y-4">
        <h2 className="text-3xl font-display font-bold">
          <span className="text-gold-gradient">PAFC</span>
        </h2>
        <Separator className="w-16 mx-auto bg-primary/40" />
        <p className="text-muted-foreground text-sm font-body">Thank you for reading</p>
        <p className="text-muted-foreground/60 text-xs font-body">© {new Date().getFullYear()} Peterborough Athletic FC</p>
      </div>
    </div>
  );
}

/* ── Page flip animation variants ── */
const pageVariants = {
  enter: (direction: number) => ({
    rotateY: direction > 0 ? 90 : -90,
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    rotateY: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    rotateY: direction < 0 ? 90 : -90,
    opacity: 0,
    scale: 0.95,
  }),
};

/* ── Main Flipbook Component ── */
export function NewsFlipbook({ articles, featured, monthLabel }: Props) {
  const [[currentPage, direction], setPage] = useState([0, 0]);

  const allArticles = useMemo(() => {
    const list: NewsArticle[] = [];
    if (featured) list.push(featured);
    list.push(...articles);
    return list;
  }, [articles, featured]);

  // total pages = cover + articles + back cover
  const totalPages = allArticles.length + 2;

  const goNext = () => {
    if (currentPage < totalPages - 1) setPage([currentPage + 1, 1]);
  };
  const goPrev = () => {
    if (currentPage > 0) setPage([currentPage - 1, -1]);
  };

  // Keyboard navigation
  const containerRef = useRef<HTMLDivElement>(null);

  if (allArticles.length === 0) {
    return (
      <div className="py-16 text-center">
        <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No articles this month.</p>
      </div>
    );
  }

  const renderPage = (pageIndex: number) => {
    if (pageIndex === 0) {
      return <CoverPage monthLabel={monthLabel} articleCount={allArticles.length} />;
    }
    if (pageIndex === totalPages - 1) {
      return <BackCover />;
    }
    const article = allArticles[pageIndex - 1];
    return <ArticlePage article={article} pageNum={pageIndex} />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-6"
      ref={containerRef}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") goNext();
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") goPrev();
      }}
      style={{ outline: "none" }}
    >
      {/* Page display with flip animation */}
      <div
        className="relative w-full max-w-[460px] mx-auto"
        style={{ perspective: "1200px" }}
      >
        <div className="aspect-[3/4] w-full">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentPage}
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                rotateY: { type: "spring", stiffness: 200, damping: 30, duration: 0.5 },
                opacity: { duration: 0.3 },
                scale: { duration: 0.3 },
              }}
              className="absolute inset-0"
              style={{ transformStyle: "preserve-3d" }}
            >
              {renderPage(currentPage)}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Click zones for flipping */}
        <button
          onClick={goPrev}
          disabled={currentPage === 0}
          className="absolute left-0 top-0 bottom-0 w-1/3 z-10 cursor-w-resize opacity-0 disabled:cursor-default"
          aria-label="Previous page"
        />
        <button
          onClick={goNext}
          disabled={currentPage >= totalPages - 1}
          className="absolute right-0 top-0 bottom-0 w-1/3 z-10 cursor-e-resize opacity-0 disabled:cursor-default"
          aria-label="Next page"
        />
      </div>

      {/* Navigation controls */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={goPrev}
          disabled={currentPage === 0}
          className="gap-1 font-display uppercase tracking-wider text-xs"
        >
          <ChevronLeft className="h-4 w-4" /> Prev
        </Button>

        {/* Page dots */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage([i, i > currentPage ? 1 : -1])}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentPage ? "bg-primary w-4" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              aria-label={`Go to page ${i + 1}`}
            />
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={goNext}
          disabled={currentPage >= totalPages - 1}
          className="gap-1 font-display uppercase tracking-wider text-xs"
        >
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
