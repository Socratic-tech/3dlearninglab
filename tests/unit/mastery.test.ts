import { describe, expect, it } from "vitest";
import { applyEvidence, applyOverride, autoLevel, effectiveLevel, groupLevel, levelFromRating } from "@/lib/mastery";
import { lessonStates } from "@/lib/progression";

describe("mastery math", () => {
  it("best level wins — an early failure never lowers mastery", () => {
    let row = applyEvidence(null, "proficient");
    row = applyEvidence(row, "developing");
    expect(effectiveLevel(row)).toBe("proficient");
  });

  it("later evidence can raise a student who struggled early (Align in week 4 → week 14)", () => {
    let row = applyEvidence(null, "developing");
    row = applyEvidence(row, "developing");
    row = applyEvidence(row, "independent");
    expect(effectiveLevel(row)).toBe("independent");
  });

  it("teacher override can lower, and new evidence can raise again", () => {
    let row = applyEvidence(null, "proficient");
    row = applyOverride("developing");
    expect(effectiveLevel(row)).toBe("developing");
    row = applyEvidence(row, "proficient");
    expect(effectiveLevel(row)).toBe("proficient");
  });

  it("automated checks only reach Proficient on conceptual competencies", () => {
    expect(autoLevel({ correct: true, check: "skill", autoAssessable: true })).toBe("proficient");
    expect(autoLevel({ correct: true, check: "skill", autoAssessable: false })).toBe("developing");
    expect(autoLevel({ correct: true, check: "practice", autoAssessable: true })).toBe("developing");
    expect(autoLevel({ correct: false, check: "skill", autoAssessable: true })).toBe("developing");
  });

  it("maps teacher ratings", () => {
    expect(levelFromRating(1)).toBe("developing");
    expect(levelFromRating(2)).toBe("proficient");
    expect(levelFromRating(3)).toBe("independent");
  });

  it("group level is the floor of the mean, at least Developing once attempted", () => {
    expect(groupLevel(["not_attempted", "not_attempted"])).toBe("not_attempted");
    expect(groupLevel(["independent", "not_attempted"])).toBe("developing");
    expect(groupLevel(["independent", "proficient"])).toBe("proficient");
  });
});

describe("prerequisites", () => {
  const lessons = [
    { id: "a", prerequisites: [] },
    { id: "b", prerequisites: ["a"] },
    { id: "c", prerequisites: ["b", "x"] }, // x is not in this path → ignored
  ];
  const base = { lessons, enabled: (id: string) => id !== "x", manuallyUnlocked: () => false };

  it("locks until prerequisites in the path are completed", () => {
    const st = lessonStates({ ...base, status: () => undefined });
    expect(st.get("a")).toBe("available");
    expect(st.get("b")).toBe("locked");
    expect(st.get("c")).toBe("locked");
  });

  it("ignores prerequisites outside the course path", () => {
    const st = lessonStates({ ...base, status: (id) => (id === "a" || id === "b" ? "completed" : undefined) });
    expect(st.get("c")).toBe("available");
  });

  it("manual unlock (external tool unavailable) opens a locked lesson", () => {
    const st = lessonStates({ ...base, manuallyUnlocked: (id) => id === "b", status: () => undefined });
    expect(st.get("b")).toBe("available");
  });

  it("disabled prerequisite does not block", () => {
    const st = lessonStates({ ...base, enabled: (id) => id !== "a" && id !== "x", status: () => undefined });
    expect(st.get("b")).toBe("available");
  });
});
