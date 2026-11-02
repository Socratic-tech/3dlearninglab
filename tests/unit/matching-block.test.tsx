// @vitest-environment jsdom
/** Matching question: tap an answer then a slot (or pick a placed one back up); Check is ready only when every slot is filled. */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { LessonCtx, MatchingBlock, type CheckState, type LessonCtxValue } from "../../src/components/lesson/interactive-blocks";

const block = {
  id: "b1",
  type: "matching",
  prompt: "Match each view.",
  pairs: [
    { id: "p1", left: "Top view", right: "p2::Seen from above" },
    { id: "p2", left: "Front view", right: "p1::Seen from the front" },
  ],
} as never;

function setup() {
  const state: { check?: CheckState | null } = {};
  const ctx = {
    courseId: "c", lessonId: "l", entries: {}, markDone: () => {}, assets: {}, readOnly: false, api: {} as never,
    registerCheck: (_: string, s: CheckState | null) => { state.check = s; },
  } as LessonCtxValue;
  render(<LessonCtx.Provider value={ctx}><MatchingBlock b={block} /></LessonCtx.Provider>);
  return state;
}
afterEach(cleanup);

describe("MatchingBlock", () => {
  it("places answers by tap, moves them, and picks them back up", () => {
    const st = setup();
    const slot = (name: RegExp) => screen.getByRole("button", { name });
    expect(st.check?.ready).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Seen from above" }));
    fireEvent.click(slot(/Top view/));
    expect(slot(/Top view/).textContent).toContain("Seen from above");
    expect(screen.queryByRole("button", { name: "Seen from above" })).toBeNull(); // left the bank
    fireEvent.click(screen.getByRole("button", { name: "Seen from the front" }));
    fireEvent.click(slot(/Front view/));
    expect(st.check?.ready).toBe(true);
    // pick one back up and drop it on the other slot: the two swap places in the bank logic (old chip returns)
    fireEvent.click(slot(/Top view/));
    expect(st.check?.ready).toBe(false);
    fireEvent.click(slot(/Front view/));
    expect(slot(/Front view/).textContent).toContain("Seen from above");
    expect(screen.getByRole("button", { name: "Seen from the front" })).toBeTruthy();
  });
});
