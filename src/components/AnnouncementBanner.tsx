import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X, Megaphone, AlertTriangle, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

// Auto-link tokens like "/presentation" or full URLs inside announcement text
function renderMessageWithLinks(message: string) {
  // Match http(s) URLs OR internal paths starting with "/" (letters/digits/-/_/)
  const regex = /(https?:\/\/[^\s]+|\/[a-zA-Z0-9\-_/]+)/g;
  const parts: Array<string | { href: string; external: boolean }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(message)) !== null) {
    if (match.index > lastIndex) parts.push(message.slice(lastIndex, match.index));
    const token = match[0];
    parts.push({ href: token, external: token.startsWith("http") });
    lastIndex = match.index + token.length;
  }
  if (lastIndex < message.length) parts.push(message.slice(lastIndex));
  return parts.map((p, i) => {
    if (typeof p === "string") return <span key={i}>{p}</span>;
    if (p.external) {
      return (
        <a key={i} href={p.href} target="_blank" rel="noopener noreferrer" className="underline font-semibold text-primary hover:text-primary/80">
          {p.href}
        </a>
      );
    }
    return (
      <Link key={i} to={p.href} className="underline font-semibold text-primary hover:text-primary/80">
        {p.href}
      </Link>
    );
  });
}

interface Announcement {
  id: string;
  message: string;
  type: string;
  is_active: boolean;
}

const typeConfig: Record<string, { icon: typeof Megaphone; bg: string; border: string }> = {
  urgent: { icon: AlertTriangle, bg: "bg-destructive/10", border: "border-destructive/30" },
  info: { icon: Info, bg: "bg-primary/10", border: "border-primary/30" },
  success: { icon: Megaphone, bg: "bg-green-900/20", border: "border-green-500/30" },
};

export function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("announcements")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (data) setAnnouncements(data);
    };
    fetch();

    const channel = supabase
      .channel("announcements-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, () => fetch())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const visible = announcements.filter((a) => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  return (
    <div className="fixed top-16 left-0 right-0 z-40 space-y-1">
      <AnimatePresence>
        {visible.map((a) => {
          const config = typeConfig[a.type] || typeConfig.info;
          const Icon = config.icon;
          const Inner = (
            <div className="container mx-auto px-4 py-2 flex items-center gap-3">
              <Icon className="h-4 w-4 shrink-0 text-foreground" />
              <p className="text-sm text-foreground flex-1">{renderMessageWithLinks(a.message)}</p>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDismissed((s) => new Set(s).add(a.id)); }}
                className="shrink-0 text-muted-foreground hover:text-foreground"
                aria-label="Dismiss announcement"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`${config.bg} ${config.border} border-b backdrop-blur-md`}
            >
              {Inner}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
