/**
 * Try-It mode (web/src/local-engine.ts): the website's Apps Script bundle running in the browser against a
 * localStorage "Sheet". Checks a student can work with no Google account, a teacher sees them on the dashboard,
 * and progress files move work between devices and into a teacher's class.
 */
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { getLesson, allBlocks } from "@/content";

const bundle = path.join(process.cwd(), "web/public/apps-script/bundle.js");
if (!fs.existsSync(bundle)) execSync("npx tsx scripts/build-pages.ts", { stdio: "inherit" });

// a browser's localStorage, shared by every "device" in a test unless reset
class MemoryStorage {
  m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
  clear() { this.m.clear(); }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
  get length() { return this.m.size; }
}

beforeAll(() => {
  vi.stubGlobal("fetch", async (url: string) => {
    if (String(url).includes("apps-script/bundle.js")) return new Response(fs.readFileSync(bundle, "utf8"));
    return new Response("", { status: 404 });
  });
});

type Engine = typeof import("../../web/src/local-engine");
let E: Engine;
/** A fresh device: new storage and a freshly loaded engine module. */
async function newDevice() {
  vi.stubGlobal("localStorage", new MemoryStorage());
  vi.stubGlobal("sessionStorage", new MemoryStorage());
  vi.resetModules();
  E = await import("../../web/src/local-engine");
}
async function call(token: string, action: string, args: Record<string, unknown> = {}) {
  return JSON.parse(await E.localPost(JSON.stringify({ action, token, args }))) as { ok: boolean; data: never; error?: string };
}

const lesson = getLesson("holes")!;
const mc = allBlocks(lesson).find((b) => b.type === "multipleChoice" && b.check === "skill")!;
if (mc.type !== "multipleChoice") throw new Error("test lesson changed");
const right = { type: "multipleChoice", optionIds: mc.correctOptionIds };

beforeEach(newDevice);

describe("Try-It mode", () => {
  it("a student starts with only a name, and the real scoring engine grades their work", async () => {
    const s = await E.startStudent("Maya", "18-week");
    const me = await call(s.token, "me", { classId: s.classId });
    expect(me.ok).toBe(true);
    expect((me.data as { user: { role: string; name: string } }).user).toMatchObject({ role: "student", name: "Maya" });
    const r = await call(s.token, "answerBlock", { classId: s.classId, lessonId: "holes", blockId: mc.id, response: right });
    expect(r.ok).toBe(true);
    expect((r.data as { correct: boolean }).correct).toBe(true);
  });

  it("work survives a reload (stored on the device)", async () => {
    const s = await E.startStudent("Maya", "9-week");
    await call(s.token, "answerBlock", { classId: s.classId, lessonId: "holes", blockId: mc.id, response: right });
    vi.resetModules(); // same storage, new page load
    E = await import("../../web/src/local-engine");
    const me = await call(s.token, "me", { classId: s.classId });
    expect(JSON.stringify(me.data)).toContain(mc.id);
  });

  it("the teacher on the same device sees the student and can't be impersonated by students", async () => {
    const s = await E.startStudent("Maya", "18-week");
    const t = await E.startTeacher();
    const data = await call(t.token, "classData", { classId: s.classId });
    expect(data.ok).toBe(true);
    expect(JSON.stringify(data.data)).toContain("Maya");
    expect((await call(s.token, "classData", { classId: s.classId })).error).toMatch(/access/);
  });

  it("a student's progress file moves their work to another device", async () => {
    const s = await E.startStudent("Luis", "18-week");
    await call(s.token, "answerBlock", { classId: s.classId, lessonId: "holes", blockId: mc.id, response: right });
    const me = await call(s.token, "me", { classId: s.classId });
    const email = (me.data as { user: { email: string } }).user.email;
    const file = JSON.stringify(await E.exportProgress({ email, name: "Luis" }));

    await newDevice();
    const got = await E.importStudent(E.readProgressFile(file), null);
    const token = E.tokenFor(got.email, got.name);
    const back = await call(token, "me", { classId: got.classId });
    expect(back.ok).toBe(true);
    expect(JSON.stringify(back.data)).toContain(mc.id);
  });

  it("a teacher adds students' files to their own class; re-adding replaces instead of duplicating", async () => {
    const s = await E.startStudent("Ava", "18-week");
    await call(s.token, "answerBlock", { classId: s.classId, lessonId: "holes", blockId: mc.id, response: right });
    const email = ((await call(s.token, "me", { classId: s.classId })).data as { user: { email: string } }).user.email;
    const file = JSON.stringify(await E.exportProgress({ email, name: "Ava" }));

    await newDevice(); // the teacher's laptop
    const t = await E.startTeacher();
    const cls = (await call(t.token, "createClass", { name: "Period 2", section: "", pathId: "18-week" })).data as { id: string };
    await E.importStudent(E.readProgressFile(file), cls.id);
    await E.importStudent(E.readProgressFile(file), cls.id);
    const data = (await call(t.token, "classData", { classId: cls.id })).data as { students: { email: string }[]; progress: { email: string }[] };
    expect(data.students.filter((x) => x.email === email)).toHaveLength(1);
    expect(data.progress.some((p) => p.email === email)).toBe(true);
  });

  it("only that student's rows go in their file", async () => {
    const a = await E.startStudent("Mia", "18-week");
    await E.startStudent("Jordan", "18-week");
    const email = ((await call(a.token, "me", { classId: a.classId })).data as { user: { email: string } }).user.email;
    const f = await E.exportProgress({ email, name: "Mia" });
    expect(JSON.stringify(f.sheets)).not.toContain("Jordan");
  });

  it("rejects files that aren't progress files, and Classroom says it's unavailable instead of crashing", async () => {
    expect(() => E.readProgressFile("{\"hello\":1}")).toThrow(/progress file/);
    const t = await E.startTeacher();
    await call(t.token, "createClass", { name: "P2", section: "", pathId: "9-week" });
    const r = await call(t.token, "classroomCourses");
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/Try-It/);
  });

  it("ignores a Google sign-in left in the tab, so Try-It shows its start screen instead of an error", async () => {
    const header = Buffer.from(JSON.stringify({ alg: "RS256" })).toString("base64url");
    const google = `${header}.${Buffer.from(JSON.stringify({ email: "teacher@district.org", exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url")}.sig`;
    sessionStorage.setItem("academy.idtoken", google);
    localStorage.setItem("academy.api", "local:device");
    const auth = await import("../../web/src/auth");
    expect(auth.currentToken()).toBeNull(); // no Try-It sign-in yet: the start screen shows
    const s = await E.startStudent("Mia", "18-week");
    auth.setLocalToken(s.token);
    expect(auth.currentToken()).toBe(s.token);
    localStorage.setItem("academy.api", "https://script.google.com/macros/s/abc/exec");
    expect(auth.currentToken()).toBe(google); // back in Google mode, the Google sign-in is used again
  });
});
