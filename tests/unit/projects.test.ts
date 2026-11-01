/** Projects page: every built-in project can be assigned as a class path that ends with the project. */
import { describe, expect, it } from "vitest";
import { lessonById } from "../../web/src/content";
import { assignProject, classLessons, decodeShareCode, encodeShareCode, projectMissions, projectPath } from "../../web/src/custom-path";

describe("Projects", () => {
  it("lists only project missions, not ordinary lessons or the teacher's own brief", () => {
    const kinds = new Set(projectMissions().map((l) => l.kind));
    expect([...kinds].every((k) => ["boss", "challenge", "capstone", "showcase", "lab"].includes(k))).toBe(true);
    expect(projectMissions().some((l) => l.id === "custom-project")).toBe(false);
    expect(projectMissions().length).toBeGreaterThan(5);
  });

  it("each project's path has every lesson it builds on, prerequisites first, and ends with the project", () => {
    for (const p of projectMissions()) {
      const ids = projectPath(p.id);
      expect(ids[ids.length - 1]).toBe(p.id);
      expect(new Set(ids).size).toBe(ids.length);
      ids.forEach((id, i) => (lessonById.get(id)?.prerequisites ?? []).forEach((q) => {
        const at = ids.indexOf(q);
        expect(at, `${q} (needed by ${id}) is in the ${p.id} path`).toBeGreaterThanOrEqual(0);
        expect(at, `${q} comes before ${id}`).toBeLessThan(i);
      }));
      expect(ids.length).toBeLessThanOrEqual(80); // the server keeps up to 80 lessons
    }
  });

  it("an assigned project is the last mission students see, with no extra mission after it", () => {
    const path = assignProject("boss-nametag")!;
    const cls = { id: "c", name: "C", section: "", pathId: "custom", tinkercadUrl: null, unlockAll: false, googleCourseId: null, custom: path };
    const shown = classLessons(cls).map((x) => x.lesson.id);
    expect(shown).toEqual(path.lessonIds);
    expect(shown).not.toContain("custom-project");
    // a share code keeps it
    expect(decodeShareCode(encodeShareCode(path))?.project).toBe("boss-nametag");
  });
});
