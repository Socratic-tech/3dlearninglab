/** Classes assigned an older copy of a built-in project are offered the current version. */
import { describe, expect, it } from "vitest";
import { assignProject, projectUpdate } from "../../web/src/custom-path";

describe("project updates", () => {
  it("offers the 18-mission Puzzle Cube to a class still on the old Playtest and Ship project", () => {
    const old = { title: "Puzzle Cube: Playtest and Ship", brief: "", requirements: [], project: "puzzle-playtest", lessonIds: ["navigating-tinkercad", "exact-dimensions", "puzzle-think-in-cubes", "puzzle-playtest"] };
    const fresh = projectUpdate(old)!;
    expect(fresh.project).toBe("puzzle-ship-it");
    expect(fresh.lessonIds).toHaveLength(18);
    expect(fresh.lessonIds.at(-1)).toBe("puzzle-ship-it");
  });

  it("stays quiet when the class already has the current version, or no built-in project", () => {
    expect(projectUpdate(assignProject("puzzle-ship-it"))).toBeNull();
    expect(projectUpdate({ title: "My path", brief: "", requirements: [], lessonIds: ["holes"], project: null })).toBeNull();
    expect(projectUpdate(null)).toBeNull();
  });

  it("offers an update when a project's lessons changed since it was assigned", () => {
    const current = assignProject("boss-nametag")!;
    expect(projectUpdate({ ...current, lessonIds: current.lessonIds.slice(1) })?.lessonIds).toEqual(current.lessonIds);
  });
});
