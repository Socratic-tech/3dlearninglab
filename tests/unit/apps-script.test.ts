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
beforeEach(() => {
  env = makeEnv();
});

describe("Apps Script API", () => {
  it("rejects strangers and unrostered students, admits rostered ones", () => {
    expect(env.call("kid@gmail.com", "me").ok).toBe(false);
    expect(env.call("maya@school.org", "me").error).toMatch(/roster/);
    expect(env.call("teacher@school.org", "addStudents", { students: [{ email: "maya@school.org", name: "Maya" }] }).data.added).toBe(1);
    const me = env.call("maya@school.org", "me");
    expect(me.ok).toBe(true);
    expect(me.data.user.role).toBe("student");
  });

  it("students cannot use teacher actions", () => {
    env.call("teacher@school.org", "addStudents", { students: [{ email: "maya@school.org" }] });
    expect(env.call("maya@school.org", "classData").error).toMatch(/access/);
    expect(env.call("maya@school.org", "override", { email: "maya@school.org", competencyId: "B3", level: "independent" }).ok).toBe(false);
  });

  it("scores on the server, records levels, and completion is separate from proficiency", () => {
    env.call("teacher@school.org", "addStudents", { students: [{ email: "maya@school.org" }] });
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
    env.call("teacher@school.org", "addStudents", { students: [{ email: "maya@school.org" }] });
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
    env.call("teacher@school.org", "addStudents", { students: [{ email: "maya@school.org" }] });
    const bad = env.call("maya@school.org", "submitEvidence", { lessonId: "holes", blockId: "submit", kind: "screenshot", file: { name: "x.png", base64: Buffer.from("not an image").toString("base64") } });
    expect(bad.error).toMatch(/damaged/);
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]).toString("base64");
    expect(env.call("maya@school.org", "submitEvidence", { lessonId: "holes", blockId: "submit", kind: "screenshot", file: { name: "x.png", base64: png } }).ok).toBe(true);
    expect(env.files).toHaveLength(1);
  });
});
