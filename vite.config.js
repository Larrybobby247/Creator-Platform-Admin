import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from '@tailwindcss/vite'
// The admin app is a separate site (own port, own bundle, own session cookie). In production serve it from its own host/path
// and reverse-proxy /api to the same API server so the admin cookie stays same-site.
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    port: 5174,
    proxy: {
      "/api": "https://creator-server-hdsk.onrender.com",
      "/uploads": "https://creator-server-hdsk.onrender.com",
    },
  },
  build: {
    target: "es2020",
    sourcemap: false,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 250,
  },
});
