import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const r = (p: string) => path.resolve(__dirname, p);
// One sign-in client ID for the whole site: env var first, then apps-script/build.config.json.
const conf = JSON.parse(fs.readFileSync(r("../apps-script/build.config.json"), "utf8")) as { clientId?: string; templateUrl?: string };
const clientId = process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || conf.clientId || "";

// GitHub Pages edition: static SPA. Student data lives in Google (Apps Script + Sheets), never here.
export default defineConfig({
  root: __dirname,
  base: "./", // relative so it works at https://<user>.github.io/<repo>/
  publicDir: r("public"),
  plugins: [react(), tailwindcss()],
  define: {
    "import.meta.env.VITE_GOOGLE_CLIENT_ID": JSON.stringify(clientId),
    "import.meta.env.VITE_TEMPLATE_URL": JSON.stringify(process.env.TEMPLATE_URL || conf.templateUrl || ""),
  },
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
