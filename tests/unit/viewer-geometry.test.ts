import { describe, expect, it } from "vitest";
import {
  boundingSize,
  displayOffset,
  formatSize,
  layerCount,
  nearestHotspot,
  sliceTriangles,
  toDisplay,
  toModel,
  type Vec3,
} from "@/components/viewer/geometry";

describe("coordinate conversion", () => {
  const offset = displayOffset([0, 0, 0], [72, 70, 95]);

  it("centres X/Y and puts min Z on the plate", () => {
    expect(offset).toEqual([36, 35, 0]);
    expect(displayOffset([-70, -70, -13], [75, 79, 38])).toEqual([2.5, 4.5, 0]);
  });

  it("maps Z-up model coordinates to Y-up display coordinates", () => {
    // Model top-centre (Z = 95) is straight up in display (Y = 95).
    expect(toDisplay([36, 35, 95], offset)).toEqual([0, 95, 0]);
    // Model front (Y = 0) faces the default camera (+Z in display).
    expect(toDisplay([36, 0, 0], offset)).toEqual([0, 0, 35]);
    // +X stays +X.
    expect(toDisplay([72, 35, 0], offset)).toEqual([36, 0, 0]);
  });

  it("toModel inverts toDisplay exactly", () => {
    const pts: Vec3[] = [
      [15, 35, 20],
      [0, 0, 0],
      [-60, -40, 12],
      [143.47, 116.63, 62.83],
    ];
    const off = displayOffset([-70, -70, -13], [75, 79, 38]);
    for (const p of pts) {
      const back = toModel(toDisplay(p, off), off);
      back.forEach((v, i) => expect(v).toBeCloseTo(p[i], 9));
    }
    const d: Vec3 = [1, 2, 3];
    toDisplay(toModel(d, off), off).forEach((v, i) => expect(v).toBeCloseTo(d[i], 9));
  });
});

describe("boundingSize / formatSize", () => {
  it("computes W × D × H", () => {
    expect(boundingSize([0, 0, 0], [72, 70, 95])).toEqual([72, 70, 95]);
    expect(boundingSize([-70, -70, -13], [75, 79, 38])).toEqual([145, 149, 51]);
  });
  it("never returns negative sizes", () => {
    expect(boundingSize([5, 5, 5], [0, 0, 0])).toEqual([0, 0, 0]);
  });
  it("formats with at most one decimal", () => {
    expect(formatSize([72, 70, 95])).toBe("72 × 70 × 95 mm");
    expect(formatSize([143.47, 116.63, 62.83])).toBe("143.5 × 116.6 × 62.8 mm");
  });
});

describe("layerCount", () => {
  it("uses 0.2 mm layers by default", () => {
    expect(layerCount(58)).toBe(290);
    expect(layerCount(95)).toBe(475);
    expect(layerCount(0.2)).toBe(1);
  });
  it("rounds partial layers up and tolerates float noise", () => {
    expect(layerCount(0.3)).toBe(2);
    expect(layerCount(19.4)).toBe(97);
    expect(layerCount(58.0000000001)).toBe(290);
  });
  it("supports other layer heights", () => {
    expect(layerCount(10, 0.1)).toBe(100);
    expect(layerCount(10, 0.3)).toBe(34);
  });
  it("returns 0 for invalid input", () => {
    expect(layerCount(0)).toBe(0);
    expect(layerCount(-1)).toBe(0);
    expect(layerCount(10, 0)).toBe(0);
    expect(layerCount(Number.NaN)).toBe(0);
  });
});

describe("nearestHotspot", () => {
  const hotspots = [
    { id: "slot", label: "Slot", position: [15, 35, 20] as Vec3, radius: 10 },
    { id: "neck", label: "Neck", position: [18.6, 35, 15.5] as Vec3, radius: 6 },
    { id: "top", label: "Top", position: [70, 35, 95] as Vec3, radius: 8 },
  ];

  it("returns null when nothing is in range", () => {
    expect(nearestHotspot([0, 0, 0], hotspots)).toBeNull();
    expect(nearestHotspot([1, 1, 1], [])).toBeNull();
  });
  it("returns the hotspot that contains the point", () => {
    expect(nearestHotspot([70, 34, 90], hotspots)?.id).toBe("top");
    expect(nearestHotspot([15, 35, 28], hotspots)?.id).toBe("slot");
  });
  it("picks the closest centre when ranges overlap", () => {
    expect(nearestHotspot([18, 35, 16], hotspots)?.id).toBe("neck");
    expect(nearestHotspot([15.5, 35, 19.5], hotspots)?.id).toBe("slot");
  });
  it("treats the radius as inclusive", () => {
    expect(nearestHotspot([25, 35, 20], hotspots)?.id).toBe("slot");
    expect(nearestHotspot([25.001, 35, 20], [hotspots[0]])).toBeNull();
  });
});

describe("sliceTriangles", () => {
  it("slices a triangle crossing the plane into one segment", () => {
    // Triangle in the XY plane spanning y = 0..2.
    const tri = [0, 0, 0, 2, 0, 0, 0, 2, 0];
    const seg = sliceTriangles(tri, 1, 1);
    expect(seg).toHaveLength(6);
    const ys = [seg[1], seg[4]];
    expect(ys).toEqual([1, 1]);
    const xs = [seg[0], seg[3]].sort();
    expect(xs[0]).toBeCloseTo(0);
    expect(xs[1]).toBeCloseTo(1);
  });
  it("ignores triangles that do not cross", () => {
    expect(sliceTriangles([0, 0, 0, 1, 0, 0, 0, 1, 0], 1, 5)).toEqual([]);
  });
});
