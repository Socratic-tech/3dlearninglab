/** Teacher slide decks and the fuller teacher guides behind them. */
import { describe, expect, it } from "vitest";
import { allBlocks, lessons } from "@/content";
import { FLAVOR } from "@/content/flavor";
import { plain, planDeck, type SlideSpec } from "@/lib/slides/plan";
import { renderDeck } from "@/lib/slides/render";
import { diagramSvg } from "@/lib/slides/diagram-png";

const deckFor = (id: string) => {
  const lesson = lessons.find((l) => l.id === id)!;
  return planDeck({ lesson, guide: lesson.teacher, hook: FLAVOR[id]?.hook });
};
const slideText = (s: SlideSpec) => [s.eyebrow, s.title, s.body, s.caption, s.chip, ...(s.bullets ?? []), ...(s.rows ?? []).flatMap((r) => [r.left, r.right])].filter(Boolean).join("\n");

describe("teacher guides", () => {
  it("every lesson has background, goals, student questions, a run plan and an exit ticket", () => {
    for (const l of lessons) {
      const t = l.teacher;
      expect(t.bigIdea, l.id).toBeTruthy();
      expect(t.successCriteria.length, l.id).toBeGreaterThanOrEqual(3);
      expect(t.background.length, l.id).toBeGreaterThanOrEqual(4);
      expect(t.studentQuestions.length, l.id).toBeGreaterThanOrEqual(3);
      expect(t.connections.length, l.id).toBeGreaterThanOrEqual(2);
      expect(t.exitTicket.length, l.id).toBeGreaterThanOrEqual(2);
      expect(t.lookFors.length, l.id).toBeGreaterThan(0);
      expect(t.runPlan.reduce((n, x) => n + x.minutes, 0), `${l.id} run plan`).toBe(l.estimatedMinutes);
    }
  });
});

describe("slide decks", () => {
  it("open with a title, goals and the plan, and close with a self-check", () => {
    const d = deckFor("holes");
    expect(d[0].kind).toBe("title");
    expect(d.map((s) => s.kind)).toEqual(expect.arrayContaining(["goals", "agenda", "vocab", "section", "step", "think", "exit"]));
    expect(d.at(-1)!.kind).toBe("close");
    expect(d.find((s) => s.kind === "agenda")!.notes).toContain("Model the container");
  });

  it("never show or say the answer to a scored question", () => {
    for (const l of lessons) {
      const deck = planDeck({ lesson: l, guide: l.teacher });
      const all = deck.map((s) => slideText(s) + "\n" + s.notes).join("\n");
      for (const b of allBlocks(l)) {
        if ("explanation" in b && b.explanation.length > 30) expect(all.includes(plain(b.explanation)), `${l.id}/${b.id}`).toBe(false);
        if (b.type === "ordering") {
          const shown = deck.find((s) => s.title === plain(b.prompt) && s.eyebrow === "Put it in order")!.bullets!;
          expect(shown, `${l.id}/${b.id}`).not.toEqual(b.items.map((x) => plain(x.text)));
        }
        if (b.type === "matching") {
          const rows = deck.find((s) => s.title === plain(b.prompt) && s.rows)!.rows!;
          expect(rows.every((r, i) => r.right === plain(b.pairs[i].right)), `${l.id}/${b.id}`).toBe(false);
        }
      }
    }
  });

  it("put teacher-led moves in the notes, not on the slide", () => {
    const l = lessons.find((x) => allBlocks(x).some((b) => b.type === "teacherLed"))!;
    const b = allBlocks(l).find((x) => x.type === "teacherLed")!;
    if (b.type !== "teacherLed") throw new Error("unreachable");
    const s = planDeck({ lesson: l, guide: l.teacher }).find((x) => x.kind === "together" && x.title === b.title)!;
    expect(s.notes).toContain(plain(b.teacher));
    expect(slideText(s)).not.toContain(plain(b.teacher));
  });

  it("turn markdown into plain slide text", () => {
    expect(plain("A **bold** [link](https://x.test) and *soft* `code`\n- one\n- two")).toBe("A bold link and soft code\n• one\n• two");
  });

  it("draw diagrams with fixed light colours", () => {
    const d = diagramSvg("solid-vs-hole")!;
    expect(d.svg).not.toContain("var(--");
    expect(d.svg).toContain(`width="${d.width}"`);
    expect(diagramSvg("no-such-diagram")).toBeNull();
  });

  it("build a .pptx with speaker notes", async () => {
    const png = { data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==", width: 1, height: 1 };
    const pptx = await renderDeck(deckFor("holes"), { title: "Holes", rasterize: async () => png });
    const buf = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
    expect(buf.subarray(0, 2).toString()).toBe("PK");
    expect(buf.length).toBeGreaterThan(20_000);
  });
});
