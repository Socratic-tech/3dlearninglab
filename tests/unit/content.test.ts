import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { lessons, paths, validateCurriculum, modelAssets, allBlocks, assetsForLesson, lessonsInPath } from "@/content";
import { isScorable, redactBlock, scoreBlock } from "@/lib/scoring";

const REQUIRED_V1 = [
  "what-is-3d-printing", "print-detective", "navigating-tinkercad", "moving-objects", "scaling-objects", "exact-dimensions",
  "rotating-objects", "workplanes", "grouping", "holes", "align", "duplicate", "repeat-duplicate", "mirror", "text", "boss-nametag",
  "ruler", "measuring-real-objects", "calipers", "tolerances", "make-it-fit", "layers", "orientation", "strength", "overhangs",
  "bridging", "supports", "material-efficiency", "print-failures", "cad-er", "product-design", "interviewing-a-user",
  "writing-constraints", "prototype", "testing", "iteration", "final-capstone", "maker-showcase",
];

describe("curriculum content", () => {
  it("validates with no cross-reference problems", () => {
    expect(validateCurriculum()).toEqual([]);
  });

  it("contains every required V1 lesson (spec §51)", () => {
    const ids = new Set(lessons.map((l) => l.id));
    for (const id of REQUIRED_V1) expect(ids.has(id), id).toBe(true);
  });

  it("each lesson has a prove-it task and a reflection", () => {
    for (const l of lessons) {
      const blocks = allBlocks(l);
      expect(blocks.some((b) => b.type === "reflection"), `${l.id} reflection`).toBe(true);
      expect(l.sections.some((s) => s.phase === "prove") || l.kind === "showcase", `${l.id} prove`).toBe(true);
    }
  });

  it("9-week and 18-week paths are both complete arcs", () => {
    const nine = paths.find((p) => p.id === "9-week")!;
    const eighteen = paths.find((p) => p.id === "18-week")!;
    expect(nine.weeks).toHaveLength(9);
    expect(eighteen.weeks).toHaveLength(18);
    expect(lessonsInPath("9-week").at(-1)!.lesson.id).toBe("mini-design-sprint");
    expect(lessonsInPath("18-week").at(-1)!.lesson.id).toBe("maker-showcase");
  });

  it("every bundled model file exists on disk", () => {
    for (const a of modelAssets.filter((m) => m.localFilePath)) {
      expect(fs.existsSync(path.join(process.cwd(), "public", a.localFilePath!)), a.id).toBe(true);
    }
  });

  it("external models are never bundled without license verification", () => {
    for (const a of modelAssets.filter((m) => !m.original)) {
      if (a.localFilePath) expect(a.sourceVerifiedAt, a.id).toBeTruthy();
    }
  });

  it("every lesson's required model files are available in the platform", () => {
    for (const l of lessons) for (const a of assetsForLesson(l)) if (a.original) expect(a.localFilePath).toBeTruthy();
  });

  it("redaction removes answer keys from every scorable block", () => {
    for (const l of lessons)
      for (const b of allBlocks(l)) {
        if (!isScorable(b)) continue;
        const r = JSON.stringify(redactBlock(b));
        if (b.type === "multipleChoice") for (const c of b.correctOptionIds) expect(r.includes(`"correctOptionIds":["${c}"`)).toBe(false);
        if (b.type === "measurement") expect((redactBlock(b) as typeof b).answer).toBe(0);
        if (b.type === "hotspot") expect((redactBlock(b) as typeof b).hotspots.every((h) => !h.correct)).toBe(true);
      }
  });

  it("the authored correct answer scores as correct for every scorable block", () => {
    for (const l of lessons)
      for (const b of allBlocks(l)) {
        if (b.type === "multipleChoice") expect(scoreBlock(b, { type: "multipleChoice", optionIds: b.correctOptionIds }).correct, `${l.id}/${b.id}`).toBe(true);
        if (b.type === "ordering") expect(scoreBlock(b, { type: "ordering", order: b.items.map((i) => i.id) }).correct).toBe(true);
        if (b.type === "matching") expect(scoreBlock(b, { type: "matching", pairs: Object.fromEntries(b.pairs.map((p) => [p.id, p.id])) }).correct).toBe(true);
        if (b.type === "measurement") expect(scoreBlock(b, { type: "measurement", value: b.answer }).correct).toBe(true);
        if (b.type === "hotspot") {
          const h = b.hotspots.find((x) => x.correct)!;
          expect(scoreBlock(b, { type: "hotspot", point: h.position }).correct, `${l.id}/${b.id}`).toBe(true);
        }
      }
  });
});

describe("matching with repeated labels", () => {
  it("accepts either example in either row of the same group, but not the same example twice", () => {
    const b = { id: "sort", type: "matching" as const, prompt: "", explanation: "", check: "practice" as const, pairs: [
      { id: "p1", left: "Subtractive", right: "Drill" }, { id: "p2", left: "Additive", right: "Print" },
      { id: "p3", left: "Subtractive", right: "Carve" }, { id: "p4", left: "Additive", right: "Clay" } ] };
    expect(scoreBlock(b, { type: "matching", pairs: { p1: "p3", p2: "p4", p3: "p1", p4: "p2" } }).correct).toBe(true);
    expect(scoreBlock(b, { type: "matching", pairs: { p1: "p1", p2: "p2", p3: "p1", p4: "p4" } }).correct).toBe(false);
  });
});
