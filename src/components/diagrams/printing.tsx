/** Diagrams: how FDM printing works. */
import { Arrow, C, Caption, Divider, IsoBox, IsoGhost, Leader, Nozzle, T, Cylinder, defineDiagram, iso, oblique, pts } from "./primitives";

export const FdmPrinter = defineDiagram("fdm-printer", (r) => (
  <g>
    {/* spool */}
    <circle cx={58} cy={78} r={34} fill={C.surface} stroke={C.fg} strokeWidth={1.4} />
    <circle cx={58} cy={78} r={24} fill="none" stroke={C.accent} strokeWidth={6} opacity={0.55} />
    <circle cx={58} cy={78} r={8} fill={C.border} stroke={C.fg} strokeWidth={1.2} />
    <T x={58} y={130} anchor="middle" weight={600}>Spool</T>
    {/* filament path */}
    <path d="M58 44 C 95 14, 170 14, 200 40" fill="none" stroke={C.accent} strokeWidth={2.4} />
    <T x={118} y={42} size={11} tone={C.muted}>filament</T>
    {/* gantry */}
    <rect x={112} y={58} width={222} height={6} rx={2} fill={C.border} stroke={C.muted} />
    <Arrow from={[228, 50]} to={[310, 50]} r={r} tone="primary" both />
    <T x={269} y={42} anchor="middle" size={11} tone={C.primary} weight={600}>head moves X / Y</T>
    {/* print head + nozzle */}
    <rect x={182} y={40} width={36} height={32} rx={3} fill={C.surface} stroke={C.fg} strokeWidth={1.4} />
    <path d="M192 72 L208 72 L203 86 L197 86 Z" fill={C.accent} stroke={C.fg} strokeWidth={1.2} />
    <path d="M186 96 q4 -4 0 -8 M214 96 q4 -4 0 -8" fill="none" stroke={C.accent} strokeWidth={1.2} />
    <Leader from={[206, 82]} to={[240, 100]} />
    <T x={243} y={104} weight={600}>Heated nozzle</T>
    <T x={243} y={118} size={11} tone={C.muted}>melts the plastic</T>
    {/* printed part */}
    <rect x={180} y={136} width={40} height={36} fill={r.layers} stroke={C.primary} strokeWidth={1.2} />
    <line x1={200} y1={88} x2={200} y2={136} stroke={C.accent} strokeWidth={2} strokeDasharray="2 3" />
    {/* bed */}
    <rect x={124} y={172} width={176} height={8} rx={2} fill={C.border} stroke={C.muted} />
    <T x={212} y={198} anchor="middle" weight={600}>Build plate</T>
    <Arrow from={[318, 150]} to={[318, 190]} r={r} tone="primary" both />
    <T x={326} y={174} size={11} tone={C.primary} weight={600}>Z</T>
  </g>
));

export const LayersStack = defineDiagram("layers-stack", (r) => {
  const p = iso(176, 124, 1);
  const pitch = 13;
  const halves = [40, 36, 31, 26, 21, 16];
  return (
    <g>
      <IsoBox p={p} x={-50} y={-50} z={-8} w={100} d={100} h={6} fill={{ top: C.border, left: C.surface, right: C.surface }} stroke={C.muted} />
      {halves.map((s, i) => (
        <IsoBox key={i} p={p} x={-s} y={-s} z={i * pitch} w={2 * s} d={2 * s} h={9} fill={{ top: C.primarySoft, left: C.surface, right: C.border }} stroke={C.primary} />
      ))}
      <Arrow from={[64, 176]} to={[64, 36]} r={r} tone="z" />
      <T x={52} y={110} anchor="middle" size={11} weight={600} tone={C.z} transform="rotate(-90 52 110)">builds upward</T>
      <Leader from={p(36, 40, 4)} to={[270, 150]} />
      <T x={273} y={154} weight={600}>Layer 1</T>
      <T x={273} y={168} size={11} tone={C.muted}>first, on the plate</T>
      <Leader from={p(16, 16, 5 * pitch + 6)} to={[270, 52]} />
      <T x={273} y={56} weight={600}>Layer 6</T>
      <T x={273} y={70} size={11} tone={C.muted}>last, on top</T>
      <T x={176} y={208} anchor="middle" size={11} tone={C.muted}>build plate</T>
    </g>
  );
});

export const SubtractiveVsAdditive = defineDiagram("subtractive-vs-additive", () => {
  const L = iso(96, 118, 1);
  const R = iso(276, 118, 1);
  const top = L(45, 20, 50);
  return (
    <g>
      <Caption x={90} y={22}>Subtractive</Caption>
      <T x={90} y={38} anchor="middle" size={11} tone={C.muted}>start big, cut material away</T>
      <IsoBox p={L} w={60} d={40} h={25} />
      <IsoBox p={L} w={30} d={40} h={25} z={25} />
      <IsoGhost p={L} x={30} w={30} d={40} h={25} z={25} stroke={C.danger} />
      {/* cutter */}
      <Cylinder cx={top[0] + 10} cy={top[1] - 8} rx={6} ry={3} h={36} side={C.border} top={C.surface} />
      {/* chips */}
      {[[148, 86, 20], [156, 104, -30], [140, 70, 50], [164, 92, 10]].map(([x, y, a], i) => (
        <rect key={i} x={x} y={y} width={6} height={3} fill={C.danger} transform={`rotate(${a} ${x} ${y})`} />
      ))}
      <T x={90} y={196} anchor="middle" size={11} weight={600} tone={C.danger}>removed (dashed) = waste</T>

      <Divider x={180} />

      <Caption x={270} y={22}>Additive</Caption>
      <T x={270} y={38} anchor="middle" size={11} tone={C.muted}>start empty, add layer by layer</T>
      {[0, 1, 2].map((i) => (
        <IsoBox key={`a${i}`} p={R} w={60} d={40} h={10} z={i * 10} stroke={C.primary} />
      ))}
      {[3, 4].map((i) => (
        <IsoBox key={`b${i}`} p={R} w={30} d={40} h={10} z={i * 10} stroke={C.primary} />
      ))}
      <Nozzle x={R(15, 20, 50)[0]} y={R(15, 20, 50)[1] - 4} s={0.8} />
      <T x={270} y={196} anchor="middle" size={11} weight={600} tone={C.primary}>only the plastic you need</T>
    </g>
  );
});

export const XyzAxes = defineDiagram("xyz-axes", (r) => {
  const o: [number, number] = [140, 160];
  const p = oblique(o[0], o[1], 0.8, 35);
  const grid = [];
  for (let i = -2; i <= 6; i++) {
    const a = p(i * 20, -30, 0);
    const b = p(i * 20, 110, 0);
    grid.push(<line key={`gx${i}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />);
  }
  for (let j = -1; j <= 5; j++) {
    const a = p(-40, j * 22, 0);
    const b = p(120, j * 22, 0);
    grid.push(<line key={`gy${j}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />);
  }
  const yEnd = p(0, 140, 0);
  const cube = [p(0, 0, 0), p(26, 0, 0), p(26, 0, 26), p(0, 0, 26)];
  const cubeTop = [p(0, 0, 26), p(26, 0, 26), p(26, 26, 26), p(0, 26, 26)];
  const cubeSide = [p(26, 0, 0), p(26, 26, 0), p(26, 26, 26), p(26, 0, 26)];
  return (
    <g>
      <g stroke={C.border} strokeWidth={0.8}>{grid}</g>
      <polygon points={pts(cubeSide)} fill={C.border} stroke={C.fg} strokeWidth={1} />
      <polygon points={pts(cube)} fill={C.surface} stroke={C.fg} strokeWidth={1} />
      <polygon points={pts(cubeTop)} fill={C.primarySoft} stroke={C.fg} strokeWidth={1} />
      <Arrow from={o} to={[310, o[1]]} r={r} tone="x" width={3} />
      <Arrow from={o} to={yEnd} r={r} tone="y" width={3} />
      <Arrow from={o} to={[o[0], 26]} r={r} tone="z" width={3} />
      <circle cx={o[0]} cy={o[1]} r={4} fill={C.fg} />
      <T x={314} y={o[1] + 5} size={16} weight={700} tone={C.x}>X</T>
      <T x={330} y={o[1] + 24} anchor="end" size={11} weight={600}>left ↔ right</T>
      <T x={yEnd[0] + 6} y={yEnd[1] + 2} size={16} weight={700} tone={C.y}>Y</T>
      <T x={yEnd[0] + 22} y={yEnd[1] + 1} size={11} weight={600}>front ↔ back</T>
      <T x={o[0] + 8} y={34} size={16} weight={700} tone={C.z}>Z</T>
      <T x={o[0] + 24} y={33} size={11} weight={600}>up ↕ down</T>
      <T x={o[0] - 8} y={o[1] + 22} anchor="end" size={11} tone={C.muted}>origin</T>
    </g>
  );
});
