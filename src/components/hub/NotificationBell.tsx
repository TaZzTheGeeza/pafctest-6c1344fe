import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Bell } from "lucide-react";
import { Link } from "react-router-dom";

export function NotificationBell() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    loadCount();

    const channel = supabase
      .channel("bell-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "hub_notifications", filter: `user_id=eq.${user.id}` }, () => {
        setUnreadCount((prev) => prev + 1);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  async function loadCount() {
    const { count } = await supabase.from("hub_notifications").select("*", { count: "exact", head: true }).eq("user_id", user!.id).eq("is_read", false);
    setUnreadCount(count || 0);
  }

  if (!user) return null;

  return (
    <Link to="/hub?tab=notifications" className="relative text-muted-foreground hover:text-foreground transition-colors">
      <Bell className="h-4 w-4" />
      {unreadCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
