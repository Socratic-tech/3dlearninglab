/** Diagrams: common print failures (side views on a build plate). */
import type { ReactNode } from "react";
import { Arrow, C, Caption, Dim, Divider, Leader, LayeredRect, Nozzle, Plate, T, Verdict, defineDiagram, round } from "./primitives";

export const FailureStringing = defineDiagram("failure-stringing", (r) => (
  <g>
    <Caption x={180} y={22}>Stringing</Caption>
    <LayeredRect x={70} y={70} w={40} h={106} r={r} />
    <LayeredRect x={250} y={70} w={40} h={106} r={r} />
    <g fill="none" stroke={C.accent} strokeWidth={1}>
      {[78, 92, 104, 120, 136, 150].map((y, i) => (
        <path key={y} d={`M110 ${y} C150 ${y + 10 + (i % 3) * 4}, 210 ${y - 6 + (i % 2) * 8}, 250 ${y + 3}`} />
      ))}
    </g>
    <Nozzle x={180} y={58} s={0.8} />
    <Arrow from={[150, 36]} to={[210, 36]} r={r} tone="muted" dash="4 3" />
    <T x={218} y={40} size={10} tone={C.muted}>nozzle travels across</T>
    <Leader from={[180, 110]} to={[180, 192]} tone={C.accent} />
    <T x={180} y={206} anchor="middle" size={11} weight={700}>thin wisps of plastic stretched between the towers</T>
  </g>
));

export const FailureWarping = defineDiagram("failure-warping", (r) => (
  <g>
    <Caption x={180} y={22}>Warping</Caption>
    <rect x={60} y={146} width={240} height={24} fill="none" stroke={C.muted} strokeDasharray="4 3" />
    <path d="M60 128 Q66 150 100 158 L260 158 Q294 150 300 128 L300 116 Q292 138 262 146 L98 146 Q68 138 60 116 Z" fill={r.layers} stroke={C.primary} strokeWidth={1.5} />
    <path d="M100 158 L260 158 L260 170 L100 170 Z" fill={r.layers} stroke={C.primary} strokeWidth={1.5} />
    <Arrow from={[62, 150]} to={[62, 122]} r={r} tone="danger" width={2} />
    <Arrow from={[298, 150]} to={[298, 122]} r={r} tone="danger" width={2} />
    <Leader from={[76, 162]} to={[40, 196]} tone={C.danger} />
    <T x={12} y={210} size={11} weight={700} tone={C.danger}>gap under the corner</T>
    <T x={330} y={110} anchor="end" size={11} weight={700}>corners curl up</T>
    <T x={30} y={110} size={11} weight={700}>corners curl up</T>
    <T x={180} y={60} anchor="middle" size={11}>plastic shrinks as it cools and pulls the corners off the plate</T>
    <T x={180} y={76} anchor="middle" size={10} tone={C.muted}>dashed = the shape it should have</T>
    <Plate x={20} y={170} w={320} />
  </g>
));

export const FailureSpaghetti = defineDiagram("failure-spaghetti", (r) => {
  const n = 160;
  const d: string[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = 120 + 190 * t + 16 * Math.cos(t * 41);
    const y = 158 + 11 * Math.sin(t * 33) - 22 * Math.sin(Math.PI * t) + 4 * Math.cos(t * 13);
    d.push(`${i === 0 ? "M" : "L"}${round(x)} ${round(Math.min(y, 172))}`);
  }
  const drop: string[] = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    drop.push(`${i === 0 ? "M" : "L"}${round(232 + 8 * Math.sin(t * 14))} ${round(64 + t * 74)}`);
  }
  const loops: ReactNode[] = [<path key="a" d={d.join(" ")} />, <path key="b" d={drop.join(" ")} />];
  return (
    <g>
      <Caption x={180} y={22}>Spaghetti</Caption>
      <g transform="rotate(-28 70 170)">
        <LayeredRect x={44} y={130} w={36} h={40} r={r} />
      </g>
      <g fill="none" stroke={C.accent} strokeWidth={1.4}>{loops}</g>
      <Nozzle x={232} y={64} s={0.9} />
      <Leader from={[60, 140]} to={[40, 72]} />
      <T x={12} y={56} size={11} weight={700}>print knocked</T>
      <T x={12} y={70} size={11} weight={700}>loose</T>
      <Leader from={[290, 150]} to={[300, 96]} tone={C.accent} />
      <T x={268} y={70} size={11} weight={700}>filament keeps</T>
      <T x={268} y={84} size={11} weight={700}>coming out</T>
      <T x={180} y={204} anchor="middle" size={11}>nothing to print on, so the plastic piles up like spaghetti</T>
      <Plate x={20} y={174} w={320} />
    </g>
  );
});

export const FailureLayerShift = defineDiagram("failure-layer-shift", (r) => (
  <g>
    <Caption x={180} y={22}>Layer shift</Caption>
    <LayeredRect x={140} y={110} w={60} h={66} r={r} />
    <LayeredRect x={168} y={50} w={60} h={60} r={r} />
    <rect x={140} y={50} width={60} height={60} fill="none" stroke={C.muted} strokeDasharray="4 3" />
    <Arrow from={[204, 40]} to={[226, 40]} r={r} tone="danger" width={2} />
    <T x={232} y={44} size={11} weight={700} tone={C.danger}>shifted sideways</T>
    <Leader from={[214, 110]} to={[250, 124]} />
    <T x={254} y={122} size={11} weight={700}>the layer</T>
    <T x={254} y={136} size={11} weight={700}>where it jumped</T>
    <T x={132} y={80} anchor="end" size={11} tone={C.muted}>should be here</T>
    <T x={132} y={150} anchor="end" size={11}>lower layers OK</T>
    <T x={180} y={204} anchor="middle" size={11}>the upper layers no longer line up with the lower ones</T>
    <Plate x={20} y={176} w={320} />
  </g>
));

export const FailureElephantFoot = defineDiagram("failure-elephant-foot", (r) => (
  <g>
    <Caption x={180} y={22}>Elephant’s foot</Caption>
    <LayeredRect x={150} y={62} w={60} h={92} r={r} />
    <path d="M150 154 Q140 160 141 176 L219 176 Q220 160 210 154 Z" fill={r.layers} stroke={C.primary} strokeWidth={1.4} />
    <line x1={150} y1={150} x2={150} y2={176} stroke={C.fg} strokeDasharray="3 3" />
    <line x1={210} y1={150} x2={210} y2={176} stroke={C.fg} strokeDasharray="3 3" />
    <Dim from={[150, 48]} to={[210, 48]} r={r} label="design width" offset={8} labelSide={-1} size={11} weight={400} />
    <Dim from={[141, 196]} to={[219, 196]} r={r} tone="danger" label="" />
    <T x={228} y={200} size={11} weight={700} tone={C.danger}>wider at the bottom</T>
    <Leader from={[143, 168]} to={[100, 150]} tone={C.danger} />
    <T x={96} y={142} anchor="end" size={11} weight={700}>first layers</T>
    <T x={96} y={156} anchor="end" size={11} weight={700}>squashed out</T>
    <T x={232} y={110} size={10} tone={C.muted}>dashed = the</T>
    <T x={232} y={123} size={10} tone={C.muted}>size it should be</T>
    <Plate x={20} y={176} w={320} />
  </g>
));

function BeadGrid({ x, cols, rows, w, h, keep }: { x: number; cols: number; rows: number; w: number; h: number; keep?: (c: number, r: number) => number }) {
  const out: ReactNode[] = [];
  for (let rr = 0; rr < rows; rr++) {
    for (let cc = 0; cc < cols; cc++) {
      const scale = keep ? keep(cc, rr) : 1;
      if (scale <= 0) continue;
      const bw = w * scale;
      const bh = h * Math.max(0.55, scale);
      const cx = x + cc * w + w / 2;
      const cy = 172 - rr * h - h / 2;
      out.push(<rect key={`${cc}-${rr}`} x={cx - bw / 2 + 0.5} y={cy - bh / 2 + 0.5} width={bw - 1} height={bh - 1} rx={bh / 2} fill={C.primarySoft} stroke={C.primary} strokeWidth={1.2} />);
    }
  }
  return <g>{out}</g>;
}

export const FailureUnderExtrusion = defineDiagram("failure-under-extrusion", () => {
  const pattern = [1, 0.6, 0.7, 0, 0.55, 0.8, 0.5, 0.65, 0, 0.6, 0.75, 0.5];
  return (
    <g>
      <Caption x={92} y={26}>Good extrusion</Caption>
      <T x={92} y={42} anchor="middle" size={10} tone={C.muted}>cut-away of a wall</T>
      <BeadGrid x={32} cols={6} rows={9} w={20} h={12} />
      <Verdict x={92} y={200} ok size={11}>lines touch, solid wall</Verdict>
      <Divider x={182} />
      <Caption x={270} y={26}>Under-extrusion</Caption>
      <T x={270} y={42} anchor="middle" size={10} tone={C.muted}>too little plastic came out</T>
      <BeadGrid x={210} cols={6} rows={9} w={20} h={12} keep={(c, rr) => pattern[(c * 5 + rr * 7) % pattern.length]} />
      <Verdict x={270} y={200} ok={false} size={11}>thin lines and gaps</Verdict>
      <Plate x={14} y={172} w={156} />
      <Plate x={194} y={172} w={156} />
    </g>
  );
});

export const FirstLayer = defineDiagram("first-layer", (r) => {
  const plateY = 150;
  const col = (cx: number, title: string, tip: number, beads: ReactNode, ok: boolean, verdict: string, note: string) => (
    <g>
      <Caption x={cx} y={24}>{title}</Caption>
      <Nozzle x={cx} y={tip} />
      {beads}
      <Dim from={[cx + 30, tip]} to={[cx + 30, plateY]} r={r} label="" tone="muted" />
      <Verdict x={cx} y={184} ok={ok} size={11}>{verdict}</Verdict>
      <T x={cx} y={200} anchor="middle" size={10}>{note}</T>
    </g>
  );
  const row = (cx: number, f: (x: number, i: number) => ReactNode) => [-36, -18, 0, 18, 36].map((dx, i) => f(cx + dx, i));
  return (
    <g>
      {col(
        62,
        "Too high",
        112,
        row(62, (x, i) => <circle key={i} cx={x} cy={plateY - 7} r={7} fill={C.primarySoft} stroke={C.primary} strokeWidth={1.3} />),
        false,
        "round lines",
        "gaps; may not stick",
      )}
      <Divider x={122} y0={14} y1={150} />
      {col(
        180,
        "Just right",
        136,
        row(180, (x, i) => <rect key={i} x={x - 10} y={plateY - 9} width={20} height={9} rx={4.5} fill={C.primarySoft} stroke={C.primary} strokeWidth={1.3} />),
        true,
        "flat lines",
        "slightly squished",
      )}
      <Divider x={238} y0={14} y1={150} />
      {col(
        298,
        "Too low",
        147,
        row(298, (x, i) => <path key={i} d={`M${x - 11} ${plateY} L${x - 11} ${plateY - 4} L${x - 8} ${plateY - 2} L${x + 8} ${plateY - 2} L${x + 11} ${plateY - 4} L${x + 11} ${plateY} Z`} fill={C.primarySoft} fillOpacity={0.5} stroke={C.primary} strokeWidth={1} />),
        false,
        "scraped thin",
        "see-through",
      )}
      <Plate x={10} y={plateY} w={340} />
      <T x={180} y={214} anchor="middle" size={10} tone={C.muted}>cross-sections of first-layer lines on the plate</T>
    </g>
  );
});

export const SupportScars = defineDiagram("support-scars", (r) => {
  const rough: string[] = [];
  for (let i = 0; i <= 32; i++) rough.push(`${i === 0 ? "M" : "L"}${54 + i * 3} ${100 + (i % 2 === 0 ? 0 : 4) + (i % 5 === 0 ? 2 : 0)}`);
  const zoom: string[] = [];
  for (let i = 0; i <= 40; i++) zoom.push(`${i === 0 ? "M" : "L"}${214 + i * 2.8} ${132 + (i % 2 === 0 ? 0 : 7) + (i % 3 === 0 ? 4 : 0)}`);
  return (
    <g>
      <defs>
        <clipPath id={`${r.id}-zoom`}>
          <circle cx={270} cy={110} r={62} />
        </clipPath>
      </defs>
      <Caption x={92} y={22}>After removing supports</Caption>
      <rect x={30} y={78} width={24} height={98} fill={r.layers} stroke={C.primary} strokeWidth={1.4} />
      <rect x={54} y={78} width={96} height={22} fill={r.layers} stroke={C.primary} strokeWidth={1.4} />
      <path d={rough.join(" ")} fill="none" stroke={C.danger} strokeWidth={1.8} />
      <circle cx={110} cy={102} r={12} fill="none" stroke={C.muted} />
      <line x1={121} y1={96} x2={210} y2={70} stroke={C.muted} />
      <line x1={120} y1={110} x2={214} y2={150} stroke={C.muted} />
      <Plate x={14} y={176} w={152} />
      <g clipPath={`url(#${r.id}-zoom)`}>
        <rect x={200} y={40} width={140} height={140} fill={C.surface} />
        <rect x={200} y={74} width={140} height={58} fill={r.layers} />
        <line x1={200} y1={74} x2={340} y2={74} stroke={C.success} strokeWidth={2.4} />
        <path d={`${zoom.join(" ")} L340 120 L200 120 Z`} fill={r.layers} stroke={C.danger} strokeWidth={1.8} />
        {[226, 252, 281, 309].map((x) => (
          <rect key={x} x={x} y={136} width={4} height={8} fill={C.muted} />
        ))}
      </g>
      <circle cx={270} cy={110} r={62} fill="none" stroke={C.muted} strokeWidth={1.4} />
      <T x={270} y={40} anchor="middle" size={11} weight={700} tone={C.success}>top: smooth</T>
      <T x={270} y={190} anchor="middle" size={11} weight={700} tone={C.danger}>underside: rough scars</T>
      <T x={270} y={204} anchor="middle" size={10}>and little leftover bits</T>
    </g>
  );
});
