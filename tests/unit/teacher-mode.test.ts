// @vitest-environment jsdom
/** Teacher dashboard view (Simple / Advanced): new teachers start simple, and the choice is remembered per teacher. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setTeacherMode, teacherMode } from "../../web/src/state";

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe("teacher dashboard mode", () => {
  it("starts in the simple view", () => {
    expect(teacherMode("new.teacher@school.org")).toBe("simple");
  });

  it("remembers each teacher's choice separately, whatever the email's capitals", () => {
    setTeacherMode("Ms.Lee@School.org", "advanced");
    expect(teacherMode("ms.lee@school.org")).toBe("advanced");
    expect(teacherMode("mr.cho@school.org")).toBe("simple");
    setTeacherMode("ms.lee@school.org", "simple");
    expect(teacherMode("MS.LEE@school.org")).toBe("simple");
  });

  it("still works for this visit when browser storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    expect(teacherMode("blocked@school.org")).toBe("simple");
    setTeacherMode("blocked@school.org", "advanced");
    expect(teacherMode("blocked@school.org")).toBe("advanced");
  });
});
