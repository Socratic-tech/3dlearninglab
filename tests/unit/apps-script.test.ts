/**
 * Runs the real Apps Script bundle (apps-script/dist) inside a VM with in-memory fakes of
 * SpreadsheetApp, LockService, CacheService, UrlFetchApp, DriveApp, etc.
 * Requires `npm run pages:prepare` (done automatically by the test via execSync if dist is missing).
 */
import { beforeEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { getLesson, allBlocks } from "@/content";
import { makeEnv } from "../helpers/apps-script-env";

const dist = path.join(process.cwd(), "apps-script/dist");
if (!fs.existsSync(path.join(dist, "Code.js"))) execSync("npx tsx scripts/build-pages.ts", { stdio: "inherit" });

let env: ReturnType<typeof makeEnv>;
let classId: string;
beforeEach(() => {
  env = makeEnv();
  classId = env.call("teacher@school.org", "createClass", { name: "3D Design", section: "Period 2", pathId: "18-week" }).data.id;
});

describe("Apps Script API", () => {
  it("rejects strangers and unrostered students, admits rostered ones", () => {
    expect(env.call("kid@gmail.com", "me").ok).toBe(false);
    expect(env.call("maya@school.org", "me").error).toMatch(/roster/);
    expect(env.call("teacher@school.org", "addStudents", { classId, students: [{ email: "maya@school.org", name: "Maya" }] }).data.added).toBe(1);
    const me = env.call("maya@school.org", "me");
    expect(me.ok).toBe(true);
    expect(me.data.user.role).toBe("student");
  });

  it("students cannot use teacher actions", () => {
    env.call("teacher@school.org", "addStudents", { classId, students: [{ email: "maya@school.org" }] });
    expect(env.call("maya@school.org", "classData").error).toMatch(/access/);
    expect(env.call("maya@school.org", "override", { email: "maya@school.org", competencyId: "B3", level: "independent" }).ok).toBe(false);
  });

  it("scores on the server, records levels, and completion is separate from proficiency", () => {
    env.call("teacher@school.org", "addStudents", { classId, students: [{ email: "maya@school.org" }] });
    const lesson = getLesson("holes")!;
    const mc = allBlocks(lesson).find((b) => b.type === "multipleChoice" && b.check === "skill")!;
    if (mc.type !== "multipleChoice") throw new Error();
    const wrong = env.call("maya@school.org", "answerBlock", { lessonId: "holes", blockId: mc.id, response: { type: "multipleChoice", optionIds: [mc.options.find((o) => !mc.correctOptionIds.includes(o.id))!.id] } });
    expect(wrong.data.correct).toBe(false);
    expect(wrong.data.explanation).toBeUndefined(); // no answer leak on first wrong try
    const right = env.call("maya@school.org", "answerBlock", { lessonId: "holes", blockId: mc.id, response: { type: "multipleChoice", optionIds: mc.correctOptionIds } });
    expect(right.data.correct).toBe(true);
    expect(env.call("maya@school.org", "completeLesson", { lessonId: "holes" }).error).toMatch(/still open/);
    const me = env.call("maya@school.org", "me");
    expect(me.data.levels.B3).toBe("developing"); // CAD skill: auto check alone never reaches proficient
  });

  it("teacher review and override update levels; best level wins", () => {
    env.call("teacher@school.org", "addStudents", { classId, students: [{ email: "maya@school.org" }] });
    const r = env.call("maya@school.org", "submitEvidence", { lessonId: "holes", blockId: "submit", kind: "design_url", url: "https://www.tinkercad.com/things/x" });
    expect(r.ok).toBe(true);
    const cls = env.call("teacher@school.org", "classData");
    expect(cls.data.evidence).toHaveLength(1);
    env.call("teacher@school.org", "review", { evidenceId: r.data.id, rating: 3, comment: "Great" });
    expect(env.call("maya@school.org", "me").data.levels.B3).toBe("independent");
    env.call("teacher@school.org", "override", { email: "maya@school.org", competencyId: "B3", level: "developing", comment: "check again" });
    expect(env.call("maya@school.org", "me").data.levels.B3).toBe("developing");
  });

  it("validates uploads", () => {
    env.call("teacher@school.org", "addStudents", { classId, students: [{ email: "maya@school.org" }] });
    const bad = env.call("maya@school.org", "submitEvidence", { lessonId: "holes", blockId: "submit", kind: "screenshot", file: { name: "x.png", base64: Buffer.from("not an image").toString("base64") } });
    expect(bad.error).toMatch(/damaged/);
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]).toString("base64");
    expect(env.call("maya@school.org", "submitEvidence", { lessonId: "holes", blockId: "submit", kind: "screenshot", file: { name: "x.png", base64: png } }).ok).toBe(true);
    expect(env.files).toHaveLength(1);
  });
});

describe("one workbook per teacher, many classes", () => {
  it("keeps rosters and class data separate per class", () => {
    const p5 = env.call("teacher@school.org", "createClass", { name: "STEAM Lab", section: "Period 5", pathId: "9-week" }).data.id;
    env.call("teacher@school.org", "addStudents", { classId, students: [{ email: "maya@school.org", name: "Maya" }] });
    env.call("teacher@school.org", "addStudents", { classId: p5, students: [{ email: "eli@school.org", name: "Eli" }] });
    const a = env.call("teacher@school.org", "classData", { classId }).data;
    const b = env.call("teacher@school.org", "classData", { classId: p5 }).data;
    expect(a.students.map((s: { email: string }) => s.email)).toEqual(["maya@school.org"]);
    expect(b.students.map((s: { email: string }) => s.email)).toEqual(["eli@school.org"]);
    expect(b.cls.pathId).toBe("9-week");
    expect(a.classes).toHaveLength(2);
    const me = env.call("eli@school.org", "me", { classId }).data; // asks for a class he isn't in
    expect(me.cls.id).toBe(p5);
    expect(me.classes).toHaveLength(1);
  });

  it("removing a student from one class keeps their other class", () => {
    const p5 = env.call("teacher@school.org", "createClass", { name: "STEAM Lab" }).data.id;
    env.call("teacher@school.org", "addStudents", { classId, students: [{ email: "maya@school.org" }] });
    env.call("teacher@school.org", "addStudents", { classId: p5, students: [{ email: "maya@school.org" }] });
    env.call("teacher@school.org", "removeStudent", { classId, email: "maya@school.org" });
    const me = env.call("maya@school.org", "me").data;
    expect(me.classes.map((c: { id: string }) => c.id)).toEqual([p5]);
  });

  it("auto-enrolls through a class link only when AUTO_ENROLL is on", () => {
    expect(env.call("new@school.org", "me", { classId }).ok).toBe(false);
    env.sheets.get("Config")!.data.forEach((r) => { if (r[0] === "AUTO_ENROLL") r[1] = "TRUE"; });
    expect(env.call("new@school.org", "me", { classId }).data.cls.id).toBe(classId);
    expect(env.call("other@school.org", "me", { classId: "nope" }).ok).toBe(false);
  });
});

describe("upgrading a single-class workbook", () => {
  it("turns the old Config class into a class and enrolls existing students", () => {
    const old = makeEnv();
    old.sheets.get("Config")!.data.push(["CLASS_NAME", "Period 2", ""], ["PATH_ID", "9-week", ""]);
    old.sheets.get("Users")!.data.push(["maya@school.org", "Maya", "student", "", "active", "", ""]);
    const me = old.call("maya@school.org", "me");
    expect(me.ok).toBe(true);
    expect(me.data.cls.name).toBe("Period 2");
    expect(me.data.cls.pathId).toBe("9-week");
  });
});

describe("lost replies", () => {
  it("a retried request with the same requestId does the work only once", () => {
    const body = JSON.stringify({ action: "createClass", token: "tok:teacher@school.org", requestId: "retry-test-1234", args: { name: "Period 7" } });
    const a = JSON.parse(env.raw(body));
    const b = JSON.parse(env.raw(body));
    expect(b).toEqual(a);
    const names = env.call("teacher@school.org", "me").data.classes.map((c: { name: string }) => c.name);
    expect(names.filter((n: string) => n === "Period 7")).toHaveLength(1);
  });
});
