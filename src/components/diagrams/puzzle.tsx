/** Diagrams: the Puzzle Cube project path (six solid pieces that fill a 3 × 3 × 3 cube). */
import { Arrow, C, Caption, Dim, Divider, IsoBox, Poly, T, Verdict, defineDiagram, iso } from "./primitives";

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

export const PuzzleChamfer = defineDiagram("puzzle-chamfer", (r) => {
  const s = 44;
  const plate = 176;
  return (
    <g>
      <Caption x={90} y={22}>Hangs over air</Caption>
      <rect x={24} y={plate - s} width={s} height={s} fill={C.primarySoft} stroke={C.fg} strokeWidth={1.3} />
      <rect x={24} y={plate - 2 * s} width={s} height={s} fill={C.primarySoft} stroke={C.fg} strokeWidth={1.3} />
      <rect x={24 + s} y={plate - 2 * s} width={s} height={s} fill={C.primarySoft} stroke={C.fg} strokeWidth={1.3} />
      <line x1={24 + s} y1={plate - s} x2={24 + 2 * s} y2={plate - s} stroke={C.danger} strokeWidth={3} />
      <T x={24 + 1.5 * s} y={plate - s + 18} anchor="middle" size={11} tone={C.danger}>air</T>
      <line x1={10} y1={plate} x2={170} y2={plate} stroke={C.fg} strokeWidth={2} />
      <Verdict x={90} y={204} ok={false}>Needs supports</Verdict>
      <Divider x={180} />
      <Caption x={270} y={22}>45° chamfer</Caption>
      <rect x={204} y={plate - s} width={s} height={s} fill={C.primarySoft} stroke={C.fg} strokeWidth={1.3} />
      <rect x={204} y={plate - 2 * s} width={s} height={s} fill={C.primarySoft} stroke={C.fg} strokeWidth={1.3} />
      <polygon points={`${204 + s},${plate - s} ${204 + 2 * s},${plate - 2 * s} ${204 + s},${plate - 2 * s}`} fill={C.primarySoft} stroke={C.fg} strokeWidth={1.3} />
      <polygon points={`${204 + s},${plate - s} ${204 + 2 * s},${plate - s} ${204 + 2 * s},${plate - 2 * s}`} fill={r.hatch} stroke={C.muted} strokeWidth={1} strokeDasharray="3 2" />
      <T x={204 + 2 * s + 6} y={plate - s - 6} size={11} tone={C.muted}>cut away</T>
      <T x={204 + s + 10} y={plate - s - 26} size={11} weight={700} tone={C.success}>45°</T>
      <line x1={190} y1={plate} x2={350} y2={plate} stroke={C.fg} strokeWidth={2} />
      <Verdict x={270} y={204} ok>Prints on its own</Verdict>
    </g>
  );
});

/** Isometric dot paper: drawing one cube in three steps. */
export const IsoSketch = defineDiagram("iso-sketch", () => {
  const u = 30;
  const steps = ["1 · Top", "2 · Down", "3 · Bottom"];
  return (
    <g>
      {steps.map((label, k) => {
        const ox = 60 + k * 120;
        const oy = 92;
        const p = iso(ox, oy, u);
        const dots: [number, number][] = [];
        const seen = new Set<string>();
        for (let a = -2; a <= 3; a++)
          for (let b = -2; b <= 3; b++)
            for (let c = 0; c <= 2; c++) {
              const [x, y] = p(a, b, c);
              const key = `${Math.round(x)}|${Math.round(y)}`;
              if (seen.has(key) || x < ox - 54 || x > ox + 54 || y < 34 || y > 168) continue;
              seen.add(key);
              dots.push([x, y]);
            }
        const top: [number, number, number][] = [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]];
        return (
          <g key={label}>
            {k > 0 && <Divider x={ox - 60} y0={30} y1={176} />}
            <Caption x={ox} y={24}>{label}</Caption>
            {dots.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={1.4} fill={C.muted} />)}
            {k === 2 && (
              <>
                <Poly p={p} points={[[1, 0, 1], [1, 1, 1], [1, 1, 0], [1, 0, 0]]} fill={C.border} stroke="none" />
                <Poly p={p} points={[[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]]} fill={C.surface} stroke="none" />
              </>
            )}
            <Poly p={p} points={top} fill={k === 2 ? C.primarySoft : "none"} stroke={k === 0 ? C.primary : C.fg} sw={k === 0 ? 2.4 : 1.6} />
            {k >= 1 && [[1, 0], [1, 1], [0, 1]].map(([a, b]) => {
              const [x1, y1] = p(a, b, 1);
              const [x2, y2] = p(a, b, 0);
              return <line key={`${a}${b}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={k === 1 ? C.primary : C.fg} strokeWidth={k === 1 ? 2.4 : 1.6} />;
            })}
            {k === 2 && [[[1, 0, 0], [1, 1, 0]], [[1, 1, 0], [0, 1, 0]]].map(([a, b], i) => {
              const [x1, y1] = p(a[0], a[1], a[2]);
              const [x2, y2] = p(b[0], b[1], b[2]);
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.primary} strokeWidth={2.4} />;
            })}
          </g>
        );
      })}
      <T x={180} y={196} anchor="middle" size={12} weight={700}>Lines only go 3 ways: straight up and down, and two slants.</T>
      <T x={180} y={212} anchor="middle" size={11} tone={C.muted}>Join dots. Add the next cube by sharing an edge you already drew.</T>
    </g>
  );
});

/** Two L pieces: one lying flat, one standing on its end. Same shape, turned. */
export const SameShapeTurned = defineDiagram("same-shape-turned", () => {
  const u = 26;
  const fill = { top: C.primarySoft, left: C.surface, right: C.border };
  const a = iso(62, 112, u);
  const b = iso(258, 128, u);
  // A: cubes at x = 0..2 on y = 0, plus (2, 1), all on the table
  const A: [number, number, number][] = [[0, 0, 0], [1, 0, 0], [2, 0, 0], [2, 1, 0]];
  // B: the same L tipped up: a column of three (z = 0..2) with one cube beside the bottom
  const B: [number, number, number][] = [[1, 0, 0], [0, 0, 0], [0, 0, 1], [0, 0, 2]];
  const draw = (p: ReturnType<typeof iso>, cubes: [number, number, number][]) =>
    [...cubes].sort((m, n) => m[2] - n[2] || m[0] + m[1] - (n[0] + n[1])).map(([x, y, z], i) => <IsoBox key={i} p={p} x={x} y={y} z={z} w={1} d={1} h={1} fill={fill} sw={1.4} />);
  return (
    <g>
      <Caption x={90} y={22}>Piece A</Caption>
      {draw(a, A)}
      <T x={90} y={204} anchor="middle" size={11} tone={C.muted}>4 cubes, lying flat</T>
      <Divider x={180} />
      <Caption x={270} y={22}>Piece B</Caption>
      {draw(b, B)}
      <T x={270} y={204} anchor="middle" size={11} tone={C.muted}>4 cubes, standing up</T>
    </g>
  );
});

/** Every shape made of 4 squares joined edge to edge (turned and flipped copies count as the same). Drawn in our own style. */
const TETROMINOES: { name: string; cells: [number, number][]; tone: string }[] = [
  { name: "I", cells: [[0, 0], [0, 1], [0, 2], [0, 3]], tone: C.primary },
  { name: "O", cells: [[0, 0], [1, 0], [0, 1], [1, 1]], tone: C.accent },
  { name: "T", cells: [[0, 0], [1, 0], [2, 0], [1, 1]], tone: C.success },
  { name: "S", cells: [[1, 0], [2, 0], [0, 1], [1, 1]], tone: C.danger },
  { name: "L", cells: [[0, 0], [0, 1], [0, 2], [1, 2]], tone: C.muted },
];
function Squares({ x, y, s, cells, tone, label }: { x: number; y: number; s: number; cells: [number, number][]; tone: string; label?: string }) {
  return (
    <g>
      {cells.map(([cx, cy], i) => <rect key={i} x={x + cx * s} y={y + cy * s} width={s} height={s} fill={tone} fillOpacity={0.28} stroke={C.fg} strokeWidth={1.3} />)}
      {label && cells.map(([cx, cy], i) => <T key={`t${i}`} x={x + cx * s + s / 2} y={y + cy * s + s / 2 + 4} anchor="middle" size={11} weight={800}>{label}</T>)}
    </g>
  );
}

export const TetrominoSet = defineDiagram("tetromino-set", () => {
  const s = 22;
  const xs = [30, 76, 136, 222, 300];
  return (
    <g>
      <Caption x={180} y={24}>Every shape made of 4 squares</Caption>
      {TETROMINOES.map((t, i) => <Squares key={t.name} x={xs[i]} y={52} s={s} cells={t.cells} tone={t.tone} label={t.name} />)}
      <T x={180} y={170} anchor="middle" size={12}>Only 5 shapes, if turned and flipped copies count as the same.</T>
      <T x={180} y={190} anchor="middle" size={11} tone={C.muted}>Games use 7: you can&apos;t flip pieces there,</T>
      <T x={180} y={205} anchor="middle" size={11} tone={C.muted}>so the mirror S and L count twice.</T>
    </g>
  );
});

export const FillSquare = defineDiagram("fill-square", () => {
  const s = 34;
  const x0 = 112;
  const y0 = 36;
  // I, O, L, L fill a 4 × 4 square (rows top to bottom: I L L L / I L O O / I L O O / I L L L)
  const groups: Record<string, [number, number][]> = {
    I: [[0, 0], [0, 1], [0, 2], [0, 3]],
    L1: [[1, 0], [2, 0], [3, 0], [1, 1]],
    O: [[2, 1], [3, 1], [2, 2], [3, 2]],
    L2: [[1, 2], [1, 3], [2, 3], [3, 3]],
  };
  const tone: Record<string, string> = { I: C.primary, O: C.accent, L1: C.danger, L2: C.success };
  return (
    <g>
      <Caption x={180} y={22}>One answer: I, O, L and L</Caption>
      {Object.entries(groups).map(([k, cells]) => <Squares key={k} x={x0} y={y0} s={s} cells={cells} tone={tone[k]} label={k[0]} />)}
      <rect x={x0} y={y0} width={4 * s} height={4 * s} fill="none" stroke={C.fg} strokeWidth={2.4} />
      <T x={180} y={200} anchor="middle" size={11} tone={C.muted}>16 squares, 4 pieces of 4. No gaps, no overlaps.</T>
    </g>
  );
});

export const FlatVsUp = defineDiagram("flat-vs-up", () => {
  const u = 24;
  const fill = { top: C.primarySoft, left: C.surface, right: C.border };
  const flat = iso(70, 118, u);
  const up = iso(250, 128, u);
  const flatCells: [number, number, number][] = [[0, 0, 0], [1, 0, 0], [2, 0, 0], [2, 1, 0]];
  const upCells: [number, number, number][] = [[0, 0, 0], [1, 0, 0], [2, 0, 0], [0, 0, 1]];
  const draw = (p: ReturnType<typeof iso>, cubes: [number, number, number][]) =>
    [...cubes].sort((m, n) => m[2] - n[2] || m[0] + m[1] - (n[0] + n[1])).map(([x, y, z], i) => <IsoBox key={i} p={p} x={x} y={y} z={z} w={1} d={1} h={1} fill={fill} sw={1.4} />);
  return (
    <g>
      <Caption x={90} y={22}>Like the game: flat</Caption>
      {draw(flat, flatCells)}
      <T x={90} y={196} anchor="middle" size={11} tone={C.muted}>every cube on the table</T>
      <Divider x={180} />
      <Caption x={270} y={22}>Only in 3D: bends up</Caption>
      {draw(up, upCells)}
      <T x={270} y={196} anchor="middle" size={11} tone={C.muted}>one cube climbs a layer</T>
    </g>
  );
});
