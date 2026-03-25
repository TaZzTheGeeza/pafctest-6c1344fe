import { useEffect, useState } from "react";
import { X, Megaphone, AlertTriangle, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

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
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`${config.bg} ${config.border} border-b backdrop-blur-md`}
            >
              <div className="container mx-auto px-4 py-2 flex items-center gap-3">
                <Icon className="h-4 w-4 shrink-0 text-foreground" />
                <p className="text-sm text-foreground flex-1">{a.message}</p>
                <button onClick={() => setDismissed((s) => new Set(s).add(a.id))} className="shrink-0 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
