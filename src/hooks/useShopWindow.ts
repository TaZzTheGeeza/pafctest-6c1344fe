import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ShopWindow {
  /** Manual admin toggle */
  shopOpenFlag: boolean;
  /** Deadline for orders (ISO) or null when no deadline set */
  closesAt: Date | null;
  /** Days needed after closure to prepare/print orders */
  readyDays: number;
  /** Date orders should be ready by */
  readyBy: Date | null;
  /** True when the shop accepts orders right now */
  isOpen: boolean;
  /** Milliseconds remaining until closure (null when no deadline) */
  msLeft: number | null;
  loading: boolean;
}

export function useShopWindow(): ShopWindow {
  const [shopOpenFlag, setShopOpenFlag] = useState(true);
  const [closesAt, setClosesAt] = useState<Date | null>(null);
  const [readyDays, setReadyDays] = useState(10);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let active = true;
    supabase
      .from("site_settings" as any)
      .select("key, value")
      .in("key", ["shop_open", "shop_closes_at", "shop_ready_days"])
      .then(({ data }) => {
        if (!active || !data) return;
        for (const row of data as any[]) {
          if (row.key === "shop_open") setShopOpenFlag(row.value === "true");
          if (row.key === "shop_closes_at" && row.value) {
            const d = new Date(row.value);
            if (!isNaN(d.getTime())) setClosesAt(d);
          }
          if (row.key === "shop_ready_days" && row.value) {
            const n = parseInt(row.value, 10);
            if (!isNaN(n)) setReadyDays(n);
          }
        }
        setLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const msLeft = closesAt ? closesAt.getTime() - now : null;
  const isOpen = shopOpenFlag && (msLeft === null || msLeft > 0);
  const readyBy = closesAt ? new Date(closesAt.getTime() + readyDays * 86400000) : null;

  return { shopOpenFlag, closesAt, readyDays, readyBy, isOpen, msLeft, loading };
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return "Closed";
  const total = Math.floor(ms / 1000);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

export function formatUkDate(d: Date): string {
  return d.toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "long", year: "numeric",
    timeZone: "Europe/London",
  });
}

export function formatUkDateTime(d: Date): string {
  return d.toLocaleString("en-GB", {
    weekday: "short", day: "numeric", month: "long",
    hour: "2-digit", minute: "2-digit",
    timeZone: "Europe/London",
  });
}
