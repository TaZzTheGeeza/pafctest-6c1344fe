import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const HEARTBEAT_INTERVAL = 60_000; // 1 minute

export function usePresence() {
  const { user } = useAuth();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!user) return;

    async function heartbeat() {
      await supabase
        .from("profiles")
        .update({ last_seen_at: new Date().toISOString() } as any)
        .eq("id", user!.id);
    }

    // Immediate heartbeat on mount
    heartbeat();

    // Regular heartbeats
    intervalRef.current = setInterval(heartbeat, HEARTBEAT_INTERVAL);

    // Heartbeat on visibility change
    function onVisibilityChange() {
      if (document.visibilityState === "visible") heartbeat();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [user?.id]);
}

/** Consider a user "online" if last_seen_at is within the last 2 minutes */
export function isUserOnline(lastSeenAt: string | null): boolean {
  if (!lastSeenAt) return false;
  const diff = Date.now() - new Date(lastSeenAt).getTime();
  return diff < 2 * 60 * 1000;
}

export function formatLastSeen(lastSeenAt: string | null): string {
  if (!lastSeenAt) return "Never";
  const diff = Date.now() - new Date(lastSeenAt).getTime();
  if (diff < 2 * 60 * 1000) return "Online";
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
