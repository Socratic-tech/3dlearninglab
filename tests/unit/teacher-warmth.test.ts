/** Numbers behind the teacher's Simple view: class progress, today's wins and where each student is on the trail. */
import { describe, expect, it } from "vitest";
import { classCompletion, classStudents, whereTheClassIs, winsToday } from "../../web/src/pages/TeacherWarmth";
import type { Lesson } from "@/content/schema";

const L = (id: string) => ({ id, title: id }) as unknown as Lesson;
const path = [
  { lesson: L("a"), week: 1, weekTitle: "One" },
  { lesson: L("b"), week: 1, weekTitle: "One" },
  { lesson: L("c"), week: 2, weekTitle: "Two" },
];
const maya = { email: "maya@s.org", name: "Maya Okafor", status: "active" };
const luis = { email: "luis@s.org", name: "Luis H", status: "active" };
const done = (email: string, lessonId: string, at = "2026-10-01T10:00:00Z") => ({ email, lessonId, status: "completed", updatedAt: at });

describe("teacher Simple view numbers", () => {
  it("leaves out archived students and the teacher's test student", () => {
    const all = [maya, { ...luis, status: "archived" }, { email: "t+student@s.org", name: "Test", status: "active" }];
    expect(classStudents(all).map((s) => s.email)).toEqual(["maya@s.org"]);
  });

  it("averages finished missions over the class", () => {
    expect(classCompletion([maya, luis], [done("maya@s.org", "a"), done("maya@s.org", "b"), done("maya@s.org", "c")], path)).toBe(50);
    expect(classCompletion([], [], path)).toBe(0);
  });

  it("lists missions finished today, newest first, for class students only", () => {
    const wins = winsToday([maya, luis], [done("maya@s.org", "a", "2026-11-01T09:00:00Z"), done("luis@s.org", "a", "2026-11-01T10:00:00Z"), done("maya@s.org", "b", "2026-10-31T10:00:00Z"), done("gone@s.org", "a", "2026-11-01T11:00:00Z")], "2026-11-01");
    expect(wins.map((w) => w.student.name)).toEqual(["Luis H", "Maya Okafor"]);
  });

  it("puts each student on the unit of their next unfinished mission", () => {
    const t = whereTheClassIs([maya, luis], [done("maya@s.org", "a"), done("maya@s.org", "b"), done("luis@s.org", "a")], path);
    expect(t.weeks.map((w) => [w.week, w.here.map((s) => s.name)])).toEqual([[1, ["Luis H"]], [2, ["Maya Okafor"]]]);
    expect(t.weeks[0]).toMatchObject({ finished: 3, total: 4 });
    const all = whereTheClassIs([maya], ["a", "b", "c"].map((id) => done("maya@s.org", id)), path);
    expect(all.finishedAll.map((s) => s.name)).toEqual(["Maya Okafor"]);
  });
});
