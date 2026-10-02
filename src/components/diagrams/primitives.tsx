/**
 * Shared drawing helpers for the explanatory diagram library.
 * Server-component safe: no hooks, no browser APIs. Colours only via CSS variables.
 */
import { Children } from "react";
import { tr } from "@/lib/i18n";
import type { FC, ReactNode, SVGProps } from "react";
import { diagramCatalog, type DiagramName } from "@/content/diagram-catalog";

export type DiagramProps = { className?: string; title?: string };
export type DiagramFC = FC<DiagramProps>;

export const VB_W = 360;
export const VB_H = 220;

/** Palette (CSS variables only). */
export const C = {
  fg: "var(--fg)",
  muted: "var(--muted)",
  primary: "var(--primary)",
  primarySoft: "var(--primary-soft)",
  accent: "var(--accent)",
  accentSoft: "var(--accent-soft)",
  surface: "var(--surface-2)",
  border: "var(--border)",
  success: "var(--success)",
  danger: "var(--danger)",
  x: "var(--axis-x)",
  y: "var(--axis-y)",
  z: "var(--axis-z)",
} as const;

export type Tone = "fg" | "muted" | "primary" | "accent" | "danger" | "success" | "x" | "y" | "z";
const TONES: Tone[] = ["fg", "muted", "primary", "accent", "danger", "success", "x", "y", "z"];
const toneVar: Record<Tone, string> = {
  fg: C.fg,
  muted: C.muted,
  primary: C.primary,
  accent: C.accent,
  danger: C.danger,
  success: C.success,
  x: C.x,
  y: C.y,
  z: C.z,
};

/** Per-diagram reference helpers (marker / pattern urls scoped by diagram name). */
export type Refs = {
  /** Arrowhead marker url for a tone. Use as markerEnd / markerStart (auto-start-reverse). */
  arrow: (t?: Tone) => string;
  /** Diagonal hatch fill (used for "hole" shapes and support material). */
  hatch: string;
  /** Horizontal layer-line fill (5 px pitch). */
  layers: string;
  /** Unique id prefix for anything else. */
  id: string;
};

export function diagramId(name: string): string {
  return `dg-${name.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

/** Wrap a diagram body in the shared <svg> frame with title + markers + patterns. */
export function defineDiagram(name: DiagramName, render: (r: Refs) => ReactNode): DiagramFC {
  const id = diagramId(name);
  const refs: Refs = {
    arrow: (t: Tone = "fg") => `url(#${id}-arrow-${t})`,
    hatch: `url(#${id}-hatch)`,
    layers: `url(#${id}-layers)`,
    id,
  };
  const Component: DiagramFC = ({ className, title }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      width="100%"
      role="img"
      aria-labelledby={`${id}-title`}
      className={className}
      style={{ height: "auto", display: "block", maxWidth: "100%" }}
      fontFamily="inherit"
      fontSize={12}
      strokeLinejoin="round"
      strokeLinecap="round"
      data-diagram={name}
    >
      <title id={`${id}-title`}>{title ?? tr(diagramCatalog[name])}</title>
      <defs>
        {TONES.map((t) => (
          <marker
            key={t}
            id={`${id}-arrow-${t}`}
            viewBox="0 0 10 10"
            refX="8.5"
            refY="5"
            markerWidth="8"
            markerHeight="8"
            markerUnits="userSpaceOnUse"
            orient="auto-start-reverse"
          >
            <path d="M0 0.5 L10 5 L0 9.5 L2.5 5 Z" fill={toneVar[t]} />
          </marker>
        ))}
        <pattern id={`${id}-hatch`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="6" height="6" fill={C.surface} />
          <line x1="0" y1="0" x2="0" y2="6" stroke={C.muted} strokeWidth="1.6" />
        </pattern>
        <pattern id={`${id}-layers`} width="8" height="5" patternUnits="userSpaceOnUse">
          <rect width="8" height="5" fill={C.primarySoft} />
          <line x1="0" y1="4.5" x2="8" y2="4.5" stroke={C.primary} strokeWidth="0.9" />
        </pattern>
      </defs>
      {render(refs)}
    </svg>
  );
  Component.displayName = `Diagram(${name})`;
  return Component;
}

/* ------------------------------------------------------------------ text */

type TextProps = Omit<SVGProps<SVGTextElement>, "x" | "y"> & {
  x: number;
  y: number;
  anchor?: "start" | "middle" | "end";
  size?: number;
  weight?: number;
  tone?: string;
  /** draw a soft outline behind the glyphs so the label stays readable over lines/fills */
  halo?: boolean;
  children: ReactNode;
};

/** A text label. Default 12px, fill var(--fg). */
export function T({ x, y, anchor = "start", size = 12, weight = 400, tone = C.fg, halo = false, children, ...rest }: TextProps) {
  const haloProps = halo ? { stroke: C.surface, strokeWidth: 3.5, paintOrder: "stroke" as const, strokeLinejoin: "round" as const } : {};
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={size} fontWeight={weight} fill={tone} {...haloProps} {...rest}>
      {Children.map(children, (c) => (typeof c === "string" ? tr(c) : c))}
    </text>
  );
}

/* ----------------------------------------------------------- lines & dims */

export type Pt = [number, number];

export function pts(list: Pt[]): string {
  return list.map(([x, y]) => `${round(x)},${round(y)}`).join(" ");
}

export function round(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Straight arrow (single or double headed). */
export function Arrow({
  from,
  to,
  r,
  tone = "fg",
  both = false,
  width = 1.6,
  dash,
}: {
  from: Pt;
  to: Pt;
  r: Refs;
  tone?: Tone;
  both?: boolean;
  width?: number;
  dash?: string;
}) {
  return (
    <line
      x1={from[0]}
      y1={from[1]}
      x2={to[0]}
      y2={to[1]}
      stroke={toneVar[tone]}
      strokeWidth={width}
      strokeDasharray={dash}
      markerEnd={r.arrow(tone)}
      markerStart={both ? r.arrow(tone) : undefined}
    />
  );
}

/** Dimension line with extension ticks and a centred label. */
export function Dim({
  from,
  to,
  label,
  r,
  tone = "fg",
  offset = 10,
  labelSide = 1,
  size = 11,
  weight = 600,
}: {
  from: Pt;
  to: Pt;
  label: ReactNode;
  r: Refs;
  tone?: Tone;
  /** distance of label from the line, along the normal */
  offset?: number;
  labelSide?: 1 | -1;
  size?: number;
  weight?: number;
}) {
  const [x1, y1] = from;
  const [x2, y2] = to;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const mx = (x1 + x2) / 2 + nx * offset * labelSide;
  const my = (y1 + y2) / 2 + ny * offset * labelSide + size * 0.35;
  const tick = 5;
  return (
    <g>
      <line x1={x1 + nx * tick} y1={y1 + ny * tick} x2={x1 - nx * tick} y2={y1 - ny * tick} stroke={toneVar[tone]} strokeWidth={1} />
      <line x1={x2 + nx * tick} y1={y2 + ny * tick} x2={x2 - nx * tick} y2={y2 - ny * tick} stroke={toneVar[tone]} strokeWidth={1} />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={toneVar[tone]} strokeWidth={1.2} markerStart={r.arrow(tone)} markerEnd={r.arrow(tone)} />
      <T x={mx} y={my} anchor="middle" size={size} weight={weight} tone={toneVar[tone]} halo>
        {label}
      </T>
    </g>
  );
}

/** Thin leader line from a point on the drawing to a label anchor. */
export function Leader({ from, to, tone = C.muted }: { from: Pt; to: Pt; tone?: string }) {
  return (
    <g>
      <circle cx={from[0]} cy={from[1]} r={2} fill={tone} />
      <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke={tone} strokeWidth={1} />
    </g>
  );
}

/** Circular arc between two angles (degrees, 0 = +x, counter-clockwise positive in math sense; SVG y down). */
export function arcPath(cx: number, cy: number, rad: number, a0: number, a1: number): string {
  const p = (a: number): Pt => [cx + rad * Math.cos((a * Math.PI) / 180), cy - rad * Math.sin((a * Math.PI) / 180)];
  const [sx, sy] = p(a0);
  const [ex, ey] = p(a1);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  const sweep = a1 > a0 ? 0 : 1;
  return `M${round(sx)} ${round(sy)} A${rad} ${rad} 0 ${large} ${sweep} ${round(ex)} ${round(ey)}`;
}

/** Points along a (rotated) ellipse arc, as an SVG path. Angles in screen degrees (y down). */
export function ellipseArc(cx: number, cy: number, rx: number, ry: number, rot: number, t0: number, t1: number, n = 28): string {
  const rr = (rot * Math.PI) / 180;
  const out: string[] = [];
  for (let i = 0; i <= n; i++) {
    const t = ((t0 + ((t1 - t0) * i) / n) * Math.PI) / 180;
    const ex = rx * Math.cos(t);
    const ey = ry * Math.sin(t);
    const x = cx + ex * Math.cos(rr) - ey * Math.sin(rr);
    const y = cy + ex * Math.sin(rr) + ey * Math.cos(rr);
    out.push(`${i === 0 ? "M" : "L"}${round(x)} ${round(y)}`);
  }
  return out.join(" ");
}

/* --------------------------------------------------------------- symbols */

/** Check mark in a circle (success) — pair with a text label. */
export function Check({ x, y, s = 14 }: { x: number; y: number; s?: number }) {
  const h = s / 2;
  return (
    <g aria-hidden="true">
      <circle cx={x} cy={y} r={h} fill={C.success} />
      <path
        d={`M${x - h * 0.5} ${y} L${x - h * 0.1} ${y + h * 0.4} L${x + h * 0.55} ${y - h * 0.4}`}
        fill="none"
        stroke={C.surface}
        strokeWidth={s / 7}
      />
    </g>
  );
}

/** Cross in a circle (danger) — pair with a text label. */
export function Cross({ x, y, s = 14 }: { x: number; y: number; s?: number }) {
  const h = s / 2;
  const k = h * 0.42;
  return (
    <g aria-hidden="true">
      <circle cx={x} cy={y} r={h} fill={C.danger} />
      <path d={`M${x - k} ${y - k} L${x + k} ${y + k} M${x + k} ${y - k} L${x - k} ${y + k}`} stroke={C.surface} strokeWidth={s / 7} />
    </g>
  );
}

/** Verdict label: ✓/✗ symbol followed by text. */
export function Verdict({ x, y, ok, children, anchor = "middle", size = 12 }: { x: number; y: number; ok: boolean; children: ReactNode; anchor?: "start" | "middle"; size?: number }) {
  // approximate text width to centre symbol + text as a unit
  const text = typeof children === "string" ? children : "";
  const w = text.length * size * 0.56;
  const sx = anchor === "middle" ? x - (w + 18) / 2 + 7 : x + 7;
  return (
    <g>
      {ok ? <Check x={sx} y={y - size * 0.35} /> : <Cross x={sx} y={y - size * 0.35} />}
      <T x={sx + 11} y={y} size={size} weight={600} tone={ok ? C.success : C.danger}>
        {children}
      </T>
    </g>
  );
}

/** Mouse-pointer cursor with its tip at (x, y). */
export function Cursor({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M0 0 L0 17 L4.5 13 L7.5 20 L10.5 18.6 L7.6 12 L13 12 Z"
      fill={C.fg}
      stroke={C.surface}
      strokeWidth={1.2}
    />
  );
}

/** Keyboard key cap. */
export function Key({ x, y, w = 30, h = 26, label, active = false, size = 12 }: { x: number; y: number; w?: number; h?: number; label: ReactNode; active?: boolean; size?: number }) {
  return (
    <g>
      <rect x={x} y={y + 2} width={w} height={h} rx={5} fill={C.border} />
      <rect x={x} y={y} width={w} height={h} rx={5} fill={active ? C.primarySoft : C.surface} stroke={active ? C.primary : C.muted} strokeWidth={1.2} />
      <T x={x + w / 2} y={y + h / 2 + size * 0.36} anchor="middle" size={size} weight={600}>
        {label}
      </T>
    </g>
  );
}

/* ------------------------------------------------- side-view print parts */

/** Side-view build plate. */
export function Plate({ x, y, w, label }: { x: number; y: number; w: number; label?: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={7} rx={1.5} fill={C.border} stroke={C.muted} strokeWidth={1} />
      {label ? (
        <T x={x + w / 2} y={y + 19} anchor="middle" size={11} tone={C.muted}>
          {label}
        </T>
      ) : null}
    </g>
  );
}

/** Rectangle filled with horizontal layer lines (side view of a printed part). */
export function LayeredRect({ x, y, w, h, r }: { x: number; y: number; w: number; h: number; r: Refs }) {
  return <rect x={x} y={y} width={w} height={h} fill={r.layers} stroke={C.primary} strokeWidth={1.4} />;
}

/** Simple side-view nozzle with its tip at (x, y). */
export function Nozzle({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-14} y={-34} width={28} height={18} rx={2} fill={C.surface} stroke={C.fg} strokeWidth={1.2} />
      <path d="M-8 -16 L8 -16 L3 -2 L-3 -2 Z" fill={C.accent} stroke={C.fg} strokeWidth={1.2} />
      <rect x={-2.5} y={-2} width={5} height={2} fill={C.fg} />
    </g>
  );
}

/* --------------------------------------------------------- isometric 3D */

const COS30 = Math.cos(Math.PI / 6);

export type Proj = (x: number, y: number, z: number) => Pt;

/** Isometric projector. +x goes right-down, +y goes left-down, +z goes up. */
export function iso(ox: number, oy: number, s = 1): Proj {
  return (x, y, z) => [ox + (x - y) * COS30 * s, oy + ((x + y) * 0.5 - z) * s];
}

/** Oblique projector: +x right, +y receding up-right (depth), +z up. */
export function oblique(ox: number, oy: number, k = 0.5, angleDeg = 35): Proj {
  const a = (angleDeg * Math.PI) / 180;
  return (x, y, z) => [ox + x + y * k * Math.cos(a), oy - z - y * k * Math.sin(a)];
}

export function Poly({ p, points, fill = "none", stroke = C.fg, sw = 1.2, dash, opacity }: { p: Proj; points: [number, number, number][]; fill?: string; stroke?: string; sw?: number; dash?: string; opacity?: number }) {
  return <polygon points={pts(points.map(([a, b, c]) => p(a, b, c)))} fill={fill} stroke={stroke} strokeWidth={sw} strokeDasharray={dash} opacity={opacity} />;
}

export type BoxFill = { top?: string; left?: string; right?: string };

/**
 * Isometric box from (x,y,z) with size (w,d,h). Draws the three visible faces
 * (top, +y face "left", +x face "right").
 */
export function IsoBox({
  p,
  x = 0,
  y = 0,
  z = 0,
  w,
  d,
  h,
  fill = {},
  stroke = C.fg,
  sw = 1.2,
  dash,
  opacity,
}: {
  p: Proj;
  x?: number;
  y?: number;
  z?: number;
  w: number;
  d: number;
  h: number;
  fill?: BoxFill;
  stroke?: string;
  sw?: number;
  dash?: string;
  opacity?: number;
}) {
  const top = fill.top ?? C.primarySoft;
  const left = fill.left ?? C.surface;
  const right = fill.right ?? C.border;
  const X = x + w;
  const Y = y + d;
  const Z = z + h;
  return (
    <g opacity={opacity}>
      <Poly p={p} points={[[x, Y, z], [X, Y, z], [X, Y, Z], [x, Y, Z]]} fill={left} stroke={stroke} sw={sw} dash={dash} />
      <Poly p={p} points={[[X, y, z], [X, Y, z], [X, Y, Z], [X, y, Z]]} fill={right} stroke={stroke} sw={sw} dash={dash} />
      <Poly p={p} points={[[x, y, Z], [X, y, Z], [X, Y, Z], [x, Y, Z]]} fill={top} stroke={stroke} sw={sw} dash={dash} />
    </g>
  );
}

/** Dashed outline of a box (all 12 edges) — for "ghost" / removed volume. */
export function IsoGhost({ p, x = 0, y = 0, z = 0, w, d, h, stroke = C.muted }: { p: Proj; x?: number; y?: number; z?: number; w: number; d: number; h: number; stroke?: string }) {
  const c = (a: number, b: number, e: number) => p(a, b, e);
  const X = x + w;
  const Y = y + d;
  const Z = z + h;
  const edges: [Pt, Pt][] = [
    [c(x, y, z), c(X, y, z)], [c(X, y, z), c(X, Y, z)], [c(X, Y, z), c(x, Y, z)], [c(x, Y, z), c(x, y, z)],
    [c(x, y, Z), c(X, y, Z)], [c(X, y, Z), c(X, Y, Z)], [c(X, Y, Z), c(x, Y, Z)], [c(x, Y, Z), c(x, y, Z)],
    [c(x, y, z), c(x, y, Z)], [c(X, y, z), c(X, y, Z)], [c(X, Y, z), c(X, Y, Z)], [c(x, Y, z), c(x, Y, Z)],
  ];
  return (
    <g stroke={stroke} strokeWidth={1.1} strokeDasharray="4 3" fill="none">
      {edges.map(([a, b], i) => (
        <line key={i} x1={round(a[0])} y1={round(a[1])} x2={round(b[0])} y2={round(b[1])} />
      ))}
    </g>
  );
}

/** Ellipse radii for an isometric circle of radius `r` lying in a horizontal plane. */
export function isoCircle(r: number, s = 1): { rx: number; ry: number } {
  return { rx: r * 1.2247 * s, ry: r * 0.7071 * s };
}

/**
 * Upright cylinder in screen space: (cx, cy) is the centre of the bottom ellipse.
 */
export function Cylinder({
  cx,
  cy,
  rx,
  ry,
  h,
  side = C.surface,
  top = C.primarySoft,
  stroke = C.fg,
  sw = 1.2,
  dash,
}: {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  h: number;
  side?: string;
  top?: string;
  stroke?: string;
  sw?: number;
  dash?: string;
}) {
  const t = cy - h;
  return (
    <g>
      <path
        d={`M${cx - rx} ${t} L${cx - rx} ${cy} A${rx} ${ry} 0 0 0 ${cx + rx} ${cy} L${cx + rx} ${t}`}
        fill={side}
        stroke={stroke}
        strokeWidth={sw}
        strokeDasharray={dash}
      />
      <ellipse cx={cx} cy={t} rx={rx} ry={ry} fill={top} stroke={stroke} strokeWidth={sw} strokeDasharray={dash} />
    </g>
  );
}

/** Light drafting grid inside a rectangle. */
export function Grid({ x, y, w, h, step = 12, tone = C.border }: { x: number; y: number; w: number; h: number; step?: number; tone?: string }) {
  const lines: ReactNode[] = [];
  for (let gx = x; gx <= x + w + 0.01; gx += step) lines.push(<line key={`v${gx}`} x1={gx} y1={y} x2={gx} y2={y + h} />);
  for (let gy = y; gy <= y + h + 0.01; gy += step) lines.push(<line key={`h${gy}`} x1={x} y1={gy} x2={x + w} y2={gy} />);
  return (
    <g stroke={tone} strokeWidth={0.8}>
      {lines}
    </g>
  );
}

/** Isometric grid on the z = `z` plane. */
export function IsoGrid({ p, x0, x1, y0, y1, z = 0, step = 10, tone = C.border, fill = "none" }: { p: Proj; x0: number; x1: number; y0: number; y1: number; z?: number; step?: number; tone?: string; fill?: string }) {
  const lines: ReactNode[] = [];
  for (let gx = x0; gx <= x1 + 0.01; gx += step) {
    const a = p(gx, y0, z);
    const b = p(gx, y1, z);
    lines.push(<line key={`x${gx}`} x1={round(a[0])} y1={round(a[1])} x2={round(b[0])} y2={round(b[1])} />);
  }
  for (let gy = y0; gy <= y1 + 0.01; gy += step) {
    const a = p(x0, gy, z);
    const b = p(x1, gy, z);
    lines.push(<line key={`y${gy}`} x1={round(a[0])} y1={round(a[1])} x2={round(b[0])} y2={round(b[1])} />);
  }
  return (
    <g>
      <Poly p={p} points={[[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]]} fill={fill} stroke={tone} sw={1} />
      <g stroke={tone} strokeWidth={0.8}>
        {lines}
      </g>
    </g>
  );
}

/** Panel caption (bold, centred). */
export function Caption({ x, y, children, tone = C.fg, size = 12 }: { x: number; y: number; children: ReactNode; tone?: string; size?: number }) {
  return (
    <T x={x} y={y} anchor="middle" size={size} weight={700} tone={tone}>
      {children}
    </T>
  );
}

/** Vertical divider between panels. */
export function Divider({ x, y0 = 14, y1 = 206 }: { x: number; y0?: number; y1?: number }) {
  return <line x1={x} y1={y0} x2={x} y2={y1} stroke={C.border} strokeWidth={1} strokeDasharray="3 4" />;
}
