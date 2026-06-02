import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, RefreshCw } from "lucide-react";

/**
 * UpdateGate
 * -----------
 * Every time the app opens (or comes back to the foreground), we check the
 * server for a newer build of index.html. The check is intentionally passive:
 * it must never hard-refresh users automatically, because CDN/proxy validators
 * can vary and would otherwise trap people in an update loop.
 *
 * The check fingerprints index.html (HEAD request, falls back to GET) and
 * compares against the last-seen fingerprint in localStorage. The very first
 * load just stores the fingerprint so we don't spuriously reload.
 */

const FP_KEY = "pafc-index-fingerprint";

type Phase = "checking" | "up-to-date" | "updating" | "idle";

async function getIndexFingerprint(): Promise<string | null> {
  try {
    // Bust any browser/proxy cache on this request so we see the real server build
    const url = `/?_fp=${Date.now()}`;
    let res = await fetch(url, { method: "HEAD", cache: "no-store" });
    // Prefer ETag, then Last-Modified, then content hash
    const etag = res.headers.get("etag") || res.headers.get("last-modified");
    if (etag) return etag;

    // Fallback: fetch body and hash a stable slice
    res = await fetch(url, { method: "GET", cache: "no-store" });
    const text = await res.text();
    // Hash the first 4KB — script tags with hashed asset names live here
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

export function UpdateGate() {
  const [phase, setPhase] = useState<Phase>("checking");

  useEffect(() => {
    // Skip inside Lovable preview iframes — we don't want the modal flashing while building
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

    if (isInIframe || isPreviewHost) {
      setPhase("idle");
      return;
    }

    let cancelled = false;

    const runCheck = async (isInitial: boolean) => {
      if (!isInitial) setPhase("checking");
      const fp = await getIndexFingerprint();
      if (cancelled) return;

      if (!fp) {
        // Network failed — don't block the app
        setPhase("idle");
        return;
      }

      const previous = localStorage.getItem(FP_KEY);

      if (!previous) {
        // First ever check on this device — just remember and move on
        localStorage.setItem(FP_KEY, fp);
        setPhase("up-to-date");
        setTimeout(() => !cancelled && setPhase("idle"), 800);
        return;
      }

      if (previous === fp) {
        setPhase("up-to-date");
        setTimeout(() => !cancelled && setPhase("idle"), 800);
        return;
      }

      // New build detected — remember it, but do not auto-refresh.
      // Users can still use the manual "Check for updates" button if needed.
      localStorage.setItem(FP_KEY, fp);
      setPhase("idle");
    };

    // Initial check on app open
    runCheck(true);

    // Re-check when the app returns to foreground (PWA users who background it)
    const onVisible = () => {
      if (document.visibilityState === "visible") runCheck(false);
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  if (phase === "idle") return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-md flex items-center justify-center px-6">
      <div className="max-w-sm w-full text-center space-y-5">
        <div className="flex justify-center">
          {phase === "updating" ? (
            <RefreshCw className="h-12 w-12 text-primary animate-spin" />
          ) : phase === "up-to-date" ? (
            <CheckCircle2 className="h-12 w-12 text-primary" />
          ) : (
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
          )}
        </div>
        <div>
          <p className="font-display text-xl tracking-wider uppercase text-foreground">
            {phase === "updating"
              ? "Updating PAFC"
              : phase === "up-to-date"
                ? "You're up to date"
                : "Checking for updates"}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {phase === "updating"
              ? "Loading the latest version… the app will refresh in a moment."
              : phase === "up-to-date"
                ? "Showing the latest news, fixtures and notifications."
                : "Making sure you have the latest news and fixtures…"}
          </p>
        </div>
      </div>
    </div>
  );
}
