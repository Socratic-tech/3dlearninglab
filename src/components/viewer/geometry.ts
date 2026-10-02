/**
 * Pure, framework-free geometry helpers for the 3D model viewer.
 *
 * Coordinate systems
 * - MODEL coordinates: what is stored in the file — millimetres, Z-up (STL convention).
 * - DISPLAY coordinates: three.js world space — Y-up. The model is shifted by `offset`
 *   (X/Y centre of its bounding box and its min Z) so it sits centred on the build plate,
 *   then rotated −90° about X: (x, y, z) → (x, z, −y).
 *
 * `toDisplay` and `toModel` are exact inverses of each other.
 */

export type Vec3 = [number, number, number];

export type HotspotLike = {
  id: string;
  position: Vec3;
  radius: number;
};

/** Default printer layer height in millimetres. */
export const DEFAULT_LAYER_MM = 0.2;

/** Offset that centres the model in X/Y and puts its lowest point (min Z) on the plate. */
export function displayOffset(min: Vec3, max: Vec3): Vec3 {
  // X/Y are centred on the plate. Z is NOT shifted: the build plate is Z = 0 in the file, exactly like the
  // Tinkercad workplane, so a shape sunk below (or floating above) the workplane is shown that way.
  return [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, 0];
}

/** MODEL (mm, Z-up) → DISPLAY (three.js, Y-up, centred on plate). */
export function toDisplay(p: Vec3, offset: Vec3): Vec3 {
  const x = p[0] - offset[0];
  const y = p[1] - offset[1];
  const z = p[2] - offset[2];
  return [x, z, -y === 0 ? 0 : -y];
}

/** DISPLAY (three.js, Y-up) → MODEL (mm, Z-up, original file coordinates). */
export function toModel(p: Vec3, offset: Vec3): Vec3 {
  return [p[0] + offset[0], -p[2] + offset[1], p[1] + offset[2]];
}

/** Bounding-box size [width (X), depth (Y), height (Z)]. */
export function boundingSize(min: Vec3, max: Vec3): Vec3 {
  return [
    Math.max(0, max[0] - min[0]),
    Math.max(0, max[1] - min[1]),
    Math.max(0, max[2] - min[2]),
  ];
}

/** Number of printed layers for a part of the given height. Always ≥ 1 for a positive height. */
export function layerCount(heightMm: number, layerMm: number = DEFAULT_LAYER_MM): number {
  if (!Number.isFinite(heightMm) || !Number.isFinite(layerMm) || layerMm <= 0 || heightMm <= 0) {
    return 0;
  }
  // Tolerate float noise such as 58.000000001 / 0.2.
  return Math.max(1, Math.ceil(heightMm / layerMm - 1e-6));
}

/** Format a millimetre value: at most one decimal, no trailing ".0". */
export function formatMm(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Object.is(rounded, -0) ? "0" : String(rounded);
}

/** "72 × 70 × 95 mm" */
export function formatSize(size: Vec3): string {
  return `${formatMm(size[0])} × ${formatMm(size[1])} × ${formatMm(size[2])} mm`;
}

export function distance(a: Vec3, b: Vec3): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/**
 * The hotspot whose centre is within its radius of `point` (inclusive). When several
 * match, the one whose centre is closest wins. Returns null if none match.
 */
export function nearestHotspot<T extends HotspotLike>(point: Vec3, hotspots: readonly T[]): T | null {
  let best: T | null = null;
  let bestDist = Infinity;
  for (const h of hotspots) {
    const d = distance(point, h.position);
    if (d <= h.radius && d < bestDist) {
      best = h;
      bestDist = d;
    }
  }
  return best;
}

/**
 * Slice a triangle soup with the plane `coord[axis] = value`.
 * `positions` holds 9 numbers per triangle (non-indexed). Returns line-segment endpoints
 * (6 numbers per segment) suitable for THREE.LineSegments.
 */
export function sliceTriangles(positions: ArrayLike<number>, axis: 0 | 1 | 2, value: number): number[] {
  const out: number[] = [];
  const pts: number[] = [];
  const triCount = Math.floor(positions.length / 9);
  for (let t = 0; t < triCount; t++) {
    const base = t * 9;
    pts.length = 0;
    for (let e = 0; e < 3; e++) {
      const a = base + e * 3;
      const b = base + ((e + 1) % 3) * 3;
      const da = positions[a + axis] - value;
      const db = positions[b + axis] - value;
      if ((da < 0 && db >= 0) || (da >= 0 && db < 0)) {
        const k = da / (da - db);
        pts.push(
          positions[a] + (positions[b] - positions[a]) * k,
          positions[a + 1] + (positions[b + 1] - positions[a + 1]) * k,
          positions[a + 2] + (positions[b + 2] - positions[a + 2]) * k,
        );
      }
    }
    if (pts.length === 6) out.push(...pts);
  }
  return out;
}
