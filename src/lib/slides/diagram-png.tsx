/**
 * Browser-only: draws a catalog diagram to a PNG for slides. Diagrams are SVG coloured with CSS variables, so
 * the light-theme values are swapped in (slides are always light) and the SVG is drawn onto a canvas.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { Diagram, isDiagramName } from "@/components/diagrams";
import type { Png } from "./render";

/** Light-theme tokens from src/app/globals.css. */
export const LIGHT_TOKENS: Record<string, string> = {
  bg: "#f6f8fb",
  surface: "#ffffff",
  "surface-2": "#eef2f7",
  border: "#cfd8e3",
  fg: "#0f1b2d",
  muted: "#4a5a70",
  primary: "#0b5cad",
  "primary-fg": "#ffffff",
  "primary-soft": "#e3effb",
  accent: "#b45309",
  "accent-soft": "#fdf1e3",
  success: "#15803d",
  "success-soft": "#e6f6ec",
  warning: "#a16207",
  "warning-soft": "#fdf6dc",
  violet: "#7c3aed",
  danger: "#b91c1c",
  "danger-soft": "#fdecec",
  "axis-x": "#c62828",
  "axis-y": "#2e7d32",
  "axis-z": "#1565c0",
};

/** A standalone SVG document for a diagram, with fixed colours and size. Exported for tests. */
export function diagramSvg(name: string, scale = 4): { svg: string; width: number; height: number } | null {
  if (!isDiagramName(name)) return null;
  let svg = renderToStaticMarkup(<Diagram name={name} />);
  const vb = /viewBox="([-\d.]+)\s+([-\d.]+)\s+([\d.]+)\s+([\d.]+)"/.exec(svg);
  const vw = vb ? Number(vb[3]) : 360;
  const vh = vb ? Number(vb[4]) : 220;
  const width = Math.round(vw * scale);
  const height = Math.round(vh * scale);
  svg = svg
    .replace(/var\(--([a-z0-9-]+)(?:\s*,\s*([^)]+))?\)/g, (_, n: string, fb?: string) => LIGHT_TOKENS[n] ?? fb?.trim() ?? "#0f1b2d")
    .replace(/\swidth="100%"/, ` width="${width}" height="${height}"`)
    .replace(/\sstyle="[^"]*"/, "")
    .replace(/font-family="inherit"/, `font-family="'Atkinson Hyperlegible', Arial, Helvetica, sans-serif"`);
  return { svg, width, height };
}

export async function diagramPng(name: string): Promise<Png | null> {
  const d = diagramSvg(name);
  if (!d) return null;
  const img = new Image();
  img.decoding = "async";
  const loaded = new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Couldn't draw diagram ${name}`));
  });
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(d.svg);
  await loaded;
  const canvas = document.createElement("canvas");
  canvas.width = d.width;
  canvas.height = d.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, d.width, d.height);
  ctx.drawImage(img, 0, 0, d.width, d.height);
  return { data: canvas.toDataURL("image/png"), width: d.width, height: d.height };
}
