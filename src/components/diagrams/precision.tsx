/** Diagrams: measuring, fits and tolerances. */
import type { ReactNode } from "react";
import { Arrow, C, Caption, Dim, Divider, IsoBox, Leader, T, Verdict, defineDiagram, iso, isoCircle } from "./primitives";

export const CaliperParts = defineDiagram("caliper-parts", (r) => {
  const ticks: ReactNode[] = [];
  for (let x = 232; x <= 324; x += 6) ticks.push(<line key={x} x1={x} y1={96} x2={x} y2={(x - 232) % 30 === 0 ? 103 : 100} />);
  return (
    <g>
      {/* main beam */}
      <rect x={40} y={96} width={290} height={14} rx={2} fill={C.surface} stroke={C.fg} strokeWidth={1.3} />
      <g stroke={C.muted} strokeWidth={1}>{ticks}</g>
      {/* fixed jaws */}
      <path d="M40 110 L62 110 L62 178 L50 190 L40 190 Z" fill={C.surface} stroke={C.fg} strokeWidth={1.3} />
      <path d="M48 96 L48 58 L62 66 L62 96 Z" fill={C.surface} stroke={C.fg} strokeWidth={1.3} />
      {/* slider */}
      <rect x={100} y={80} width={112} height={48} rx={6} fill={C.border} stroke={C.fg} strokeWidth={1.3} />
      <path d="M100 128 L122 128 L122 190 L112 190 L100 178 Z" fill={C.border} stroke={C.fg} strokeWidth={1.3} />
      <path d="M100 80 L100 66 L114 58 L114 80 Z" fill={C.border} stroke={C.fg} strokeWidth={1.3} />
      {/* display + zero button */}
      <rect x={124} y={88} width={56} height={24} rx={3} fill={C.primarySoft} stroke={C.primary} strokeWidth={1.4} />
      <T x={152} y={105} anchor="middle" size={13} weight={700} tone={C.primary}>25.40</T>
      <circle cx={196} cy={100} r={7} fill={C.accentSoft} stroke={C.accent} strokeWidth={1.4} />
      <T x={196} y={104} anchor="middle" size={9} weight={700}>0</T>
      {/* depth rod */}
      <line x1={330} y1={104} x2={354} y2={104} stroke={C.fg} strokeWidth={2.4} />
      {/* object between outside jaws */}
      <rect x={62} y={140} width={38} height={26} fill={C.accentSoft} stroke={C.accent} strokeDasharray="3 2" />
      {/* labels */}
      <Leader from={[81, 184]} to={[81, 196]} />
      <T x={81} y={210} anchor="middle" weight={700}>Outside jaws</T>
      <T x={150} y={210} size={11} tone={C.muted}>measure the outside of things</T>
      <Leader from={[81, 62]} to={[81, 42]} />
      <T x={81} y={20} anchor="middle" weight={700}>Inside jaws</T>
      <T x={81} y={35} anchor="middle" size={11} tone={C.muted}>hole width</T>
      <Leader from={[160, 88]} to={[176, 50]} />
      <T x={160} y={44} weight={700}>Display</T>
      <Leader from={[199, 94]} to={[234, 64]} />
      <T x={230} y={58} weight={700}>Zero button</T>
      <T x={230} y={72} size={11} tone={C.muted}>close jaws, press</T>
      <Leader from={[348, 104]} to={[332, 140]} />
      <T x={348} y={154} anchor="end" weight={700}>Depth rod</T>
      <T x={348} y={168} anchor="end" size={11} tone={C.muted}>depth of a hole</T>
      <Arrow from={[220, 140]} to={[260, 140]} r={r} tone="muted" />
      <T x={218} y={144} anchor="end" size={10} tone={C.muted}>slides</T>
    </g>
  );
});

export const MeasureCritical = defineDiagram("measure-critical", (r) => (
  <g>
    {/* marker pen */}
    <rect x={84} y={78} width={168} height={34} rx={6} fill={C.surface} stroke={C.fg} strokeWidth={1.4} />
    <rect x={84} y={78} width={52} height={34} rx={6} fill={C.border} stroke={C.fg} strokeWidth={1.4} />
    <rect x={130} y={74} width={6} height={42} rx={1} fill={C.border} stroke={C.fg} />
    <path d="M252 84 L284 90 L296 95 L284 100 L252 106 Z" fill={C.border} stroke={C.fg} strokeWidth={1.4} />
    <T x={215} y={99} anchor="middle" size={11} tone={C.muted}>marker</T>
    {/* critical: diameter */}
    <rect x={160} y={74} width={18} height={42} fill={C.accentSoft} stroke={C.accent} strokeWidth={2} strokeDasharray="4 2" />
    <Dim from={[64, 112]} to={[64, 78]} r={r} tone="accent" label="" />
    <T x={56} y={92} anchor="end" size={13} weight={800} tone={C.accent}>Ø 14</T>
    <T x={56} y={106} anchor="end" size={11} weight={700} tone={C.accent}>mm</T>
    <Leader from={[169, 74]} to={[190, 40]} tone={C.accent} />
    <T x={192} y={30} size={12} weight={800} tone={C.accent}>CRITICAL dimension</T>
    <T x={192} y={44} size={11}>must fit the holder’s hole</T>
    {/* nice-to-know: length */}
    <Dim from={[84, 140]} to={[296, 140]} r={r} tone="muted" label="length 135 mm" offset={-12} labelSide={-1} weight={400} />
    <T x={190} y={172} anchor="middle" size={11} tone={C.muted}>nice to know, but it doesn’t have to fit anything</T>
    <T x={190} y={204} anchor="middle" size={11}>Measure the critical one carefully — that’s the one you test.</T>
  </g>
));

export const ClearanceFit = defineDiagram("clearance-fit", (r) => (
  <g>
    <Caption x={96} y={22}>Top view</Caption>
    <rect x={26} y={40} width={140} height={140} rx={6} fill={C.surface} stroke={C.fg} strokeWidth={1.4} />
    <circle cx={96} cy={110} r={46} fill={C.accentSoft} stroke={C.fg} strokeWidth={1.4} />
    <circle cx={96} cy={110} r={38} fill={C.primarySoft} stroke={C.primary} strokeWidth={1.8} />
    <T x={96} y={106} anchor="middle" weight={700} tone={C.primary}>peg</T>
    <T x={96} y={121} anchor="middle" size={11}>Ø 10.0</T>
    <T x={96} y={196} anchor="middle" size={11}>hole Ø 10.4</T>
    {/* zoom circle */}
    <circle cx={138} cy={110} r={9} fill="none" stroke={C.muted} strokeWidth={1.2} />
    <line x1={146} y1={104} x2={218} y2={64} stroke={C.muted} />
    <line x1={146} y1={116} x2={218} y2={160} stroke={C.muted} />
    <defs>
      <clipPath id={`${r.id}-zoom`}>
        <circle cx={268} cy={112} r={64} />
      </clipPath>
    </defs>
    <g clipPath={`url(#${r.id}-zoom)`}>
      <rect x={200} y={44} width={64} height={140} fill={C.primarySoft} />
      <rect x={264} y={44} width={26} height={140} fill={C.accentSoft} />
      <rect x={290} y={44} width={50} height={140} fill={C.surface} />
      <line x1={264} y1={44} x2={264} y2={184} stroke={C.primary} strokeWidth={2.4} />
      <line x1={290} y1={44} x2={290} y2={184} stroke={C.fg} strokeWidth={2.4} />
    </g>
    <circle cx={268} cy={112} r={64} fill="none" stroke={C.muted} strokeWidth={1.4} />
    <Dim from={[264, 112]} to={[290, 112]} r={r} tone="accent" label="" />
    <T x={234} y={92} anchor="middle" size={11} weight={700} tone={C.primary}>peg</T>
    <T x={312} y={92} anchor="middle" size={11} weight={700}>wall</T>
    <T x={277} y={140} anchor="middle" size={11} weight={800} tone={C.accent}>gap</T>
    <T x={268} y={198} anchor="middle" size={12} weight={700}>Clearance ≈ 0.2 mm each side</T>
    <T x={268} y={212} anchor="middle" size={10} tone={C.muted}>zoomed in</T>
  </g>
));

export const ToleranceRange = defineDiagram("tolerance-range", () => {
  const x = (mm: number) => 180 + (mm - 20) * 300;
  const ticks: ReactNode[] = [];
  for (let v = 19.5; v <= 20.501; v += 0.1) {
    const vv = Math.round(v * 10) / 10;
    ticks.push(
      <g key={vv}>
        <line x1={x(vv)} y1={120} x2={x(vv)} y2={vv * 10 % 5 === 0 ? 130 : 126} stroke={C.fg} />
        {Math.abs(vv * 10 - Math.round(vv * 10)) < 0.01 && Math.round(vv * 10) % 2 === 0 ? (
          <T x={x(vv)} y={144} anchor="middle" size={10} tone={C.muted}>{vv.toFixed(1)}</T>
        ) : null}
      </g>,
    );
  }
  const samples: [number, boolean][] = [[19.6, false], [19.9, true], [20.1, true], [20.4, false]];
  return (
    <g>
            <rect x={x(19.8)} y={84} width={x(20.2) - x(19.8)} height={36} rx={3} fill={C.primarySoft} stroke={C.success} strokeWidth={1.6} />
      <T x={180} y={78} anchor="middle" size={12} weight={700} tone={C.success}>acceptable: 19.8 – 20.2 mm</T>
      <line x1={x(19.5)} y1={120} x2={x(20.5)} y2={120} stroke={C.fg} strokeWidth={1.6} />
      {ticks}
      <line x1={180} y1={56} x2={180} y2={64} stroke={C.primary} strokeWidth={2.4} />
      <line x1={180} y1={84} x2={180} y2={128} stroke={C.primary} strokeWidth={2.4} />
      <T x={180} y={34} anchor="middle" size={13} weight={800} tone={C.primary}>Target 20.0 mm</T>
      <T x={180} y={50} anchor="middle" size={11}>± 0.2 mm tolerance</T>
      <T x={x(19.62)} y={102} anchor="middle" size={11} weight={700} tone={C.danger}>too small</T>
      <T x={x(20.38)} y={102} anchor="middle" size={11} weight={700} tone={C.danger}>too big</T>
      {samples.map(([v, ok]) => (
        <g key={v}>
          <circle cx={x(v)} cy={166} r={5} fill={ok ? C.success : C.danger} />
          <line x1={x(v)} y1={150} x2={x(v)} y2={160} stroke={C.muted} strokeDasharray="2 2" />
          <Verdict x={x(v)} y={192} ok={ok} size={11}>{v.toFixed(1)}</Verdict>
        </g>
      ))}
      <T x={180} y={212} anchor="middle" size={10} tone={C.muted}>measured parts</T>
    </g>
  );
});

export const FitTypes = defineDiagram("fit-types", (r) => {
  const fit = (cx: number, gap: number, title: string, gapLabel: string, note: string) => {
    const pegW = 36;
    const holeW = pegW + 2 * gap;
    return (
      <g>
        <Caption x={cx} y={20}>{title}</Caption>
        <rect x={cx - 50} y={92} width={100} height={70} fill={C.border} stroke={C.fg} strokeWidth={1.2} />
        <rect x={cx - holeW / 2} y={92} width={holeW} height={56} fill={C.accentSoft} stroke={C.fg} strokeWidth={1.2} />
        <rect x={cx - pegW / 2} y={50} width={pegW} height={98} rx={2} fill={C.primarySoft} stroke={C.primary} strokeWidth={1.6} />
        {gap >= 6 ? <Dim from={[cx + pegW / 2, 118]} to={[cx + holeW / 2, 118]} r={r} tone="accent" label="" /> : null}
        <T x={cx} y={182} anchor="middle" size={12} weight={700} tone={C.accent}>{gapLabel}</T>
        <T x={cx} y={198} anchor="middle" size={11}>{note}</T>
      </g>
    );
  };
  return (
    <g>
      {fit(62, 0.6, "Press / tight", "gap ≈ 0–0.1 mm", "push hard; stays put")}
      <Divider x={124} y0={48} />
      {fit(182, 4, "Sliding", "gap ≈ 0.2 mm", "moves smoothly")}
      <Divider x={242} y0={48} />
      {fit(302, 10, "Loose", "gap ≈ 0.4+ mm", "wobbles, falls out")}
      <T x={180} y={38} anchor="middle" size={10} tone={C.muted}>same peg, different holes (side cut-away)</T>
    </g>
  );
});

export const PrototypeCritical = defineDiagram("prototype-critical", (r) => {
  const L = iso(80, 104, 1);
  const R = iso(262, 128, 1);
  const c = isoCircle(9);
  const holeL = L(25, 25, 60);
  const holeR = R(25, 25, 6);
  return (
    <g>
      <Caption x={82} y={22}>Whole part</Caption>
      <IsoBox p={L} w={50} d={50} h={60} />
      <ellipse cx={holeL[0]} cy={holeL[1]} rx={c.rx} ry={c.ry} fill={C.border} stroke={C.fg} />
      <IsoBox p={L} x={0} y={0} z={46} w={50} d={50} h={0.01} fill={{ top: "none", left: "none", right: "none" }} stroke={C.accent} sw={1.6} dash="4 3" />
      <T x={82} y={186} anchor="middle" size={11}>about 2 hours</T>
      <T x={82} y={200} anchor="middle" size={11} tone={C.muted}>lots of plastic</T>
      <Divider x={176} />
      <Arrow from={[146, 70]} to={[214, 96]} r={r} tone="accent" dash="4 3" />
      <T x={180} y={60} anchor="middle" size={11} weight={700} tone={C.accent}>print only this slice</T>
      <Caption x={266} y={22}>Test slice</Caption>
      <IsoBox p={R} w={50} d={50} h={6} fill={{ top: C.accentSoft }} stroke={C.accent} />
      <ellipse cx={holeR[0]} cy={holeR[1]} rx={c.rx} ry={c.ry} fill={C.border} stroke={C.fg} />
      <T x={266} y={186} anchor="middle" size={11}>about 10 minutes</T>
      <T x={266} y={200} anchor="middle" size={11} tone={C.muted}>tests the hole the same way</T>
      <Leader from={[holeR[0] + c.rx, holeR[1]]} to={[318, 90]} />
      <T x={300} y={84} size={11} weight={700}>the hole</T>
    </g>
  );
});
