import { describe, expect, it } from "vitest";
import { computeStats, XP } from "@/lib/streaks";
import { redactBlock, scoreBlock, toClientResult } from "@/lib/scoring";
import { getLesson, allBlocks } from "@/content";

const at = (d: string) => `${d}T15:00:00Z`;

describe("streaks and XP", () => {
  it("counts first try, first correct, work and lessons once each", () => {
    const s = computeStats(
      [
        { kind: "attempt", at: at("2026-10-01"), lessonId: "l", blockId: "b", correct: false },
        { kind: "attempt", at: at("2026-10-01"), lessonId: "l", blockId: "b", correct: true },
        { kind: "attempt", at: at("2026-10-01"), lessonId: "l", blockId: "b", correct: true },
        { kind: "work", at: at("2026-10-02"), lessonId: "l", blockId: "r" },
        { kind: "lesson", at: at("2026-10-02"), lessonId: "l" },
        { kind: "lesson", at: at("2026-10-02"), lessonId: "l" },
      ],
      { now: new Date(at("2026-10-02")), timeZone: "America/Detroit" },
    );
    expect(s.xp).toBe(XP.firstTry + XP.firstCorrect + XP.work + XP.lesson);
    expect(s.todayXp).toBe(XP.work + XP.lesson);
    expect(s.streak).toBe(2);
    expect(s.week.at(-1)).toEqual({ day: "2026-10-02", xp: 70 });
    expect(s.byLesson.l).toBe(s.xp);
  });

  it("keeps yesterday's streak alive until today ends, and breaks on a gap", () => {
    const ev = (d: string) => ({ kind: "attempt" as const, at: at(d), lessonId: d, blockId: "b", correct: null });
    expect(computeStats([ev("2026-09-30"), ev("2026-10-01")], { now: new Date(at("2026-10-02")) }).streak).toBe(2);
    expect(computeStats([ev("2026-09-28"), ev("2026-10-01")], { now: new Date(at("2026-10-02")) }).streak).toBe(1);
    expect(computeStats([ev("2026-09-29")], { now: new Date(at("2026-10-02")) }).streak).toBe(0);
  });
});

describe("slider blocks", () => {
  const b = allBlocks(getLesson("overhangs")!).find((x) => x.type === "slider")!;
  it("scores within tolerance and hides the answer", () => {
    expect(scoreBlock(b, { type: "slider", value: 46 }).correct).toBe(true);
    expect(scoreBlock(b, { type: "slider", value: 30 }).correct).toBe(false);
    expect(() => scoreBlock(b, { type: "slider", value: 999 })).toThrow();
    const r = redactBlock(b) as typeof b & { answer: number };
    expect(r.answer).toBe(0);
    expect(JSON.stringify(r)).not.toContain("halfway on the layer below. (Layers are 0.2 mm tall and 0.4 mm wide.)\",\"scene\":\"overhang\",\"min\":0,\"max\":75,\"step\":1,\"start\":10,\"unit\":\"°\",\"answer\":45");
  });
  it("reveals the answer after three tries", () => {
    const res = toClientResult(b, scoreBlock(b, { type: "slider", value: 10 }), 3);
    expect(res.reveal.answer).toBe(45);
  });
});
