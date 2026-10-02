/** Diagrams: CAD workspace controls (view, select, move, scale, rotate, measure). */
import type { ReactNode } from "react";
import {
  Arrow,
  C,
  Caption,
  Cursor,
  Dim,
  Divider,
  Grid,
  IsoBox,
  IsoGrid,
  Key,
  Leader,
  Poly,
  T,
  type Pt,
  defineDiagram,
  ellipseArc,
  iso,
  pts,
  round,
} from "./primitives";

export const ViewControls = defineDiagram("view-controls", () => (
  <g>
    <path d="M130 82 Q130 50 160 50 Q190 50 190 82 L190 140 Q190 174 160 174 Q130 174 130 140 Z" fill={C.surface} stroke={C.fg} strokeWidth={1.5} />
    <path d="M160 50 Q190 50 190 82 L190 100 L160 100 Z" fill={C.primarySoft} stroke={C.primary} strokeWidth={1.5} />
    <line x1={130} y1={100} x2={190} y2={100} stroke={C.fg} strokeWidth={1.2} />
    <line x1={160} y1={50} x2={160} y2={100} stroke={C.fg} strokeWidth={1.2} />
    <rect x={155} y={60} width={10} height={28} rx={5} fill={C.accentSoft} stroke={C.accent} strokeWidth={1.5} />
    {/* wheel → left labels */}
    <Leader from={[156, 72]} to={[122, 72]} />
    <T x={118} y={66} anchor="end" weight={700}>Scroll → zoom</T>
    <T x={118} y={82} anchor="end" size={11}>Middle-drag → pan</T>
    <Leader from={[144, 88]} to={[122, 120]} />
    <T x={118} y={124} anchor="end" size={11} tone={C.muted}>Left-click → select</T>
    {/* right button → right labels */}
    <Leader from={[180, 80]} to={[202, 68]} />
    <T x={206} y={64} weight={700}>Right-drag → orbit</T>
    <T x={206} y={80} size={11}>Shift + right-drag → pan</T>
    {/* view cube */}
    {(() => {
      const p = iso(296, 140, 1);
      return (
        <g>
          <IsoBox p={p} w={26} d={26} h={26} />
          <T x={p(13, 13, 26)[0]} y={p(13, 13, 26)[1] + 3} anchor="middle" size={8} weight={700}>TOP</T>
        </g>
      );
    })()}
    <T x={296} y={186} anchor="middle" weight={700}>View cube</T>
    <T x={296} y={201} anchor="middle" size={11}>click it to reset the view</T>
  </g>
));

export const Selection = defineDiagram("selection", () => {
  const panel = (x0: number, sel: [boolean, boolean, boolean], title: string, sub: string, extra: ReactNode) => {
    const st = (on: boolean) => ({ fill: on ? C.primarySoft : C.surface, stroke: on ? C.primary : C.muted, strokeWidth: on ? 2.4 : 1.2 });
    const count = sel.filter(Boolean).length;
    return (
      <g>
        <Caption x={x0 + 60} y={24}>{title}</Caption>
        <T x={x0 + 60} y={40} anchor="middle" size={11} tone={C.muted}>{sub}</T>
        {extra}
        <rect x={x0 + 18} y={64} width={30} height={30} rx={2} {...st(sel[0])} />
        <circle cx={x0 + 86} cy={80} r={15} {...st(sel[1])} />
        <polygon points={pts([[x0 + 56, 118], [x0 + 76, 150], [x0 + 36, 150]])} {...st(sel[2])} />
        <T x={x0 + 60} y={190} anchor="middle" weight={700} tone={C.primary}>{`${count} selected`}</T>
      </g>
    );
  };
  return (
    <g>
      {panel(0, [true, false, false], "Click", "selects one shape", null)}
      <Cursor x={36} y={80} />
      <Divider x={120} />
      {panel(120, [true, true, false], "Shift + click", "adds more shapes", <Key x={196} y={108} w={40} h={20} label="Shift" size={10} active />)}
      <Cursor x={210} y={84} />
      <Divider x={240} />
      {panel(
        240,
        [true, true, true],
        "Drag a box",
        "selects all inside",
        <rect x={248} y={54} width={104} height={106} fill={C.primarySoft} fillOpacity={0.35} stroke={C.primary} strokeWidth={1.4} strokeDasharray="5 3" />,
      )}
      <Cursor x={352} y={160} />
    </g>
  );
});

export const Workplane = defineDiagram("workplane", () => {
  const p = iso(122, 62, 1.4);
  const k = 0.6;
  const s = (x: number, y: number): [number, number, number] => [x, y, k * x];
  const n = [-0.514, 0, 0.857];
  const h = 24;
  const t = (x: number, y: number): [number, number, number] => [x + n[0] * h, y, k * x + n[2] * h];
  const grid: ReactNode[] = [];
  for (let x = 8; x <= 92; x += 12) {
    const a = p(...s(x, 6));
    const b = p(...s(x, 54));
    grid.push(<line key={`gx${x}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />);
  }
  for (let y = 6; y <= 54; y += 12) {
    const a = p(...s(8, y));
    const b = p(...s(92, y));
    grid.push(<line key={`gy${y}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />);
  }
  return (
    <g>
      {/* wedge */}
      <Poly p={p} points={[[100, 0, 0], [100, 60, 0], [100, 60, 60], [100, 0, 60]]} fill={C.border} />
      <Poly p={p} points={[[0, 60, 0], [100, 60, 0], [100, 60, 60]]} fill={C.surface} />
      <Poly p={p} points={[[0, 0, 0], [100, 0, 60], [100, 60, 60], [0, 60, 0]]} fill={C.surface} />
      {/* workplane on the slope */}
      <Poly p={p} points={[s(8, 6), s(92, 6), s(92, 54), s(8, 54)]} fill={C.primarySoft} stroke={C.primary} sw={1.6} />
      <g stroke={C.primary} strokeWidth={0.8} opacity={0.6}>{grid}</g>
      {/* new shape sitting flat on the face */}
      <Poly p={p} points={[s(40, 40), s(64, 40), t(64, 40), t(40, 40)]} fill={C.accentSoft} stroke={C.accent} sw={1.4} />
      <Poly p={p} points={[s(64, 18), s(64, 40), t(64, 40), t(64, 18)]} fill={C.accentSoft} stroke={C.accent} sw={1.4} />
      <Poly p={p} points={[t(40, 18), t(64, 18), t(64, 40), t(40, 40)]} fill={C.accentSoft} stroke={C.accent} sw={1.4} />
      <Leader from={p(...s(86, 10))} to={[268, 52]} />
      <T x={256} y={34} weight={700}>Workplane</T>
      <T x={256} y={48} size={11}>placed on the</T>
      <T x={256} y={62} size={11}>sloped face</T>
      <Leader from={p(...t(52, 29))} to={[262, 110]} />
      <T x={266} y={106} weight={700} tone={C.accent}>New shape</T>
      <T x={266} y={120} size={11}>sits flat on</T>
      <T x={266} y={134} size={11}>that face</T>
      <Leader from={p(70, 60, 14)} to={[160, 196]} />
      <T x={164} y={200} weight={700}>Wedge</T>
    </g>
  );
});

export const NudgeKeys = defineDiagram("nudge-keys", (r) => (
  <g>
    <Key x={55} y={24} label="↑" />
    <Key x={20} y={54} label="←" />
    <Key x={55} y={54} label="↓" />
    <Key x={90} y={54} label="→" />
    <T x={10} y={112} size={11}><tspan fontWeight={700}>Arrow</tspan> = move 1 mm on X / Y</T>
    <T x={10} y={132} size={11}><tspan fontWeight={700}>Shift + arrow</tspan> = 10 mm</T>
    <T x={10} y={152} size={11}><tspan fontWeight={700}>Ctrl + ↑ / ↓</tspan> = up / down on Z</T>
    <Divider x={208} />
    {/* top view: 1 mm and 10 mm steps (1 mm = 5 px) */}
    <T x={284} y={22} anchor="middle" size={11} tone={C.muted}>top view</T>
    <Grid x={218} y={30} w={132} h={50} step={10} />
    <rect x={272} y={43} width={24} height={24} fill="none" stroke={C.muted} strokeDasharray="3 2" />
    <rect x={227} y={43} width={24} height={24} fill="none" stroke={C.muted} strokeDasharray="3 2" />
    <rect x={222} y={43} width={24} height={24} fill={C.primarySoft} stroke={C.primary} strokeWidth={1.8} />
    <line x1={222} y1={88} x2={227} y2={88} stroke={C.fg} strokeWidth={2} />
    <T x={232} y={92} size={10} weight={700}>1 mm (arrow)</T>
    <Dim from={[222, 104]} to={[272, 104]} r={r} label="" tone="primary" />
    <T x={278} y={108} size={10} weight={700} tone={C.primary}>10 mm (Shift)</T>
    {/* side view: Z */}
    <T x={284} y={124} anchor="middle" size={11} tone={C.muted}>side view</T>
    <line x1={218} y1={200} x2={350} y2={200} stroke={C.muted} strokeWidth={2} />
    <rect x={240} y={176} width={30} height={24} fill="none" stroke={C.muted} strokeDasharray="3 2" />
    <rect x={240} y={140} width={30} height={24} fill={C.primarySoft} stroke={C.primary} strokeWidth={1.8} />
    <Arrow from={[285, 186]} to={[285, 144]} r={r} tone="z" />
    <T x={292} y={160} size={11} weight={700} tone={C.z}>Ctrl + ↑</T>
    <T x={292} y={174} size={11}>raises on Z</T>
  </g>
));

export const MoveZ = defineDiagram("move-z", (r) => {
  const p = iso(140, 100, 1);
  const shadow: [number, number, number][] = [[20, 0, 0], [70, 0, 0], [70, 40, 0], [20, 40, 0]];
  const topC = p(45, 20, 76);
  return (
    <g>
      <IsoGrid p={p} x0={-20} x1={100} y0={-20} y1={70} step={15} />
      <Poly p={p} points={shadow} fill={C.border} stroke={C.muted} dash="4 3" />
      <Arrow from={p(45, 20, 40)} to={p(45, 20, 3)} r={r} tone="primary" dash="4 3" />
      {[[70, 40], [20, 40], [70, 0]].map(([x, y], i) => {
        const a = p(x, y, 40);
        const b = p(x, y, 0);
        return <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={C.muted} strokeDasharray="2 3" />;
      })}
      <IsoBox p={p} x={20} y={0} z={40} w={50} d={40} h={36} />
      {/* cone handle */}
      <path d={`M${topC[0] - 7} ${topC[1] - 8} L${topC[0]} ${topC[1] - 32} L${topC[0] + 7} ${topC[1] - 8} Z`} fill={C.fg} />
      <ellipse cx={topC[0]} cy={topC[1] - 8} rx={7} ry={3} fill={C.fg} />
      <line x1={topC[0]} y1={topC[1]} x2={topC[0]} y2={topC[1] - 8} stroke={C.fg} strokeWidth={1.5} />
      <Arrow from={[topC[0] + 16, topC[1] - 4]} to={[topC[0] + 16, topC[1] - 40]} r={r} tone="z" both />
      <T x={topC[0] + 26} y={topC[1] - 26} weight={700}>Cone handle</T>
      <T x={topC[0] + 26} y={topC[1] - 12} size={11}>drag up or down</T>
      <Dim from={[p(70, 40, 0)[0] + 14, p(70, 40, 0)[1]]} to={[p(70, 40, 40)[0] + 14, p(70, 40, 40)[1]]} r={r} label="lifted" labelSide={1} offset={30} size={11} />
      <Key x={292} y={142} w={30} h={28} label="D" />
      <T x={307} y={190} anchor="middle" size={11}><tspan fontWeight={700}>D</tspan> drops it</T>
      <T x={307} y={204} anchor="middle" size={11}>to the workplane</T>
      <T x={p(100, 70, 0)[0] - 30} y={p(100, 70, 0)[1] + 4} anchor="end" size={11} tone={C.muted}>workplane</T>
    </g>
  );
});

export const ScaleHandles = defineDiagram("scale-handles", (r) => {
  const p = iso(140, 92, 1);
  const handle = (pt: Pt, dark: boolean, key: string) => (
    <rect key={key} x={pt[0] - 4} y={pt[1] - 4} width={8} height={8} fill={dark ? C.fg : C.surface} stroke={C.fg} strokeWidth={1.2} />
  );
  const corner = p(80, 60, 0);
  const side = p(80, 30, 0);
  const top = p(40, 30, 50);
  return (
    <g>
      <IsoBox p={p} w={80} d={60} h={40} />
      <line x1={p(40, 30, 40)[0]} y1={p(40, 30, 40)[1]} x2={top[0]} y2={top[1]} stroke={C.fg} />
      {handle(p(80, 0, 0), true, "c1")}
      {handle(corner, true, "c2")}
      {handle(p(0, 60, 0), true, "c3")}
      {handle(side, false, "s1")}
      {handle(p(40, 60, 0), false, "s2")}
      {handle(top, false, "t")}
      {/* direction arrows */}
      <Arrow from={corner} to={p(100, 60, 0)} r={r} tone="primary" />
      <Arrow from={corner} to={p(80, 80, 0)} r={r} tone="primary" />
      <Arrow from={side} to={p(100, 30, 0)} r={r} tone="accent" />
      <Arrow from={[top[0], top[1] - 6]} to={[top[0], top[1] - 30]} r={r} tone="z" />
      <Leader from={[top[0] + 6, top[1] - 4]} to={[250, 44]} />
      <T x={254} y={40} weight={700}>Top handle</T>
      <T x={254} y={54} size={11}>changes height</T>
      <Leader from={[side[0] + 6, side[1] - 2]} to={[250, 118]} />
      <T x={254} y={114} weight={700}>Side handle</T>
      <T x={254} y={128} size={11}>1 direction</T>
      <Leader from={[corner[0] + 6, corner[1] + 6]} to={[250, 172]} />
      <T x={254} y={168} weight={700}>Corner handle</T>
      <T x={254} y={182} size={11}>2 directions at once</T>
      <Key x={10} y={14} w={42} h={22} label="Shift" size={11} active />
      <T x={58} y={30} size={11}>+ drag = keep proportions</T>
    </g>
  );
});

export const ExactDimension = defineDiagram("exact-dimension", () => {
  const p = iso(118, 100, 1);
  const w0 = p(0, 54, 0);
  const w1 = p(80, 54, 0);
  const d0 = p(94, 0, 0);
  const d1 = p(94, 40, 0);
  const h0 = p(0, 54, 0);
  const wm: Pt = [(w0[0] + w1[0]) / 2, (w0[1] + w1[1]) / 2];
  const dm: Pt = [(d0[0] + d1[0]) / 2, (d0[1] + d1[1]) / 2];
  const line = (a: Pt, b: Pt) => <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={C.muted} strokeWidth={1} />;
  return (
    <g>
      <IsoBox p={p} w={80} d={40} h={30} />
      {line(w0, w1)}
      {line(d0, d1)}
      {line(h0, [h0[0], h0[1] - 30])}
      {/* depth & height: plain numbers */}
      <rect x={dm[0] - 13} y={dm[1] - 9} width={26} height={18} rx={3} fill={C.surface} stroke={C.muted} />
      <T x={dm[0]} y={dm[1] + 4} anchor="middle" size={11}>40</T>
      <rect x={h0[0] - 13} y={h0[1] - 24} width={26} height={18} rx={3} fill={C.surface} stroke={C.muted} />
      <T x={h0[0]} y={h0[1] - 11} anchor="middle" size={11}>30</T>
      {/* width: active input box */}
      <rect x={wm[0] - 26} y={wm[1] - 12} width={52} height={24} rx={4} fill={C.primarySoft} stroke={C.primary} strokeWidth={2.2} />
      <T x={wm[0] - 4} y={wm[1] + 5} anchor="middle" size={13} weight={700}>32.5</T>
      <line x1={wm[0] + 18} y1={wm[1] - 7} x2={wm[0] + 18} y2={wm[1] + 7} stroke={C.fg} strokeWidth={1.5} />
      <Cursor x={wm[0] + 14} y={wm[1] + 8} />
      <g>
        <T x={232} y={50} weight={700}>1  Click a number</T>
        <T x={232} y={78} weight={700}>2  Type the value</T>
        <T x={232} y={106} weight={700}>3  Press Enter</T>
        <rect x={228} y={128} width={120} height={40} rx={6} fill={C.accentSoft} stroke={C.accent} />
        <T x={288} y={145} anchor="middle" size={11} weight={700}>Units: millimetres</T>
        <T x={288} y={160} anchor="middle" size={11}>32.5 = 32.5 mm</T>
      </g>
    </g>
  );
});

export const RotateHandles = defineDiagram("rotate-handles", (r) => {
  const p = iso(110, 108, 1);
  const cz = p(30, 30, 0);
  const cx = p(60, 30, 20);
  const cy = p(30, 60, 20);
  const snaps: ReactNode[] = [];
  const pc: Pt = [290, 168];
  for (let i = 0; i <= 8; i++) {
    const a = (i * 22.5 * Math.PI) / 180;
    const big = i % 4 === 0;
    snaps.push(
      <line
        key={i}
        x1={round(pc[0] + 52 * Math.cos(a))}
        y1={round(pc[1] - 52 * Math.sin(a))}
        x2={round(pc[0] + (big ? 40 : 45) * Math.cos(a))}
        y2={round(pc[1] - (big ? 40 : 45) * Math.sin(a))}
        stroke={C.fg}
        strokeWidth={1.3}
      />,
    );
  }
  const a1 = (22.5 * Math.PI) / 180;
  return (
    <g>
      <IsoBox p={p} w={60} d={60} h={40} />
      <path d={ellipseArc(cz[0], cz[1], 78, 45, 0, 160, 20)} fill="none" stroke={C.z} strokeWidth={3} markerEnd={r.arrow("z")} />
      <path d={ellipseArc(cx[0], cx[1], 34, 20, 120, 200, 20)} fill="none" stroke={C.x} strokeWidth={3} markerEnd={r.arrow("x")} />
      <path d={ellipseArc(cy[0], cy[1], 34, 20, 60, 160, -20)} fill="none" stroke={C.y} strokeWidth={3} markerEnd={r.arrow("y")} />
      <T x={110} y={212} anchor="middle" size={11}><tspan fontWeight={700} fill={C.z}>Z</tspan> spins it flat</T>
      <T x={196} y={110} size={11}><tspan fontWeight={700} fill={C.x}>X</tspan> tips it</T>
      <T x={196} y={124} size={11}>side to side</T>
      <T x={6} y={50} size={11}><tspan fontWeight={700} fill={C.y}>Y</tspan> tips it</T>
      <T x={6} y={64} size={11}>front to back</T>
      <Divider x={226} />
      <Caption x={290} y={30}>Snap steps</Caption>
      <T x={290} y={46} anchor="middle" size={11}>drag near the arrow</T>
      <path d={`M${pc[0] - 52} ${pc[1]} A52 52 0 0 1 ${pc[0] + 52} ${pc[1]}`} fill="none" stroke={C.muted} />
      <path d={`M${pc[0]} ${pc[1]} L${pc[0] + 52} ${pc[1]} A52 52 0 0 0 ${round(pc[0] + 52 * Math.cos(a1))} ${round(pc[1] - 52 * Math.sin(a1))} Z`} fill={C.primarySoft} stroke={C.primary} />
      {snaps}
      <T x={pc[0] + 58} y={pc[1] + 16} anchor="end" size={11} weight={700} tone={C.primary}>22.5° each</T>
      <T x={290} y={196} anchor="middle" size={11}>8 snaps = 180°</T>
    </g>
  );
});

export const RulerTool = defineDiagram("ruler-tool", (r) => {
  const o: Pt = [56, 178];
  const ticks: ReactNode[] = [];
  for (let i = 0; i <= 26; i++) ticks.push(<line key={`x${i}`} x1={o[0] + i * 10} y1={o[1]} x2={o[0] + i * 10} y2={o[1] + (i % 5 === 0 ? 8 : 4)} />);
  for (let i = 0; i <= 14; i++) ticks.push(<line key={`y${i}`} x1={o[0]} y1={o[1] - i * 10} x2={o[0] - (i % 5 === 0 ? 8 : 4)} y2={o[1] - i * 10} />);
  return (
    <g>
      <Grid x={56} y={38} w={290} h={140} step={10} />
      {/* ruler L */}
      <path d={`M${o[0]} ${o[1]} L${o[0] + 266} ${o[1]} M${o[0]} ${o[1]} L${o[0]} ${o[1] - 146}`} stroke={C.fg} strokeWidth={2} />
      <g stroke={C.fg} strokeWidth={1}>{ticks}</g>
      <circle cx={o[0]} cy={o[1]} r={5} fill={C.accent} stroke={C.fg} />
      <T x={o[0] - 4} y={o[1] + 22} anchor="middle" size={11} weight={700} tone={C.accent}>ruler at corner</T>
      {/* old position (ghost) and shape */}
      <rect x={106} y={88} width={100} height={60} fill="none" stroke={C.muted} strokeDasharray="4 3" />
      <rect x={136} y={88} width={100} height={60} fill={C.primarySoft} stroke={C.primary} strokeWidth={1.8} />
      <Arrow from={[150, 118]} to={[176, 118]} r={r} tone="primary" />
      <Dim from={[o[0], 162]} to={[136, 162]} r={r} label="" />
      <rect x={76} y={150} width={40} height={22} rx={4} fill={C.primarySoft} stroke={C.primary} strokeWidth={2} />
      <T x={92} y={166} anchor="middle" size={12} weight={700}>40</T>
      <line x1={106} y1={155} x2={106} y2={167} stroke={C.fg} strokeWidth={1.4} />
      <Dim from={[136, 76]} to={[236, 76]} r={r} label="50 mm wide" offset={8} labelSide={-1} />
      <Dim from={[252, o[1]]} to={[252, 148]} r={r} label="15" offset={14} labelSide={-1} />
      <T x={262} y={112} size={11} weight={700}>Type a distance →</T>
      <T x={262} y={126} size={11}>the shape moves</T>
      <T x={262} y={140} size={11}>exactly there</T>
      <T x={10} y={24} size={11} tone={C.muted}>Distances are measured from the ruler’s corner (mm)</T>
    </g>
  );
});
