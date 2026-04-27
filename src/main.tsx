import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from "virtual:pwa-register";

createRoot(document.getElementById("root")!).render(<App />);

const APP_BUILD_VERSION = "pafc-pwa-cache-reset-2026-04-27-v1";
const BUILD_VERSION_KEY = "pafc-app-build-version";
const BUILD_REFRESH_KEY = "pafc-app-build-refreshing";

// Auto-update the PWA: when a new service worker is ready, reload immediately
// so users (especially on installed PWA / Android) always get the latest build.
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
    const previousVersion = window.localStorage.getItem(BUILD_VERSION_KEY);
    const alreadyRefreshing = window.sessionStorage.getItem(BUILD_REFRESH_KEY) === APP_BUILD_VERSION;

    if (previousVersion !== APP_BUILD_VERSION && !alreadyRefreshing) {
      window.localStorage.setItem(BUILD_VERSION_KEY, APP_BUILD_VERSION);
      window.sessionStorage.setItem(BUILD_REFRESH_KEY, APP_BUILD_VERSION);

      Promise.all([
        navigator.serviceWorker.getRegistrations().then((registrations) =>
          Promise.all(registrations.map((registration) => registration.unregister().catch(() => false)))
        ),
        "caches" in window
          ? caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key).catch(() => false))))
          : Promise.resolve([]),
      ]).finally(() => {
        window.location.reload();
      });
    }

    const updateSW = registerSW({
      immediate: true,
      onRegisteredSW(swUrl, registration) {
        window.sessionStorage.removeItem(BUILD_REFRESH_KEY);
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
        updateSW(true);
      },
    });
  }
}
