import type { BlockOf } from "@/content/schema";

/**
 * Live pictures for slider blocks. Each scene only draws the physics of the current value — never the answer —
 * so the student explores, notices, then checks.
 */
type Scene = BlockOf<"slider">["scene"];

const W = 480;
const H = 240;

export function SliderScene({ scene, value }: { scene: Scene; value: number }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full max-h-72 rounded-2xl border border-border bg-surface-2/50" role="img" aria-label={describe(scene, value)}>
      {scene === "overhang" && <Overhang angle={value} />}
      {scene === "clearance" && <Clearance hole={value} />}
      {scene === "scale" && <Scale pct={value} />}
      {scene === "layers" && <Layers h={value} />}
      {scene === "infill" && <Infill pct={value} />}
    </svg>
  );
}

/** Short readout under the slider (also used for screen readers). */
export function readout(scene: Scene, v: number): string {
  switch (scene) {
    case "overhang": {
      const rest = restingPct(v);
      return `${v}° from vertical · each new layer rests ${rest}% on the one below`;
    }
    case "clearance": return `Hole: ${v.toFixed(2)} mm · peg: 10.00 mm`;
    case "scale": return `Scale: ${v}%`;
    case "layers": return `Layer height: ${v.toFixed(2)} mm`;
    case "infill": return `Infill: ${v}% · about ${infillGrams(v).toFixed(1)} g · ${infillMinutes(v)} min`;
  }
}

function describe(scene: Scene, v: number) {
  return `Live picture. ${readout(scene, v)}`;
}

// ── overhang: 0.2 mm layers, 0.4 mm lines ──
function restingPct(angle: number) {
  const over = 0.2 * Math.tan((angle * Math.PI) / 180); // mm each layer steps out
  return Math.max(0, Math.round((1 - over / 0.4) * 100));
}
function Overhang({ angle }: { angle: number }) {
  const n = 9;
  const lh = 18; // px per layer
  const lw = 24; // px per line width (0.4 mm)
  const step = 0.2 * Math.tan((angle * Math.PI) / 180) * (lw / 0.4); // px each layer steps out
  const x0 = 90;
  const base = H - 30;
  return (
    <g>
      <rect x={0} y={base} width={W} height={30} fill="var(--border)" />
      {Array.from({ length: n }, (_, i) => {
        const x = x0 + i * step;
        const y = base - (i + 1) * lh;
        const prevX = x0 + (i - 1) * step;
        const over = i === 0 ? 0 : Math.max(0, Math.min(lw, x - prevX));
        return (
          <g key={i}>
            <rect x={x} y={y} width={lw} height={lh - 2} rx={6} fill="var(--primary)" opacity={0.85} />
            {over > 0 && <rect x={x + lw - over} y={y} width={over} height={lh - 2} rx={6} fill="var(--accent)" />}
          </g>
        );
      })}
      <line x1={x0} y1={base} x2={x0} y2={base - n * lh - 10} stroke="var(--muted)" strokeDasharray="4 4" />
      <text x={x0 - 8} y={base - n * lh - 14} textAnchor="end" fontSize="13" fill="var(--muted)">vertical</text>
      <g fontSize="13" fill="var(--fg)">
        <rect x={90} y={219} width={12} height={12} rx={3} fill="var(--accent)" />
        <text x={108} y={230}>hangs over air</text>
        <rect x={230} y={219} width={12} height={12} rx={3} fill="var(--primary)" />
        <text x={248} y={230}>held up by the layer below</text>
      </g>
    </g>
  );
}

// ── clearance: top view, gap exaggerated so tenths of a mm are visible ──
function Clearance({ hole }: { hole: number }) {
  const cx = 170;
  const cy = H / 2;
  const peg = 70; // px radius for 10 mm
  const gapPx = ((hole - 10) / 2) * 160; // exaggerated
  return (
    <g>
      <rect x={60} y={20} width={220} height={200} rx={16} fill="var(--border)" />
      <circle cx={cx} cy={cy} r={peg + gapPx} fill="var(--bg)" />
      <circle cx={cx} cy={cy} r={peg} fill="var(--primary)" opacity={0.9} />
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--primary-fg)">peg 10 mm</text>
      {gapPx > 2 && (
        <g stroke="var(--accent)" strokeWidth={2}>
          <line x1={cx + peg} y1={cy} x2={cx + peg + gapPx} y2={cy} />
          <line x1={cx - peg} y1={cy} x2={cx - peg - gapPx} y2={cy} />
        </g>
      )}
      <g fontSize="14" fill="var(--fg)">
        <text x={310} y={90}>Gaps are drawn</text>
        <text x={310} y={110}>much bigger than</text>
        <text x={310} y={130}>real life so you</text>
        <text x={310} y={150}>can see them.</text>
      </g>
    </g>
  );
}

// ── scale: a 20 mm cube against a ruler ──
function Scale({ pct }: { pct: number }) {
  const mm = 6; // px per mm
  const x0 = 40;
  const size = 20 * (pct / 100) * mm;
  const base = H - 50;
  return (
    <g>
      <rect x={x0} y={base - Math.min(size, 170)} width={size} height={Math.min(size, 170)} rx={4} fill="var(--primary)" opacity={0.85} />
      <line x1={x0} y1={base + 8} x2={x0 + 66 * mm} y2={base + 8} stroke="var(--fg)" strokeWidth={2} />
      {Array.from({ length: 67 }, (_, i) => (
        <g key={i}>
          <line x1={x0 + i * mm} y1={base + 8} x2={x0 + i * mm} y2={base + (i % 10 === 0 ? 22 : i % 5 === 0 ? 17 : 13)} stroke="var(--fg)" />
          {i % 10 === 0 && <text x={x0 + i * mm} y={base + 38} fontSize="13" textAnchor="middle" fill="var(--fg)">{i}</text>}
        </g>
      ))}
      <text x={x0 + 66 * mm} y={base + 38} fontSize="13" textAnchor="end" fill="var(--muted)">mm</text>
    </g>
  );
}

// ── layers: a 20 mm tall dome, sliced ──
function Layers({ h }: { h: number }) {
  const R = 20;
  const px = 9; // px per mm
  const cx = W / 2;
  const base = H - 20;
  const n = Math.max(1, Math.round(R / h));
  const rel = Math.min(1, 0.1 / h); // print time relative to 0.1 mm
  return (
    <g>
      <path d={`M ${cx - R * px} ${base} A ${R * px} ${R * px} 0 0 1 ${cx + R * px} ${base} Z`} fill="none" stroke="var(--muted)" strokeDasharray="4 4" />
      {Array.from({ length: n }, (_, i) => {
        const z = i * h; // bottom of the layer
        const half = Math.sqrt(Math.max(0, R * R - z * z));
        return <rect key={i} x={cx - half * px} y={base - (z + h) * px} width={half * 2 * px} height={h * px} fill="var(--primary)" opacity={i % 2 ? 0.7 : 0.9} />;
      })}
      <g fontSize="13" fill="var(--fg)">
        <text x={16} y={26}>Print time</text>
        <rect x={16} y={34} width={120} height={12} rx={6} fill="var(--border)" />
        <rect x={16} y={34} width={120 * rel} height={12} rx={6} fill="var(--accent)" />
        <text x={W - 16} y={26} textAnchor="end">20 mm tall</text>
      </g>
    </g>
  );
}

// ── infill: cross-section of a keychain ──
export const infillGrams = (pct: number) => 6 + 0.3 * pct;
export const infillMinutes = (pct: number) => Math.round(25 + 0.6 * pct);
function Infill({ pct }: { pct: number }) {
  const x = 120, y = 30, w = 240, h = 180, wall = 14;
  const lines = pct <= 0 ? 0 : Math.max(1, Math.round(pct / 5));
  const gap = (w - 2 * wall) / (lines + 1);
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={18} fill="var(--primary)" opacity={0.9} />
      <rect x={x + wall} y={y + wall} width={w - 2 * wall} height={h - 2 * wall} rx={8} fill="var(--bg)" />
      {pct >= 100 ? (
        <rect x={x + wall} y={y + wall} width={w - 2 * wall} height={h - 2 * wall} rx={8} fill="var(--primary)" opacity={0.6} />
      ) : (
        <g stroke="var(--primary)" strokeWidth={3} opacity={0.7}>
          {Array.from({ length: lines }, (_, i) => (
            <g key={i}>
              <line x1={x + wall + gap * (i + 1)} y1={y + wall} x2={x + wall + gap * (i + 1)} y2={y + h - wall} />
              <line x1={x + wall} y1={y + wall + ((h - 2 * wall) / (lines + 1)) * (i + 1)} x2={x + w - wall} y2={y + wall + ((h - 2 * wall) / (lines + 1)) * (i + 1)} />
            </g>
          ))}
        </g>
      )}
      <text x={x + w / 2} y={y + h + 22} textAnchor="middle" fontSize="13" fill="var(--muted)">walls stay the same · infill fills the inside</text>
    </g>
  );
}
