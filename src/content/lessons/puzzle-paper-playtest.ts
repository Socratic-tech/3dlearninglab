import type { LessonInput } from "../schema";

/** Puzzle Cube, day 5 of 18: build the planned puzzle by hand, swap with a partner, fix the plan before CAD. */
export const lesson: LessonInput = {
  id: "puzzle-paper-playtest",
  number: 404,
  title: "Puzzle Cube 5: Build It by Hand",
  subtitle: "A hand-made prototype finds problems while they're cheap to fix.",
  domain: "F",
  kind: "lesson",
  summary: "Students build their planned puzzle from math cubes, swap with a partner for a quick timed try, and make one change to their layer map before any CAD. Optional in a 3-week run.",
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
          hook: "Changing a piece today takes 30 seconds: unsnap a cube, snap it somewhere else. Changing it after printing takes hours. Today you build your puzzle by hand and let someone else try it.",
          visual: { diagram: "design-cycle", alt: "The design cycle, looping from test back to revise." },
        },
        {
          id: "when",
          type: "prediction",
          prompt: "You find out a piece is too easy to place. When is the cheapest time to change it?",
          options: [
            { id: "now", text: "Now, while it's snapped math cubes" },
            { id: "cad", text: "Next week, in Tinkercad", misconceptionId: "fix-later" },
            { id: "print", text: "After printing, when you can really hold it", misconceptionId: "fix-later" },
          ],
          expectedOptionId: "now",
          reveal: "Every step makes changes more expensive: math cubes take seconds, CAD takes minutes, a reprint takes hours and plastic. Test early.",
        },
      ],
    },
    {
      phase: "practice",
      title: "Run a quick swap test",
      blocks: [
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
          id: "swap",
          type: "teacherLed",
          title: "Swap test",
          minutes: 20,
          students: "1. Build each piece from math cubes, snapped firmly together.\n2. Take your cube apart and hand the pieces to a partner.\n3. Start a timer. **Don't help.** Stop at 5 minutes.\n4. Write down: time, where they got stuck, and anything that broke or was too easy.\n5. Swap roles.",
          teacher: "Pairing and timing are your call; across-table pairs who haven't seen each other's plans work best. The hardest part for students is staying quiet while someone struggles with their puzzle. Name that out loud before you start, and model what 'not helping' looks like.",
        },
        { id: "journal-test", type: "journal", projectKey: "puzzle-cube", promptIds: ["prototype", "test"] },
        {
          id: "share",
          type: "teacherLed",
          title: "One change",
          minutes: 8,
          students: "Share with the class: what did your tester do that surprised you, and what one change will you make to your plan?",
          teacher: "Collect a few changes on the board and sort them: too easy, too hard, pieces that broke. It sets up week 4's playtests and shows that changing a plan after a test is normal, not failure.",
        },
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
    runPlan: [
      { minutes: 5, title: "Hook", teacher: "Fix it now, for free: why test before CAD.", students: "Listen.", devices: "away" },
      { minutes: 10, title: "Build it", teacher: "Students build their planned puzzle from math cubes; check against the layer map.", students: "Build all pieces.", devices: "away" },
      { minutes: 20, title: "Swap test", teacher: "Organise pairs; remind: don't help; circulate and listen.", students: "Swap both ways, time, take notes.", devices: "away" },
      { minutes: 8, title: "One change", teacher: "Share surprises and planned changes; sort them on the board.", students: "Share; choose one change.", devices: "away" },
      { minutes: 12, title: "Plan version 2", teacher: "Devices open: update the layer map, upload photo and notes.", students: "Update the plan, upload, reflect.", devices: "open" },
    ],
    lookFors: ["Testers left to struggle without hints.", "Notes with a time and a stuck spot, not just 'it was fine'.", "Changes that respond to what the tester did."],
    differentiation: { support: ["Test with a partner who has the layer map to check against, instead of a blind solve.", "Give a notes template: time / stuck spot / one change."], extend: ["Run a second swap with a new tester after the change.", "Make a 'hint card' that helps without giving the answer away."] },
    preparation: ["Math cubes for every student or pair (about 30). Several colours help tell pieces apart.", "Pair students with someone who hasn't seen their plan.", "Timers (phones, a class timer)."],
    equipment: ["Math cubes", "Timers"],
    misconceptions: [
      { id: "fix-later", text: "It's fine to fix problems after printing.", response: "Compare: 30 seconds with math cubes vs. a 3-hour reprint. Test now." },
      { id: "opinion-is-data", text: "A tester's opinion is the test result.", response: "Ask: could you compare this note after a change? Times and stuck spots can be compared." },
    ],
    discussionQuestions: ["What did watching someone else teach you about your own puzzle?"],
    troubleshooting: [
      "Pieces come apart when they're handed over: snap them firmly, and photograph each piece so it can be rebuilt.",
      "If the puzzle was solved in seconds, suggest bending a flat piece into 3D.",
    ],
    answerGuidance: ["Proficient: a test with a recorded time, one change linked to the test, and an updated plan that still follows the rules."],
    alternatives: { noPrinter: "No printer needed.", touchDevice: "Photograph the prototype and updated map with the tablet." },
  },
};
