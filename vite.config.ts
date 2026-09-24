import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // App disajikan dari root subdomain (mis. https://kat.naufarrel.dev/)
  base: "/",
  server: {
    // Dev: teruskan panggilan API ke backend lokal (server/) di :8787.
    // Produksi tidak pakai ini — reverse proxy yang me-rute /api.
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8787",
        changeOrigin: true,
      },
    },
  },
});
