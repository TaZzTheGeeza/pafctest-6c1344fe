import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from "virtual:pwa-register";

createRoot(document.getElementById("root")!).render(<App />);

// Auto-update the PWA: when a new service worker is ready, reload immediately
// so users (especially on installed PWA / Android) always get the latest build.
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      updateSW(true);
    },
    onRegisteredSW(_swUrl, registration) {
      // Check for updates every 60 seconds while the app is open
      if (registration) {
        setInterval(() => {
          registration.update().catch(() => {});
        }, 60_000);
      }
    },
  });
}
