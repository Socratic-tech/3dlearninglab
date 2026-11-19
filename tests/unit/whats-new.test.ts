import { describe, expect, it } from "vitest";
import { isNewTeacherDevice, latestReleaseId, RELEASES, unseenReleases, type Release } from "../../web/src/whatsnew";

const rel = (id: string): Release => ({ id, title: id, items: ["x"] });

describe("what's new for teachers", () => {
  it("shows everything to a teacher who has never dismissed anything", () => {
    expect(unseenReleases(null, [rel("2026-01-01-a"), rel("2026-02-01-b")]).map((r) => r.id)).toEqual(["2026-01-01-a", "2026-02-01-b"]);
  });
  it("shows only releases newer than the last one dismissed, and nothing once up to date", () => {
    const all = [rel("2026-01-01-a"), rel("2026-02-01-b"), rel("2026-03-01-c")];
    expect(unseenReleases("2026-01-01-a", all).map((r) => r.id)).toEqual(["2026-02-01-b", "2026-03-01-c"]);
    expect(unseenReleases("2026-03-01-c", all)).toEqual([]);
  });
  it("dismissing remembers the newest release", () => {
    expect(unseenReleases(latestReleaseId())).toEqual([]);
  });
  it("treats a device that ran the setup walkthrough as a new teacher", () => {
    expect(isNewTeacherDevice(() => null)).toBe(false);
    expect(isNewTeacherDevice((k) => (k === "academy.setupStepsDone.queue" ? "[1]" : null))).toBe(true);
  });
  it("keeps releases in order with unique ids and something to say", () => {
    const ids = RELEASES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual(ids);
    RELEASES.forEach((r) => expect(r.items.length).toBeGreaterThan(0));
  });
});
