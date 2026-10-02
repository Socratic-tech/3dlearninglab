"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { CSS2DObject, CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Box,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  DEFAULT_LAYER_MM,
  boundingSize,
  displayOffset,
  formatMm,
  formatSize,
  layerCount,
  sliceTriangles,
  toDisplay,
  toModel,
  type Vec3,
} from "./geometry";

export type ViewerHotspot = { id: string; label: string; position: [number, number, number]; radius: number };

export type ModelViewerProps = {
  /** URL of the file */
  src: string;
  format: "stl" | "obj" | "glb" | "gltf";
  /** Accessible name */
  title: string;
  /** Screen-reader description of the model */
  description?: string;
  /** Default true: bounding-box size W×D×H in mm shown as an overlay label */
  showDimensions?: boolean;
  /** Adds a layer-height slider (0.2 mm layers) that clips the model at Z */
  showLayers?: boolean;
  /** Positions in MODEL coordinates: millimetres, Z-up (as in the file) */
  hotspots?: ViewerHotspot[];
  /** Draw labelled markers for these hotspot ids */
  revealedHotspotIds?: string[];
  /** When provided, clicking/tapping the model reports the hit point in MODEL coordinates */
  onPick?: (point: [number, number, number]) => void;
  pickedPoint?: [number, number, number] | null;
  /** CSS px, default 320 */
  height?: number;
  className?: string;
};

type Status = "loading" | "ready" | "error";

type Palette = {
  model: THREE.Color;
  grid: THREE.Color;
  background: THREE.Color;
  plate: THREE.Color;
  accent: THREE.Color;
  danger: THREE.Color;
};

/** Everything created imperatively for one loaded model. Lives in a ref. */
type Engine = {
  renderer: THREE.WebGLRenderer;
  labelRenderer: CSS2DRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  modelRoot: THREE.Group;
  meshes: THREE.Mesh[];
  materials: THREE.Material[];
  ownedMaterial: THREE.MeshStandardMaterial | null;
  clipPlane: THREE.Plane;
  layerGroup: THREE.Group;
  markerGroup: THREE.Group;
  offset: Vec3;
  sizeMm: Vec3;
  displayRadius: number;
  footprint: number;
  trianglesDisplay: Float32Array;
  gridHelper: THREE.GridHelper;
  plate: THREE.Mesh;
  home: { position: THREE.Vector3; target: THREE.Vector3 };
  render: () => void;
  applyPalette: (p: Palette) => void;
  setWireframe: (on: boolean) => void;
  /** Clip everything above display Y = h (Infinity disables clipping). */
  setClipHeight: (h: number) => void;
  palette: Palette;
};

const FALLBACK = {
  primary: "#0b5cad",
  border: "#cfd8e3",
  surface2: "#eef2f7",
  surface: "#ffffff",
  accent: "#b45309",
  danger: "#b91c1c",
};

function readPalette(): Palette {
  const style = getComputedStyle(document.documentElement);
  const pick = (name: string, fallback: string) => {
    const color = new THREE.Color();
    const raw = style.getPropertyValue(name).trim();
    try {
      color.setStyle(raw || fallback);
    } catch {
      color.setStyle(fallback);
    }
    return color;
  };
  const background = pick("--surface-2", FALLBACK.surface2);
  const surface = pick("--surface", FALLBACK.surface);
  return {
    model: pick("--primary", FALLBACK.primary),
    grid: pick("--border", FALLBACK.border),
    background,
    plate: surface.clone().lerp(background, 0.35),
    accent: pick("--accent", FALLBACK.accent),
    danger: pick("--danger", FALLBACK.danger),
  };
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
}

function webglAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (canvas.getContext("webgl2") || canvas.getContext("webgl")));
  } catch {
    return false;
  }
}

async function loadObject(src: string, format: ModelViewerProps["format"], signal: AbortSignal): Promise<THREE.Object3D> {
  const res = await fetch(src, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  if (format === "stl") {
    const geometry = new STLLoader().parse(await res.arrayBuffer());
    if (!geometry.getAttribute("normal")) geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry);
    const group = new THREE.Group();
    group.add(mesh);
    return group;
  }
  if (format === "obj") {
    return new OBJLoader().parse(await res.text());
  }
  const base = new URL(src, window.location.href);
  const path = base.href.slice(0, base.href.lastIndexOf("/") + 1);
  const data = format === "glb" ? await res.arrayBuffer() : await res.text();
  const gltf = await new GLTFLoader().parseAsync(data, path);
  return gltf.scene;
}

function disposeObject(root: THREE.Object3D) {
  root.traverse((obj) => {
    const withGeometry = obj as Partial<THREE.Mesh>;
    withGeometry.geometry?.dispose();
    const mat = withGeometry.material;
    if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
    else mat?.dispose();
  });
}

function makeLabel(text: string, variant: "hotspot" | "pick"): HTMLDivElement {
  const el = document.createElement("div");
  el.textContent = text;
  el.setAttribute("aria-hidden", "true");
  el.style.cssText = [
    "pointer-events:none",
    "font:600 12px/1.2 system-ui,sans-serif",
    "padding:2px 6px",
    "border-radius:6px",
    "white-space:nowrap",
    "transform:translateY(-18px)",
    "box-shadow:0 1px 3px rgba(0,0,0,.25)",
    variant === "hotspot"
      ? "background:var(--accent);color:var(--surface)"
      : "background:var(--danger);color:var(--surface)",
  ].join(";");
  // CSS2DObject sets its own transform on the element; wrap so our offset survives.
  const wrap = document.createElement("div");
  wrap.appendChild(el);
  return wrap;
}

const HINT = "Drag to orbit · Right-drag/two-finger to pan · Scroll/pinch to zoom";
const ROTATE_STEP = Math.PI / 12;
const ZOOM_STEP = 1.2;

export default function ModelViewer({
  src,
  format,
  title,
  description,
  showDimensions = true,
  showLayers = false,
  hotspots,
  revealedHotspotIds,
  onPick,
  pickedPoint = null,
  height = 320,
  className,
}: ModelViewerProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<Engine | null>(null);
  const onPickRef = useRef(onPick);
  const tweenRef = useRef<number | null>(null);
  const idBase = useId();
  const descId = `${idBase}-desc`;
  const hintId = `${idBase}-hint`;
  const layerId = `${idBase}-layer`;

  const loadKey = `${format}:${src}`;
  const [result, setResult] = useState<{ key: string; status: Exclude<Status, "loading">; size?: Vec3 }>({
    key: "",
    status: "error",
  });
  const status: Status = result.key === loadKey ? result.status : "loading";
  const sizeMm = result.key === loadKey ? result.size : undefined;

  const [wireframe, setWireframe] = useState(false);
  // Bumped on theme change so marker / layer visuals rebuild with the new palette.
  const [themeTick, setThemeTick] = useState(0);
  const totalLayers = sizeMm ? layerCount(sizeMm[2], DEFAULT_LAYER_MM) : 0;
  const [layerState, setLayerState] = useState<{ key: string; layer: number }>({ key: "", layer: 0 });
  const layer = layerState.key === loadKey ? Math.min(layerState.layer, totalLayers) : totalLayers;

  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  // ---------- Engine lifecycle: create, load, dispose ----------
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const abort = new AbortController();
    let disposed = false;
    let frame: number | null = null;
    const cleanups: Array<() => void> = [];

    const fail = () => {
      if (!disposed) setResult({ key: loadKey, status: "error" });
    };

    const start = async () => {
      if (!webglAvailable()) {
        fail();
        return;
      }
      let renderer: THREE.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "low-power" });
      } catch {
        fail();
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.localClippingEnabled = true;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      const canvas = renderer.domElement;
      canvas.style.display = "block";
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.touchAction = "none";
      canvas.setAttribute("aria-hidden", "true");
      mount.appendChild(canvas);
      cleanups.push(() => {
        renderer.dispose();
        renderer.forceContextLoss();
        canvas.remove();
      });

      const labelRenderer = new CSS2DRenderer();
      const labelEl = labelRenderer.domElement;
      labelEl.style.position = "absolute";
      labelEl.style.inset = "0";
      labelEl.style.pointerEvents = "none";
      labelEl.setAttribute("aria-hidden", "true");
      mount.appendChild(labelEl);
      cleanups.push(() => labelEl.remove());

      let object: THREE.Object3D;
      try {
        object = await loadObject(src, format, abort.signal);
      } catch {
        fail();
        return;
      }
      if (disposed) {
        disposeObject(object);
        return;
      }

      const palette = readPalette();
      const scene = new THREE.Scene();
      scene.background = palette.background.clone();
      cleanups.push(() => disposeObject(scene));

      // Collect meshes, assign our tint material to untextured formats.
      const meshes: THREE.Mesh[] = [];
      object.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh);
      });
      if (meshes.length === 0) {
        disposeObject(object);
        fail();
        return;
      }
      const clipPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), Infinity);
      let ownedMaterial: THREE.MeshStandardMaterial | null = null;
      const materials: THREE.Material[] = [];
      if (format === "stl" || format === "obj") {
        ownedMaterial = new THREE.MeshStandardMaterial({
          color: palette.model,
          roughness: 0.55,
          metalness: 0.05,
          side: THREE.DoubleSide,
          flatShading: format === "stl",
        });
        for (const m of meshes) {
          const old = m.material;
          if (Array.isArray(old)) old.forEach((x) => x.dispose());
          else old?.dispose();
          m.material = ownedMaterial;
        }
        materials.push(ownedMaterial);
      } else {
        for (const m of meshes) {
          const list = Array.isArray(m.material) ? m.material : [m.material];
          for (const mat of list) {
            mat.side = THREE.DoubleSide;
            if (!materials.includes(mat)) materials.push(mat);
          }
        }
      }
      for (const mat of materials) mat.clippingPlanes = [clipPlane];

      // Bounds in MODEL coordinates.
      object.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(object, true);
      if (box.isEmpty() || ![box.min.x, box.max.x, box.min.z, box.max.z].every(Number.isFinite)) {
        disposeObject(object);
        fail();
        return;
      }
      const min: Vec3 = [box.min.x, box.min.y, box.min.z];
      const max: Vec3 = [box.max.x, box.max.y, box.max.z];
      const offset = displayOffset(min, max);
      const size = boundingSize(min, max);

      // modelRoot: rotation −90° about X; inner object shifted by −offset (in model space).
      const modelRoot = new THREE.Group();
      modelRoot.rotation.x = -Math.PI / 2;
      object.position.set(-offset[0], -offset[1], -offset[2]);
      modelRoot.add(object);
      scene.add(modelRoot);
      scene.updateMatrixWorld(true);

      // Triangle soup in DISPLAY coordinates (for layer outlines).
      const tris: number[] = [];
      const v = new THREE.Vector3();
      for (const m of meshes) {
        const g = m.geometry as THREE.BufferGeometry;
        const pos = g.getAttribute("position");
        if (!pos) continue;
        const idx = g.getIndex();
        const count = idx ? idx.count : pos.count;
        for (let i = 0; i < count; i++) {
          const vi = idx ? idx.getX(i) : i;
          v.fromBufferAttribute(pos, vi).applyMatrix4(m.matrixWorld);
          tris.push(v.x, v.y, v.z);
        }
      }
      const trianglesDisplay = new Float32Array(tris);

      // Lights.
      scene.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 1.6));
      const key = new THREE.DirectionalLight(0xffffff, 1.6);
      key.position.set(1, 1.6, 1.2);
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xffffff, 0.6);
      fill.position.set(-1.2, 0.6, -0.8);
      scene.add(fill);

      // Build plate: ≥ 1.5× footprint, 10 mm cells.
      const footprint = Math.max(size[0], size[1], 1);
      const gridSize = Math.max(60, Math.ceil((footprint * 1.5) / 20) * 20);
      const gridHelper = new THREE.GridHelper(gridSize, gridSize / 10, palette.grid, palette.grid);
      const gridMat = gridHelper.material as THREE.Material;
      gridMat.transparent = true;
      gridMat.opacity = 0.9;
      gridHelper.position.y = 0.02;
      scene.add(gridHelper);
      const plate = new THREE.Mesh(
        new THREE.PlaneGeometry(gridSize, gridSize),
        new THREE.MeshBasicMaterial({
          color: palette.plate,
          polygonOffset: true,
          polygonOffsetFactor: 1,
          polygonOffsetUnits: 1,
        }),
      );
      plate.rotation.x = -Math.PI / 2;
      plate.position.y = -0.05;
      scene.add(plate);

      const layerGroup = new THREE.Group();
      scene.add(layerGroup);
      const markerGroup = new THREE.Group();
      scene.add(markerGroup);

      // Camera.
      const dispBox = new THREE.Box3().setFromObject(modelRoot, true);
      const sphere = dispBox.getBoundingSphere(new THREE.Sphere());
      const displayRadius = Math.max(sphere.radius, 1);
      const camera = new THREE.PerspectiveCamera(40, 1, displayRadius / 100, displayRadius * 100 + gridSize * 4);
      const target = new THREE.Vector3(0, size[2] / 2, 0);
      const fitDist = displayRadius / Math.sin(THREE.MathUtils.degToRad(40 / 2)) * 1.05;
      const dir = new THREE.Vector3(0.75, 0.55, 1).normalize();
      const homePos = target.clone().addScaledVector(dir, fitDist);
      camera.position.copy(homePos);
      camera.lookAt(target);

      const controls = new OrbitControls(camera, canvas);
      controls.target.copy(target);
      controls.enableDamping = false;
      controls.autoRotate = false;
      controls.screenSpacePanning = true;
      controls.minDistance = displayRadius * 0.2;
      controls.maxDistance = displayRadius * 20 + gridSize;
      controls.update();
      cleanups.push(() => controls.dispose());

      let pending = false;
      const render = () => {
        if (disposed || pending) return;
        pending = true;
        frame = requestAnimationFrame(() => {
          pending = false;
          frame = null;
          if (disposed) return;
          renderer.render(scene, camera);
          labelRenderer.render(scene, camera);
        });
      };
      controls.addEventListener("change", render);

      const resize = () => {
        const w = Math.max(1, mount.clientWidth);
        const h = Math.max(1, mount.clientHeight);
        renderer.setSize(w, h, false);
        labelRenderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        render();
      };
      const ro = new ResizeObserver(resize);
      ro.observe(mount);
      cleanups.push(() => ro.disconnect());
      resize();

      const applyPalette = (p: Palette) => {
        engine.palette = p;
        (scene.background as THREE.Color).copy(p.background);
        if (ownedMaterial) ownedMaterial.color.copy(p.model);
        const gm = gridHelper.material as THREE.LineBasicMaterial;
        const colors = gridHelper.geometry.getAttribute("color") as THREE.BufferAttribute | undefined;
        if (colors) {
          for (let i = 0; i < colors.count; i++) colors.setXYZ(i, p.grid.r, p.grid.g, p.grid.b);
          colors.needsUpdate = true;
        }
        gm.needsUpdate = true;
        (plate.material as THREE.MeshBasicMaterial).color.copy(p.plate);
        render();
      };

      const engine: Engine = {
        renderer,
        labelRenderer,
        scene,
        camera,
        controls,
        modelRoot,
        meshes,
        materials,
        ownedMaterial,
        clipPlane,
        layerGroup,
        markerGroup,
        offset,
        sizeMm: size,
        displayRadius,
        footprint,
        trianglesDisplay,
        gridHelper,
        plate,
        home: { position: homePos.clone(), target: target.clone() },
        render,
        applyPalette,
        setWireframe: (on) => {
          for (const m of materials) {
            (m as THREE.MeshStandardMaterial).wireframe = on;
            m.needsUpdate = true;
          }
          render();
        },
        setClipHeight: (h) => {
          clipPlane.constant = h;
          render();
        },
        palette,
      };
      engineRef.current = engine;
      cleanups.push(() => {
        if (engineRef.current === engine) engineRef.current = null;
      });

      // Theme changes.
      const onTheme = () => {
        applyPalette(readPalette());
        setThemeTick((t) => t + 1);
      };
      const mo = new MutationObserver(onTheme);
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class", "style"] });
      const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
      mq?.addEventListener?.("change", onTheme);
      cleanups.push(() => {
        mo.disconnect();
        mq?.removeEventListener?.("change", onTheme);
      });

      // Picking: a click/tap (not a drag) raycasts the model.
      const raycaster = new THREE.Raycaster();
      const ndc = new THREE.Vector2();
      let down: { x: number; y: number; t: number } | null = null;
      const onDown = (e: PointerEvent) => {
        down = e.isPrimary ? { x: e.clientX, y: e.clientY, t: performance.now() } : null;
      };
      const onUp = (e: PointerEvent) => {
        const d = down;
        down = null;
        const cb = onPickRef.current;
        if (!cb || !d || !e.isPrimary) return;
        if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6 || performance.now() - d.t > 600) return;
        const rect = canvas.getBoundingClientRect();
        ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
        raycaster.setFromCamera(ndc, camera);
        const clipY = clipPlane.constant;
        const hit = raycaster
          .intersectObjects(meshes, false)
          .find((h) => h.point.y <= clipY + 1e-4);
        if (!hit) return;
        const p = toModel([hit.point.x, hit.point.y, hit.point.z], offset);
        cb([round3(p[0]), round3(p[1]), round3(p[2])]);
      };
      canvas.addEventListener("pointerdown", onDown);
      canvas.addEventListener("pointerup", onUp);
      cleanups.push(() => {
        canvas.removeEventListener("pointerdown", onDown);
        canvas.removeEventListener("pointerup", onUp);
      });

      setResult({ key: loadKey, status: "ready", size });
    };

    start().catch(fail);

    return () => {
      disposed = true;
      abort.abort();
      if (frame !== null) cancelAnimationFrame(frame);
      if (tweenRef.current !== null) cancelAnimationFrame(tweenRef.current);
      tweenRef.current = null;
      for (let i = cleanups.length - 1; i >= 0; i--) {
        try {
          cleanups[i]();
        } catch {
          /* ignore cleanup errors */
        }
      }
    };
  }, [src, format, loadKey]);

  // ---------- Wireframe ----------
  useEffect(() => {
    const e = engineRef.current;
    if (!e || status !== "ready") return;
    e.setWireframe(wireframe);
  }, [wireframe, status]);

  // ---------- Layers: clip + outline + plane ----------
  useEffect(() => {
    const e = engineRef.current;
    if (!e || status !== "ready") return;
    // Clear previous layer visuals.
    for (const child of [...e.layerGroup.children]) {
      e.layerGroup.remove(child);
      disposeObject(child);
    }
    const active = showLayers && totalLayers > 0 && layer < totalLayers;
    if (!active) {
      e.setClipHeight(Infinity);
      return;
    }
    const top = layer * DEFAULT_LAYER_MM;
    e.setClipHeight(top);
    // Outline: slice at the middle of the current layer, draw at its top.
    const segs = sliceTriangles(e.trianglesDisplay, 1, Math.max(top - DEFAULT_LAYER_MM / 2, 1e-4));
    if (segs.length) {
      for (let i = 1; i < segs.length; i += 3) segs[i] = top + 0.03;
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(segs, 3));
      const lines = new THREE.LineSegments(
        g,
        new THREE.LineBasicMaterial({ color: e.palette.accent, depthTest: false, transparent: true }),
      );
      lines.renderOrder = 10;
      e.layerGroup.add(lines);
    }
    const planeSize = e.footprint * 1.25;
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(planeSize, planeSize),
      new THREE.MeshBasicMaterial({
        color: e.palette.accent,
        transparent: true,
        opacity: 0.12,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = top;
    plane.renderOrder = 5;
    e.layerGroup.add(plane);
    e.render();
  }, [showLayers, layer, totalLayers, status, themeTick]);

  // ---------- Hotspot + pick markers ----------
  const revealedKey = (revealedHotspotIds ?? []).join("\u0000");
  const revealed = useMemo(
    () => {
      const ids = new Set(revealedKey ? revealedKey.split("\u0000") : []);
      return (hotspots ?? []).filter((h) => ids.has(h.id));
    },
    [hotspots, revealedKey],
  );
  const pickKey = pickedPoint ? pickedPoint.join(",") : "";
  useEffect(() => {
    const e = engineRef.current;
    if (!e || status !== "ready") return;
    for (const child of [...e.markerGroup.children]) {
      e.markerGroup.remove(child);
      child.traverse((o) => {
        if (o instanceof CSS2DObject) o.element.remove();
      });
      disposeObject(child);
    }
    const r = Math.max(0.8, Math.min(e.displayRadius * 0.025, 4));
    const addMarker = (pos: Vec3, label: string, color: THREE.Color, variant: "hotspot" | "pick") => {
      const d = toDisplay(pos, e.offset);
      const group = new THREE.Group();
      group.position.set(d[0], d[1], d[2]);
      const ball = new THREE.Mesh(
        new THREE.SphereGeometry(r, 20, 14),
        new THREE.MeshBasicMaterial({ color, depthTest: false, transparent: true, opacity: 0.95 }),
      );
      ball.renderOrder = 20;
      group.add(ball);
      const labelObj = new CSS2DObject(makeLabel(label, variant));
      labelObj.position.set(0, r, 0);
      group.add(labelObj);
      e.markerGroup.add(group);
    };
    for (const h of revealed) addMarker(h.position, h.label, e.palette.accent, "hotspot");
    if (pickKey) {
      const p = pickKey.split(",").map(Number) as Vec3;
      if (p.every(Number.isFinite)) {
        addMarker(p, "Your pick", e.palette.danger, "pick");
      }
    }
    e.render();
  }, [revealed, pickKey, status, themeTick]);

  // ---------- Camera actions ----------
  const resetView = useCallback(() => {
    const e = engineRef.current;
    if (!e) return;
    if (tweenRef.current !== null) cancelAnimationFrame(tweenRef.current);
    tweenRef.current = null;
    const { camera, controls, home } = e;
    if (prefersReducedMotion()) {
      camera.position.copy(home.position);
      controls.target.copy(home.target);
      controls.update();
      e.render();
      return;
    }
    const fromPos = camera.position.clone();
    const fromTarget = controls.target.clone();
    const t0 = performance.now();
    const duration = 350;
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / duration);
      const ease = 1 - Math.pow(1 - k, 3);
      camera.position.lerpVectors(fromPos, home.position, ease);
      controls.target.lerpVectors(fromTarget, home.target, ease);
      controls.update();
      e.render();
      tweenRef.current = k < 1 ? requestAnimationFrame(step) : null;
    };
    tweenRef.current = requestAnimationFrame(step);
  }, []);

  const rotate = useCallback((left: number, up: number) => {
    const e = engineRef.current;
    if (!e) return;
    if (left) e.controls.rotateLeft(left);
    if (up) e.controls.rotateUp(up);
    e.controls.update();
    e.render();
  }, []);

  const zoom = useCallback((factor: number) => {
    const e = engineRef.current;
    if (!e) return;
    // OrbitControls naming: dollyOut(s) divides the camera distance by s, so s > 1 moves closer.
    e.controls.dollyOut(factor);
    e.render();
  }, []);

  const onKeyDown = (ev: React.KeyboardEvent<HTMLDivElement>) => {
    if (status !== "ready") return;
    let handled = true;
    switch (ev.key) {
      case "ArrowLeft":
        rotate(ROTATE_STEP, 0);
        break;
      case "ArrowRight":
        rotate(-ROTATE_STEP, 0);
        break;
      case "ArrowUp":
        rotate(0, ROTATE_STEP);
        break;
      case "ArrowDown":
        rotate(0, -ROTATE_STEP);
        break;
      case "+":
      case "=":
        zoom(ZOOM_STEP);
        break;
      case "-":
      case "_":
        zoom(1 / ZOOM_STEP);
        break;
      case "0":
        resetView();
        break;
      default:
        handled = false;
    }
    if (handled) ev.preventDefault();
  };

  const dimsText = sizeMm ? formatSize(sizeMm) : "";
  const dimsSpoken = sizeMm
    ? `Size: ${formatMm(sizeMm[0])} millimetres wide, ${formatMm(sizeMm[1])} deep, ${formatMm(sizeMm[2])} tall.`
    : "";

  if (status === "error") {
    return (
      <div
        role="status"
        className={[
          "flex flex-col items-center justify-center gap-2 rounded-lg border border-border bg-surface-2 p-4 text-center text-muted",
          className ?? "",
        ].join(" ")}
        style={{ minHeight: height }}
      >
        <p className="text-fg">3D preview unavailable — you can still download the file.</p>
        <p className="text-sm">{title}</p>
        <a href={src} download className="text-sm font-medium text-primary underline underline-offset-2">
          Download file
        </a>
      </div>
    );
  }

  const btnBase =
    "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-sm disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]";
  const btn = `${btnBase} border-border bg-surface text-fg hover:bg-primary-soft`;
  const btnOn = `${btnBase} border-primary bg-primary text-primary-fg`;
  const ready = status === "ready";

  return (
    <figure className={["m-0 flex flex-col gap-2", className ?? ""].join(" ")}>
      <div role="toolbar" aria-label={`${title} view controls`} className="flex flex-wrap items-center gap-1">
        <button type="button" className={btn} onClick={resetView} disabled={!ready} aria-label="Reset view" title="Reset view (0)">
          <RotateCcw aria-hidden="true" size={16} />
          <span>Reset</span>
        </button>
        <button
          type="button"
          className={wireframe ? btnOn : btn}
          onClick={() => setWireframe((w) => !w)}
          disabled={!ready}
          aria-pressed={wireframe}
          aria-label="Wireframe"
          title="Toggle wireframe"
        >
          <Box aria-hidden="true" size={16} />
          <span>Wireframe</span>
        </button>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
        <button type="button" className={btn} onClick={() => rotate(ROTATE_STEP, 0)} disabled={!ready} aria-label="Rotate left" title="Rotate left (←)">
          <ArrowLeft aria-hidden="true" size={16} />
        </button>
        <button type="button" className={btn} onClick={() => rotate(-ROTATE_STEP, 0)} disabled={!ready} aria-label="Rotate right" title="Rotate right (→)">
          <ArrowRight aria-hidden="true" size={16} />
        </button>
        <button type="button" className={btn} onClick={() => rotate(0, ROTATE_STEP)} disabled={!ready} aria-label="Rotate up" title="Rotate up (↑)">
          <ArrowUp aria-hidden="true" size={16} />
        </button>
        <button type="button" className={btn} onClick={() => rotate(0, -ROTATE_STEP)} disabled={!ready} aria-label="Rotate down" title="Rotate down (↓)">
          <ArrowDown aria-hidden="true" size={16} />
        </button>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
        <button type="button" className={btn} onClick={() => zoom(ZOOM_STEP)} disabled={!ready} aria-label="Zoom in" title="Zoom in (+)">
          <ZoomIn aria-hidden="true" size={16} />
        </button>
        <button type="button" className={btn} onClick={() => zoom(1 / ZOOM_STEP)} disabled={!ready} aria-label="Zoom out" title="Zoom out (−)">
          <ZoomOut aria-hidden="true" size={16} />
        </button>
      </div>

      <div
        className="relative overflow-hidden rounded-lg border border-border bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
        style={{ height }}
        tabIndex={0}
        role="group"
        aria-roledescription="3D model viewer"
        aria-label={title}
        aria-describedby={`${descId} ${hintId}`}
        onKeyDown={onKeyDown}
      >
        <div ref={mountRef} className="absolute inset-0" style={{ cursor: onPick ? "crosshair" : "grab" }} />
        {status === "loading" && (
          <div role="status" className="absolute inset-0 flex items-center justify-center text-sm text-muted">
            Loading 3D preview…
          </div>
        )}
        {ready && showDimensions && sizeMm && (
          <div
            className="pointer-events-none absolute left-2 top-2 rounded-md border border-border bg-surface px-2 py-1 text-xs font-semibold text-fg tabular-nums"
            aria-hidden="true"
            data-testid="viewer-dimensions"
          >
            {dimsText}
          </div>
        )}
      </div>

      <span id={descId} className="sr-only">
        {[description, showDimensions ? dimsSpoken : "", "Use arrow keys to rotate, plus and minus to zoom, 0 to reset."]
          .filter(Boolean)
          .join(" ")}
      </span>

      {showLayers && ready && totalLayers > 0 && (
        <div className="flex flex-wrap items-center gap-3 text-sm text-fg">
          <label htmlFor={layerId} className="font-medium">
            Layer {layer} of {totalLayers}
          </label>
          <input
            id={layerId}
            type="range"
            min={1}
            max={totalLayers}
            step={1}
            value={layer}
            onChange={(ev) => setLayerState({ key: loadKey, layer: Number(ev.currentTarget.value) })}
            aria-valuetext={`Layer ${layer} of ${totalLayers}, ${formatMm(layer * DEFAULT_LAYER_MM)} millimetres`}
            className="min-w-40 flex-1 accent-[var(--primary)]"
          />
          <span className="text-muted tabular-nums">{formatMm(layer * DEFAULT_LAYER_MM)} mm</span>
        </div>
      )}

      <figcaption id={hintId} className="text-xs text-muted">
        {HINT}
      </figcaption>
    </figure>
  );
}

function round3(n: number): number {
  const r = Math.round(n * 1000) / 1000;
  return Object.is(r, -0) ? 0 : r;
}
