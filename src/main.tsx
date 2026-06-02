import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from "virtual:pwa-register";

createRoot(document.getElementById("root")!).render(<App />);

// Register the PWA worker without forcing automatic page reloads. Automatic
// cache-clearing reloads caused some installed app users to get stuck on the
// "Updating PAFC" screen when validators changed between requests.
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  const isInIframe = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();
  const isPreviewHost =
    window.location.hostname.includes("id-preview--") ||
    window.location.hostname.includes("lovableproject.com");

  if (isInIframe || isPreviewHost) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister().catch(() => {}));
    });
  } else {
    const updateSW = registerSW({
      immediate: true,
      onRegisteredSW(swUrl, registration) {
        if (registration) {
          registration.update().catch(() => {});
          setInterval(() => {
            registration.update().catch(() => {});
          }, 60_000);
        }

        window.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") {
            navigator.serviceWorker.getRegistration(swUrl).then((registration) => {
              registration?.update().catch(() => {});
            });
          }
        });
      },
      onNeedRefresh() {
        updateSW(true);
      },
      onOfflineReady() {
        // Offline cache is ready; no user-facing action required.
      },
    });
  }
}
