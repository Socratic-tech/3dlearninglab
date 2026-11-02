/** Assigning the Puzzle Cube finale from the Projects page gives the class the whole sketch-to-ship sequence. */
import { describe, expect, it } from "vitest";
import { lessonsInPath } from "@/content";
import { projectMissions, projectPath } from "../../web/src/custom-path";

describe("Puzzle Cube on the Projects page", () => {
  it("is one project whose path is the full 18-mission course", () => {
    const puzzleProjects = projectMissions().filter((l) => l.id.startsWith("puzzle-")).map((l) => l.id);
    expect(puzzleProjects).toEqual(["puzzle-ship-it"]);
    expect(projectPath("puzzle-ship-it")).toEqual(lessonsInPath("puzzle-cube").map((x) => x.lesson.id));
  });
});
