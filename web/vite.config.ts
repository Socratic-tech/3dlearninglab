import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const r = (p: string) => path.resolve(__dirname, p);

// GitHub Pages edition: static SPA. Student data lives in Google (Apps Script + Sheets), never here.
export default defineConfig({
  root: __dirname,
  base: "./", // relative so it works at https://<user>.github.io/<repo>/
  publicDir: r("public"),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: "next/link", replacement: r("src/shims/next-link.tsx") },
      { find: "next/dynamic", replacement: r("src/shims/next-dynamic.tsx") },
      { find: "server-only", replacement: r("src/shims/empty.ts") },
      { find: "@", replacement: r("../src") },
    ],
  },
  build: { outDir: r("dist"), emptyOutDir: true, chunkSizeWarningLimit: 1500 },
});
