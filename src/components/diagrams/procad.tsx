/** Diagrams: sketch-based ("pro") CAD — sketches, constraints, extrude, feature history, variables, pro features. */
import type { ReactNode } from "react";
import { Arrow, C, Caption, Cylinder, Dim, Divider, IsoBox, IsoGrid, T, defineDiagram, iso, isoCircle, pts } from "./primitives";

/** A flat rectangle lying on an iso plane (a sketch). */
function SketchRect({ ox, oy, w, d, stroke = C.z, dash }: { ox: number; oy: number; w: number; d: number; stroke?: string; dash?: string }) {
  const p = iso(ox, oy, 1);
  return <polygon points={pts([p(0, 0, 0), p(w, 0, 0), p(w, d, 0), p(0, d, 0)])} fill={C.primarySoft} fillOpacity={0.35} stroke={stroke} strokeWidth={2} strokeDasharray={dash} />;
}

export const ShapesVsSketches = defineDiagram("shapes-vs-sketches", (r) => {
  const c = isoCircle(9);
  return (
    <g>
      <Caption x={90} y={20}>Tinkercad: stack shapes</Caption>
      <IsoBox p={iso(60, 118, 1)} w={46} d={46} h={26} />
      <Cylinder cx={90} cy={96} rx={c.rx} ry={c.ry} h={40} side={r.hatch} top={r.hatch} stroke={C.muted} dash="4 3" />
      <T x={90} y={176} anchor="middle" size={11}>box + hole shape, then Group</T>
      <Divider x={180} />
      <Caption x={270} y={20}>Pro CAD: draw, then pull</Caption>
      <SketchRect ox={214} oy={150} w={40} d={40} />
      <T x={214} y={192} anchor="middle" size={10} tone={C.muted}>1 · sketch</T>
      <Arrow from={[246, 132]} to={[266, 116]} r={r} />
      <IsoBox p={iso(300, 140, 1)} w={40} d={40} h={36} />
      <T x={318} y={192} anchor="middle" size={10} tone={C.muted}>2 · extrude</T>
      <T x={270} y={208} anchor="middle" size={11}>every step is saved in a list you can edit</T>
    </g>
  );
});

export const SketchExtrude = defineDiagram("sketch-extrude", (r) => {
  const pl = iso(70, 120, 1.1);
  return (
    <g>
      <Caption x={80} y={20}>Sketch on the Top plane</Caption>
      <IsoGrid p={pl} x0={-10} x1={70} y0={-10} y1={60} step={10} />
      <polygon points={pts([pl(0, 0, 0), pl(50, 0, 0), pl(50, 40, 0), pl(0, 40, 0)])} fill={C.primarySoft} fillOpacity={0.5} stroke={C.fg} strokeWidth={2} />
      <Dim from={pl(0, -8, 0)} to={pl(50, -8, 0)} label="50" r={r} offset={-9} />
      <Dim from={pl(58, 0, 0)} to={pl(58, 40, 0)} label="40" r={r} offset={-9} />
      <Arrow from={[168, 112]} to={[204, 112]} r={r} width={2.2} />
      <T x={186} y={100} anchor="middle" size={10} weight={700}>Extrude</T>
      <Caption x={280} y={20}>A 3D part</Caption>
      <IsoBox p={iso(262, 140, 1.1)} w={50} d={40} h={30} />
      <Dim from={[328, 132]} to={[328, 99]} label="30" r={r} offset={14} />
      <T x={280} y={196} anchor="middle" size={11}>depth 30 mm · result: New</T>
    </g>
  );
});

export const ConstraintColors = defineDiagram("constraint-colors", (r) => {
  return (
    <g>
      <Caption x={90} y={22}>Under-defined</Caption>
      <rect x={34} y={58} width={96} height={64} fill="none" stroke={C.z} strokeWidth={2.4} />
      <Arrow from={[132, 90]} to={[156, 90]} r={r} tone="z" />
      <Arrow from={[82, 124]} to={[82, 146]} r={r} tone="z" />
      <T x={90} y={170} anchor="middle" size={12} weight={700} tone={C.z}>blue in Onshape</T>
      <T x={90} y={186} anchor="middle" size={11}>can still be dragged</T>
      <T x={90} y={200} anchor="middle" size={11}>to a different size</T>
      <Divider x={180} />
      <Caption x={270} y={22}>Fully defined</Caption>
      <rect x={222} y={58} width={96} height={64} fill="none" stroke={C.fg} strokeWidth={3} />
      <Dim from={[222, 46]} to={[318, 46]} label="40" r={r} offset={-8} />
      <Dim from={[332, 58]} to={[332, 122]} label="25" r={r} offset={-10} labelSide={-1} />
      <circle cx={222} cy={122} r={4} fill={C.fg} />
      <T x={196} y={138} size={10} tone={C.muted}>pinned to origin</T>
      <T x={270} y={170} anchor="middle" size={12} weight={700}>black in Onshape</T>
      <T x={270} y={186} anchor="middle" size={11}>size and spot are locked</T>
      <T x={270} y={200} anchor="middle" size={11}>(red means a conflict)</T>
    </g>
  );
});

export const FeatureHistory = defineDiagram("feature-history", () => {
  const rows = ["Sketch 1", "Extrude 1", "Sketch 2", "Extrude 2 · Remove", "Fillet 1"];
  return (
    <g>
      <rect x={14} y={14} width={168} height={192} rx={8} fill={C.surface} stroke={C.border} />
      <T x={26} y={36} size={12} weight={800}>Feature list</T>
      {rows.map((t, i) => (
        <g key={t} opacity={i > 2 ? 0.45 : 1}>
          <rect x={24} y={48 + i * 28} width={148} height={22} rx={4} fill={i === 1 ? C.primarySoft : "transparent"} stroke={i === 1 ? C.primary : "none"} />
          <T x={34} y={63 + i * 28} size={11} weight={i === 1 ? 700 : 400}>{`${i + 1}. ${t}`}</T>
        </g>
      ))}
      <line x1={22} y1={127} x2={176} y2={127} stroke={C.accent} strokeWidth={4} strokeLinecap="round" />
      <T x={196} y={128} size={11} weight={700} tone={C.accent}>rollback bar</T>
      <T x={196} y={144} size={10}>features below it are</T>
      <T x={196} y={157} size={10}>paused for now</T>
      <T x={196} y={62} size={11} weight={700} tone={C.primary}>edit an early step…</T>
      <T x={196} y={78} size={10}>change Extrude 1 from</T>
      <T x={196} y={91} size={10}>30 mm to 50 mm and every</T>
      <T x={196} y={104} size={10}>later step rebuilds on it</T>
      <T x={196} y={188} size={10} tone={C.muted}>drag the bar back down</T>
      <T x={196} y={201} size={10} tone={C.muted}>to see the whole part</T>
    </g>
  );
});

export const VariableRipple = defineDiagram("variable-ripple", () => {
  const cups: [number, number, number][] = [[62, 30, 50], [178, 40, 70], [296, 50, 90]];
  const nodes: ReactNode[] = [];
  for (const [cx, rad, label] of cups) {
    const c = isoCircle(rad * 0.6);
    nodes.push(
      <g key={cx}>
        <Cylinder cx={cx} cy={150} rx={c.rx} ry={c.ry} h={54} />
        <ellipse cx={cx} cy={96} rx={c.rx - 5} ry={c.ry - 3} fill={C.border} stroke={C.fg} strokeWidth={1} />
        <T x={cx} y={194} anchor="middle" size={12} weight={700}>{`#diameter = ${label}`}</T>
      </g>,
    );
  }
  return (
    <g>
      <rect x={96} y={14} width={168} height={30} rx={8} fill={C.primarySoft} stroke={C.primary} />
      <T x={180} y={34} anchor="middle" size={12} weight={800} tone={C.primary}>change one number…</T>
      {nodes}
      <T x={180} y={212} anchor="middle" size={11}>…the wall stays 2 mm and every feature follows</T>
    </g>
  );
});

export const ProMoves = defineDiagram("pro-moves", () => {
  const panel = (x: number, title: string, body: ReactNode) => (
    <g key={title}>
      <T x={x + 40} y={26} anchor="middle" size={12} weight={800}>{title}</T>
      <g transform={`translate(${x} 0)`}>{body}</g>
    </g>
  );
  const rounded = <path d="M10 160 L10 90 Q10 60 40 60 L70 60 L70 160 Z" fill={C.primarySoft} stroke={C.fg} strokeWidth={1.6} />;
  const shell = (
    <g>
      <IsoBox p={iso(40, 122, 1)} w={34} d={34} h={50} />
      <polygon points={pts([iso(40, 122, 1)(3, 3, 50), iso(40, 122, 1)(31, 3, 50), iso(40, 122, 1)(31, 31, 50), iso(40, 122, 1)(3, 31, 50)])} fill={C.border} stroke={C.fg} strokeWidth={1} />
    </g>
  );
  const mirror = (
    <g>
      <path d="M40 60 L12 80 L12 150 L40 160 Z" fill={C.primarySoft} stroke={C.fg} strokeWidth={1.6} />
      <path d="M40 60 L68 80 L68 150 L40 160 Z" fill={C.primarySoft} fillOpacity={0.4} stroke={C.fg} strokeWidth={1.6} strokeDasharray="4 3" />
      <line x1={40} y1={48} x2={40} y2={172} stroke={C.accent} strokeWidth={1.6} strokeDasharray="8 3 2 3" />
    </g>
  );
  const pattern = (
    <g>
      <rect x={6} y={60} width={68} height={100} rx={6} fill={C.primarySoft} stroke={C.fg} strokeWidth={1.6} />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={18} y={70 + i * 22} width={44} height={10} rx={5} fill={C.border} stroke={C.fg} strokeWidth={1} strokeDasharray={i === 0 ? undefined : "3 2"} />
      ))}
    </g>
  );
  return (
    <g>
      {panel(4, "Fillet", rounded)}
      {panel(94, "Shell", shell)}
      {panel(184, "Mirror", mirror)}
      {panel(274, "Pattern", pattern)}
      <T x={44} y={184} anchor="middle" size={10}>rounds an edge</T>
      <T x={134} y={184} anchor="middle" size={10}>hollows a part</T>
      <T x={224} y={184} anchor="middle" size={10}>copies across a plane</T>
      <T x={314} y={184} anchor="middle" size={10}>repeats a feature</T>
      <T x={180} y={208} anchor="middle" size={11} tone={C.muted}>each is one line in the feature list — change it any time</T>
    </g>
  );
});
