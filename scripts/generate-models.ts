/**
 * Generates every ORIGINAL course model from editable source.
 *   npm run models:generate
 *
 * Coordinates are millimetres, Z-up (the convention Tinkercad and slicers use). Each model writes a binary
 * STL into public/models/original and an entry into src/content/generated/model-manifest.json containing
 * its bounding box and named anchor points (used for lesson hotspots).
 *
 * Original assets are released under the license configured in src/content/models.ts (default CC BY 4.0).
 */
import fs from "node:fs";
import path from "node:path";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type ManifoldModule from "manifold-3d";
// manifold-3d is ESM-only and this script runs as CommonJS: load it with a real dynamic import
const loadManifold = new Function("return import('manifold-3d')") as () => Promise<{ default: typeof ManifoldModule }>;

const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  if (String(args[0]).includes("maxLeafSize")) return;
  originalWarn(...args);
};

const OUT_DIR = path.join(process.cwd(), "public/models/original");
const MANIFEST = path.join(process.cwd(), "src/content/generated/model-manifest.json");
const SEG = 96; // circle resolution — high enough that holes are not noticeably undersized

type Vec3 = [number, number, number];
type Built = { geometry: THREE.BufferGeometry; anchors?: Record<string, Vec3>; notes?: string };

// ───────── primitives (all Z-up, positioned by min corner or base center) ─────────

function clean(g: THREE.BufferGeometry) {
  const ng = g.index ? g.toNonIndexed() : g.clone();
  for (const k of Object.keys(ng.attributes)) if (k !== "position") ng.deleteAttribute(k);
  ng.computeVertexNormals();
  return ng;
}

/** Box with min corner at (x,y,z). */
function box(x: number, y: number, z: number, w: number, d: number, h: number) {
  const g = new THREE.BoxGeometry(w, d, h);
  g.translate(x + w / 2, y + d / 2, z + h / 2);
  return g;
}

/** Cylinder along Z with base centre at (x,y,z). */
function cyl(x: number, y: number, z: number, r: number, h: number, seg = SEG) {
  const g = new THREE.CylinderGeometry(r, r, h, seg);
  g.rotateX(Math.PI / 2);
  g.translate(x, y, z + h / 2);
  return g;
}

function cone(x: number, y: number, z: number, r: number, h: number) {
  const g = new THREE.ConeGeometry(r, h, SEG);
  g.rotateX(Math.PI / 2);
  g.translate(x, y, z + h / 2);
  return g;
}

function sphere(x: number, y: number, z: number, r: number) {
  const g = new THREE.SphereGeometry(r, 48, 24);
  g.translate(x, y, z);
  return g;
}

/**
 * Side profile drawn in the X/Z plane (pts = [x,z]) extruded along +Y by `width`.
 */
function profile(pts: [number, number][], width: number, y0 = 0) {
  const shape = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, z)));
  const g = new THREE.ExtrudeGeometry(shape, { depth: width, bevelEnabled: false, curveSegments: 48 });
  // shape is in XY, extruded along +Z → rotate so shape-Y becomes Z and extrusion becomes +Y
  g.rotateX(Math.PI / 2);
  g.translate(0, y0 + width, 0);
  return g;
}

// CSG with manifold-3d: every result is a closed, watertight solid (slicers print it without repairs).
type Wasm = Awaited<ReturnType<typeof ManifoldModule>>;
let M: Wasm;

/** three.js geometry → Manifold (vertices welded by position so the solid is closed). */
function toManifold(g: THREE.BufferGeometry) {
  const pos = clean(g).getAttribute("position");
  const index = new Map<string, number>();
  const verts: number[] = [];
  const tris: number[] = [];
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const k = `${x.toFixed(5)},${y.toFixed(5)},${z.toFixed(5)}`;
    let v = index.get(k);
    if (v === undefined) { v = verts.length / 3; index.set(k, v); verts.push(x, y, z); }
    tris.push(v);
  }
  // drop triangles that collapsed to a line after welding
  const kept: number[] = [];
  for (let i = 0; i < tris.length; i += 3) if (tris[i] !== tris[i + 1] && tris[i + 1] !== tris[i + 2] && tris[i] !== tris[i + 2]) kept.push(tris[i], tris[i + 1], tris[i + 2]);
  const mesh = new M.Mesh({ numProp: 3, vertProperties: new Float32Array(verts), triVerts: new Uint32Array(kept) });
  mesh.merge();
  const man = new M.Manifold(mesh);
  if (man.status() !== "NoError") throw new Error(`Input shape is not closed (${man.status()})`);
  return man;
}

function fromManifold(man: InstanceType<Wasm["Manifold"]>) {
  const mesh = man.getMesh();
  const out = new Float32Array(mesh.numTri * 9);
  for (let t = 0; t < mesh.numTri; t++) {
    for (let c = 0; c < 3; c++) {
      const v = mesh.triVerts[t * 3 + c];
      for (let a = 0; a < 3; a++) out[t * 9 + c * 3 + a] = mesh.vertProperties[v * mesh.numProp + a];
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(out, 3));
  g.computeVertexNormals();
  return g;
}

function subtract(a: THREE.BufferGeometry, ...cutters: THREE.BufferGeometry[]) {
  let result = toManifold(a);
  for (const c of cutters) result = result.subtract(toManifold(c));
  return fromManifold(result);
}

function union(...parts: THREE.BufferGeometry[]) {
  return fromManifold(M.Manifold.union(parts.map(toManifold)));
}

/** Several separate shells in one file (like ungrouped objects). */
function shells(...parts: THREE.BufferGeometry[]) {
  return mergeGeometries(parts.map(clean))!;
}

// ───────── models ─────────

const models: Record<string, () => Built> = {
  "misplaced-shapes": () => ({
    geometry: shells(
      box(55, 35, 18, 20, 20, 20), // floating cube (Z = 18 above the plane)
      cyl(-60, -40, 0, 10, 25), // far off to the side
      sphere(0, 0, -4, 9), // sunk below the workplane
      cone(-25, 70, 0, 9, 22),
      box(20, -70, 0, 30, 10, 6),
    ),
    anchors: { floatingCube: [65, 45, 28], farCylinder: [-60, -40, 12], sunkSphere: [0, 0, 0], cone: [-25, 70, 10], bar: [35, -65, 3] },
    notes: "Five shapes scattered in space: one floating, one sunk below the workplane, the rest far from the origin.",
  }),

  "toolbox-parts": () => {
    const tray = subtract(box(0, 0, 0, 90, 45, 25), box(2, 2, 2, 86, 41, 30));
    const rod = box(-35, 0, 0, 70, 8, 6);
    rod.rotateZ(THREE.MathUtils.degToRad(35));
    rod.rotateY(THREE.MathUtils.degToRad(-60));
    rod.translate(45, 90, 35);
    const block = box(-15, -5, -5, 30, 10, 10);
    block.rotateX(THREE.MathUtils.degToRad(90));
    block.rotateZ(THREE.MathUtils.degToRad(50));
    block.translate(130, 25, 15);
    return {
      geometry: shells(tray, rod, block),
      anchors: { trayCenter: [45, 22.5, 2], rod: [45, 90, 35], block: [130, 25, 15] },
      notes: "An open tray (90 × 45 × 25 mm, 2 mm walls) and two parts that only fit after rotating them flat.",
    };
  },

  "broken-die": () => ({
    geometry: shells(
      box(0, 0, 0, 21, 20, 19.4), // wrong size on X and Z
      cyl(10.5, 10, -1, 2, 22, 32), // "one" pip that goes all the way through (as a solid, not a hole)
      sphere(5, -6, 10, 2), // pip floating off the face
      box(4, 4, 19.4, 4, 4, 1.5), // raised square where a recess should be
    ),
    anchors: { throughPip: [10.5, 10, 20], floatingPip: [5, -6, 10], raisedFeature: [6, 6, 20.5], cubeCorner: [21, 20, 19.4] },
    notes: "A die that looks almost right: 21 × 20 × 19.4 mm, a pip that runs through the whole cube, a floating pip and a raised (not recessed) feature. Nothing is grouped.",
  }),

  "broken-tag": () => {
    // 56 mm long (spec says 50), key-ring hole punched right through the edge, "name" floating 1 mm above the tag
    const plate = subtract(box(0, 0, 0, 56, 20, 3), cyl(1.5, 10, -1, 2.5, 5));
    const letters = [0, 1, 2, 3].map((i) => box(14 + i * 9, 5, 4, 6, 10, 1));
    return {
      geometry: shells(plate, ...letters),
      anchors: { ringHole: [1.5, 10, 3], floatingName: [27, 10, 5], tagEnd: [56, 10, 3], tagFace: [48, 3, 3] },
      notes: "A name tag that looks almost right: 56 mm long instead of 50, a key-ring hole that breaks through the edge, and name letters floating 1 mm above the tag.",
    };
  },

  "bad-phone-stand": () => {
    // Solid, oversized base (excessive material)
    const base = box(0, 0, 0, 60, 70, 14);
    // Phone slot too narrow: 6 mm gap between lip and backrest
    const lip = box(8, 0, 14, 4, 70, 10);
    // Backrest leans BACK past the base (tips backward), joined by a thin neck
    const neck = box(18, 0, 14, 1.2, 70, 3);
    const back = profile(
      [
        [18, 17],
        [22, 17],
        [72, 95],
        [68, 95],
      ],
      70,
    );
    // Overhanging shelf that needs support
    const shelf = box(40, 0, 60, 30, 70, 3);
    return {
      geometry: union(base, lip, neck, back, shelf), // one solid: the flaws are in the shape, not the mesh
      anchors: {
        slot: [15, 35, 20],
        neck: [18.6, 35, 15.5],
        backrestTop: [70, 35, 95],
        shelf: [55, 35, 61.5],
        base: [30, 35, 7],
        front: [0, 35, 7],
      },
      notes: "Falls backward (backrest centre of mass is behind the base), 6 mm phone slot, 1.2 mm neck at a layer boundary, unsupported shelf, solid 14 mm base.",
    };
  },

  "orientation-hook": () => {
    const pts: [number, number][] = [
      [0, 0],
      [8, 0],
      [8, 50],
      [22, 50],
      [22, 38],
      [30, 38],
      [30, 58],
      [0, 58],
    ];
    return {
      geometry: profile(pts, 10),
      anchors: { hookBend: [22, 5, 50], stem: [4, 5, 25], tip: [26, 5, 38] },
      notes: "A J-hook 30 × 10 × 58 mm. Printed standing up, layers run across the stem and it snaps at the bend; printed flat on its side, layers run along the hook.",
    };
  },

  "excessive-support-object": () => ({
    geometry: union(box(25, 0, 0, 10, 20, 40), box(0, 0, 40, 60, 20, 8)),
    anchors: { leftArm: [8, 10, 40], rightArm: [52, 10, 40], stem: [30, 10, 20] },
    notes: "A 'T' standing on its stem: both 25 mm arms are flat overhangs that need support.",
  }),

  "redesigned-support-object": () => {
    const gussets = profile(
      [
        [0, 40],
        [25, 15],
        [35, 15],
        [60, 40],
      ],
      20,
    );
    return {
      geometry: union(box(25, 0, 0, 10, 20, 40), box(0, 0, 40, 60, 20, 8), gussets),
      anchors: { leftChamfer: [12, 10, 28], rightChamfer: [48, 10, 28] },
      notes: "Same T, but 45° chamfers under each arm make it self-supporting.",
    };
  },

  // Grades 4–5 starter unit: a good bookmark and one that breaks two rules (too thin, hole at the edge)
  "bookmark-good": () => ({
    geometry: subtract(box(0, 0, 0, 120, 35, 2), cyl(10, 17.5, -1, 3, 4)),
    anchors: { hole: [10, 17.5, 2] },
    notes: "120 × 35 × 2 mm bookmark with a 6 mm tassel hole and 7 mm of plastic around it.",
  }),
  "bookmark-thin": () => ({
    geometry: subtract(box(0, 0, 0, 120, 35, 0.6), cyl(3.5, 17.5, -1, 3, 4)),
    anchors: { hole: [3.5, 17.5, 0.6] },
    notes: "Breaks two rules: only 0.6 mm thick, and the 6 mm hole leaves 0.5 mm of plastic at the edge.",
  }),

  "peg-10mm": () => ({
    geometry: union(cyl(0, 0, 0, 5, 20), cyl(0, 0, 0, 8, 3)),
    anchors: { peg: [0, 0, 20] },
    notes: "A 10.0 mm diameter peg, 20 mm tall, on a 16 mm flange so it is easy to hold.",
  }),

  "hole-10mm": () => ({
    geometry: subtract(box(-12.5, -12.5, 0, 25, 25, 8), cyl(0, 0, -1, 5.0, 10)),
    anchors: { hole: [0, 0, 8] },
    notes: "25 × 25 × 8 mm plate with a 10.0 mm hole (zero designed clearance).",
  }),

  "hole-10-2mm": () => ({
    geometry: subtract(box(-12.5, -12.5, 0, 25, 25, 8), cyl(0, 0, -1, 5.1, 10)),
    anchors: { hole: [0, 0, 8] },
    notes: "25 × 25 × 8 mm plate with a 10.2 mm hole (0.1 mm clearance per side).",
  }),

  "hole-10-4mm": () => ({
    geometry: subtract(box(-12.5, -12.5, 0, 25, 25, 8), cyl(0, 0, -1, 5.2, 10)),
    anchors: { hole: [0, 0, 8] },
    notes: "25 × 25 × 8 mm plate with a 10.4 mm hole (0.2 mm clearance per side).",
  }),

  "thin-wall-test": () => {
    const walls = [0.4, 0.8, 1.2, 1.6, 2.0, 3.0];
    let x = 4;
    const parts: THREE.BufferGeometry[] = [];
    parts.push(box(0, 0, 0, 4 + walls.reduce((a, w) => a + w + 6, 0), 20, 2));
    const anchors: Record<string, Vec3> = {};
    for (const w of walls) {
      parts.push(box(x, 2, 2, w, 16, 15));
      anchors[`wall_${String(w).replace(".", "_")}`] = [x + w / 2, 10, 17];
      x += w + 6;
    }
    return {
      geometry: union(...parts),
      anchors,
      notes: "Six walls, left to right: 0.4, 0.8, 1.2, 1.6, 2.0 and 3.0 mm thick, 15 mm tall, on a 2 mm base.",
    };
  },

  "mystery-fit-object": () => ({
    geometry: shells(box(0, 0, 0, 34, 22, 10), cyl(10, 11, 10, 4, 12), box(22, 8, 10, 6, 6, 6)),
    anchors: { roundPeg: [10, 11, 22], squarePost: [25, 11, 16], base: [17, 11, 5] },
    notes: "A 34 × 22 × 10 mm block with an 8 mm round peg (12 mm tall) and a 6 × 6 × 6 mm square post. Measure it, then design a cap that fits over both.",
  }),

  "axis-cube-20mm": () => ({
    // notches: 1 on the X face, 2 on the Y face, 3 on the top (Z) — identify axes after printing
    geometry: subtract(
      box(0, 0, 0, 20, 20, 20),
      box(19, 8, 8, 2, 4, 4),
      box(5, 19, 8, 3, 2, 4),
      box(12, 19, 8, 3, 2, 4),
      box(4, 8, 19, 3, 4, 2),
      box(8.5, 8, 19, 3, 4, 2),
      box(13, 8, 19, 3, 4, 2),
    ),
    anchors: { xFace: [20, 10, 10], yFace: [10, 20, 10], top: [10, 10, 20] },
    notes: "A 20 mm calibration cube. One notch marks the X face, two the Y face, three the top (Z).",
  }),

  "overhang-test": () => {
    const angles = [20, 30, 45, 60, 70];
    const parts: THREE.BufferGeometry[] = [box(0, 0, 0, 12, 10 * angles.length + 10, 30)];
    const anchors: Record<string, Vec3> = {};
    angles.forEach((deg, i) => {
      const y0 = 5 + i * 10;
      // overhang angle measured from vertical: dx = height * tan(angle)
      const h = 18;
      const dx = h * Math.tan(THREE.MathUtils.degToRad(deg));
      parts.push(
        profile(
          [
            [12, 8],
            [12 + 2, 8],
            [12 + 2 + dx, 8 + h],
            [12, 8 + h],
          ],
          6,
          y0,
        ),
      );
      anchors[`overhang_${deg}`] = [12 + dx, y0 + 3, 8 + h];
    });
    return {
      geometry: union(...parts),
      anchors,
      notes: "Five fins leaning out from a wall at 20°, 30°, 45°, 60° and 70° from vertical. Most printers handle up to about 45°.",
    };
  },

  "bridge-test": () => {
    const spans = [10, 20, 40, 60];
    const parts: THREE.BufferGeometry[] = [];
    const anchors: Record<string, Vec3> = {};
    let y = 0;
    for (const s of spans) {
      parts.push(union(box(0, y, 0, 6, 8, 12), box(6 + s, y, 0, 6, 8, 12), box(0, y, 12, 12 + s, 8, 2)));
      anchors[`span_${s}`] = [6 + s / 2, y + 4, 13];
      y += 14;
    }
    return {
      geometry: shells(...parts),
      anchors,
      notes: "Four bridges spanning 10, 20, 40 and 60 mm between pillars 12 mm tall.",
    };
  },

  "misaligned-stack": () => ({
    geometry: shells(cyl(0, 0, 0, 20, 6), cyl(4, -3, 6, 14, 6), cyl(-5, 6, 12, 8, 6), cyl(8, 2, 18, 3, 10)),
    anchors: { bottom: [0, 0, 3], middle: [4, -3, 9], top: [-5, 6, 15], post: [8, 2, 23] },
    notes: "A wedding-cake stack of four cylinders that should share one centre line — none of them do.",
  }),

  "half-bracket": () => ({
    geometry: union(
      box(0, 0, 0, 30, 20, 4),
      box(0, 0, 4, 4, 20, 26),
      profile(
        [
          [4, 4],
          [16, 4],
          [4, 16],
        ],
        4,
        8,
      ),
    ),
    anchors: { mirrorEdge: [30, 10, 2], upright: [2, 10, 17] },
    notes: "Half of a symmetric shelf bracket. Mirror it across its right edge (X = 30 mm) and group to complete it.",
  }),

  "wedge-block": () => ({
    geometry: profile(
      [
        [0, 0],
        [40, 0],
        [40, 10],
        [0, 30],
      ],
      30,
    ),
    anchors: { slopedFace: [20, 15, 20] },
    notes: "A wedge with a sloped top face. Put a workplane on the slope and add a feature that sits flat on it.",
  }),
};

// ───────── STL writer ─────────

function writeBinaryStl(file: string, g: THREE.BufferGeometry, name: string) {
  const geom = g.index ? g.toNonIndexed() : g;
  const pos = geom.getAttribute("position");
  const triCount = pos.count / 3;
  const buf = Buffer.alloc(84 + triCount * 50);
  buf.write(`3D Design Academy — ${name} — mm`.slice(0, 80), 0, "ascii");
  buf.writeUInt32LE(triCount, 80);
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const n = new THREE.Vector3();
  let o = 84;
  for (let i = 0; i < triCount; i++) {
    a.fromBufferAttribute(pos, i * 3);
    b.fromBufferAttribute(pos, i * 3 + 1);
    c.fromBufferAttribute(pos, i * 3 + 2);
    n.subVectors(c, b).cross(new THREE.Vector3().subVectors(a, b)).normalize();
    for (const v of [n, a, b, c]) {
      buf.writeFloatLE(v.x, o);
      buf.writeFloatLE(v.y, o + 4);
      buf.writeFloatLE(v.z, o + 8);
      o += 12;
    }
    buf.writeUInt16LE(0, o);
    o += 2;
  }
  fs.writeFileSync(file, buf);
  return triCount;
}

function round(v: number) {
  return Math.round(v * 100) / 100;
}

async function main() {
M = await (await loadManifold()).default();
M.setup();
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
const manifest: Record<string, unknown> = {};
for (const [id, build] of Object.entries(models)) {
  const { geometry, anchors = {}, notes } = build();
  geometry.computeBoundingBox();
  const bb = geometry.boundingBox!;
  const tris = writeBinaryStl(path.join(OUT_DIR, `${id}.stl`), geometry, id);
  manifest[id] = {
    file: `/models/original/${id}.stl`,
    triangles: tris,
    min: bb.min.toArray().map(round),
    max: bb.max.toArray().map(round),
    size: bb.getSize(new THREE.Vector3()).toArray().map(round),
    anchors,
    notes,
  };
  console.log(`${id.padEnd(28)} ${String(tris).padStart(6)} tris  size ${(manifest[id] as { size: number[] }).size.join(" × ")} mm`);
}
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
console.log(`\nWrote ${Object.keys(models).length} models → ${path.relative(process.cwd(), OUT_DIR)}`);
}
void main();
