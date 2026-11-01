/** Diagrams: the Puzzle Cube project path (six solid pieces that fill a 3 × 3 × 3 cube). */
import { Arrow, C, Caption, Dim, Divider, IsoBox, T, Verdict, defineDiagram, iso } from "./primitives";

/** The sample puzzle, layer by layer (rows listed back to front). Same letters as the puzzle-cube-exploded model. */
const LAYERS: { name: string; rows: string[] }[] = [
  { name: "Bottom layer", rows: ["CFF", "AAF", "AAA"] },
  { name: "Middle layer", rows: ["CCF", "CCE", "BBB"] },
  { name: "Top layer", rows: ["DDD", "BDE", "BEE"] },
];
/** Each piece gets a colour AND a letter, so the map never depends on colour alone. */
const PIECE_FILL: Record<string, string> = {
  A: C.primary,
  B: C.accent,
  C: C.success,
  D: C.danger,
  E: C.z,
  F: C.muted,
};

export const PuzzleLayerMap = defineDiagram("puzzle-layer-map", (r) => {
  const s = 30;
  return (
    <g>
      {LAYERS.map((layer, li) => {
        const x0 = 22 + li * 116;
        const y0 = 46;
        return (
          <g key={layer.name}>
            <Caption x={x0 + (3 * s) / 2} y={30}>{layer.name}</Caption>
            {layer.rows.map((row, ri) =>
              row.split("").map((letter, ci) => (
                <g key={`${ri}-${ci}`}>
                  <rect x={x0 + ci * s} y={y0 + ri * s} width={s} height={s} fill={PIECE_FILL[letter]} fillOpacity={0.28} stroke={C.fg} strokeWidth={1.2} />
                  <T x={x0 + ci * s + s / 2} y={y0 + ri * s + s / 2 + 5} anchor="middle" size={14} weight={800}>{letter}</T>
                </g>
              )),
            )}
            {li < 2 && <Arrow from={[x0 + 3 * s + 4, y0 + 45]} to={[x0 + 3 * s + 22, y0 + 45]} r={r} tone="muted" />}
          </g>
        );
      })}
      <T x={180} y={164} anchor="middle" size={12}>Same letter = same piece. Count each letter across all three layers.</T>
      <T x={180} y={184} anchor="middle" size={11} tone={C.muted}>A, B, C: 5 cubes each · D, E, F: 4 cubes each</T>
      <T x={180} y={204} anchor="middle" size={12} weight={700}>5 + 5 + 5 + 4 + 4 + 4 = 27 cubes = one 3 × 3 × 3 cube</T>
    </g>
  );
});

export const FaceVsEdge = defineDiagram("face-vs-edge", () => {
  const s = 44;
  return (
    <g>
      <Caption x={90} y={28}>Shares a whole face</Caption>
      <rect x={46} y={66} width={s} height={s} fill={C.primarySoft} stroke={C.fg} strokeWidth={1.4} />
      <rect x={46 + s} y={66} width={s} height={s} fill={C.primarySoft} stroke={C.fg} strokeWidth={1.4} />
      <line x1={46 + s} y1={66} x2={46 + s} y2={66 + s} stroke={C.success} strokeWidth={4} />
      <T x={90} y={140} anchor="middle" size={11} tone={C.muted}>top view</T>
      <Verdict x={90} y={174} ok>Strong: one solid piece</Verdict>
      <Divider x={180} />
      <Caption x={270} y={28}>Touches on an edge only</Caption>
      <rect x={226} y={88} width={s} height={s} fill={C.primarySoft} stroke={C.fg} strokeWidth={1.4} />
      <rect x={226 + s} y={88 - s} width={s} height={s} fill={C.primarySoft} stroke={C.fg} strokeWidth={1.4} />
      <circle cx={226 + s} cy={88} r={6} fill="none" stroke={C.danger} strokeWidth={2.4} />
      <T x={270} y={150} anchor="middle" size={11} tone={C.muted}>top view: no plastic joins them</T>
      <Verdict x={270} y={174} ok={false}>Snaps apart</Verdict>
      <T x={180} y={206} anchor="middle" size={11}>Cubes in a piece must share a whole face.</T>
    </g>
  );
});

export const ToleranceStack = defineDiagram("tolerance-stack", (r) => {
  const p = iso(40, 80, 0.8);
  const w = 34;
  return (
    <g>
      <Caption x={180} y={22}>Small errors add up</Caption>
      {[0, 1, 2].map((i) => (
        <IsoBox key={i} p={p} x={i * w} y={0} z={0} w={w} d={w} h={w} fill={{ top: C.primarySoft }} />
      ))}
      <T x={98} y={160} anchor="middle" size={11}>each printed piece: 15.1 mm</T>
      <T x={98} y={178} anchor="middle" size={12} weight={700}>15.1 + 15.1 + 15.1 = 45.3 mm</T>
      <Divider x={196} y0={34} y1={186} />
      <T x={278} y={52} anchor="middle" size={11} weight={700}>Box opening 45.0 mm</T>
      <Dim from={[232, 70]} to={[324, 70]} r={r} tone="danger" label="" offset={0} />
      <Verdict x={278} y={92} ok={false}>Jams: 0.3 mm too big</Verdict>
      <T x={278} y={128} anchor="middle" size={11} weight={700}>Box opening 46.1 mm</T>
      <Dim from={[228, 146]} to={[328, 146]} r={r} tone="success" label="" offset={0} />
      <Verdict x={278} y={168} ok>Slides in and out</Verdict>
      <T x={180} y={204} anchor="middle" size={11}>Measure the real assembled cube, then add clearance on each side.</T>
    </g>
  );
});
