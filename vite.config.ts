import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // App disajikan dari sub-path https://kat.naufarrel.dev/dashboard/
  base: "/dashboard/",
  server: {
    // Dev: teruskan panggilan API ke backend lokal (server/) di :8787.
    // Produksi tidak pakai ini — Traefik yang me-rute /dashboard/api.
    proxy: {
      "/dashboard/api": {
        target: "http://127.0.0.1:8787",
        changeOrigin: true,
      },
    },
  },
});
