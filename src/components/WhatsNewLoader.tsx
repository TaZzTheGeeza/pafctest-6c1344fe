import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LionsDenGate } from "./LionsDenGate";

/**
 * WhatsNewLoader
 * ---------------
 * Shows the Lions' Den "Enter" gate on EVERY fresh page load. Tapping Enter
 * wipes caches + service workers and hard-reloads, guaranteeing every visitor
 * lands on the latest build.
 *
 * Optional content: if an admin has authored an active campaign at
 * /whats-new-admin, its title/bullets are displayed inside the gate. Otherwise
 * the gate falls back to the default Lions' Den copy.
 *
 * Skipped inside the Lovable preview iframe so editing isn't blocked.
 */

interface Bullet {
  title: string;
  desc: string;
}

interface Campaign {
  title: string;
  bullets: Bullet[];
}

const ENTERED_KEY = "lionsden_entered_v1";

async function clearCachesAndReload() {
  try {
    sessionStorage.setItem(ENTERED_KEY, "1");
  } catch {}
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister().catch(() => {})));
    }
  } catch {}
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {}
  const url = window.location.pathname + window.location.search;
  const sep = url.includes("?") ? "&" : "?";
  window.location.replace(url + sep + "_v=" + Date.now());
}

export function WhatsNewLoader() {
  const [show, setShow] = useState(false);
  const [campaign, setCampaign] = useState<Campaign | null>(null);

  useEffect(() => {
    // Skip inside Lovable preview iframes / editor
    const isInIframe = (() => {
      try {
        return window.self !== window.top;
      } catch {
        return true;
      }
    })();
    const isPreviewHost =
      window.location.hostname.includes("id-preview--") ||
      window.location.hostname.includes("lovableproject.com") ||
      window.location.hostname.includes("localhost");

    if (isInIframe || isPreviewHost) return;

    // Don't re-show after the user already tapped Enter this session
    let alreadyEntered = false;
    try {
      alreadyEntered = sessionStorage.getItem(ENTERED_KEY) === "1";
    } catch {}
    const hasVersionParam = new URLSearchParams(window.location.search).has("_v");
    if (alreadyEntered || hasVersionParam) {
      // If we arrived via a versioned reload, mark as entered so future
      // in-app navigations during this session don't re-trigger the gate.
      try { sessionStorage.setItem(ENTERED_KEY, "1"); } catch {}
      return;
    }

    setShow(true);

    // Fetch optional active campaign content (non-blocking)
    (async () => {
      const { data } = await supabase
        .from("whats_new_campaigns")
        .select("title, bullets")
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        const bullets = Array.isArray(data.bullets) ? (data.bullets as unknown as Bullet[]) : [];
        setCampaign({ title: (data.title as string) || "", bullets });
      }
    })();
  }, []);

  if (!show) return null;

  return (
    <LionsDenGate
      title={campaign?.title}
      bullets={campaign?.bullets}
      onEnter={clearCachesAndReload}
    />
  );
}
