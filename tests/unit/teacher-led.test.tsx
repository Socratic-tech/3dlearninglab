/** Teacher-led parts: students see what to do; only teacher views show the teacher's moves. */
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TeacherLedBlock, TeacherViewContext } from "@/components/lesson/static-blocks";
import { allBlocks, lessonsInPath } from "@/content";

const b = { id: "x", type: "teacherLed" as const, title: "Fill the square", minutes: 12, students: "Build an I, O, T and S.", teacher: "SECRET-MOVES: let them struggle.", devices: "away" as const };

describe("teacher-led block", () => {
  it("students see the task, not the teacher's moves", () => {
    const html = renderToStaticMarkup(<TeacherLedBlock b={b} />);
    expect(html).toContain("Build an I, O, T and S.");
    expect(html).toContain("Devices down");
    expect(html).not.toContain("SECRET-MOVES");
  });

  it("teachers see the moves too", () => {
    const html = renderToStaticMarkup(<TeacherViewContext.Provider value><TeacherLedBlock b={b} /></TeacherViewContext.Provider>);
    expect(html).toContain("SECRET-MOVES");
  });

  it("every Puzzle Cube mission has a teacher-led part and a run plan that fills the period", () => {
    for (const { lesson: l } of lessonsInPath("puzzle-cube")) {
      const id = l.id;
      expect(allBlocks(l).some((x) => x.type === "teacherLed"), id).toBe(true);
      expect(l.teacher.runPlan.reduce((n, x) => n + x.minutes, 0), id).toBe(l.estimatedMinutes);
      expect(l.teacher.lookFors.length, id).toBeGreaterThan(0);
    }
  });

  it("week 1 keeps devices down for most of each period", () => {
    for (const { lesson: l } of lessonsInPath("puzzle-cube").slice(0, 5)) {
      const away = l.teacher.runPlan.filter((x) => x.devices === "away").reduce((n, x) => n + x.minutes, 0);
      expect(away, l.id).toBeGreaterThanOrEqual(30);
    }
  });
});
