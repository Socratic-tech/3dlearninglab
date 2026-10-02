/** Diagrams: design for additive manufacturing (walls, overhangs, bridges, orientation, infill). */
import type { ReactNode } from "react";
import { Arrow, C, Caption, Dim, Divider, IsoBox, Leader, Nozzle, Plate, Poly, T, Verdict, arcPath, defineDiagram, iso, pts, type Refs } from "./primitives";

/** Rounded extrusion bead (cross-section of one printed line). */
function Bead({ x, y, w, h, tone = C.primary }: { x: number; y: number; w: number; h: number; tone?: string }) {
  return <rect x={x + 0.5} y={y + 0.5} width={w - 1} height={h - 1} rx={Math.min(h, w) / 2} fill={C.primarySoft} stroke={tone} strokeWidth={1.3} />;
}

export const WallThickness = defineDiagram("wall-thickness", () => {
  const bw = 20; // 0.4 mm
  const bh = 12;
  const wall = (cx: number, lines: number) =>
    Array.from({ length: 5 }).flatMap((_, row) =>
      Array.from({ length: lines }).map((__, i) => <Bead key={`${row}-${i}`} x={cx - (lines * bw) / 2 + i * bw} y={166 - (row + 1) * bh} w={bw} h={bh} />),
    );
  return (
    <g>
      <Nozzle x={40} y={44} />
      <Bead x={30} y={46} w={bw} h={bh} />
      <T x={66} y={30} size={12} weight={700}>One nozzle line = 0.4 mm</T>
      <T x={66} y={46} size={11} tone={C.muted}>walls are built from whole lines (cut-away view)</T>
      <line x1={10} y1={66} x2={350} y2={66} stroke={C.border} strokeDasharray="3 4" />
      <Caption x={62} y={90}>Thin 0.3 mm</Caption>
      <rect x={62 - 7.5} y={106} width={15} height={60} fill="none" stroke={C.danger} strokeWidth={1.4} strokeDasharray="4 3" />
      <T x={62} y={140} anchor="middle" size={18} weight={700} tone={C.danger}>?</T>
      <Caption x={182} y={90}>Medium 0.8 mm</Caption>
      {wall(182, 2)}
      <Caption x={300} y={90}>Thick 1.6 mm</Caption>
      {wall(300, 4)}
      <Plate x={10} y={166} w={340} />
      <Verdict x={62} y={192} ok={false} size={11}>less than 1 line</Verdict>
      <T x={62} y={207} anchor="middle" size={10}>may not print at all</T>
      <Verdict x={182} y={192} ok size={11}>2 lines</Verdict>
      <T x={182} y={207} anchor="middle" size={10}>OK for most parts</T>
      <Verdict x={300} y={192} ok size={11}>4 lines</Verdict>
      <T x={300} y={207} anchor="middle" size={10}>strong, uses more plastic</T>
    </g>
  );
});

export const OverhangAngles = defineDiagram("overhang-angles", () => {
  const col = (x0: number, deg: number, ok: boolean, verdict: string) => {
    const dx = 30 * Math.tan((deg * Math.PI) / 180);
    const sx = x0 + 16;
    const shape: [number, number][] = [[x0, 170], [sx, 170], [sx, 130], [sx + dx, 100], [x0, 100]];
    const lines: ReactNode[] = [];
    for (let y = 164; y > 100; y -= 6) {
      const xr = y >= 130 ? sx : sx + ((130 - y) / 30) * dx;
      lines.push(<line key={y} x1={x0} y1={y} x2={xr} y2={y} />);
    }
    return (
      <g>
        <polygon points={pts(shape)} fill={C.primarySoft} stroke={C.primary} strokeWidth={1.5} />
        <g stroke={C.primary} strokeWidth={0.7} opacity={0.7}>{lines}</g>
        <line x1={sx} y1={130} x2={sx} y2={78} stroke={C.fg} strokeWidth={1} strokeDasharray="4 3" />
        <path d={arcPath(sx, 130, 24, 90, 90 - deg)} fill="none" stroke={C.accent} strokeWidth={1.8} />
        <T x={sx + 4} y={74} size={12} weight={800} tone={C.accent} halo>{`${deg}°`}</T>
        {!ok ? (
          <path
            d={`M${sx + dx * 0.35} ${130 - 30 * 0.35 + 2} q4 14 8 2 M${sx + dx * 0.55} ${130 - 30 * 0.55 + 2} q5 18 10 3 M${sx + dx * 0.78} ${130 - 30 * 0.78 + 2} q5 20 10 3`}
            fill="none"
            stroke={C.danger}
            strokeWidth={2}
          />
        ) : null}
        <Verdict x={x0 + 50} y={194} ok={ok} size={11}>{verdict}</Verdict>
      </g>
    );
  };
  return (
    <g>
      <Caption x={180} y={22}>Overhang angle, measured from vertical</Caption>
      <T x={180} y={40} anchor="middle" size={11} tone={C.muted}>dashed line = vertical</T>
      {col(22, 20, true, "prints well")}
      {col(140, 45, true, "about the limit")}
      {col(250, 70, false, "droops")}
      <Plate x={10} y={170} w={340} />
      <T x={180} y={212} anchor="middle" size={11}>Rule of thumb: up to about 45° prints without support</T>
    </g>
  );
});

export const BridgeSpan = defineDiagram("bridge-span", (r) => (
  <g>
    <Caption x={80} y={26}>Short bridge</Caption>
    <rect x={40} y={100} width={24} height={76} fill={r.layers} stroke={C.primary} strokeWidth={1.4} />
    <rect x={96} y={100} width={24} height={76} fill={r.layers} stroke={C.primary} strokeWidth={1.4} />
    <path d="M40 98 L120 98 M40 95 L120 95" stroke={C.accent} strokeWidth={2.6} />
    <Dim from={[64, 70]} to={[96, 70]} r={r} label="8 mm" offset={-9} labelSide={-1} size={11} />
    <Verdict x={80} y={200} ok size={11}>holds straight</Verdict>
    <Divider x={156} />
    <Caption x={262} y={26}>Long bridge</Caption>
    <rect x={180} y={100} width={24} height={76} fill={r.layers} stroke={C.primary} strokeWidth={1.4} />
    <rect x={318} y={100} width={24} height={76} fill={r.layers} stroke={C.primary} strokeWidth={1.4} />
    <line x1={204} y1={97} x2={318} y2={97} stroke={C.muted} strokeDasharray="4 3" />
    <path d="M180 98 L204 98 Q261 156 318 98 L342 98 M180 95 L204 95 Q261 150 318 95 L342 95" fill="none" stroke={C.accent} strokeWidth={2.6} />
    <Dim from={[204, 70]} to={[318, 70]} r={r} label="50 mm" offset={-9} labelSide={-1} size={11} />
    <T x={261} y={150} anchor="middle" size={11} weight={700} tone={C.danger}>sags</T>
    <Verdict x={262} y={200} ok={false} size={11}>droops in the middle</Verdict>
    <Plate x={10} y={176} w={340} />
  </g>
));

/** L-shaped part with a horizontal arm (side view). */
function LPart({ x, r }: { x: number; r: Refs }) {
  return (
    <g>
      <rect x={x} y={78} width={24} height={98} fill={r.layers} stroke={C.primary} strokeWidth={1.4} />
      <rect x={x + 24} y={78} width={86} height={22} fill={r.layers} stroke={C.primary} strokeWidth={1.4} />
    </g>
  );
}

function SupportLattice({ x, w, y0 = 103, y1 = 176 }: { x: number; w: number; y0?: number; y1?: number }) {
  const parts: ReactNode[] = [];
  for (let i = 0; i <= w; i += 12) parts.push(<line key={`v${i}`} x1={x + i} y1={y0} x2={x + i} y2={y1} />);
  for (let i = 0; i < w; i += 12) parts.push(<path key={`z${i}`} d={`M${x + i} ${y1} L${x + i + 12} ${y0 + 20} M${x + i} ${y0 + 34} L${x + i + 12} ${y0}`} />);
  return (
    <g stroke={C.muted} strokeWidth={1.1} fill="none">
      <line x1={x} y1={y0} x2={x + w} y2={y0} strokeWidth={2} />
      {parts}
    </g>
  );
}

export const Supports = defineDiagram("supports", (r) => (
  <g>
    <Caption x={90} y={24}>While printing</Caption>
    <LPart x={30} r={r} />
    <SupportLattice x={58} w={78} />
    <Leader from={[110, 140]} to={[150, 52]} />
    <T x={154} y={50} size={11} weight={700}>support</T>
    <T x={154} y={63} size={10} tone={C.muted}>(holds up the arm)</T>
    <Plate x={14} y={176} w={152} />
    <Divider x={180} />
    <Caption x={270} y={24}>After printing</Caption>
    <LPart x={210} r={r} />
    <g stroke={C.muted} strokeWidth={1.1} fill="none">
      <path d="M300 174 L312 152 L318 164 L330 146 M306 174 L334 170 M322 172 L340 158" />
    </g>
    <T x={322} y={136} anchor="middle" size={11} weight={700}>snapped off</T>
    <T x={322} y={124} anchor="middle" size={10} tone={C.muted}>thrown away</T>
    <Plate x={194} y={176} w={152} />
    <Arrow from={[160, 110]} to={[200, 110]} r={r} tone="accent" />
    <T x={180} y={204} anchor="middle" size={11}>Support is extra plastic printed under an overhang, then removed.</T>
  </g>
));

export const SelfSupporting = defineDiagram("self-supporting", (r) => (
  <g>
    <Caption x={90} y={24}>Flat overhang</Caption>
    <polygon points={pts([[40, 176], [64, 176], [64, 104], [148, 104], [148, 84], [40, 84]])} fill={r.layers} stroke={C.primary} strokeWidth={1.4} />
    <path d="M80 106 q4 14 9 2 M102 106 q5 18 10 2 M124 106 q5 20 10 2" fill="none" stroke={C.danger} strokeWidth={2} />
    <T x={90} y={40} anchor="middle" size={11} tone={C.danger} weight={700}>nothing underneath it</T>
    <Verdict x={90} y={200} ok={false} size={11}>needs support</Verdict>
    <Divider x={180} />
    <Caption x={270} y={24}>45° chamfer</Caption>
    <polygon points={pts([[222, 176], [250, 176], [322, 104], [322, 84], [222, 84]])} fill={r.layers} stroke={C.primary} strokeWidth={1.4} />
    <line x1={250} y1={176} x2={250} y2={120} stroke={C.fg} strokeDasharray="4 3" />
    <path d={arcPath(250, 176, 30, 90, 45)} fill="none" stroke={C.accent} strokeWidth={1.8} />
    <T x={256} y={142} size={12} weight={800} tone={C.accent} halo>45°</T>
    <T x={270} y={40} anchor="middle" size={10}>each layer sits on the one below</T>
    <Verdict x={270} y={204} ok size={11}>supports itself</Verdict>
    <Plate x={14} y={176} w={152} />
    <Plate x={196} y={176} w={152} />
  </g>
));

/* ------------------------------------------------------------- hooks */

/** Cane-shaped hook: stem stands on the plate, bend at the top, tip hangs down. */
function caneD(x: number, base: number, top: number, rad: number, tip: number): string {
  return `M${x} ${base} L${x} ${top} A${rad} ${rad} 0 0 1 ${x + 2 * rad} ${top} L${x + 2 * rad} ${top + tip}`;
}

function LayeredStroke({ d, w, r }: { d: string; w: number; r: Refs }) {
  return (
    <g fill="none" strokeLinecap="butt">
      <path d={d} stroke={C.fg} strokeWidth={w + 3} />
      <path d={d} stroke={r.layers} strokeWidth={w} />
    </g>
  );
}

function AlongStroke({ d, w }: { d: string; w: number }) {
  return (
    <g fill="none" strokeLinecap="butt">
      <path d={d} stroke={C.fg} strokeWidth={w + 3} />
      <path d={d} stroke={C.primarySoft} strokeWidth={w} />
      <path d={d} stroke={C.primary} strokeWidth={w * 0.62} />
      <path d={d} stroke={C.primarySoft} strokeWidth={w * 0.62 - 2} />
      <path d={d} stroke={C.primary} strokeWidth={1.1} />
    </g>
  );
}

function Crack({ x, y }: { x: number; y: number }) {
  return <path d={`M${x - 10} ${y} l5 -3 l4 3 l4 -3 l4 3 l4 -3`} fill="none" stroke={C.danger} strokeWidth={2.2} />;
}

export const OrientationStrength = defineDiagram("orientation-strength", (r) => {
  const flatD = "M196 140 L292 140 A22 22 0 0 0 292 96 L270 96";
  return (
    <g>
      <Caption x={90} y={22}>Standing up</Caption>
      <T x={90} y={38} anchor="middle" size={11}>layers across the hook</T>
      <LayeredStroke d={caneD(66, 176, 90, 22, 26)} w={14} r={r} />
      <Crack x={66} y={100} />
      <Arrow from={[110, 120]} to={[110, 150]} r={r} tone="danger" width={2.2} />
      <T x={118} y={146} size={11} weight={700}>load</T>
      <T x={50} y={98} anchor="end" size={10} tone={C.danger} weight={700}>splits</T>
      <Plate x={20} y={176} w={140} />
      <Verdict x={90} y={204} ok={false} size={12}>weak</Verdict>
      <Divider x={180} />
      <Caption x={270} y={22}>Lying flat</Caption>
      <T x={270} y={38} anchor="middle" size={11}>layers along the hook</T>
      <rect x={190} y={64} width={156} height={104} rx={4} fill={C.border} opacity={0.6} />
      <T x={196} y={78} size={9} tone={C.muted}>top view</T>
      <AlongStroke d={flatD} w={14} />
      <Arrow from={[230, 158]} to={[280, 158]} r={r} tone="success" width={2} both />
      <T x={255} y={182} anchor="middle" size={10} tone={C.muted}>load pulls along the lines</T>
      <Verdict x={270} y={204} ok size={12}>strong</Verdict>
    </g>
  );
});

export const HookStanding = defineDiagram("hook-standing", (r) => {
  const d = caneD(150, 186, 82, 32, 34);
  return (
    <g>
      <LayeredStroke d={d} w={22} r={r} />
      <Crack x={150} y={92} />
      <Leader from={[161, 150]} to={[224, 150]} />
      <T x={228} y={146} size={12} weight={700}>layer lines run</T>
      <T x={228} y={160} size={12} weight={700}>across the stem</T>
      <Leader from={[140, 92]} to={[124, 62]} tone={C.danger} />
      <T x={122} y={42} anchor="end" size={11} weight={700} tone={C.danger}>weak spot: short</T>
      <T x={122} y={56} anchor="end" size={11} weight={700} tone={C.danger}>stacked layers</T>
      <Leader from={[214, 110]} to={[254, 92]} />
      <T x={258} y={92} size={11}>hook tip</T>
      <T x={150} y={210} anchor="middle" size={11}>flat end on the build plate</T>
      <Plate x={40} y={186} w={280} />
      <T x={12} y={24} size={12} weight={700}>Standing upright</T>
    </g>
  );
});

export const HookFlat = defineDiagram("hook-flat", () => {
  const d = "M40 120 L170 120 A36 36 0 0 0 170 48 L130 48";
  const m = "matrix(1 0 0.42 0.56 18 58)";
  return (
    <g>
      <g transform={m}>
        <rect x={0} y={4} width={250} height={150} rx={6} fill={C.border} stroke={C.muted} />
      </g>
      <g transform={`translate(0 6) ${m}`}>
        <path d={d} fill="none" stroke={C.muted} strokeWidth={30} strokeLinecap="butt" />
      </g>
      <g transform={m}>
        <AlongStroke d={d} w={26} />
      </g>
      <Leader from={[118, 125]} to={[118, 168]} />
      <T x={118} y={182} anchor="middle" size={12} weight={700}>layer lines run along</T>
      <T x={118} y={196} anchor="middle" size={12} weight={700}>the whole hook</T>
      <T x={12} y={24} size={12} weight={700}>Lying flat on its side</T>
      <T x={12} y={40} size={11} tone={C.muted}>every layer is a complete hook-shaped slice</T>
      <T x={350} y={160} anchor="end" size={11} tone={C.muted}>build plate</T>
    </g>
  );
});

export const HookUpsideDown = defineDiagram("hook-upside-down", (r) => {
  // J with its curve at the bottom, balanced on the curve
  const d = "M140 46 L140 134 A30 30 0 0 0 200 134 L200 112";
  return (
    <g>
      <LayeredStroke d={d} w={20} r={r} />
      <Plate x={40} y={176} w={280} />
      <ellipse cx={170} cy={176} rx={8} ry={2.5} fill={C.accent} />
      <Leader from={[178, 177]} to={[236, 196]} tone={C.accent} />
      <T x={240} y={200} size={11} weight={700} tone={C.accent}>tiny contact area</T>
      <path d={arcPath(140, 176, 120, 96, 112)} fill="none" stroke={C.danger} strokeWidth={2} strokeDasharray="5 3" markerEnd={r.arrow("danger")} />
      <T x={50} y={52} anchor="middle" size={11} weight={700} tone={C.danger}>may tip over</T>
      <T x={50} y={66} anchor="middle" size={11} weight={700} tone={C.danger}>mid-print</T>
      <Leader from={[150, 80]} to={[220, 64]} />
      <T x={224} y={60} size={11}>layers still run</T>
      <T x={224} y={74} size={11}>across the stem</T>
      <T x={12} y={24} size={12} weight={700}>Upside down on its tip</T>
    </g>
  );
});

/* ---------------------------------------------------------- infill */

function InfillSquare({ x, y, s, step }: { x: number; y: number; s: number; step: number }) {
  const lines: ReactNode[] = [];
  const i0 = x + 8;
  const i1 = x + s - 8;
  for (let v = i0 + step / 2; v < i1; v += step) {
    lines.push(<line key={`v${v}`} x1={v} y1={y + 8} x2={v} y2={y + s - 8} />);
    lines.push(<line key={`h${v}`} x1={x + 8} y1={y + (v - x)} x2={x + s - 8} y2={y + (v - x)} />);
  }
  return (
    <g>
      <rect x={x} y={y} width={s} height={s} rx={3} fill={C.surface} />
      <g stroke={C.primary} strokeWidth={1.4}>{lines}</g>
      <rect x={x + 3} y={y + 3} width={s - 6} height={s - 6} rx={2} fill="none" stroke={C.fg} strokeWidth={6} />
    </g>
  );
}

export const InfillPatterns = defineDiagram("infill-patterns", (r) => {
  const items: [number, number, string, string][] = [
    [60, 22, "10%", "light, quick"],
    [180, 11, "20%", "everyday parts"],
    [300, 4.5, "50%", "strong, heavy"],
  ];
  return (
    <g>
      <T x={180} y={20} anchor="middle" size={11} tone={C.muted}>cut-away: one layer seen from above · solid walls around the outside</T>
      {items.map(([cx, step, pct, note]) => (
        <g key={pct}>
          <InfillSquare x={cx - 46} y={34} s={92} step={step} />
          <T x={cx} y={148} anchor="middle" size={15} weight={800}>{pct}</T>
          <T x={cx} y={164} anchor="middle" size={11}>{note}</T>
        </g>
      ))}
      <Arrow from={[30, 186]} to={[330, 186]} r={r} tone="accent" width={2} />
      <T x={180} y={206} anchor="middle" size={11} weight={700}>more infill → stronger, but heavier and slower to print</T>
    </g>
  );
});

export const WallsPerimeters = defineDiagram("walls-perimeters", (r) => {
  const diag: ReactNode[] = [];
  for (let k = -150; k < 230; k += 14) diag.push(<line key={k} x1={42 + k} y1={164} x2={42 + k + 122} y2={42} />);
  return (
    <g>
      <defs>
        <clipPath id={`${r.id}-inner`}>
          <rect x={44} y={58} width={176} height={104} rx={4} />
        </clipPath>
      </defs>
      <rect x={20} y={34} width={224} height={152} rx={12} fill={C.surface} />
      {[0, 7, 14].map((k) => (
        <rect key={k} x={23 + k} y={37 + k} width={218 - 2 * k} height={146 - 2 * k} rx={10 - k / 2} fill="none" stroke={C.primary} strokeWidth={5.5} />
      ))}
      <g clipPath={`url(#${r.id}-inner)`} stroke={C.accent} strokeWidth={1.6}>{diag}</g>
      <Leader from={[241, 70]} to={[262, 56]} />
      <T x={266} y={52} weight={700} tone={C.primary}>Perimeters</T>
      <T x={266} y={66} size={11}>(walls): 3 lines</T>
      <T x={266} y={80} size={11}>around the edge</T>
      <Leader from={[160, 120]} to={[262, 132]} />
      <T x={266} y={128} weight={700} tone={C.accent}>Infill</T>
      <T x={266} y={142} size={11}>fills the middle</T>
      <T x={266} y={156} size={11}>with a pattern</T>
      <Dim from={[20, 200]} to={[41, 200]} r={r} label="" />
      <T x={48} y={204} size={11}>3 × 0.4 = 1.2 mm wall</T>
      <T x={132} y={24} anchor="middle" size={11} tone={C.muted}>cross-section of one layer</T>
    </g>
  );
});

export const MaterialCompare = defineDiagram("material-compare", () => {
  const L = iso(90, 100, 1);
  const R = iso(270, 100, 1);
  const s = 60;
  const w = 6;
  const grid: ReactNode[] = [];
  for (let k = w + 12; k < s - w; k += 12) {
    const a = R(k, s, w);
    const b = R(k, s, s - w);
    const c = R(w, s, k);
    const d = R(s - w, s, k);
    grid.push(<line key={`a${k}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />, <line key={`b${k}`} x1={c[0]} y1={c[1]} x2={d[0]} y2={d[1]} />);
  }
  return (
    <g>
      <T x={180} y={22} anchor="middle" size={12} weight={700}>Same outside size: 40 × 40 × 40 mm</T>
      <IsoBox p={L} w={s} d={s} h={s} fill={{ left: C.primarySoft, right: C.primarySoft, top: C.primarySoft }} stroke={C.primary} />
      <Poly p={L} points={[[0, s, 0], [s, s, 0], [s, s, s], [0, s, s]]} fill={C.primary} opacity={0.35} stroke={C.primary} />
      <T x={90} y={184} anchor="middle" weight={700}>Solid</T>
      <T x={90} y={200} anchor="middle" size={11}>≈ 79 g of plastic</T>
      <IsoBox p={R} w={s} d={s} h={s} />
      <Poly p={R} points={[[0, s, 0], [s, s, 0], [s, s, s], [0, s, s]]} fill={C.primarySoft} stroke={C.fg} />
      <Poly p={R} points={[[w, s, w], [s - w, s, w], [s - w, s, s - w], [w, s, s - w]]} fill={C.surface} stroke={C.primary} />
      <g stroke={C.primary} strokeWidth={1}>{grid}</g>
      <T x={270} y={184} anchor="middle" weight={700}>Hollow: walls + 15% infill</T>
      <T x={270} y={200} anchor="middle" size={11}>≈ 20 g of plastic</T>
      <T x={180} y={102} anchor="middle" size={10} tone={C.muted}>cut open →</T>
    </g>
  );
});
