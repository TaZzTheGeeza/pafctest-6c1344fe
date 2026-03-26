import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon-v3.ico", "apple-touch-icon-v3.png", "pwa-icon-192-v3.png", "pwa-icon-512-v3.png", "pwa-maskable-v3.png"],
      workbox: {
        navigateFallbackDenylist: [/^\/~oauth/],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,webp,woff,woff2}"],
      },
      manifest: {
        id: "/",
        name: "Peterborough Athletic FC",
        short_name: "PAFC",
        description: "Official app for Peterborough Athletic FC — fixtures, results, team hub & more.",
        theme_color: "#b8860b",
        background_color: "#0d0d0d",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/pwa-icon-192-v3.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-icon-512-v3.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/pwa-maskable-v3.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
}));
