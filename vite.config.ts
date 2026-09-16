import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/supabase/vite";

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
    mcpPlugin(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon-v3.ico", "apple-touch-icon-v4.png", "pwa-icon-192-v4.png", "pwa-icon-512-v4.png", "pwa-maskable-v4.png"],
      devOptions: {
        enabled: false,
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        // index.html is deliberately not precached, so there is no precached URL to
        // bind a navigation fallback to. Leaving the default ('index.html') would make
        // sw.js throw non-precached-url on install and kill push handling too.
        navigateFallback: null,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkOnly",
            options: {
              cacheName: "pafc-pages",
            },
          },
        ],
        // Never precache HTML. Every page navigation must load the current
        // deployment so newly added routes cannot be hidden by an old app shell.
        globPatterns: ["**/*.{js,css,ico,png,svg,jpg,webp,woff,woff2}"],
        importScripts: ["/push-sw.js"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
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
            src: "/pwa-icon-192-v4.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-icon-512-v4.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/pwa-maskable-v4.png",
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
