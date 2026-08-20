import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/money-tree-tracker/",
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/apple-touch-icon.png"],
      manifest: {
        name: "MoneyTree — Grace Ofure Zone Tracker",
        short_name: "MoneyTree",
        description: "Everything Grace Ofure teaches, and my growth through it.",
        start_url: ".",
        scope: ".",
        display: "standalone",
        background_color: "#FFFBF2",
        theme_color: "#166534",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icons/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        navigateFallback: "/money-tree-tracker/index.html",
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
        globIgnores: ["**/data/**"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/raw\.githubusercontent\.com\/.*\/data\/.*\.json/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "catalog-remote",
              expiration: { maxEntries: 10, maxAgeSeconds: 7 * 24 * 3600 },
            },
          },
          {
            urlPattern: /\/data\/[^/]+\.json$/,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "catalog-local" },
          },
          {
            urlPattern: /^https:\/\/i\d?\.ytimg\.com\/.*/,
            handler: "CacheFirst",
            options: {
              cacheName: "thumbnails",
              expiration: { maxEntries: 300, maxAgeSeconds: 30 * 24 * 3600 },
            },
          },
        ],
      },
    }),
  ],
});
