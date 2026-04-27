import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Manual cache-buster for users whose installed PWA is stuck on an old build.
 * Unregisters all service workers, clears all caches, then hard-reloads.
 */
export function CheckForUpdatesButton() {
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    setBusy(true);
    try {
      toast.info("Checking for updates…");

      // Clear the build-version marker so main.tsx treats next load as fresh
      try {
        localStorage.removeItem("pafc_app_build_version");
        sessionStorage.removeItem("pafc_build_refresh_done");
      } catch {}

      // Unregister all service workers
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }

      // Wipe all caches (Workbox + browser)
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }

      toast.success("Reloading with the latest version…");
      // Slight delay so the toast is seen, then hard reload bypassing cache
      setTimeout(() => {
        window.location.replace(
          window.location.pathname + "?_v=" + Date.now()
        );
      }, 600);
    } catch (err) {
      console.error("Update check failed", err);
      toast.error("Couldn't refresh. Please close and reopen the app.");
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg bg-card/40">
      <div className="flex-1">
        <p className="font-display text-sm uppercase tracking-wider text-foreground">
          App Updates
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Stuck on an old version? Force a refresh to clear the cache and load
          the latest build.
        </p>
      </div>
      <Button
        onClick={handleClick}
        disabled={busy}
        variant="outline"
        size="sm"
        className="shrink-0"
      >
        {busy ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <RefreshCw className="w-4 h-4 mr-2" />
        )}
        {busy ? "Refreshing…" : "Check for updates"}
      </Button>
    </div>
  );
}
