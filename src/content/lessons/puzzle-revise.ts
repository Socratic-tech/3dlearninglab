import type { LessonInput } from "../schema";

/** Puzzle Cube, day 17 of 18: one targeted change from the playtest data, reprint, re-test. */
export const lesson: LessonInput = {
  id: "puzzle-revise",
  number: 416,
  title: "Puzzle Cube 17: Revise and Re-test",
  subtitle: "One change, based on the data. Then test again.",
  domain: "F",
  kind: "lesson",
  summary: "Students choose one change that targets their playtest results (too easy, too hard, pieces that look alike, a tight fit), make it in their backup design, reprint only the changed pieces, and re-test with a new tester.",
  estimatedMinutes: 55,
  printLevel: "prototype",
  competencyIds: ["F8", "F9", "E7"],
  prerequisites: ["puzzle-playtest"],
  vocabulary: [
    { term: "Revision", definition: "A change made because of test results." },
    { term: "Version", definition: "One saved stage of your design: v1, v2 … so you can compare them." },
  ],
  sections: [
    {
      phase: "discover",
      title: "Change what the data points to",
      blocks: [
        {
          id: "hook",
          type: "hero",
          title: "Version 2 is where designs get good.",
          hook: "Almost nothing great works perfectly the first time. Designers test, change one thing, and test again, until the numbers say it's right.",
          visual: { diagram: "design-cycle", alt: "The design cycle, looping from test back to revise." },
        },
        {
          id: "menu",
          type: "text",
          title: "Common changes",
          body: "- **Too easy:** trade cubes between two pieces so a flat piece bends into 3D, or make two pieces look more alike.\n- **Too hard:** make look-alike pieces clearly different, or add a small mark (a dot) to the first piece to place.\n- **Pieces stick:** sand edges, or reprint a warped piece.\n- **Just right?** Change something else from your notes, like the box fit or your personal touch.\n\nChange the pieces in your **ungrouped backup** (in place), so they still fit together. Then group and print only those pieces.",
        },
      ],
    },
    {
      phase: "practice",
      title: "Pick the right change",
      blocks: [
        {
          id: "too-easy-mc",
          type: "multipleChoice",
          prompt: "Your testers solved it in 25 and 40 seconds. Your target is 1–5 minutes. What's the best change?",
          hint: "Change one thing, then re-test, so you know what made the difference.",
          options: [
            { id: "trade", text: "Trade cubes between two pieces so one flat piece becomes 3D, reprint those two, re-test" },
            { id: "bigger", text: "Make the whole cube bigger", misconceptionId: "bigger-is-harder" },
            { id: "all", text: "Redesign every piece at once", misconceptionId: "change-everything" },
          ],
          correctOptionIds: ["trade"],
          explanation: "A 3D piece is harder to place. Changing just two pieces is quick to reprint and shows whether that change worked.",
          competencyId: "F8",
          check: "skill",
        },
        {
          id: "too-hard-mc",
          type: "multipleChoice",
          prompt: "A tester gave up after 10 minutes and 3 hints, stuck on two pieces that look almost the same. What's a good single change?",
          hint: "What made the solver stuck? Change that.",
          options: [
            { id: "different", text: "Make those two pieces clearly different, or mark the first piece to place" },
            { id: "time", text: "Give testers more time next round", misconceptionId: "change-the-test" },
            { id: "nothing", text: "Keep it: hard is good", misconceptionId: "change-the-test" },
          ],
          correctOptionIds: ["different"],
          explanation: "The stuck spot points to the fix. Changing the test instead of the design hides the problem.",
          competencyId: "F8",
          check: "skill",
        },
      ],
    },
    {
      phase: "apply",
      title: "Make version 2",
      blocks: [
        {
          id: "tinkercad",
          type: "tinkercadLaunch",
          title: "Change, then print only what changed",
          steps: [
            "Copy your ungrouped backup as 'puzzle cube v2'.",
            "Make your one change in place (recolour the cubes that move between pieces).",
            "Check the whole cube is still 45 × 45 × 45 and the piece rules still pass.",
            "Group only the changed pieces, turn them to print, export and request a print.",
          ],
        },
        {
          id: "micro",
          type: "challenge",
          kind: "micro",
          where: "offline",
          title: "Re-test",
          prompt: "When the new pieces are printed, test with a NEW tester using the same playtest plan.",
          requirements: ["New tester", "Same timer and hint ladder", "Time, hints and stuck spot recorded", "Compared with version 1"],
          skills: ["F8", "E7"],
        },
        { id: "journal-change", type: "journal", projectKey: "puzzle-cube", promptIds: ["changed"] },
      ],
    },
    {
      phase: "prove",
      title: "Prove it: version 2",
      blocks: [
        {
          id: "prove",
          type: "challenge",
          kind: "prove",
          where: "both",
          title: "Version 2",
          prompt: "Make one change based on your playtest data, and show whether it worked.",
          requirements: [
            "The change, and which test result it responds to",
            "Before and after pictures (layer maps or screenshots)",
            "Only the changed pieces reprinted",
            "Re-test result compared with version 1 (or planned, if prints aren't ready)",
          ],
          skills: ["F8", "F9", "E7"],
        },
        {
          id: "submit",
          type: "uploadEvidence",
          prompt: "Upload before/after pictures and your re-test notes. Attach the STL of the changed pieces if you need a reprint.",
          accepts: ["screenshot", "stl", "written", "physical_test"],
          competencyIds: ["F8", "F9", "E7"],
          checklist: ["Change linked to data", "Before and after", "Re-test compared"],
          allowPrintRequest: true,
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
          prompt: "Did your change move the results toward your target? How do you know?",
          sentenceStarters: ["Version 1 took … and version 2 took …", "The change worked / didn't work because …"],
          competencyIds: ["F8", "E7"],
        },
      ],
    },
  ],
  teacher: {
    purpose: "Evidence-based iteration: one targeted change linked to playtest data, a minimal reprint, and a comparable re-test. Keep this day even in a 3-week run; it's where the design cycle closes.",
    preparation: ["Reserve printer time for small reprints (usually one or two pieces per student).", "Line up new testers (another table or class)."],
    equipment: ["Student devices with Tinkercad", "Printers", "Timers"],
    misconceptions: [
      { id: "bigger-is-harder", text: "A bigger puzzle is a harder puzzle.", response: "Scaling keeps the same shapes. Difficulty comes from piece shapes, not size." },
      { id: "change-everything", text: "Fix a problem by changing everything.", response: "If you change every piece, you won't know which change helped. Change what the test points to." },
      { id: "change-the-test", text: "Change the test (more time, more hints) instead of the design.", response: "The test measures the design. Keep the test the same so the comparison is fair." },
    ],
    discussionQuestions: ["Why keep the playtest exactly the same for version 2?"],
    troubleshooting: [
      "Changed pieces don't fit old ones: the change was made on a loose piece, not in the assembled backup. Redo it in place.",
      "No printer time: re-test with a real-cube mock-up of the changed pieces.",
    ],
    answerGuidance: ["Proficient: one change clearly linked to data, before/after shown, re-test compared (or a clear plan if prints are pending)."],
    alternatives: { noPrinter: "Make the change with real cubes and re-test that version.", touchDevice: "Recolour cubes by tapping them; export from the tablet." },
  },
};
