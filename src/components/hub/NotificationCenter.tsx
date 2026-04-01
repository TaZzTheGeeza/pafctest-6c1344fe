import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, Check, CheckCheck, Info, AlertTriangle, Calendar, CreditCard } from "lucide-react";
import { format } from "date-fns";

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

const typeIcons: Record<string, any> = {
  info: Info,
  warning: AlertTriangle,
  event: Calendar,
  payment: CreditCard,
};

export function NotificationCenter() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    if (!user) return;
    loadNotifications();

    const channel = supabase
      .channel("hub-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "hub_notifications", filter: `user_id=eq.${user.id}` }, (payload) => {
        setNotifications((prev) => [payload.new as Notification, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  async function loadNotifications() {
    const { data } = await supabase.from("hub_notifications").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(50);
    if (data) setNotifications(data);
  }

  async function markAsRead(id: string) {
    await supabase.from("hub_notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  }

  async function markAllAsRead() {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from("hub_notifications").update({ is_read: true }).in("id", unreadIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  if (!user) {
    return (
      <div className="text-center py-16">
        <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Sign in to view notifications</p>
      </div>
    );
  }

  const filtered = filter === "unread" ? notifications.filter((n) => !n.is_read) : notifications;
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setFilter("all")} className={`text-xs font-display tracking-wider px-3 py-1.5 rounded-full border transition-colors ${filter === "all" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>All</button>
          <button onClick={() => setFilter("unread")} className={`text-xs font-display tracking-wider px-3 py-1.5 rounded-full border transition-colors ${filter === "unread" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </button>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="text-xs text-primary hover:text-primary/80 font-display tracking-wider flex items-center gap-1">
            <CheckCheck className="h-3.5 w-3.5" /> Mark all read
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <Bell className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{filter === "unread" ? "No unread notifications" : "No notifications yet"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => {
            const Icon = typeIcons[n.type] || Info;
            return (
              <div key={n.id} onClick={() => !n.is_read && markAsRead(n.id)} className={`bg-card border rounded-xl p-4 transition-colors cursor-pointer ${n.is_read ? "border-border opacity-70" : "border-primary/30 hover:border-primary/50"}`}>
                <div className="flex items-start gap-3">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${n.is_read ? "bg-secondary" : "bg-primary/20"}`}>
                    <Icon className={`h-4 w-4 ${n.is_read ? "text-muted-foreground" : "text-primary"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className={`text-sm font-display ${n.is_read ? "text-muted-foreground" : "text-foreground font-bold"}`}>{n.title}</h4>
                      {!n.is_read && <span className="w-2 h-2 bg-primary rounded-full shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(n.created_at), "dd MMM yyyy, HH:mm")}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
