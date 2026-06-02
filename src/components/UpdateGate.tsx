import { useEffect, useRef, useState } from "react";
import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * UpdateGate
 * -----------
 * Hybrid update strategy:
 *  - Background poll fingerprints index.html and detects new builds.
 *  - When a new build is detected, show a dismissible "Update available" banner
 *    so users can refresh on their terms.
 *  - Additionally, auto-refresh ONCE per new version, but only when it's safe:
 *      * the tab is hidden OR has been idle (no input) for >30s
 *      * no dialog/modal is open
 *      * no form input is focused / has unsaved text
 *      * not already auto-refreshed for this version (tracked in localStorage)
 *  - If the same mismatch persists after an auto-refresh, we never auto-refresh
 *    that fingerprint again — preventing the previous loop.
 */

const FP_KEY = "pafc-index-fingerprint";
const AUTO_REFRESHED_KEY = "pafc-auto-refreshed-fp";
const SESSION_AUTO_KEY = "pafc-auto-refreshed-this-session";
const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const IDLE_THRESHOLD_MS = 30 * 1000; // 30 seconds

async function getIndexFingerprint(): Promise<string | null> {
  try {
    const url = `/?_fp=${Date.now()}`;
    let res = await fetch(url, { method: "HEAD", cache: "no-store" });
    const etag = res.headers.get("etag") || res.headers.get("last-modified");
    if (etag) return etag;

    res = await fetch(url, { method: "GET", cache: "no-store" });
    const text = await res.text();
    const slice = text.slice(0, 4096);
    let hash = 0;
    for (let i = 0; i < slice.length; i++) {
      hash = (hash * 31 + slice.charCodeAt(i)) | 0;
    }
    return String(hash);
  } catch {
    return null;
  }
}

function isUserBusy(): boolean {
  // Open dialog / modal
  if (document.querySelector('[role="dialog"], [data-state="open"][role="alertdialog"]')) {
    return true;
  }
  // Focused input with text
  const el = document.activeElement as HTMLElement | null;
  if (el) {
    const tag = el.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable) {
      const value = (el as HTMLInputElement).value;
      if (value && value.length > 0) return true;
      // Even empty but focused — treat as busy
      return true;
    }
  }
  return false;
}

async function doRefresh() {
  try {
    sessionStorage.setItem(SESSION_AUTO_KEY, "1");
  } catch {}
  // Best-effort cache + SW wipe so the new build actually loads
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

export function UpdateGate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const lastActivityRef = useRef<number>(Date.now());
  const newFpRef = useRef<string | null>(null);

  useEffect(() => {
    // Skip inside Lovable preview iframes
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

    let cancelled = false;

    // Track user activity for idle detection
    const markActive = () => {
      lastActivityRef.current = Date.now();
    };
    ["mousemove", "keydown", "touchstart", "scroll", "click"].forEach((e) =>
      window.addEventListener(e, markActive, { passive: true })
    );

    const tryAutoRefresh = (fp: string) => {
      // Already auto-refreshed once this session — never again
      try {
        if (sessionStorage.getItem(SESSION_AUTO_KEY) === "1") return;
      } catch {}
      // Already auto-refreshed for this fingerprint previously — never again (loop guard)
      try {
        if (localStorage.getItem(AUTO_REFRESHED_KEY) === fp) return;
      } catch {}

      const tabHidden = document.visibilityState === "hidden";
      const idleMs = Date.now() - lastActivityRef.current;
      const safeToRefresh = (tabHidden || idleMs > IDLE_THRESHOLD_MS) && !isUserBusy();

      if (safeToRefresh) {
        try {
          localStorage.setItem(AUTO_REFRESHED_KEY, fp);
          localStorage.setItem(FP_KEY, fp);
        } catch {}
        doRefresh();
      }
    };

    const runCheck = async (isInitial: boolean) => {
      const fp = await getIndexFingerprint();
      if (cancelled || !fp) return;

      const previous = localStorage.getItem(FP_KEY);

      if (!previous) {
        // First check on this device — remember and move on
        localStorage.setItem(FP_KEY, fp);
        return;
      }

      if (previous === fp) {
        // Nothing new
        return;
      }

      // New build detected
      newFpRef.current = fp;
      setUpdateAvailable(true);

      // Try a one-shot safe auto-refresh
      if (!isInitial) {
        tryAutoRefresh(fp);
      } else {
        // On initial load, give the user a moment before considering auto-refresh
        setTimeout(() => !cancelled && tryAutoRefresh(fp), 5000);
      }
    };

    runCheck(true);

    const interval = window.setInterval(() => runCheck(false), CHECK_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        markActive();
        runCheck(false);
      } else if (newFpRef.current) {
        // Tab being hidden with pending update — perfect moment to swap in
        tryAutoRefresh(newFpRef.current);
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      ["mousemove", "keydown", "touchstart", "scroll", "click"].forEach((e) =>
        window.removeEventListener(e, markActive)
      );
    };
  }, []);

  if (!updateAvailable || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] max-w-sm w-[calc(100%-2rem)] bg-card border border-border rounded-lg shadow-lg p-3 flex items-center gap-3 animate-in slide-in-from-bottom-4">
      <RefreshCw className="h-5 w-5 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-display text-sm uppercase tracking-wider text-foreground">
          Update available
        </p>
        <p className="text-xs text-muted-foreground">
          A new version of PAFC is ready.
        </p>
      </div>
      <Button
        size="sm"
        onClick={() => {
          if (newFpRef.current) {
            try {
              localStorage.setItem(FP_KEY, newFpRef.current);
            } catch {}
          }
          setDismissed(true);
          doRefresh();
        }}
      >
        Refresh
      </Button>
      <button
        onClick={() => setDismissed(true)}
        className="p-1 text-muted-foreground hover:text-foreground"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
