import { tr } from "@/lib/i18n";
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
      {scene === "rotate" && <Rotate angle={value} />}
      {scene === "lift" && <Lift z={value} />}
      {scene === "spacing" && <Spacing s={value} />}
      {scene === "wall" && <Wall t={value} />}
      {scene === "bridge" && <Bridge legs={value} />}
    </svg>
  );
}

/** Short readout under the slider (also used for screen readers). */
export function readout(scene: Scene, v: number): string {
  switch (scene) {
    case "overhang": {
      const rest = restingPct(v);
      return tr("{v}° from vertical · each new layer rests {rest}% on the one below", { v, rest });
    }
    case "clearance": return tr("Hole: {v} mm · peg: 10.00 mm", { v: v.toFixed(2) });
    case "scale": return tr("Scale: {v}%", { v });
    case "layers": return tr("Layer height: {v} mm", { v: v.toFixed(2) });
    case "infill": return tr("Infill: {v}% · about {g} g · {min} min", { v, g: infillGrams(v).toFixed(1), min: infillMinutes(v) });
    case "rotate": return tr("Turned {v}°", { v });
    case "lift": return tr("Small cube's bottom: Z = {v} mm", { v });
    case "spacing": return tr("Tooth spacing: {v} mm", { v: v.toFixed(1) });
    case "wall": return tr("Wall: {v} mm", { v: v.toFixed(1) });
    case "bridge": return tr("Legs: {v}", { v });
  }
}

function describe(scene: Scene, v: number) {
  return `${tr("Live picture.")} ${readout(scene, v)}`;
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
      <text x={x0 - 8} y={base - n * lh - 14} textAnchor="end" fontSize="13" fill="var(--muted)">{tr("vertical")}</text>
      <g fontSize="13" fill="var(--fg)">
        <rect x={90} y={219} width={12} height={12} rx={3} fill="var(--accent)" />
        <text x={108} y={230}>{tr("hangs over air")}</text>
        <rect x={230} y={219} width={12} height={12} rx={3} fill="var(--primary)" />
        <text x={248} y={230}>{tr("held up by the layer below")}</text>
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
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--primary-fg)">{tr("peg 10 mm")}</text>
      {gapPx > 2 && (
        <g stroke="var(--accent)" strokeWidth={2}>
          <line x1={cx + peg} y1={cy} x2={cx + peg + gapPx} y2={cy} />
          <line x1={cx - peg} y1={cy} x2={cx - peg - gapPx} y2={cy} />
        </g>
      )}
      <g fontSize="14" fill="var(--fg)">
        <text x={310} y={90}>{tr("Gaps are drawn")}</text>
        <text x={310} y={110}>{tr("much bigger than")}</text>
        <text x={310} y={130}>{tr("real life so you")}</text>
        <text x={310} y={150}>{tr("can see them.")}</text>
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
      <text x={x0 + 66 * mm} y={base + 38} fontSize="13" textAnchor="end" fill="var(--muted)">{tr("mm")}</text>
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
        <text x={16} y={26}>{tr("Print time")}</text>
        <rect x={16} y={34} width={120} height={12} rx={6} fill="var(--border)" />
        <rect x={16} y={34} width={120 * rel} height={12} rx={6} fill="var(--accent)" />
        <text x={W - 16} y={26} textAnchor="end">{tr("20 mm tall")}</text>
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
      <text x={x + w / 2} y={y + h + 22} textAnchor="middle" fontSize="13" fill="var(--muted)">{tr("walls stay the same \u00b7 infill fills the inside")}</text>
    </g>
  );
}

// ── rotate: a bar turning around its corner, with the 22.5° snap marks ──
function Rotate({ angle }: { angle: number }) {
  const cx = 150, cy = 200, L = 150;
  const rad = (a: number) => (a * Math.PI) / 180;
  return (
    <g>
      {Array.from({ length: 9 }, (_, i) => i * 22.5).map((a) => (
        <line key={a} x1={cx + Math.cos(rad(-a)) * (L + 8)} y1={cy + Math.sin(rad(-a)) * (L + 8)} x2={cx + Math.cos(rad(-a)) * (L + 20)} y2={cy + Math.sin(rad(-a)) * (L + 20)} stroke="var(--muted)" strokeWidth={a % 90 === 0 ? 3 : 1.5} />
      ))}
      <path d={`M ${cx + L * 0.35} ${cy} A ${L * 0.35} ${L * 0.35} 0 0 0 ${cx + Math.cos(rad(-angle)) * L * 0.35} ${cy + Math.sin(rad(-angle)) * L * 0.35}`} fill="none" stroke="var(--accent)" strokeWidth={3} />
      <rect x={cx} y={cy - 12} width={L} height={24} rx={4} fill="var(--border)" opacity={0.6} />
      <g transform={`rotate(${-angle} ${cx} ${cy})`}>
        <rect x={cx} y={cy - 12} width={L} height={24} rx={4} fill="var(--primary)" opacity={0.9} />
      </g>
      <circle cx={cx} cy={cy} r={6} fill="var(--fg)" />
      <text x={W - 16} y={30} textAnchor="end" fontSize="13" fill="var(--muted)">{tr("grey = where it started")}</text>
    </g>
  );
}

// ── lift: side view, 20 mm box with a 10 mm cube above it ──
function Lift({ z }: { z: number }) {
  const mm = 4.5;
  const base = H - 20;
  const boxTop = base - 20 * mm;
  const cubeBottom = base - z * mm;
  const overlap = z < 20;
  return (
    <g>
      <line x1={20} y1={base} x2={W - 20} y2={base} stroke="var(--fg)" strokeWidth={2} />
      <text x={W - 24} y={base + 15} textAnchor="end" fontSize="12" fill="var(--muted)">{tr("workplane (Z = 0)")}</text>
      <rect x={150} y={boxTop} width={180} height={20 * mm} fill="var(--primary)" opacity={0.75} />
      <text x={340} y={base - 8} fontSize="13" fill="var(--fg)">{tr("box: 20 mm tall")}</text>
      <rect x={215} y={cubeBottom - 10 * mm} width={10 * mm} height={10 * mm} fill="var(--accent)" opacity={0.9} />
      {overlap && <rect x={215} y={Math.max(cubeBottom - 10 * mm, boxTop)} width={10 * mm} height={Math.min(cubeBottom, base) - Math.max(cubeBottom - 10 * mm, boxTop)} fill="var(--danger)" opacity={0.7} />}
      {z > 20 && <line x1={237} y1={boxTop} x2={237} y2={cubeBottom} stroke="var(--danger)" strokeWidth={2} strokeDasharray="3 3" />}
      <text x={345} y={Math.max(20, cubeBottom - 20)} fontSize="13" fontWeight="700" fill="var(--danger)">{overlap ? tr("sunk into the box") : z > 20 ? tr("floating in the air") : ""}</text>
      {Array.from({ length: 9 }, (_, i) => i * 5).map((v) => (
        <g key={v}>
          <line x1={40} y1={base - v * mm} x2={v % 10 ? 46 : 52} y2={base - v * mm} stroke="var(--fg)" />
          {v % 10 === 0 && <text x={58} y={base - v * mm + 4} fontSize="11" fill="var(--fg)">{v}</text>}
        </g>
      ))}
    </g>
  );
}

// ── spacing: comb teeth repeated along a ruler ──
function Spacing({ s }: { s: number }) {
  const mm = 5.6;
  const x0 = 30;
  const base = 150;
  return (
    <g>
      <rect x={x0 - 6} y={60} width={78 * mm} height={14} rx={3} fill="var(--border)" />
      {Array.from({ length: 15 }, (_, i) => (
        <rect key={i} x={x0 + i * s * mm - 0.75 * mm} y={74} width={1.5 * mm} height={base - 74} fill="var(--primary)" opacity={i === 14 ? 1 : 0.8} />
      ))}
      <line x1={x0} y1={base + 12} x2={x0 + 75 * mm} y2={base + 12} stroke="var(--fg)" strokeWidth={2} />
      {Array.from({ length: 76 }, (_, i) => (
        <g key={i}>
          <line x1={x0 + i * mm} y1={base + 12} x2={x0 + i * mm} y2={base + (i % 10 === 0 ? 28 : i % 5 === 0 ? 23 : 18)} stroke="var(--fg)" />
          {i % 10 === 0 && <text x={x0 + i * mm} y={base + 44} fontSize="12" textAnchor="middle" fill="var(--fg)">{i}</text>}
        </g>
      ))}
      <text x={x0 + 14 * s * mm} y={52} fontSize="12" textAnchor="middle" fill="var(--accent)">{tr("last tooth")}</text>
    </g>
  );
}

// ── wall: cross-section showing how many 0.4 mm nozzle lines fit ──
function Wall({ t }: { t: number }) {
  const px = 40; // px per mm
  const lines = Math.round(t / 0.4);
  const x0 = (W - t * px) / 2;
  return (
    <g>
      {Array.from({ length: lines }, (_, i) => (
        <rect key={i} x={x0 + i * 0.4 * px} y={40} width={0.4 * px - 2} height={150} rx={7} fill="var(--primary)" opacity={i % 2 ? 0.7 : 0.9} />
      ))}
      <text x={W / 2} y={215} textAnchor="middle" fontSize="13" fill="var(--muted)">{tr("each stripe = one 0.4 mm line from the nozzle")}</text>
    </g>
  );
}

// ── bridge: a 70 mm shelf on evenly spaced legs; longer gaps sag more ──
function Bridge({ legs }: { legs: number }) {
  const mm = 5.4;
  const x0 = (W - 70 * mm) / 2;
  const top = 80;
  const n = Math.max(2, Math.round(legs));
  const gap = 70 / (n - 1);
  const sag = Math.min(60, (gap * gap) / 40); // px, grows with the square of the span
  const xs = Array.from({ length: n }, (_, i) => x0 + i * gap * mm);
  return (
    <g>
      <line x1={20} y1={H - 20} x2={W - 20} y2={H - 20} stroke="var(--fg)" strokeWidth={2} />
      {xs.map((x, i) => <rect key={i} x={x - 5} y={top} width={10} height={H - 20 - top} fill="var(--primary)" opacity={0.85} />)}
      {xs.slice(1).map((x, i) => {
        const a = xs[i];
        return <path key={i} d={`M ${a} ${top} Q ${(a + x) / 2} ${top + sag * 2} ${x} ${top}`} fill="none" stroke="var(--accent)" strokeWidth={6} strokeLinecap="round" />;
      })}
      <text x={W / 2} y={36} textAnchor="middle" fontSize="13" fill="var(--muted)">{tr("shelf is 70 mm wide \u00b7 first layer bridges each gap")}</text>
    </g>
  );
}
