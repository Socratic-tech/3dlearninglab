/**
 * Draws a slide plan (see plan.ts) as a .pptx with pptxgenjs. The file imports cleanly into Google Slides
 * (File → Import slides, or upload to Drive and open with Google Slides) and opens in PowerPoint and Keynote.
 *
 * Design for the projector: big type (18 pt minimum), high contrast, one idea per slide, diagrams as PNG with alt
 * text, teacher moves in the speaker notes. Fonts are Google Fonts so they render as designed in Google Slides.
 */
import PptxGenJS from "pptxgenjs";
import type { SlideSpec } from "./plan";

export type Png = { data: string; width: number; height: number };
export type Rasterize = (diagram: string) => Promise<Png | null>;

const W = 13.333;
const H = 7.5;
const M = 0.6; // side margin
const FONT = "Atkinson Hyperlegible";
const HEAD = "Space Grotesk";
const C = {
  ink: "0F1B2D",
  muted: "4A5A70",
  primary: "0B5CAD",
  primarySoft: "E3EFFB",
  accent: "B45309",
  accentSoft: "FDF1E3",
  success: "15803D",
  successSoft: "E6F6EC",
  bg: "F6F8FB",
  border: "CFD8E3",
  white: "FFFFFF",
  night: "0A1626",
  nightMuted: "A5B7CF",
  sun: "FBBF5A",
};

/** Bigger text for less of it, never below 18 pt. */
function bodySize(chars: number, narrow: boolean): number {
  const steps = narrow ? [[120, 24], [260, 22], [420, 20]] : [[160, 28], [320, 24], [520, 22], [800, 20]];
  for (const [max, size] of steps) if (chars <= max) return size;
  return 18;
}
function titleSize(chars: number): number {
  return chars <= 36 ? 36 : chars <= 70 ? 30 : chars <= 120 ? 26 : 22;
}

const KIND_ACCENT: Partial<Record<SlideSpec["kind"], string>> = {
  think: C.accent,
  challenge: C.accent,
  together: C.success,
  reflect: C.success,
  exit: C.accent,
};

function bulletOpts(style: SlideSpec["listStyle"]) {
  switch (style) {
    case "number":
      return { type: "number" as const, indent: 28 };
    case "check":
      return { code: "2610", indent: 28 };
    default:
      return { indent: 22 };
  }
}

function fitImage(img: Png, box: { x: number; y: number; w: number; h: number }) {
  const r = img.width / img.height;
  let w = box.w;
  let h = w / r;
  if (h > box.h) {
    h = box.h;
    w = h * r;
  }
  return { x: box.x + (box.w - w) / 2, y: box.y + (box.h - h) / 2, w, h };
}

export async function renderDeck(slides: SlideSpec[], opts: { title: string; rasterize: Rasterize; author?: string }): Promise<PptxGenJS> {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.title = opts.title;
  pptx.author = opts.author ?? "3D Design Academy";
  pptx.company = "3D Design Academy";
  pptx.theme = { headFontFace: HEAD, bodyFontFace: FONT };

  pptx.defineSlideMaster({
    title: "ACADEMY",
    background: { color: C.white },
    objects: [
      { rect: { x: 0, y: 0, w: W, h: 0.12, fill: { color: C.primary } } },
      { text: { text: opts.title, options: { x: M, y: H - 0.45, w: 9, h: 0.3, fontFace: FONT, fontSize: 11, color: C.muted } } },
    ],
    slideNumber: { x: W - 1.1, y: H - 0.45, w: 0.6, h: 0.3, fontFace: FONT, fontSize: 11, color: C.muted, align: "right" },
  });

  // Rasterize each diagram once, even if it appears on several slides.
  const cache = new Map<string, Promise<Png | null>>();
  const png = (name: string) => {
    if (!cache.has(name)) cache.set(name, opts.rasterize(name).catch(() => null));
    return cache.get(name)!;
  };

  for (const s of slides) {
    if (s.kind === "title" || s.kind === "section") {
      const slide = pptx.addSlide();
      const dark = s.kind === "title";
      slide.background = { color: dark ? C.night : C.primary };
      if (s.eyebrow) slide.addText(s.eyebrow.toUpperCase(), { x: M + 0.2, y: 2.2, w: W - 2 * M, h: 0.5, fontFace: FONT, fontSize: 18, bold: true, color: dark ? C.sun : C.primarySoft, charSpacing: 2 });
      slide.addText(s.title, { x: M + 0.2, y: 2.75, w: W - 2 * M - 0.4, h: 1.8, fontFace: HEAD, fontSize: s.title.length > 40 ? 40 : 48, bold: true, color: C.white, valign: "top" });
      if (s.body) slide.addText(s.body, { x: M + 0.2, y: 4.6, w: W - 2 * M - 0.4, h: 1, fontFace: FONT, fontSize: 24, color: dark ? C.nightMuted : C.primarySoft, valign: "top" });
      if (dark) slide.addText("3D Design Academy", { x: M + 0.2, y: H - 0.9, w: 6, h: 0.4, fontFace: HEAD, fontSize: 14, bold: true, color: C.nightMuted });
      if (s.notes) slide.addNotes(s.notes);
      continue;
    }

    const slide = pptx.addSlide({ masterName: "ACADEMY" });
    if (s.kind === "hook") slide.background = { color: C.accentSoft };
    const accent = KIND_ACCENT[s.kind] ?? C.primary;

    let y = 0.45;
    if (s.eyebrow) {
      slide.addText(s.eyebrow.toUpperCase(), { x: M, y, w: W - 2 * M, h: 0.4, fontFace: FONT, fontSize: 14, bold: true, color: accent, charSpacing: 1.5, margin: 0 });
      y += 0.45;
    }
    const tSize = titleSize(s.title.length);
    const tH = tSize >= 36 ? 0.9 : tSize >= 30 ? 1.2 : 1.35;
    slide.addText(s.title, { x: M, y, w: W - 2 * M, h: tH, fontFace: HEAD, fontSize: tSize, bold: true, color: C.ink, valign: "top", margin: 0 });
    y += tH + 0.2;

    const img = s.diagram ? await png(s.diagram) : null;
    const bottom = H - 0.7;
    const textW = img ? 6.1 : W - 2 * M;

    if (img) {
      const capH = s.caption ? 0.6 : 0;
      const box = { x: M + textW + 0.3, y, w: W - M - (M + textW + 0.3), h: bottom - y - capH };
      const f = fitImage(img, box);
      slide.addImage({ data: img.data, ...f, altText: s.diagramAlt ?? s.caption ?? s.title });
      if (s.caption) slide.addText(s.caption, { x: box.x, y: f.y + f.h + 0.05, w: box.w, h: capH, fontFace: FONT, fontSize: 14, italic: true, color: C.muted, align: "center", valign: "top", margin: 0 });
    }

    if (s.rows?.length) {
      const agenda = s.kind === "agenda";
      const rows = s.rows.map((r) => {
        const cells: PptxGenJS.TableCell[] = [
          { text: r.left, options: { bold: true, color: agenda ? C.ink : C.primary, fontFace: agenda ? HEAD : FONT } },
          { text: r.right, options: { color: C.ink } },
        ];
        if (agenda) cells.push({ text: r.tag ?? "", options: { color: r.tag === "Devices down" ? C.accent : C.muted, bold: true, align: "right" } });
        return cells;
      });
      const chars = s.rows.reduce((n, r) => n + r.left.length + r.right.length, 0);
      const size = Math.max(18, Math.min(agenda ? 22 : 24, bodySize(chars, false)));
      slide.addTable(rows, {
        x: M,
        y,
        w: textW,
        colW: agenda ? [1.6, textW - 4.1, 2.5] : [Math.min(3.6, textW * 0.32), textW - Math.min(3.6, textW * 0.32)],
        fontFace: FONT,
        fontSize: size,
        valign: "middle",
        border: { type: "solid", pt: 1, color: C.border },
        fill: { color: C.white },
        margin: 0.12,
        autoPage: false,
      });
    } else {
      const parts: PptxGenJS.TextProps[] = [];
      if (s.body) parts.push({ text: s.body, options: { breakLine: true, paraSpaceAfter: 10 } });
      (s.bullets ?? []).forEach((b, i) => {
        // Lettered options are written out ("A  …") so every app shows the same letters students say aloud.
        if (s.listStyle === "letter") parts.push({ text: `${String.fromCharCode(65 + i)}   ${b}`, options: { breakLine: true, paraSpaceAfter: 8, indentLevel: 0 } });
        else parts.push({ text: b, options: { bullet: bulletOpts(s.listStyle), breakLine: true, paraSpaceAfter: 6 } });
      });
      if (parts.length) {
        const chars = (s.body?.length ?? 0) + (s.bullets ?? []).reduce((n, b) => n + b.length + 20, 0);
        const chipH = s.chip ? 0.6 : 0;
        slide.addText(parts, { x: M, y, w: textW, h: bottom - y - chipH, fontFace: FONT, fontSize: bodySize(chars, !!img), color: C.ink, valign: "top", margin: 0, lineSpacingMultiple: 1.1 });
      }
    }

    if (s.chip) {
      const cw = Math.min(5, 0.4 + s.chip.length * 0.13);
      slide.addText(s.chip, { x: M, y: bottom - 0.5, w: cw, h: 0.45, shape: pptx.ShapeType.roundRect, rectRadius: 0.2, fill: { color: s.kind === "together" ? C.successSoft : C.primarySoft }, color: s.kind === "together" ? C.success : C.primary, fontFace: FONT, fontSize: 16, bold: true, align: "center", valign: "middle", margin: 0 });
    }

    if (s.notes) slide.addNotes(s.notes);
  }
  return pptx;
}

/** A safe file name: "Puzzle Cube 4 - Plan the Whole Cube.pptx". */
export function deckFileName(title: string): string {
  return title.replace(/[:/\\?*"<>|]+/g, " -").replace(/\s+/g, " ").trim() + ".pptx";
}
