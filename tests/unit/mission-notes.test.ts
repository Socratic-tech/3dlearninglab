/** Teacher notes on missions: saved per class in the Sheet, sent to that class's students, plain text and limited. */
import { beforeEach, describe, expect, it } from "vitest";
import { execSync } from "node:child_process";
import { makeEnv } from "../helpers/apps-script-env";

execSync("npx tsx scripts/build-pages.ts", { stdio: "ignore" });

let env: ReturnType<typeof makeEnv>;
let classId: string;
beforeEach(() => {
  env = makeEnv();
  classId = env.call("teacher@school.org", "createClass", { name: "3D Design", section: "Period 2", pathId: "puzzle-cube" }).data.id;
  env.call("teacher@school.org", "addStudents", { classId, students: [{ email: "maya@school.org", name: "Maya" }] });
});

describe("mission notes", () => {
  it("a teacher's note reaches that class's students", () => {
    const r = env.call("teacher@school.org", "updateClass", { classId, lessonNote: { lessonId: "puzzle-good-puzzle", text: "  Grab a bag of math cubes first.  " } });
    expect(r.ok).toBe(true);
    expect(r.data.notes).toEqual({ "puzzle-good-puzzle": "Grab a bag of math cubes first." });
    expect(env.call("maya@school.org", "me").data.cls.notes["puzzle-good-puzzle"]).toBe("Grab a bag of math cubes first.");
  });

  it("an empty note removes it, other notes stay", () => {
    env.call("teacher@school.org", "updateClass", { classId, lessonNote: { lessonId: "puzzle-good-puzzle", text: "One" } });
    env.call("teacher@school.org", "updateClass", { classId, lessonNote: { lessonId: "puzzle-sketch-cubes", text: "Two" } });
    const r = env.call("teacher@school.org", "updateClass", { classId, lessonNote: { lessonId: "puzzle-good-puzzle", text: "" } });
    expect(r.data.notes).toEqual({ "puzzle-sketch-cubes": "Two" });
  });

  it("only known missions; notes are plain and length-limited; students can't write them", () => {
    expect(env.call("teacher@school.org", "updateClass", { classId, lessonNote: { lessonId: "not-a-mission", text: "x" } }).ok).toBe(false);
    const long = env.call("teacher@school.org", "updateClass", { classId, lessonNote: { lessonId: "puzzle-good-puzzle", text: "a\u0007b" + "x".repeat(900) } });
    expect(long.data.notes["puzzle-good-puzzle"]).toHaveLength(600);
    expect(long.data.notes["puzzle-good-puzzle"].startsWith("ab")).toBe(true);
    expect(env.call("maya@school.org", "updateClass", { classId, lessonNote: { lessonId: "puzzle-good-puzzle", text: "hi" } }).ok).toBe(false);
  });

  it("classes without notes send an empty set", () => {
    expect(env.call("teacher@school.org", "me").data.cls.notes).toEqual({});
  });
});
