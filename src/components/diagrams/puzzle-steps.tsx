/**
 * Puzzle Cube: one-step-at-a-time pictures. Each drawing technique gets one image per step: lines from earlier
 * steps in grey, this step's new lines thick in the primary colour, an edge to reuse in the accent colour, and lines
 * to erase dashed in red. The sample puzzle (same as puzzle-layer-map) is also shown in 3D, sliced into layers and
 * built piece by piece.
 */
import type { ReactNode } from "react";
import type { DiagramName } from "@/content/diagram-catalog";
import { Arrow, C, Caption, Divider, IsoGhost, Poly, T, defineDiagram, iso, type Proj } from "./primitives";

type P3 = [number, number, number];
type Seg = [P3, P3];

// ───────────────────────── drawing helpers ─────────────────────────

/** Isometric dot paper: every lattice point inside the box, drawn once. */
function Dots({ p, box, range = 4 }: { p: Proj; box: [number, number, number, number]; range?: number }) {
  const [x0, y0, x1, y1] = box;
  const seen = new Set<string>();
  const out: ReactNode[] = [];
  for (let a = -range; a <= range + 2; a++)
    for (let b = -range; b <= range + 2; b++)
      for (let c = -1; c <= 3; c++) {
        const [x, y] = p(a, b, c);
        const k = `${Math.round(x)}|${Math.round(y)}`;
        if (seen.has(k) || x < x0 || x > x1 || y < y0 || y > y1) continue;
        seen.add(k);
        out.push(<circle key={k} cx={x} cy={y} r={1.6} fill={C.muted} opacity={0.75} />);
      }
  return <g aria-hidden>{out}</g>;
}

function Lines({ p, segs, kind }: { p: Proj; segs: Seg[]; kind: "old" | "new" | "reuse" | "erase" }) {
  const style = {
    old: { stroke: C.muted, width: 1.6, dash: undefined },
    new: { stroke: C.primary, width: 3.4, dash: undefined },
    reuse: { stroke: C.accent, width: 3.4, dash: undefined },
    erase: { stroke: C.danger, width: 2.4, dash: "5 4" },
  }[kind];
  return (
    <g strokeLinecap="round">
      {segs.map(([a, b], i) => {
        const [x1, y1] = p(...a);
        const [x2, y2] = p(...b);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={style.stroke} strokeWidth={style.width} strokeDasharray={style.dash} />;
      })}
    </g>
  );
}

/** "Step 2 of 4" badge, top left. */
function StepBadge({ n, of, title }: { n: number; of: number; title: string }) {
  return (
    <g>
      <rect x={12} y={12} width={78} height={22} rx={11} fill={C.primary} />
      <T x={51} y={27} anchor="middle" size={12} weight={800} tone="var(--primary-fg)">{`Step ${n} of ${of}`}</T>
      <T x={100} y={28} size={13} weight={700}>{title}</T>
    </g>
  );
}

/** Small key along the bottom: what grey, blue, amber and red dashes mean in these pictures. */
function Key({ items }: { items: ("old" | "new" | "reuse" | "erase")[] }) {
  const label = { old: "drawn before", new: "draw now", reuse: "reuse this edge", erase: "erase" };
  const colour = { old: C.muted, new: C.primary, reuse: C.accent, erase: C.danger };
  // each entry starts where the previous one's label ends
  const starts = items.map((_, i) => items.slice(0, i).reduce((x, k) => x + 30 + label[k].length * 6.2, 14));
  return (
    <g>
      {items.map((k, i) => {
        const at = starts[i];
        return (
          <g key={k}>
            <line x1={at} y1={205} x2={at + 20} y2={205} stroke={colour[k]} strokeWidth={k === "old" ? 1.6 : 3.2} strokeDasharray={k === "erase" ? "5 4" : undefined} strokeLinecap="round" />
            <T x={at + 25} y={209} size={11} tone={C.muted}>{label[k]}</T>
          </g>
        );
      })}
    </g>
  );
}

// One unit cube at (x, y, z): the edges you see in an isometric drawing (top diamond, three verticals, two bottom edges).
const top = (x: number, y: number, z: number): Seg[] => [
  [[x, y, z + 1], [x + 1, y, z + 1]], [[x + 1, y, z + 1], [x + 1, y + 1, z + 1]], [[x + 1, y + 1, z + 1], [x, y + 1, z + 1]], [[x, y + 1, z + 1], [x, y, z + 1]],
];
const verticals = (x: number, y: number, z: number): Seg[] => [
  [[x + 1, y, z + 1], [x + 1, y, z]], [[x + 1, y + 1, z + 1], [x + 1, y + 1, z]], [[x, y + 1, z + 1], [x, y + 1, z]],
];
const bottom = (x: number, y: number, z: number): Seg[] => [[[x + 1, y, z], [x + 1, y + 1, z]], [[x + 1, y + 1, z], [x, y + 1, z]]];
const cube = (x: number, y: number, z: number): Seg[] => [...top(x, y, z), ...verticals(x, y, z), ...bottom(x, y, z)];

/** Shaded faces of a cube (top light, left medium, right darker) so a finished drawing reads as solid. */
function Shade({ p, at: [x, y, z] }: { p: Proj; at: P3 }) {
  return (
    <g>
      <Poly p={p} points={[[x, y + 1, z], [x + 1, y + 1, z], [x + 1, y + 1, z + 1], [x, y + 1, z + 1]]} fill={C.surface} stroke="none" />
      <Poly p={p} points={[[x + 1, y, z], [x + 1, y + 1, z], [x + 1, y + 1, z + 1], [x + 1, y, z + 1]]} fill={C.border} stroke="none" />
      <Poly p={p} points={[[x, y, z + 1], [x + 1, y, z + 1], [x + 1, y + 1, z + 1], [x, y + 1, z + 1]]} fill={C.primarySoft} stroke="none" />
    </g>
  );
}

// ───────────────────────── dot paper ─────────────────────────

export const IsoPaper = defineDiagram("iso-paper", (r) => {
  const p = iso(100, 112, 30);
  return (
    <g>
      <Caption x={100} y={24}>Dots make up-and-down columns</Caption>
      <Dots p={p} box={[14, 38, 186, 196]} />
      <Arrow from={p(1, 1, 0)} to={p(1, 1, 2)} r={r} tone="z" width={3} />
      <Arrow from={p(1, 1, 0)} to={p(3, 1, 0)} r={r} tone="x" width={3} />
      <Arrow from={p(1, 1, 0)} to={p(1, 3, 0)} r={r} tone="y" width={3} />
      <Divider x={200} />
      <T x={212} y={58} size={12} weight={700}>Lines go only 3 ways:</T>
      <T x={212} y={84} size={12} tone={C.z}>● up and down</T>
      <T x={212} y={106} size={12} tone={C.x}>● slant down-right</T>
      <T x={212} y={128} size={12} tone={C.y}>● slant down-left</T>
      <T x={212} y={162} size={11} tone={C.muted}>Dots in sideways rows?</T>
      <T x={212} y={178} size={11} tone={C.muted}>Turn the paper a</T>
      <T x={212} y={193} size={11} tone={C.muted}>quarter turn.</T>
    </g>
  );
});

// ───────────────────────── one cube, four steps ─────────────────────────

function CubeStep(n: 1 | 2 | 3 | 4) {
  const p = iso(150, 104, 52);
  const titles = ["Draw the top", "Drop three lines", "Close the bottom", "Shade it"];
  const parts = [top(0, 0, 0), verticals(0, 0, 0), bottom(0, 0, 0)];
  return (
    <g>
      <StepBadge n={n} of={4} title={titles[n - 1]} />
      <Dots p={p} box={[40, 40, 290, 194]} />
      {n === 4 && <Shade p={p} at={[0, 0, 0]} />}
      {parts.map((segs, i) => (i < Math.min(n, 3) ? <Lines key={i} p={p} segs={segs} kind={n === 4 ? "old" : i === n - 1 ? "new" : "old"} /> : null))}
      {n === 4 && <Lines p={p} segs={cube(0, 0, 0)} kind="old" />}
      {n === 4 && (
        <>
          <T x={236} y={70} size={11} tone={C.muted} halo>top: lightest</T>
          <T x={236} y={150} size={11} tone={C.muted} halo>one side: darker</T>
        </>
      )}
      <Key items={n === 4 ? ["old"] : n === 1 ? ["new"] : ["old", "new"]} />
    </g>
  );
}
export const IsoCube1 = defineDiagram("iso-cube-1", () => CubeStep(1));
export const IsoCube2 = defineDiagram("iso-cube-2", () => CubeStep(2));
export const IsoCube3 = defineDiagram("iso-cube-3", () => CubeStep(3));
export const IsoCube4 = defineDiagram("iso-cube-4", () => CubeStep(4));

// ───────────────────────── add a cube beside, four steps ─────────────────────────

function BesideStep(n: 1 | 2 | 3 | 4) {
  const p = iso(124, 96, 44);
  const titles = ["Top of the new cube", "Drop the new lines", "Close the bottom", "Erase what's hidden"];
  const shared: Seg[] = [[[1, 0, 1], [1, 1, 1]]];
  const newTop: Seg[] = [[[1, 0, 1], [2, 0, 1]], [[2, 0, 1], [2, 1, 1]], [[2, 1, 1], [1, 1, 1]]];
  const newDown: Seg[] = [[[2, 0, 1], [2, 0, 0]], [[2, 1, 1], [2, 1, 0]]];
  const newBottom: Seg[] = [[[2, 0, 0], [2, 1, 0]], [[2, 1, 0], [1, 1, 0]]];
  const hidden: Seg[] = [[[1, 0, 1], [1, 0, 0]], [[1, 0, 0], [1, 1, 0]]];
  const first = cube(0, 0, 0).filter((s) => !(n === 4 && hidden.some((h) => JSON.stringify(h) === JSON.stringify(s))));
  const added = [newTop, newDown, newBottom];
  return (
    <g>
      <StepBadge n={n} of={4} title={titles[n - 1]} />
      <Dots p={p} box={[30, 40, 300, 192]} />
      <Lines p={p} segs={first} kind="old" />
      {added.map((segs, i) => (i < Math.min(n, 3) ? <Lines key={i} p={p} segs={segs} kind={n < 4 && i === n - 1 ? "new" : "old"} /> : null))}
      {n === 1 && <Lines p={p} segs={shared} kind="reuse" />}
      {n === 4 && <Lines p={p} segs={hidden} kind="erase" />}
      {n === 1 && <T x={p(1, 0.5, 1)[0] + 8} y={p(1, 0.5, 1)[1] - 18} size={11} weight={700} tone={C.accent}>shared edge</T>}
      {n === 4 && <T x={p(1, 0, 1)[0] + 10} y={p(1, 0, 1)[1] - 12} size={11} weight={700} tone={C.danger} halo>now inside: erase</T>}
      <Key items={n === 1 ? ["old", "new", "reuse"] : n === 4 ? ["old", "erase"] : ["old", "new"]} />
    </g>
  );
}
export const IsoBeside1 = defineDiagram("iso-beside-1", () => BesideStep(1));
export const IsoBeside2 = defineDiagram("iso-beside-2", () => BesideStep(2));
export const IsoBeside3 = defineDiagram("iso-beside-3", () => BesideStep(3));
export const IsoBeside4 = defineDiagram("iso-beside-4", () => BesideStep(4));

// ───────────────────────── stack a cube on top, three steps ─────────────────────────

function UpStep(n: 1 | 2 | 3) {
  const p = iso(160, 150, 44);
  const titles = ["Lines up from the top", "The new top", "Erase what's hidden"];
  const up: Seg[] = [[[1, 0, 1], [1, 0, 2]], [[1, 1, 1], [1, 1, 2]], [[0, 1, 1], [0, 1, 2]]];
  const newTop = top(0, 0, 1);
  const hidden: Seg[] = [[[0, 0, 1], [1, 0, 1]], [[0, 0, 1], [0, 1, 1]]];
  const first = cube(0, 0, 0).filter((s) => !(n === 3 && hidden.some((h) => JSON.stringify(h) === JSON.stringify(s))));
  return (
    <g>
      <StepBadge n={n} of={3} title={titles[n - 1]} />
      <Dots p={p} box={[60, 40, 270, 192]} />
      <Lines p={p} segs={first} kind="old" />
      <Lines p={p} segs={up} kind={n === 1 ? "new" : "old"} />
      {n >= 2 && <Lines p={p} segs={newTop} kind={n === 2 ? "new" : "old"} />}
      {n === 3 && <Lines p={p} segs={hidden} kind="erase" />}
      {n === 3 && <T x={p(0, 1, 1)[0] - 10} y={p(0, 1, 1)[1] + 4} anchor="end" size={11} weight={700} tone={C.danger} halo>now inside: erase</T>}
      <Key items={n === 3 ? ["old", "erase"] : ["old", "new"]} />
    </g>
  );
}
export const IsoUp1 = defineDiagram("iso-up-1", () => UpStep(1));
export const IsoUp2 = defineDiagram("iso-up-2", () => UpStep(2));
export const IsoUp3 = defineDiagram("iso-up-3", () => UpStep(3));

// ───────────────────────── read a piece three ways ─────────────────────────

/** The example L: three cubes in a row, plus one on top of the right-hand end. */
const L_PIECE: P3[] = [[0, 0, 0], [1, 0, 0], [2, 0, 0], [2, 0, 1]];

/** A solid cube with shaded faces, drawn back to front so nearer cubes cover farther ones. */
function SolidCubes({ p, cubes, fill = C.primarySoft, highlight }: { p: Proj; cubes: P3[]; fill?: string; highlight?: (c: P3) => string | undefined }) {
  const order = [...cubes].sort((a, b) => a[0] + a[1] + a[2] - (b[0] + b[1] + b[2]) || a[2] - b[2]);
  return (
    <g>
      {order.map(([x, y, z]) => {
        const f = highlight?.([x, y, z]) ?? fill;
        return (
          <g key={`${x}${y}${z}`}>
            <Poly p={p} points={[[x, y + 1, z], [x + 1, y + 1, z], [x + 1, y + 1, z + 1], [x, y + 1, z + 1]]} fill={f} stroke={C.fg} sw={1.3} />
            <Poly p={p} points={[[x, y + 1, z], [x + 1, y + 1, z], [x + 1, y + 1, z + 1], [x, y + 1, z + 1]]} fill={C.fg} stroke="none" opacity={0.07} />
            <Poly p={p} points={[[x + 1, y, z], [x + 1, y + 1, z], [x + 1, y + 1, z + 1], [x + 1, y, z + 1]]} fill={f} stroke={C.fg} sw={1.3} />
            <Poly p={p} points={[[x + 1, y, z], [x + 1, y + 1, z], [x + 1, y + 1, z + 1], [x + 1, y, z + 1]]} fill={C.fg} stroke="none" opacity={0.18} />
            <Poly p={p} points={[[x, y, z + 1], [x + 1, y, z + 1], [x + 1, y + 1, z + 1], [x, y + 1, z + 1]]} fill={f} stroke={C.fg} sw={1.3} />
          </g>
        );
      })}
    </g>
  );
}

export const PieceIso = defineDiagram("piece-view-iso", () => {
  const p = iso(130, 120, 34);
  return (
    <g>
      <Caption x={180} y={24}>Isometric view: three faces at once</Caption>
      <SolidCubes p={p} cubes={L_PIECE} />
      <T x={254} y={98} size={12} weight={700}>4 cubes</T>
      <T x={254} y={116} size={11} tone={C.muted}>3 in a row,</T>
      <T x={254} y={132} size={11} tone={C.muted}>1 on the end</T>
      <T x={180} y={204} anchor="middle" size={11} tone={C.muted}>Best for seeing the shape. Some cubes can hide behind others.</T>
    </g>
  );
});

export const PieceTop = defineDiagram("piece-view-top", (r) => {
  const p = iso(78, 118, 24);
  const s = 34;
  const gx = 196;
  const gy = 86;
  return (
    <g>
      <Caption x={180} y={24}>Top view: look straight down</Caption>
      <SolidCubes p={p} cubes={L_PIECE} />
      <Arrow from={[p(2.5, 0.5, 2)[0], 38]} to={[p(2.5, 0.5, 2)[0], p(2.5, 0.5, 2)[1] - 6]} r={r} tone="primary" width={2.4} />
      <T x={p(2.5, 0.5, 2)[0] + 6} y={48} size={11} weight={700} tone={C.primary}>eye</T>
      <Divider x={170} y0={40} y1={186} />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={gx + i * s} y={gy} width={s} height={s} fill={C.primarySoft} stroke={C.fg} strokeWidth={1.4} />
          <T x={gx + i * s + s / 2} y={gy + s / 2 + 6} anchor="middle" size={16} weight={800}>{i === 2 ? "2" : "1"}</T>
        </g>
      ))}
      <T x={gx + 1.5 * s} y={gy + s + 26} anchor="middle" size={11} tone={C.muted}>The footprint on the table.</T>
      <T x={gx + 1.5 * s} y={gy + s + 42} anchor="middle" size={11} tone={C.muted}>Numbers: cubes tall.</T>
    </g>
  );
});

export const PieceFront = defineDiagram("piece-view-front", (r) => {
  const p = iso(78, 118, 24);
  const s = 34;
  const gx = 196;
  const gy = 124;
  return (
    <g>
      <Caption x={180} y={24}>Front view: look straight at the front</Caption>
      <SolidCubes p={p} cubes={L_PIECE} />
      <Arrow from={[p(1.5, 2.6, 0.5)[0] - 18, p(1.5, 2.6, 0.5)[1] + 22]} to={[p(1.5, 1.2, 0.5)[0], p(1.5, 1.2, 0.5)[1]]} r={r} tone="primary" width={2.4} />
      <T x={p(1.5, 2.6, 0.5)[0] - 34} y={p(1.5, 2.6, 0.5)[1] + 38} size={11} weight={700} tone={C.primary}>eye</T>
      <Divider x={170} y0={40} y1={186} />
      {[0, 1, 2].map((i) => <rect key={i} x={gx + i * s} y={gy} width={s} height={s} fill={C.primarySoft} stroke={C.fg} strokeWidth={1.4} />)}
      <rect x={gx + 2 * s} y={gy - s} width={s} height={s} fill={C.primarySoft} stroke={C.fg} strokeWidth={1.4} />
      <T x={gx + 1.5 * s} y={gy + s + 26} anchor="middle" size={11} tone={C.muted}>Shows how tall each part is.</T>
    </g>
  );
});

export const HiddenCube = defineDiagram("iso-hidden-cube", (r) => {
  const p1 = iso(90, 124, 28);
  const p2 = iso(270, 140, 28);
  const piece: P3[] = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1]];
  const base = piece.filter((c) => c[2] === 0);
  return (
    <g>
      <Caption x={90} y={24}>What you see</Caption>
      <SolidCubes p={p1} cubes={piece} />
      <T x={90} y={198} anchor="middle" size={11} tone={C.muted}>Looks like 4 cubes…</T>
      <Divider x={180} />
      <Caption x={270} y={24}>Lift the top cube off</Caption>
      <SolidCubes p={p2} cubes={base} highlight={(c) => (c.join() === "0,0,0" ? "var(--danger-soft)" : undefined)} />
      <Poly p={p2} points={[[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]]} fill="none" stroke={C.danger} sw={2.6} />
      <SolidCubes p={p2} cubes={[[0, 0, 2.3]]} />
      <Arrow from={p2(0.5, 0.5, 1.3)} to={p2(0.5, 0.5, 2.15)} r={r} tone="muted" />
      <T x={p2(0, 1, 1)[0] - 8} y={p2(0, 1, 1)[1] + 2} anchor="end" size={11} weight={700} tone={C.danger} halo>hidden</T>
      <T x={270} y={198} anchor="middle" size={11} weight={700} tone={C.danger}>…but it really has 5.</T>
    </g>
  );
});

/** Eight sample sketches, each with its cube count: what a piece bank looks like. */
export const PieceBank = defineDiagram("piece-bank", () => {
  const bank: { cubes: P3[] }[] = [
    { cubes: [[0, 0, 0], [1, 0, 0], [2, 0, 0]] },
    { cubes: [[0, 0, 0], [1, 0, 0], [2, 0, 0], [2, 0, 1]] },
    { cubes: [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]] },
    { cubes: [[0, 0, 0], [1, 0, 0], [1, 1, 0], [2, 1, 0]] },
    { cubes: [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1]] },
    { cubes: [[0, 0, 0], [1, 0, 0], [2, 0, 0], [0, 1, 0], [0, 0, 1]] },
    { cubes: [[0, 0, 0], [0, 0, 1], [0, 0, 2], [1, 0, 0], [0, 1, 0]] },
    { cubes: [[0, 0, 0], [1, 0, 0], [2, 0, 0], [1, 1, 0], [1, 0, 1], [2, 1, 0]] },
  ];
  return (
    <g>
      {bank.map((b, i) => {
        const col = i % 4;
        const row = Math.floor(i / 4);
        const ox = 44 + col * 88;
        const oy = 58 + row * 100;
        const p = iso(ox, oy, 12);
        const flat = b.cubes.every((c) => c[2] === 0);
        return (
          <g key={i}>
            <SolidCubes p={p} cubes={b.cubes} />
            <T x={ox + 4} y={oy + 46} anchor="middle" size={11} weight={700}>{`${b.cubes.length} cubes · ${flat ? "flat" : "3D"}`}</T>
          </g>
        );
      })}
    </g>
  );
});

// ───────────────────────── the sample puzzle in 3D, by layers, piece by piece ─────────────────────────

/** The sample puzzle (rows back to front, columns left to right): same as puzzle-layer-map. */
const SAMPLE: string[][] = [
  ["CFF", "AAF", "AAA"],
  ["CCF", "CCE", "BBB"],
  ["DDD", "BDE", "BEE"],
];
const PIECE_FILL: Record<string, string> = { A: C.primary, B: C.accent, C: C.success, D: C.danger, E: "var(--violet)", F: C.muted };
type Placed = { at: P3; letter: string };
const placed: Placed[] = SAMPLE.flatMap((layer, z) => layer.flatMap((row, y) => row.split("").map((letter, x) => ({ at: [x, y, z] as P3, letter }))));

/** Coloured cubes with each piece's letter on the top faces you can see. */
function PieceCubes({ p, cubes, faded = () => false, gapZ = 0 }: { p: Proj; cubes: Placed[]; faded?: (c: Placed) => boolean; gapZ?: number }) {
  const has = new Set(cubes.map((c) => c.at.join()));
  const lift = (z: number) => z * (1 + gapZ);
  const order = [...cubes].sort((a, b) => a.at[0] + a.at[1] + lift(a.at[2]) - (b.at[0] + b.at[1] + lift(b.at[2])) || a.at[2] - b.at[2]);
  return (
    <g>
      {order.map((c) => {
        const [x, y, z0] = c.at;
        const z = lift(z0);
        const dim = faded(c);
        const f = dim ? C.surface : PIECE_FILL[c.letter];
        const [tx, ty] = p(x + 0.5, y + 0.5, z + 1);
        return (
          <g key={c.at.join()}>
            <Poly p={p} points={[[x, y + 1, z], [x + 1, y + 1, z], [x + 1, y + 1, z + 1], [x, y + 1, z + 1]]} fill={f} stroke={C.fg} sw={1.1} />
            <Poly p={p} points={[[x, y + 1, z], [x + 1, y + 1, z], [x + 1, y + 1, z + 1], [x, y + 1, z + 1]]} fill={C.surface} stroke="none" opacity={0.55} />
            <Poly p={p} points={[[x + 1, y, z], [x + 1, y + 1, z], [x + 1, y + 1, z + 1], [x + 1, y, z + 1]]} fill={f} stroke={C.fg} sw={1.1} />
            <Poly p={p} points={[[x + 1, y, z], [x + 1, y + 1, z], [x + 1, y + 1, z + 1], [x + 1, y, z + 1]]} fill={C.surface} stroke="none" opacity={0.75} />
            <Poly p={p} points={[[x, y, z + 1], [x + 1, y, z + 1], [x + 1, y + 1, z + 1], [x, y + 1, z + 1]]} fill={f} stroke={C.fg} sw={1.1} />
            <Poly p={p} points={[[x, y, z + 1], [x + 1, y, z + 1], [x + 1, y + 1, z + 1], [x, y + 1, z + 1]]} fill={C.surface} stroke="none" opacity={0.3} />
            {gapZ > 0 && <T x={tx} y={ty + 4} anchor="middle" size={11} weight={800} tone={dim ? C.muted : C.fg} halo>{c.letter}</T>}
          </g>
        );
      })}
      {/* Put together: letters go on last, only on top faces nothing sits on or in front of, so no letter peeks out from behind a cube. */}
      {gapZ === 0 &&
        cubes
          .filter(({ at: [x, y, z] }) => ![[x, y, z + 1], [x + 1, y, z + 1], [x, y + 1, z + 1], [x + 1, y + 1, z + 1], [x + 1, y + 1, z + 2]].some((q) => has.has(q.join())))
          .map((c) => {
            const [tx, ty] = p(c.at[0] + 0.5, c.at[1] + 0.5, c.at[2] + 1);
            return <T key={`L${c.at.join()}`} x={tx} y={ty + 4} anchor="middle" size={11} weight={800} tone={faded(c) ? C.muted : C.fg} halo>{c.letter}</T>;
          })}
    </g>
  );
}

/** One layer as a 3 × 3 grid: rows back (top of the grid) to front (bottom). */
function LayerGrid({ x0, y0, rows, s = 28, label }: { x0: number; y0: number; rows: string[]; s?: number; label: string }) {
  return (
    <g>
      <Caption x={x0 + 1.5 * s} y={y0 - 22}>{label}</Caption>
      <T x={x0 + 1.5 * s} y={y0 - 6} anchor="middle" size={10} tone={C.muted}>back</T>
      {rows.map((row, ri) =>
        row.split("").map((letter, ci) => (
          <g key={`${ri}${ci}`}>
            <rect x={x0 + ci * s} y={y0 + ri * s} width={s} height={s} fill={PIECE_FILL[letter]} fillOpacity={0.3} stroke={C.fg} strokeWidth={1.2} />
            <T x={x0 + ci * s + s / 2} y={y0 + ri * s + s / 2 + 5} anchor="middle" size={14} weight={800}>{letter}</T>
          </g>
        )),
      )}
      <T x={x0 + 1.5 * s} y={y0 + 3 * s + 14} anchor="middle" size={10} tone={C.muted}>front</T>
    </g>
  );
}

export const SampleWhole = defineDiagram("puzzle-sample-whole", () => {
  const p = iso(140, 120, 24);
  return (
    <g>
      <Caption x={180} y={22}>The sample puzzle, put together</Caption>
      <PieceCubes p={p} cubes={placed} />
      <T x={262} y={92} size={12} weight={700}>27 cubes</T>
      <T x={262} y={110} size={11} tone={C.muted}>6 pieces,</T>
      <T x={262} y={126} size={11} tone={C.muted}>A to F</T>
      <T x={262} y={150} size={11} tone={C.muted}>Some pieces</T>
      <T x={262} y={165} size={11} tone={C.muted}>are hidden inside.</T>
    </g>
  );
});

export const SampleSliced = defineDiagram("puzzle-sample-sliced", () => {
  const p = iso(140, 150, 15);
  return (
    <g>
      <Caption x={180} y={22}>Lift the layers apart</Caption>
      <PieceCubes p={p} cubes={placed} gapZ={2.2} />
      {[["Top layer", 2], ["Middle layer", 1], ["Bottom layer", 0]].map(([name, z]) => {
        const [x, y] = p(3, 0, (z as number) * 3.2 + 0.5);
        return <T key={name as string} x={x + 40} y={y} size={11} weight={700}>{name as string}</T>;
      })}
      <T x={180} y={208} anchor="middle" size={11} tone={C.muted}>Each layer is 3 × 3 = 9 squares. 3 layers × 9 = 27.</T>
    </g>
  );
});

function LayerStep(z: 0 | 1 | 2) {
  const names = ["Bottom layer", "Middle layer", "Top layer"];
  const p = iso(96, 132, 24);
  return (
    <g>
      <StepBadge n={z + 1} of={3} title={`Map the ${names[z].toLowerCase()}`} />
      <IsoGhost p={p} w={3} d={3} h={3} />
      <PieceCubes p={p} cubes={placed.filter((c) => c.at[2] === z)} />
      <Divider x={196} y0={48} y1={196} />
      <LayerGrid x0={232} y0={84} rows={SAMPLE[z]} label={names[z]} />
    </g>
  );
}
export const LayerBottom = defineDiagram("layer-step-bottom", () => LayerStep(0));
export const LayerMiddle = defineDiagram("layer-step-middle", () => LayerStep(1));
export const LayerTop = defineDiagram("layer-step-top", () => LayerStep(2));

export const PuzzleCount = defineDiagram("puzzle-count", () => {
  const counts: Record<string, number> = {};
  placed.forEach((c) => (counts[c.letter] = (counts[c.letter] ?? 0) + 1));
  const letters = Object.keys(counts).sort();
  const s = 20;
  return (
    <g>
      <Caption x={180} y={22}>Count each letter in all three layers</Caption>
      {letters.map((L, i) => (
        <g key={L}>
          <T x={70} y={58 + i * 24} anchor="end" size={14} weight={800}>{L}</T>
          {Array.from({ length: counts[L] }, (_, k) => (
            <rect key={k} x={80 + k * (s + 3)} y={44 + i * 24} width={s} height={s} fill={PIECE_FILL[L]} fillOpacity={0.35} stroke={C.fg} strokeWidth={1.1} />
          ))}
          <T x={80 + 7 * (s + 3) + 6} y={58 + i * 24} size={12} weight={700}>{`= ${counts[L]}`}</T>
        </g>
      ))}
      <T x={180} y={206} anchor="middle" size={13} weight={800}>{`${letters.map((L) => counts[L]).join(" + ")} = 27`}</T>
    </g>
  );
});

/** The sample cube built one piece at a time: earlier pieces faded, the new piece in full colour. */
const BUILD_ORDER = ["A", "C", "B", "F", "E", "D"];
function BuildStep(n: number) {
  const p = iso(140, 128, 24);
  const placedSoFar = BUILD_ORDER.slice(0, n);
  const newPiece = BUILD_ORDER[n - 1];
  const left = 27 - placed.filter((c) => placedSoFar.includes(c.letter)).length;
  return (
    <g>
      <StepBadge n={n} of={6} title={`Add piece ${newPiece}`} />
      <PieceCubes p={p} cubes={placed.filter((c) => placedSoFar.includes(c.letter))} faded={(c) => c.letter !== newPiece} />
      <T x={262} y={112} size={12} weight={700}>{`${placed.filter((c) => c.letter === newPiece).length} cubes`}</T>
      <T x={262} y={130} size={11} tone={C.muted}>{left === 0 ? "Cube full!" : `${left} spaces left`}</T>
    </g>
  );
}
const buildNames = ["puzzle-build-1", "puzzle-build-2", "puzzle-build-3", "puzzle-build-4", "puzzle-build-5", "puzzle-build-6"] as const satisfies readonly DiagramName[];
export const PuzzleBuild = buildNames.map((name, i) => defineDiagram(name, () => BuildStep(i + 1)));
