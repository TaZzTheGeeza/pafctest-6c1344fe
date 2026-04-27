import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from "virtual:pwa-register";

createRoot(document.getElementById("root")!).render(<App />);

const APP_BUILD_VERSION = "presentation-evening-player-zone-v2";

// Auto-update the PWA: when a new service worker is ready, reload immediately
// so users (especially on installed PWA / Android) always get the latest build.
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  const previousVersion = window.localStorage.getItem("pafc-app-build-version");
  if (previousVersion !== APP_BUILD_VERSION) {
    window.localStorage.setItem("pafc-app-build-version", APP_BUILD_VERSION);
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.update().catch(() => {}));
    });
  }

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
      updateSW(true);
    },
  });
}
