/** Diagrams: combining, copying and arranging shapes in CAD. */
import type { ReactNode } from "react";
import { Arrow, C, Caption, Cursor, Cylinder, Dim, Divider, IsoBox, Key, Leader, T, defineDiagram, iso, isoCircle, pts, round } from "./primitives";

/** Hole drawn on the top face of an iso solid (ellipse with a hint of inner wall). */
function HoleTop({ cx, cy, rx, ry }: { cx: number; cy: number; rx: number; ry: number }) {
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={C.border} stroke={C.fg} strokeWidth={1.2} />
      <ellipse cx={cx} cy={cy + ry * 0.35} rx={rx * 0.86} ry={ry * 0.62} fill={C.muted} opacity={0.45} />
    </g>
  );
}

export const GroupHole = defineDiagram("group-hole", (r) => {
  const box = (cx: number) => iso(cx, 100, 1);
  const c = isoCircle(14);
  return (
    <g>
      <IsoBox p={box(60)} w={50} d={50} h={30} />
      <T x={60} y={182} anchor="middle" weight={700}>Solid box</T>
      <T x={120} y={118} anchor="middle" size={22} weight={700}>+</T>
      <Cylinder cx={180} cy={140} rx={c.rx} ry={c.ry} h={56} side={r.hatch} top={r.hatch} stroke={C.muted} dash="4 3" />
      <T x={180} y={182} anchor="middle" weight={700}>Hole cylinder</T>
      <T x={180} y={197} anchor="middle" size={11} tone={C.muted}>(striped = removes)</T>
      <Key x={218} y={66} w={44} h={20} label="Group" size={10} />
      <T x={240} y={118} anchor="middle" size={22} weight={700}>=</T>
      <IsoBox p={box(300)} w={50} d={50} h={30} />
      <HoleTop cx={300} cy={95} rx={c.rx} ry={c.ry} />
      <T x={300} y={182} anchor="middle" weight={700}>Box with an opening</T>
      <T x={240} y={24} anchor="middle" size={11} tone={C.muted}>select both, then Group (Ctrl + G)</T>
    </g>
  );
});

export const SolidVsHole = defineDiagram("solid-vs-hole", (r) => {
  const c = isoCircle(16);
  const slab = (cx: number) => iso(cx - 8.66, 142, 1);
  return (
    <g>
      <Caption x={90} y={20}>Solid (+)</Caption>
      <Cylinder cx={90} cy={92} rx={c.rx} ry={c.ry} h={50} />
      <Arrow from={[90, 108]} to={[90, 126]} r={r} />
      <IsoBox p={slab(90)} w={70} d={50} h={12} fill={{ top: C.surface, left: C.border, right: C.border }} />
      <Cylinder cx={90} cy={160} rx={14} ry={8} h={26} />
      <T x={90} y={214} anchor="middle" size={11} weight={700}>adds material</T>
      <Divider x={180} />
      <Caption x={270} y={20}>Hole (−)</Caption>
      <Cylinder cx={270} cy={92} rx={c.rx} ry={c.ry} h={50} side={r.hatch} top={r.hatch} stroke={C.muted} dash="4 3" />
      <Arrow from={[270, 108]} to={[270, 126]} r={r} />
      <IsoBox p={slab(270)} w={70} d={50} h={12} fill={{ top: C.surface, left: C.border, right: C.border }} />
      <HoleTop cx={270} cy={160} rx={14} ry={8} />
      <T x={270} y={214} anchor="middle" size={11} weight={700}>removes material</T>
      <T x={180} y={60} anchor="middle" size={10} tone={C.muted}>same cylinder</T>
    </g>
  );
});

export const AlignHandles = defineDiagram("align-handles", (r) => {
  const dot = (x: number, y: number, on = false) => <circle key={`${x}-${y}`} cx={x} cy={y} r={on ? 6 : 4.5} fill={on ? C.primary : C.surface} stroke={C.fg} strokeWidth={1.3} />;
  return (
    <g>
      <Caption x={90} y={22}>Before</Caption>
      <rect x={30} y={60} width={50} height={50} fill={C.primarySoft} stroke={C.primary} strokeWidth={1.6} />
      <circle cx={118} cy={112} r={24} fill={C.accentSoft} stroke={C.accent} strokeWidth={1.6} />
      <rect x={30} y={60} width={112} height={76} fill="none" stroke={C.muted} strokeDasharray="4 3" />
      {[30, 86, 142].map((x) => dot(x, 152, x === 86))}
      {[60, 98, 136].map((y) => dot(14, y))}
      <Cursor x={88} y={154} />
      <Leader from={[142, 152]} to={[160, 170]} />
      <T x={150} y={184} size={11} weight={700}>align dots</T>
      <T x={10} y={204} size={11}>click the <tspan fontWeight={700}>middle</tspan> dot</T>
      <Arrow from={[178, 100]} to={[206, 100]} r={r} width={2.2} />
      <Divider x={192} y0={130} />
      <Caption x={280} y={22}>After: centred</Caption>
      <line x1={280} y1={44} x2={280} y2={166} stroke={C.muted} strokeDasharray="8 3 2 3" />
      <line x1={220} y1={100} x2={340} y2={100} stroke={C.muted} strokeDasharray="8 3 2 3" />
      <rect x={255} y={75} width={50} height={50} fill={C.primarySoft} stroke={C.primary} strokeWidth={1.6} />
      <circle cx={280} cy={100} r={24} fill={C.accentSoft} fillOpacity={0.7} stroke={C.accent} strokeWidth={1.6} />
      <circle cx={280} cy={100} r={2.5} fill={C.fg} />
      <T x={280} y={190} anchor="middle" size={11}>same centre on X and Y</T>
    </g>
  );
});

export const DuplicatePattern = defineDiagram("duplicate-pattern", (r) => {
  const xs = [20, 80, 140, 200, 260];
  const ring: ReactNode[] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i * 45 * Math.PI) / 180;
    const x = 70 + 32 * Math.cos(a);
    const y = 172 + 32 * Math.sin(a);
    ring.push(
      <rect
        key={i}
        x={round(x - 7)}
        y={round(y - 7)}
        width={14}
        height={14}
        transform={`rotate(${i * 45} ${round(x)} ${round(y)})`}
        fill={i === 0 ? C.primarySoft : i === 1 ? C.accentSoft : C.surface}
        stroke={i === 0 ? C.primary : i === 1 ? C.accent : C.muted}
        strokeWidth={1.4}
      />,
    );
  }
  return (
    <g>
      <T x={10} y={22} weight={700}>Along a line</T>
      {xs.map((x, i) => (
        <rect key={x} x={x} y={36} width={28} height={28} fill={i === 0 ? C.primarySoft : i === 1 ? C.accentSoft : C.surface} stroke={i === 0 ? C.primary : i === 1 ? C.accent : C.muted} strokeWidth={1.5} />
      ))}
      <T x={34} y={80} anchor="middle" size={10} tone={C.muted}>original</T>
      <Arrow from={[34, 90]} to={[94, 90]} r={r} tone="accent" />
      <T x={64} y={104} anchor="middle" size={11} weight={700} tone={C.accent}>move once</T>
      {[1, 2, 3].map((i) => (
        <Arrow key={i} from={[34 + i * 60, 90]} to={[94 + i * 60, 90]} r={r} tone="muted" dash="4 3" />
      ))}
      <T x={214} y={104} anchor="middle" size={11} weight={700}>repeat: same step each time</T>
      <line x1={10} y1={116} x2={350} y2={116} stroke={C.border} strokeDasharray="3 4" />
      <T x={150} y={140} weight={700}>Around a circle</T>
      <circle cx={70} cy={172} r={32} fill="none" stroke={C.border} strokeDasharray="3 3" />
      <circle cx={70} cy={172} r={2.5} fill={C.fg} />
      {ring}
      <T x={150} y={160} size={11}><tspan fontWeight={700}>1</tspan>  Duplicate (Ctrl + D)</T>
      <T x={150} y={178} size={11}><tspan fontWeight={700}>2</tspan>  Move or rotate the copy once</T>
      <T x={150} y={196} size={11}><tspan fontWeight={700}>3</tspan>  Duplicate again → repeats the step</T>
    </g>
  );
});

export const MirrorAxis = defineDiagram("mirror-axis", (r) => {
  const shape: [number, number][] = [[64, 54], [150, 54], [150, 84], [104, 84], [104, 158], [64, 158]];
  const mirrored = shape.map(([x, y]) => [360 - x, y] as [number, number]);
  return (
    <g>
      <line x1={180} y1={30} x2={180} y2={196} stroke={C.fg} strokeWidth={1.6} strokeDasharray="10 4 2 4" />
      <T x={180} y={22} anchor="middle" size={11} weight={700}>mirror line</T>
      <polygon points={pts(shape)} fill={C.primarySoft} stroke={C.primary} strokeWidth={1.8} />
      <polygon points={pts(mirrored)} fill={C.accentSoft} stroke={C.accent} strokeWidth={1.8} />
      <T x={84} y={150} anchor="middle" size={11} weight={700} transform="rotate(-90 84 150)">original</T>
      <T x={276} y={106} anchor="middle" size={11} weight={700} transform="rotate(90 276 106)">mirrored copy</T>
      <line x1={150} y1={70} x2={210} y2={70} stroke={C.muted} strokeDasharray="2 3" />
      <Dim from={[104, 176]} to={[180, 176]} r={r} label="same" offset={-8} labelSide={-1} size={11} />
      <Dim from={[180, 176]} to={[256, 176]} r={r} label="same" offset={-8} labelSide={-1} size={11} />
      <line x1={104} y1={160} x2={104} y2={182} stroke={C.muted} />
      <line x1={256} y1={160} x2={256} y2={182} stroke={C.muted} />
      <T x={180} y={212} anchor="middle" size={11}>every point lands the same distance on the other side</T>
    </g>
  );
});

export const TextRaisedRecessed = defineDiagram("text-raised-recessed", (r) => {
  // oblique plate: front-left corner F, width 136, depth vector V
  const plate = (x0: number) => {
    const F: [number, number] = [x0, 112];
    const V: [number, number] = [26, -40];
    const W = 132;
    return { F, V, W, top: pts([F, [F[0] + W, F[1]], [F[0] + W + V[0], F[1] + V[1]], [F[0] + V[0], F[1] + V[1]]]) };
  };
  const L = plate(14);
  const R = plate(196);
  const m = (P: ReturnType<typeof plate>) => `matrix(1 0 ${round(-P.V[0] / 40)} 1 ${P.F[0] + P.V[0]} ${P.F[1] + P.V[1]})`;
  const word = (P: ReturnType<typeof plate>, fill: string, stroke?: string, dy = 0) => (
    <text transform={`translate(0 ${dy}) ${m(P)}`} x={44} y={34} fontSize={32} fontWeight={800} fill={fill} stroke={stroke} strokeWidth={stroke ? 1 : 0}>
      3D
    </text>
  );
  const slabFront = (P: ReturnType<typeof plate>) => (
    <g>
      <polygon points={P.top} fill={C.surface} stroke={C.fg} strokeWidth={1.2} />
      <rect x={P.F[0]} y={P.F[1]} width={P.W} height={14} fill={C.border} stroke={C.fg} strokeWidth={1.2} />
      <polygon points={pts([[P.F[0] + P.W, P.F[1]], [P.F[0] + P.W + P.V[0], P.F[1] + P.V[1]], [P.F[0] + P.W + P.V[0], P.F[1] + P.V[1] + 14], [P.F[0] + P.W, P.F[1] + 14]])} fill={C.border} stroke={C.fg} strokeWidth={1.2} />
    </g>
  );
  return (
    <g>
      <defs>
        <clipPath id={`${r.id}-word`}>{word(R, C.fg)}</clipPath>
      </defs>
      <Caption x={92} y={22}>Raised text</Caption>
      <T x={92} y={38} anchor="middle" size={11}>solid letters on top</T>
      {slabFront(L)}
      {[6, 5, 4, 3, 2, 1].map((d) => (
        <g key={d}>{word(L, C.primary, undefined, d)}</g>
      ))}
      {word(L, C.primarySoft, C.primary)}
      <Divider x={182} />
      <Caption x={274} y={22}>Recessed text</Caption>
      <T x={274} y={38} anchor="middle" size={11}>hole letters cut in</T>
      {slabFront(R)}
      <g clipPath={`url(#${r.id}-word)`}>
        <rect x={196} y={60} width={170} height={60} fill={C.muted} />
        {word(R, C.border, undefined, 4)}
      </g>
      {/* cross-sections */}
      <T x={92} y={150} anchor="middle" size={10} tone={C.muted}>cut-through view</T>
      <path d="M30 186 L30 168 L60 168 L60 158 L76 158 L76 168 L106 168 L106 158 L122 158 L122 168 L154 168 L154 186 Z" fill={C.surface} stroke={C.fg} strokeWidth={1.2} />
      <rect x={60} y={158} width={16} height={10} fill={C.primarySoft} stroke={C.primary} />
      <rect x={106} y={158} width={16} height={10} fill={C.primarySoft} stroke={C.primary} />
      <T x={92} y={204} anchor="middle" size={11} weight={700}>sticks up</T>
      <T x={274} y={150} anchor="middle" size={10} tone={C.muted}>cut-through view</T>
      <path d="M212 186 L212 162 L242 162 L242 172 L258 172 L258 162 L288 162 L288 172 L304 172 L304 162 L336 162 L336 186 Z" fill={C.surface} stroke={C.fg} strokeWidth={1.2} />
      <T x={274} y={204} anchor="middle" size={11} weight={700}>cut into the surface</T>
    </g>
  );
});

const PIPS: Record<number, [number, number][]> = {
  1: [[0, 0]],
  2: [[-1, -1], [1, 1]],
  3: [[-1, -1], [0, 0], [1, 1]],
  4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
  6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
};
const PAIR_FILL: Record<number, string> = { 1: C.primarySoft, 6: C.primarySoft, 2: C.accentSoft, 5: C.accentSoft, 3: C.surface, 4: C.surface };

function Face({ x, y, n, s = 34 }: { x: number; y: number; n: number; s?: number }) {
  const c = s / 2;
  return (
    <g>
      <rect x={x} y={y} width={s} height={s} fill={PAIR_FILL[n]} stroke={C.fg} strokeWidth={1.3} />
      {PIPS[n].map(([dx, dy], i) => (
        <circle key={i} cx={x + c + dx * s * 0.27} cy={y + c + dy * s * 0.27} r={s * 0.075} fill={C.fg} />
      ))}
    </g>
  );
}

export const DieNet = defineDiagram("die-net", () => (
  <g>
    <Face x={74} y={24} n={2} />
    <Face x={40} y={58} n={3} />
    <Face x={74} y={58} n={1} />
    <Face x={108} y={58} n={4} />
    <Face x={74} y={92} n={5} />
    <Face x={74} y={126} n={6} />
    <T x={91} y={182} anchor="middle" size={11} tone={C.muted}>fold on the lines</T>
    <T x={91} y={198} anchor="middle" size={11} tone={C.muted}>to make a cube</T>
    <Caption x={262} y={44}>Opposite faces add to 7</Caption>
    {[
      [1, 6],
      [2, 5],
      [3, 4],
    ].map(([a, b], i) => (
      <g key={a}>
        <Face x={196} y={64 + i * 44} n={a} s={28} />
        <T x={234} y={83 + i * 44} size={16} weight={700}>+</T>
        <Face x={250} y={64 + i * 44} n={b} s={28} />
        <T x={286} y={84 + i * 44} size={15} weight={700}>{`= 7`}</T>
      </g>
    ))}
    <T x={190} y={210} size={10} tone={C.muted}>same shade = opposite faces</T>
  </g>
));
