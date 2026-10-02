import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import localFont from "next/font/local";
import { parsePrefs, PREFS_COOKIE } from "@/lib/prefs";
import "./globals.css";

// Self-hosted (OFL) so schools that block Google Fonts still get the right typefaces.
const body = localFont({
  src: [
    { path: "./fonts/atkinson-hyperlegible-latin-400-normal.woff2", weight: "400" },
    { path: "./fonts/atkinson-hyperlegible-latin-700-normal.woff2", weight: "700" },
  ],
  variable: "--font-body",
  display: "swap",
});
const heading = localFont({ src: "./fonts/space-grotesk-latin-wght-normal.woff2", weight: "300 700", variable: "--font-heading", display: "swap" });
const code = localFont({ src: "./fonts/jetbrains-mono-latin-wght-normal.woff2", weight: "100 800", variable: "--font-code", display: "swap" });

export const metadata: Metadata = {
  title: { default: "3D Design Academy", template: "%s · 3D Design Academy" },
  description: "Learn to design things that work: CAD, engineering, prototyping and 3D printing for middle school.",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f8fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1626" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const prefs = parsePrefs((await cookies()).get(PREFS_COOKIE)?.value);
  return (
    <html
      lang="en"
      className={`${body.variable} ${heading.variable} ${code.variable}`}
      data-theme={prefs.theme === "system" ? undefined : prefs.theme}
      data-text={prefs.text === "normal" ? undefined : prefs.text}
      data-readable={prefs.readable ? "true" : undefined}
      data-motion={prefs.motion === "reduce" ? "reduce" : undefined}
      suppressHydrationWarning
    >
      <body className="min-h-dvh">
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
