/** Diagrams: the design process. */
import type { ReactNode } from "react";
import { Arrow, C, Caption, T, Verdict, defineDiagram, ellipseArc, pts } from "./primitives";

function Badge({ x, y, n }: { x: number; y: number; n: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={9} fill={C.danger} stroke={C.fg} strokeWidth={1} />
      <T x={x} y={y + 4} anchor="middle" size={11} weight={800} tone={C.surface}>{n}</T>
    </g>
  );
}

export const PhoneStandSymptoms = defineDiagram("phone-stand-symptoms", (r) => {
  const symptoms = ["Falls backward", "Slot too narrow", "Needs support", "Weak at a layer line", "Too much material"];
  return (
    <g>
      <T x={10} y={24} size={12} weight={800} tone={C.danger}>PATIENT: phone stand</T>
      <T x={10} y={40} size={10} tone={C.muted}>side view · 5 symptoms</T>
      {symptoms.map((s, i) => (
        <g key={s}>
          <Badge x={20} y={66 + i * 28} n={i + 1} />
          <T x={34} y={70 + i * 28} size={11} weight={600}>{s}</T>
        </g>
      ))}
      {/* base: thick solid block */}
      <rect x={150} y={164} width={130} height={22} fill={r.layers} stroke={C.primary} strokeWidth={1.4} />
      {/* front lip and slot ridge */}
      <rect x={156} y={146} width={9} height={18} fill={r.layers} stroke={C.primary} strokeWidth={1.4} />
      <rect x={176} y={152} width={8} height={12} fill={r.layers} stroke={C.primary} strokeWidth={1.4} />
      {/* backrest leaning back, with a flat ledge at the top */}
      <polygon points={pts([[252, 164], [262, 164], [314, 62], [304, 58]])} fill={r.layers} stroke={C.primary} strokeWidth={1.4} />
      <rect x={306} y={56} width={44} height={8} fill={r.layers} stroke={C.primary} strokeWidth={1.4} />
      {/* phone (dashed) */}
      <rect x={168} y={140} width={134} height={10} rx={3} fill="none" stroke={C.muted} strokeWidth={1.4} strokeDasharray="5 3" transform="rotate(-28 168 150)" />
      <T x={210} y={110} size={10} tone={C.muted} transform="rotate(-28 210 110)">phone</T>
      {/* symptom markers */}
      <path d="M300 196 q20 -4 26 -24" fill="none" stroke={C.danger} strokeWidth={1.6} markerEnd={r.arrow("danger")} />
      <Badge x={296} y={204} n={1} />
      <Badge x={170} y={136} n={2} />
      <path d="M312 68 q4 8 8 0 M326 68 q4 9 8 0" fill="none" stroke={C.danger} strokeWidth={1.5} />
      <Badge x={340} y={82} n={3} />
      <path d="M249 150 l5 -3 l4 3 l4 -3 l4 3" fill="none" stroke={C.danger} strokeWidth={2} />
      <Badge x={240} y={138} n={4} />
      <Badge x={215} y={175} n={5} />
    </g>
  );
});

export const DesignCycle = defineDiagram("design-cycle", (r) => {
  const steps = ["Understand", "Define", "Ideate", "Prototype", "Test", "Revise"];
  const cx = 180;
  const cy = 112;
  const rx = 128;
  const ry = 78;
  const ang = [-90, -30, 30, 90, 150, 210];
  const pos = ang.map((a) => [cx + rx * Math.cos((a * Math.PI) / 180), cy + ry * Math.sin((a * Math.PI) / 180)] as const);
  const arcs: ReactNode[] = ang.map((a, i) => {
    const last = i === ang.length - 1;
    return (
      <path
        key={a}
        d={ellipseArc(cx, cy, rx, ry, 0, a + 22, a + 60 - 22, 12)}
        fill="none"
        stroke={last ? C.accent : C.primary}
        strokeWidth={2}
        markerEnd={r.arrow(last ? "accent" : "primary")}
      />
    );
  });
  return (
    <g>
      {arcs}
      {steps.map((s, i) => (
        <g key={s}>
          <rect x={pos[i][0] - 46} y={pos[i][1] - 13} width={92} height={26} rx={13} fill={C.primarySoft} stroke={C.primary} strokeWidth={1.5} />
          <T x={pos[i][0]} y={pos[i][1] + 4} anchor="middle" size={12} weight={700}>{`${i + 1} ${s}`}</T>
        </g>
      ))}
      <Caption x={cx} y={cy - 4} size={14}>Design cycle</Caption>
      <T x={cx} y={cy + 13} anchor="middle" size={11}>loop back and improve</T>
      <T x={62} y={46} anchor="middle" size={10} weight={700} tone={C.accent}>back to the start</T>
    </g>
  );
});

export const FollowToDesign = defineDiagram("follow-to-design", (r) => {
  const steps: [string, string][] = [
    ["Follow", "copy the steps"],
    ["Modify", "change a part"],
    ["Combine", "mix ideas"],
    ["Solve", "fix a problem"],
    ["Design", "your own idea"],
  ];
  return (
    <g>
      {steps.map(([name, note], i) => {
        const x = 12 + i * 68;
        const top = 168 - i * 30;
        return (
          <g key={name}>
            <rect x={x} y={top} width={66} height={196 - top} fill={i === 4 ? C.accentSoft : C.primarySoft} stroke={i === 4 ? C.accent : C.primary} strokeWidth={1.4} />
            <T x={x + 33} y={top + 17} anchor="middle" size={14} weight={800} tone={i === 4 ? C.accent : C.primary}>{i + 1}</T>
            <T x={x + 33} y={top - 20} anchor="middle" size={12} weight={700}>{name}</T>
            <T x={x + 33} y={top - 7} anchor="middle" size={9.5}>{note}</T>
          </g>
        );
      })}
      <Arrow from={[20, 112]} to={[180, 42]} r={r} tone="accent" width={2} />
      <T x={34} y={97} size={11} weight={700} tone={C.accent} transform="rotate(-23.6 34 97)">more of your own thinking</T>
      <line x1={8} y1={196} x2={352} y2={196} stroke={C.muted} strokeWidth={1.4} />
    </g>
  );
});

function RulerIcon({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y} width={16} height={8} rx={1} fill={C.primarySoft} stroke={C.primary} />
      <path d={`M${x + 4} ${y} v3 M${x + 8} ${y} v4 M${x + 12} ${y} v3`} stroke={C.primary} />
    </g>
  );
}

function Star({ x, y }: { x: number; y: number }) {
  const p: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 === 0 ? 7 : 3;
    p.push([x + 8 + rr * Math.cos(a), y + 4 + rr * Math.sin(a)]);
  }
  return <polygon points={pts(p)} fill={C.accentSoft} stroke={C.accent} />;
}

export const ConstraintVsWish = defineDiagram("constraint-vs-wish", () => {
  const musts = ["Holds a phone 8–11 mm thick", "Fits a 120 × 120 mm plate", "Prints in under 2 hours", "Uses less than 40 g"];
  const wishes = ["Looks cool", "Matches my desk", "Has a cable slot", "Folds flat"];
  return (
    <g>
      <rect x={10} y={14} width={198} height={192} rx={10} fill={C.primarySoft} fillOpacity={0.5} stroke={C.primary} strokeWidth={1.5} />
      <T x={22} y={38} size={14} weight={800} tone={C.primary}>Constraints</T>
      <T x={22} y={54} size={11} weight={700}>MUST · measurable</T>
      {musts.map((m, i) => (
        <g key={m}>
          <RulerIcon x={22} y={72 + i * 26} />
          <T x={44} y={80 + i * 26} size={11}>{m}</T>
        </g>
      ))}
      <Verdict x={22} y={194} ok anchor="start" size={11}>can you measure it? yes</Verdict>
      <rect x={216} y={14} width={134} height={192} rx={10} fill={C.accentSoft} fillOpacity={0.5} stroke={C.accent} strokeWidth={1.5} strokeDasharray="6 3" />
      <T x={228} y={38} size={14} weight={800} tone={C.accent}>Wishes</T>
      <T x={228} y={54} size={11} weight={700}>nice to have</T>
      {wishes.map((m, i) => (
        <g key={m}>
          <Star x={226} y={72 + i * 26} />
          <T x={248} y={80 + i * 26} size={11}>{m}</T>
        </g>
      ))}
      <T x={228} y={186} size={10} tone={C.muted}>hard to measure;</T>
      <T x={228} y={199} size={10} tone={C.muted}>OK to skip if needed</T>
    </g>
  );
});

export const SketchConcepts = defineDiagram("sketch-concepts", () => {
  const sk = { fill: "none", stroke: C.fg, strokeWidth: 1.6 } as const;
  const frame = (x: number, label: string, chosen: boolean, body: ReactNode) => (
    <g>
      <rect x={x} y={44} width={104} height={118} rx={4} fill={chosen ? C.primarySoft : C.surface} stroke={chosen ? C.primary : C.border} strokeWidth={chosen ? 2.4 : 1.2} />
      <g transform={`translate(${x} 44)`}>{body}</g>
      <T x={x + 52} y={180} anchor="middle" size={11} weight={700}>{label}</T>
    </g>
  );
  return (
    <g>
      <T x={180} y={22} anchor="middle" size={12} weight={700}>Same problem: hold a phone up on a desk</T>
      <T x={180} y={36} anchor="middle" size={10} tone={C.muted}>quick, rough sketches — different ideas, not tiny changes</T>
      {frame(
        14,
        "A: wedge",
        false,
        <g {...sk}>
          <path d="M14 96 L90 96 L90 40 Z M15 95 L89 97" />
          <path d="M46 70 L70 26" strokeDasharray="4 3" />
        </g>,
      )}
      {frame(
        128,
        "B: easel + lip",
        true,
        <g {...sk}>
          <path d="M20 98 L52 24 L84 98 M52 24 L53 26" />
          <path d="M28 82 L44 82 L44 74" />
          <path d="M36 80 L60 22" strokeDasharray="4 3" />
        </g>,
      )}
      {frame(
        242,
        "C: slotted block",
        false,
        <g {...sk}>
          <path d="M12 96 L92 96 L92 70 L12 70 Z M13 71 L91 69" />
          <path d="M46 70 L46 82 L56 82 L56 70" />
          <path d="M51 80 L51 22" strokeDasharray="4 3" />
        </g>,
      )}
      <Verdict x={180} y={204} ok size={11}>compare, then choose one to prototype</Verdict>
    </g>
  );
});
