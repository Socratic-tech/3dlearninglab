/**
 * Runs the real Apps Script bundle (apps-script/dist) inside a VM with in-memory fakes of
 * SpreadsheetApp, LockService, CacheService, UrlFetchApp, DriveApp, etc.
 * Requires `npm run pages:prepare` (done automatically by the test via execSync if dist is missing).
 */
import { beforeEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import vm from "node:vm";
import { decodeFeed, encodeFeed, ENGINE, type Feed } from "@/lib/content-feed";
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
    // XP: first try 10 + first correct 5; today counts toward the goal and starts a streak
    expect(me.data.stats).toMatchObject({ xp: 15, todayXp: 15, streak: 1, goal: 50 });
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
    // iPad/iPhone photos (HEIC) and WebP work too; one folder for the book + one per student, reused
    const heic = Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from("ftypheic"), Buffer.alloc(8)]).toString("base64");
    expect(env.call("maya@school.org", "submitEvidence", { lessonId: "holes", blockId: "submit", kind: "screenshot", file: { name: "IMG_0042.HEIC", base64: heic } }).ok).toBe(true);
    const webp = Buffer.concat([Buffer.from("RIFF"), Buffer.alloc(4), Buffer.from("WEBPVP8 ")]).toString("base64");
    expect(env.call("maya@school.org", "submitEvidence", { lessonId: "holes", blockId: "submit", kind: "screenshot", file: { name: "shot.webp", base64: webp } }).ok).toBe(true);
    expect(env.files).toHaveLength(3);
    expect(env.folders).toHaveLength(2);
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

  it("keeps XP in the Summary tab so loading never re-reads every answer", () => {
    env.call("teacher@school.org", "addStudents", { classId, students: [{ email: "maya@school.org" }] });
    const mc = allBlocks(getLesson("holes")!).find((b) => b.type === "multipleChoice")!;
    if (mc.type !== "multipleChoice") throw new Error();
    env.call("maya@school.org", "answerBlock", { lessonId: "holes", blockId: mc.id, response: { type: "multipleChoice", optionIds: mc.correctOptionIds } });
    // wipe the raw answer log: stats must still come from the running summary
    env.sheets.get("Attempts")!.data.splice(1);
    expect(env.call("maya@school.org", "me").data.stats.xp).toBe(15);
    expect(env.sheets.get("Summary")!.data.length).toBe(2);
  });

  it("shows stuck students and most-missed questions without reading the answer log", () => {
    env.call("teacher@school.org", "addStudents", { classId, students: [{ email: "maya@school.org" }, { email: "luis@school.org" }] });
    const mc = allBlocks(getLesson("holes")!).find((b) => b.type === "multipleChoice")!;
    if (mc.type !== "multipleChoice") throw new Error();
    const wrong = { type: "multipleChoice", optionIds: [mc.options.find((o) => !mc.correctOptionIds.includes(o.id))!.id] };
    for (let i = 0; i < 3; i++) env.call("maya@school.org", "answerBlock", { lessonId: "holes", blockId: mc.id, response: wrong });
    env.call("luis@school.org", "answerBlock", { lessonId: "holes", blockId: mc.id, response: wrong });
    env.sheets.get("Attempts")!.data.splice(1);
    const live = env.call("teacher@school.org", "classData", { classId }).data.live;
    expect(live.stuck).toHaveLength(1);
    expect(live.stuck[0]).toMatchObject({ email: "maya@school.org", attempts: 3 });
    expect(live.missed[0]).toMatchObject({ lessonId: "holes", blockId: mc.id, count: 2 });
    expect(live.activeToday).toBe(2);
  });

  it("runs a print queue: student requests, teacher moves it along, student sees the status", () => {
    env.call("teacher@school.org", "addStudents", { classId, students: [{ email: "maya@school.org" }] });
    const stl = Buffer.from("solid x\nendsolid x").toString("base64");
    const up = env.call("maya@school.org", "submitEvidence", { lessonId: "holes", blockId: "submit", kind: "stl", file: { name: "box.stl", base64: stl }, requestPrint: true, note: "red please" });
    expect(up.ok).toBe(true);
    const cd = env.call("teacher@school.org", "classData", { classId }).data;
    expect(cd.prints).toHaveLength(1);
    expect(cd.prints[0]).toMatchObject({ status: "requested", note: "red please", fileName: "box.stl" });
    // asking twice for the same file doesn't create a duplicate
    expect(env.call("maya@school.org", "requestPrint", { evidenceId: up.data.id }).data.id).toBe(cd.prints[0].id);
    expect(env.call("maya@school.org", "updatePrint", { printId: cd.prints[0].id, status: "done" }).ok).toBe(false);
    env.call("teacher@school.org", "updatePrint", { printId: cd.prints[0].id, status: "done", teacherNote: "Bin 3" });
    expect(env.call("maya@school.org", "me").data.prints[0]).toMatchObject({ status: "done", teacherNote: "Bin 3" });
  });
});

describe("Setup sidebar", () => {
  it("before deploying: no links yet; after: Workspace URL normalized into class links", () => {
    const pre = makeEnv("teacher@school.org");
    expect(pre.run("sidebarState()")).toMatchObject({ ready: true, url: null, teacherLink: null });
    const live = makeEnv("teacher@school.org", { webAppUrl: "https://script.google.com/a/macros/school.org/s/AKfy123/exec" });
    const st = live.run("sidebarCreateClass({ name: 'Robotics', section: 'P4', pathId: '9-week' })");
    expect(st.url).toBe("https://script.google.com/macros/s/AKfy123/exec");
    expect(st.classes).toHaveLength(1);
    expect(st.classes[0].link).toContain("?api=https%3A%2F%2Fscript.google.com%2Fmacros%2Fs%2FAKfy123%2Fexec");
    expect(st.classes[0].link).toContain("&class=");
    expect(st.teacherLink).toMatch(/#\/teacher$/);
  });

  it("setting up never touches the Apps Script API (Google blocks it in Sheet copies)", () => {
    const e = makeEnv("teacher@school.org");
    const st = e.run("sidebarAutoSetup()");
    expect(st).toMatchObject({ ready: true, url: null });
    expect(st.editorUrl).toBe("https://script.google.com/d/script-1/edit");
    expect(e.scriptApiCalls).toHaveLength(0);
  });

  it("engine updates are a copy and paste: the panel links the published paste page, and there is no update action", () => {
    const e = makeEnv("teacher@school.org", { webAppUrl: "https://script.google.com/macros/s/AKfy123/exec" });
    expect(e.run("sidebarState()").pasteUrl).toBe("https://socratic-tech.github.io/3dlearninglab/apps-script/paste.html");
    expect(e.call("teacher@school.org", "updateApp")).toMatchObject({ ok: false });
    expect(e.scriptApiCalls).toHaveLength(0);
  });




  it("a copied template starts fresh for the new teacher and fills in their domain", () => {
    const e = makeEnv("teacher@school.org");
    e.props.set("UPLOAD_FOLDER_ID", "someone-elses-folder");
    e.props.set("OWNER", "original@resa.org");
    e.run("sidebarPrepare()");
    expect(e.props.get("UPLOAD_FOLDER_ID")).toBeUndefined();
    expect(e.props.get("OWNER")).toBe("teacher@school.org");
    expect(e.run("sidebarSaveSettings({ domains: 'School.org  students.school.org', teacherEmails: '', autoEnroll: true })")).toMatchObject({ domains: "school.org,students.school.org", autoEnroll: true });
  });

  it("a student's save doesn't wait on another student's lock, and repeat saves keep one row", () => {
    const e = makeEnv();
    const cid = e.call("teacher@school.org", "createClass", { name: "3D" }).data.id;
    e.call("teacher@school.org", "addStudents", { classId: cid, students: [{ email: "maya@school.org" }, { email: "luis@school.org" }] });
    const mc = allBlocks(getLesson("navigating-tinkercad")!).find((b) => b.id === "box-select")!;
    if (mc.type !== "multipleChoice") throw new Error();
    e.run(`(CacheService.getScriptCache().put("slk_maya@school.org", "someone-else", 20), true)`); // Maya is mid-save elsewhere
    const t0 = Date.now();
    const wrong = { type: "multipleChoice", optionIds: [mc.options.find((o) => !mc.correctOptionIds.includes(o.id))!.id] };
    expect(e.call("luis@school.org", "answerBlock", { lessonId: "navigating-tinkercad", blockId: mc.id, response: wrong }).ok).toBe(true);
    expect(e.call("luis@school.org", "answerBlock", { lessonId: "navigating-tinkercad", blockId: mc.id, response: wrong }).data.attempts).toBe(2);
    expect(Date.now() - t0).toBeLessThan(2000);
    const rows = e.sheets.get("Progress")!.data.filter((r) => r[0] === "luis@school.org" && r[1] === "navigating-tinkercad");
    expect(rows).toHaveLength(1);
  });

  it("admins listed in ADMIN_EMAILS get staff access, even from another domain", () => {
    const e = makeEnv();
    e.sheets.get("Config")!.data.forEach((r) => { if (r[0] === "ADMIN_EMAILS") r[1] = "principal@resa.org"; });
    const me = e.call("principal@resa.org", "me");
    expect(me.ok).toBe(true);
    expect(me.data.user).toMatchObject({ role: "teacher", admin: true });
    expect(e.call("principal@resa.org", "createClass", { name: "Admin test" }).ok).toBe(true);
    expect(e.call("stranger@resa.org", "me").ok).toBe(false);
  });
});

describe("Lesson content feed", () => {
  const builtIn = () => {
    const ctx: { CONTENT_FEED?: Feed } = {};
    vm.runInNewContext(fs.readFileSync(path.join(dist, "Content.js"), "utf8").replace("var CONTENT_FEED", "this.CONTENT_FEED"), ctx);
    return decodeFeed(ctx.CONTENT_FEED!) as { lessons: Record<string, { blocks: Record<string, { correctOptionIds?: string[]; options?: { id: string }[] }> }> };
  };
  const holesSkill = () => {
    const mc = allBlocks(getLesson("holes")!).find((b) => b.type === "multipleChoice" && b.check === "skill")!;
    if (mc.type !== "multipleChoice") throw new Error();
    return { mc, other: mc.options.find((o) => !mc.correctOptionIds.includes(o.id))!.id };
  };
  const setup = (body: string | null) => {
    const feed = { body, fetches: 0 };
    const e = makeEnv("teacher@school.org", { feed });
    const cls = e.call("teacher@school.org", "createClass", { name: "Feed", pathId: "18-week" }).data.id;
    e.call("teacher@school.org", "addStudents", { classId: cls, students: [{ email: "maya@school.org" }] });
    return { e, feed };
  };
  const answer = (e: ReturnType<typeof makeEnv>, optionId: string) =>
    e.call("maya@school.org", "answerBlock", { lessonId: "holes", blockId: holesSkill().mc.id, response: { type: "multipleChoice", optionIds: [optionId] } }).data.correct;

  it("uses edited lessons from the website without any engine update", () => {
    const { mc, other } = holesSkill();
    const c = builtIn();
    c.lessons.holes.blocks[mc.id].correctOptionIds = [other]; // the lesson was edited: a different answer is right now
    const { e, feed } = setup(JSON.stringify(encodeFeed(c, "v-edit")));
    expect(answer(e, other)).toBe(true);
    expect(e.call("teacher@school.org", "me").data.app).toMatchObject({ content: "v-edit", engineBehind: false });
    // cached in pieces under the 100 KB limit; the next request doesn't download again
    expect(Number(e.cache.get("cf_n"))).toBeGreaterThan(1);
    const before = feed.fetches;
    answer(e, other);
    expect(feed.fetches).toBe(before);
  });

  it("refuses a damaged, malformed or too-new feed and keeps the last good lessons", () => {
    const { mc, other } = holesSkill();
    const good = encodeFeed(builtIn(), "v-good");
    const tampered = { ...good, data: good.data.slice(0, -40) + "A".repeat(40) };
    const broken = builtIn() as unknown as Record<string, unknown>;
    delete broken.paths;
    const tooNew = encodeFeed(builtIn(), "v-new", 99);
    for (const body of ["<html>captive portal</html>", JSON.stringify(tampered), JSON.stringify(encodeFeed(broken, "v-bad")), JSON.stringify(tooNew), null]) {
      const { e } = setup(body);
      expect([String(body).slice(0, 30), answer(e, other)]).toEqual([String(body).slice(0, 30), false]); // built-in answer key still used
      expect(answer(e, mc.correctOptionIds[0])).toBe(true);
      expect(e.call("teacher@school.org", "me").data.app.content).toBe("built-in");
    }
    const { e } = setup(JSON.stringify(tooNew));
    expect(e.call("teacher@school.org", "me").data.app.engineBehind).toBe(true);
  });

  it("when the website goes down, keeps using the last good copy", () => {
    const { mc, other } = holesSkill();
    const c = builtIn();
    c.lessons.holes.blocks[mc.id].correctOptionIds = [other];
    const { e, feed } = setup(JSON.stringify(encodeFeed(c, "v-edit")));
    expect(answer(e, other)).toBe(true);
    feed.body = null;
    e.cache.delete("cf_fresh"); // 15 minutes later: time to check, and the site is down
    expect(answer(e, other)).toBe(true);
    expect(e.call("teacher@school.org", "me").data.app.content).toBe("v-edit");
  });

  it("the published feed matches the lessons and passes validation", () => {
    const f = JSON.parse(fs.readFileSync(path.join(process.cwd(), "web/public/apps-script/content.json"), "utf8"));
    expect(f).toMatchObject({ format: 1, engine: ENGINE });
    expect(JSON.stringify(f)).not.toContain("correctOptionIds"); // answer keys aren't readable in the file
    expect(fs.readFileSync(path.join(dist, "Content.js"), "utf8")).not.toContain("correctOptionIds"); // nor in the paste page's Content file
  });
});
