import type { LessonInput } from "../schema";

/** Puzzle Cube, day 5 of 18: build the planned puzzle by hand, swap with a partner, fix the plan before CAD. */
export const lesson: LessonInput = {
  id: "puzzle-paper-playtest",
  number: 404,
  title: "Puzzle Cube 5: Build It by Hand",
  subtitle: "A hand-made prototype finds problems while they're cheap to fix.",
  domain: "F",
  kind: "lesson",
  summary: "Students build their planned puzzle from real cubes, swap with a partner for a quick timed try, and make one change to their layer map before any CAD. Optional in a 3-week run.",
  estimatedMinutes: 55,
  printLevel: "digital",
  competencyIds: ["F5", "F6", "F8"],
  prerequisites: ["puzzle-think-in-cubes"],
  vocabulary: [
    { term: "Prototype", definition: "A quick early version built to answer a question, like 'does this fit?' or 'is this too easy?'" },
    { term: "Iteration", definition: "Changing your design because of a test, then testing again." },
  ],
  sections: [
    {
      phase: "discover",
      title: "Test it before you build it for real",
      blocks: [
        {
          id: "hook",
          type: "hero",
          title: "Fix it now, for free.",
          hook: "Changing a piece today takes 30 seconds and some tape. Changing it after printing takes hours. Today you build your puzzle by hand and let someone else try it.",
          visual: { diagram: "design-cycle", alt: "The design cycle, looping from test back to revise." },
        },
        {
          id: "when",
          type: "prediction",
          prompt: "You find out a piece is too easy to place. When is the cheapest time to change it?",
          options: [
            { id: "now", text: "Now, while it's taped cubes" },
            { id: "cad", text: "Next week, in Tinkercad", misconceptionId: "fix-later" },
            { id: "print", text: "After printing, when you can really hold it", misconceptionId: "fix-later" },
          ],
          expectedOptionId: "now",
          reveal: "Every step makes changes more expensive: taped cubes take seconds, CAD takes minutes, a reprint takes hours and plastic. Test early.",
        },
      ],
    },
    {
      phase: "practice",
      title: "Run a quick swap test",
      blocks: [
        {
          id: "protocol",
          type: "text",
          title: "The swap test",
          body: "1. Build each piece from real cubes and tape or stick it together.\n2. Take your cube apart and hand the pieces to a partner.\n3. Start a timer. **Don't help.** Stop at 5 minutes.\n4. Write down: time, where they got stuck, and anything that broke or fell apart.\n5. Swap roles.",
        },
        {
          id: "notes-mc",
          type: "multipleChoice",
          prompt: "Which note will help you most when you change your plan?",
          hint: "Which one tells you what to change?",
          options: [
            { id: "data", text: "Solved in 40 seconds; pieces B and E went in first try" },
            { id: "vibe", text: "Partner said it was okay", misconceptionId: "opinion-is-data" },
          ],
          correctOptionIds: ["data"],
          explanation: "A time and the pieces that were easy (or stuck) point to what to change. 'Okay' doesn't.",
          competencyId: "F6",
          check: "practice",
        },
      ],
    },
    {
      phase: "apply",
      title: "Swap and change",
      blocks: [
        {
          id: "micro",
          type: "challenge",
          kind: "micro",
          where: "offline",
          title: "Swap test",
          prompt: "Run the swap test with a partner, both ways.",
          requirements: ["Your puzzle built from real cubes", "Partner's time written down", "Where they got stuck (or what was too easy)"],
          skills: ["F5", "F6"],
        },
        { id: "journal-test", type: "journal", projectKey: "puzzle-cube", promptIds: ["prototype", "test"] },
      ],
    },
    {
      phase: "prove",
      title: "Prove it: plan version 2",
      blocks: [
        {
          id: "prove",
          type: "challenge",
          kind: "prove",
          where: "offline",
          title: "Plan Version 2",
          prompt: "Make one change to your layer map because of the swap test, and explain it.",
          requirements: [
            "Photo of your hand-built puzzle",
            "Partner's time and stuck spot",
            "One change to the layer map (or a clear reason why no change is needed)",
            "The new plan still adds to 27 and follows the piece rules",
          ],
          skills: ["F5", "F6", "F8"],
        },
        {
          id: "submit",
          type: "uploadEvidence",
          prompt: "Upload a photo of your hand-built puzzle and your updated layer map, with a sentence about the change.",
          accepts: ["physical_test", "screenshot", "written"],
          competencyIds: ["F5", "F6", "F8"],
          checklist: ["Photo of the prototype", "Test notes", "Updated layer map", "Reason for the change"],
        },
      ],
    },
    {
      phase: "reflect",
      title: "Reflect",
      blocks: [
        {
          id: "reflect",
          type: "reflection",
          prompt: "What did your partner do with your puzzle that you didn't expect?",
          sentenceStarters: ["I expected … but my partner …", "So I changed …"],
          competencyIds: ["F6", "F8"],
        },
      ],
    },
  ],
  teacher: {
    purpose: "A low-cost prototype and first user test before any CAD. Students experience iteration when changes are cheap. Optional in a 3-week run: if skipped, have students build their plan from cubes for 10 minutes at the end of day 4.",
    preparation: ["Real cubes and tape or sticky tack for every student.", "Pair students with someone who hasn't seen their plan.", "Timers (phones, a class timer)."],
    equipment: ["Small cubes", "Tape or sticky tack", "Timers"],
    misconceptions: [
      { id: "fix-later", text: "It's fine to fix problems after printing.", response: "Compare: 30 seconds with tape vs. a 3-hour reprint. Test now." },
      { id: "opinion-is-data", text: "A tester's opinion is the test result.", response: "Ask: could you compare this note after a change? Times and stuck spots can be compared." },
    ],
    discussionQuestions: ["What did watching someone else teach you about your own puzzle?"],
    troubleshooting: [
      "Sugar cubes crumble: linking cubes or paper cubes last longer.",
      "If the puzzle was solved in seconds, suggest bending a flat piece into 3D.",
    ],
    answerGuidance: ["Proficient: a test with a recorded time, one change linked to the test, and an updated plan that still follows the rules."],
    alternatives: { noPrinter: "No printer needed.", touchDevice: "Photograph the prototype and updated map with the tablet." },
  },
};
