import { describe, expect, it } from "vitest";
import { allBlocks, lessons } from "@/content";
import { FLAVOR } from "@/content/flavor";

describe("lesson flavor (real-world openers, clients, themes)", () => {
  it("every lesson has a short real-world opener", () => {
    for (const l of lessons) {
      const f = FLAVOR[l.id];
      expect(f, l.id).toBeTruthy();
      expect(f.hook.headline.length, l.id).toBeLessThan(90);
      expect(f.hook.body.split(/\s+/).length, l.id).toBeLessThanOrEqual(55);
    }
  });
  it("clients and themes point at real challenge blocks", () => {
    for (const [lessonId, f] of Object.entries(FLAVOR)) {
      const lesson = lessons.find((l) => l.id === lessonId);
      expect(lesson, lessonId).toBeTruthy();
      const challengeIds = allBlocks(lesson!).filter((b) => b.type === "challenge").map((b) => b.id);
      for (const id of [...Object.keys(f.clients ?? {}), ...Object.keys(f.themes ?? {})]) expect(challengeIds, `${lessonId}.${id}`).toContain(id);
      for (const t of Object.values(f.themes ?? {})) expect(t.length).toBeGreaterThanOrEqual(2);
    }
  });
});
