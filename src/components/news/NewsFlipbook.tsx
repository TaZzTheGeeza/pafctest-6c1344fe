import { useRef, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Newspaper, Clock, User, Trophy, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import programmeCover from "@/assets/news/programme-cover.jpg";

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
function CoverPage({ articleCount }: { articleCount: number }) {
  return (
    <div className="h-full w-full relative overflow-hidden rounded-r-lg rounded-l-sm">
      <img src={programmeCover} alt="PAFC Monthly Programme" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1 pb-4 bg-gradient-to-t from-black/60 to-transparent pt-10">
        <p className="text-white/60 text-xs font-body">
          {articleCount} {articleCount === 1 ? "story" : "stories"} inside
        </p>
        <div className="flex items-center gap-2 text-white/40 text-[10px]">
          <BookOpen className="h-3 w-3" />
          <span className="font-body">Swipe or drag to turn pages</span>
        </div>
      </div>
    </div>
  );
}

/* ── Article page ── */
function ArticlePage({ article, pageNum }: { article: NewsArticle; pageNum: number }) {
  return (
    <div className="h-full flex flex-col rounded-r-lg rounded-l-sm border border-border bg-card overflow-hidden">
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
          <Badge variant="outline" className="w-fit mb-2 font-display uppercase text-[9px] tracking-widest border-primary/30 text-primary">
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
            <Link to={`/news/${article.slug}`} className="inline-flex items-center gap-1 mt-2 text-primary text-xs font-display uppercase tracking-wider hover:underline">
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
    <div className="h-full flex flex-col items-center justify-center relative rounded-r-lg rounded-l-sm border border-border bg-card">
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

/*
 * TRUE PAGE-FLIP: The current page folds over from the RIGHT edge
 * like a real book. The next page is revealed underneath.
 *
 * Going forward: current page rotates from 0 → -180 around right edge
 * Going backward: previous page rotates from -180 → 0 around right edge
 */

const SWIPE_THRESHOLD = 60;

export function NewsFlipbook({ articles, featured, monthLabel }: Props) {
  const [currentPage, setCurrentPage] = useState(0);
  const [flipState, setFlipState] = useState<"idle" | "flipping-forward" | "flipping-back">("idle");
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef<number | null>(null);
  const isDragging = useRef(false);

  const allArticles = useMemo(() => {
    const list: NewsArticle[] = [];
    if (featured) list.push(featured);
    list.push(...articles);
    return list;
  }, [articles, featured]);

  const totalPages = allArticles.length + 2;

  const renderPage = useCallback((pageIndex: number) => {
    if (pageIndex === 0) return <CoverPage articleCount={allArticles.length} />;
    if (pageIndex === totalPages - 1) return <BackCover />;
    return <ArticlePage article={allArticles[pageIndex - 1]} pageNum={pageIndex} />;
  }, [allArticles, totalPages]);

  const goNext = useCallback(() => {
    if (currentPage < totalPages - 1 && flipState === "idle") {
      setFlipState("flipping-forward");
      setTimeout(() => {
        setCurrentPage((p) => p + 1);
        setFlipState("idle");
      }, 600);
    }
  }, [currentPage, totalPages, flipState]);

  const goPrev = useCallback(() => {
    if (currentPage > 0 && flipState === "idle") {
      setFlipState("flipping-back");
      setCurrentPage((p) => p - 1);
      setTimeout(() => {
        setFlipState("idle");
      }, 600);
    }
  }, [currentPage, flipState]);

  // Pointer-based swipe (works for mouse + touch)
  const handlePointerDown = (e: React.PointerEvent) => {
    dragStartX.current = e.clientX;
    isDragging.current = true;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragStartX.current === null || !isDragging.current) return;
    const diff = dragStartX.current - e.clientX;
    isDragging.current = false;
    dragStartX.current = null;

    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      if (diff > 0) goNext();
      else goPrev();
    }
  };

  if (allArticles.length === 0) {
    return (
      <div className="py-16 text-center">
        <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No articles this month.</p>
      </div>
    );
  }

  const nextPage = Math.min(currentPage + 1, totalPages - 1);
  const prevPage = Math.max(currentPage - 1, 0);

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
      {/* Book container */}
      <div
        className="relative w-full max-w-[460px] mx-auto select-none touch-none"
        style={{ perspective: "1800px" }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => { isDragging.current = false; dragStartX.current = null; }}
      >
        {/* Book spine */}
        <div className="absolute -left-2 top-2 bottom-2 w-4 rounded-l-sm z-30 pointer-events-none"
          style={{
            background: "linear-gradient(to right, hsl(var(--muted)) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.1) 100%)",
          }}
        />
        {/* Bottom shadow */}
        <div className="absolute -bottom-4 left-6 right-6 h-5 bg-black/15 rounded-full blur-lg pointer-events-none" />

        <div className="aspect-[3/4] w-full relative overflow-visible">
          {/* LAYER 1: The page underneath (revealed during flip) */}
          <div className="absolute inset-0 rounded-r-lg rounded-l-sm overflow-hidden">
            {flipState === "flipping-forward" && renderPage(nextPage)}
            {flipState === "flipping-back" && renderPage(currentPage)}
            {flipState === "idle" && renderPage(currentPage)}
          </div>

          {/* LAYER 2: The flipping page on top */}
          <AnimatePresence>
            {flipState === "flipping-forward" && (
              <motion.div
                key={`flip-fwd-${currentPage}`}
                className="absolute inset-0 rounded-r-lg rounded-l-sm overflow-hidden"
                style={{
                  transformOrigin: "left center",
                  transformStyle: "preserve-3d",
                  backfaceVisibility: "hidden",
                }}
                initial={{ rotateY: 0 }}
                animate={{ rotateY: -180 }}
                exit={{ rotateY: -180 }}
                transition={{
                  rotateY: {
                    duration: 0.6,
                    ease: [0.645, 0.045, 0.355, 1],
                  },
                }}
              >
                {renderPage(currentPage)}
                {/* Shadow that intensifies as page flips */}
                <motion.div
                  className="absolute inset-0 pointer-events-none rounded-r-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.4 }}
                  transition={{ duration: 0.6 }}
                  style={{
                    background: "linear-gradient(to left, rgba(0,0,0,0.5) 0%, transparent 60%)",
                  }}
                />
              </motion.div>
            )}

            {flipState === "flipping-back" && (
              <motion.div
                key={`flip-back-${prevPage}`}
                className="absolute inset-0 rounded-r-lg rounded-l-sm overflow-hidden"
                style={{
                  transformOrigin: "left center",
                  transformStyle: "preserve-3d",
                  backfaceVisibility: "hidden",
                }}
                initial={{ rotateY: -180 }}
                animate={{ rotateY: 0 }}
                exit={{ rotateY: 0 }}
                transition={{
                  rotateY: {
                    duration: 0.6,
                    ease: [0.645, 0.045, 0.355, 1],
                  },
                }}
              >
                {renderPage(prevPage)}
                <motion.div
                  className="absolute inset-0 pointer-events-none rounded-r-lg"
                  initial={{ opacity: 0.4 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                  style={{
                    background: "linear-gradient(to left, rgba(0,0,0,0.5) 0%, transparent 60%)",
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Page edge lines for depth */}
          <div className="absolute right-0 top-1 bottom-1 w-[3px] pointer-events-none z-20 rounded-r"
            style={{
              background: "linear-gradient(to left, rgba(0,0,0,0.15), transparent)",
            }}
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={goPrev} disabled={currentPage === 0 || flipState !== "idle"} className="gap-1 font-display uppercase tracking-wider text-xs">
          <ChevronLeft className="h-4 w-4" /> Prev
        </Button>

        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => {
                if (flipState !== "idle" || i === currentPage) return;
                if (i > currentPage) goNext();
                else goPrev();
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentPage ? "bg-primary w-4" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              aria-label={`Go to page ${i + 1}`}
            />
          ))}
        </div>

        <Button variant="outline" size="sm" onClick={goNext} disabled={currentPage >= totalPages - 1 || flipState !== "idle"} className="gap-1 font-display uppercase tracking-wider text-xs">
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
