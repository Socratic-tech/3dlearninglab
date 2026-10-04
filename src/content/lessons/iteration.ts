import type { LessonInput } from "../schema";

export const lesson: LessonInput = {
  id: "iteration",
  number: 37,
  title: "Iteration",
  subtitle: "Version 2 exists because version 1 taught you something",
  domain: "F",
  kind: "lesson",
  summary: "Use test results to make targeted revisions, keep every version, and document what changed, why, and what happened.",
  estimatedMinutes: 50,
  printLevel: "prototype",
  competencyIds: ["F8", "F9", "E7"],
  prerequisites: ["testing"],
  vocabulary: [
    { term: "Iteration", definition: "One trip around the loop: change, test, learn." },
    { term: "Revision", definition: "A specific change made because of a test result or feedback." },
    { term: "Version", definition: "A saved copy of the design at one point in time: v1, v2, v3." },
    { term: "Variable", definition: "The one thing you change so you can tell what caused the result." },
  ],
  sections: [
    {
      phase: "discover",
      title: "Why this matters",
      blocks: [
        {
          id: "hook",
          type: "hero",
          title: "Nobody's first version is the final version.",
          hook: "Real products go through dozens of versions. Each one fixes something the last one revealed. Failure is how you find out what to fix.",
          visual: { diagram: "design-cycle" },
        },
        {
          id: "explain",
          type: "text",
          body: "Revise from **evidence**: a test result or user feedback. Change one important thing at a time when you can, so you know what made the difference. Save every version.",
        },
        {
          id: "predict",
          type: "prediction",
          prompt: "Prototype 1 was too tight. For v2 you widened the hole, rotated the part and changed the infill. Now it fits. Which change fixed it?",
          options: [
            { id: "a", text: "You can't be sure — three things changed at once." },
            { id: "b", text: "The infill, because it changed the most.", misconceptionId: "guess-cause" },
            { id: "c", text: "All three equally.", misconceptionId: "guess-cause" },
          ],
          expectedOptionId: "a",
          reveal: "The hole width probably mattered, but rotation can also change a hole's printed size. Next time change the hole only, test, then change the next thing.",
        },
      ],
    },
    {
      phase: "practice",
      title: "Revise from evidence",
      blocks: [
        {
          id: "match-revision",
          type: "matching",
          prompt: "Match each test result to a sensible revision.",
          hint: "Each fix should change the one thing that caused that result.",
          pairs: [
            { id: "tight", left: "Glue stick won't go in the 14.0 mm hole", right: "Widen the hole a little, e.g. to 14.4 mm, and print a new slice" },
            { id: "snap", left: "Hook arm snapped at a layer line", right: "Thicken the arm or change print orientation" },
            { id: "tip", left: "Holder tips forward when full", right: "Make the base longer at the front" },
            { id: "confuse", left: "User tried to open it from the wrong side", right: "Make the opening side obvious, e.g. a finger notch" },
          ],
          explanation: "Each revision targets the cause the test revealed. 'Make it better' isn't a revision — a specific change is.",
          competencyId: "F8",
          check: "practice",
        },
        {
          id: "doc-mc",
          type: "multipleChoice",
          prompt: "Which journal entry documents an iteration best?",
          hint: "Good documentation lists the version, what changed, and a measured result.",
          options: [
            { id: "a", text: "v1: hole 14.0 mm — glue stick stuck 5/5 tries. v2: hole 14.4 mm (only change) — slid in 5/5 tries. Keeping 14.4." },
            { id: "b", text: "Made it better. Works now.", misconceptionId: "vague-log" },
            { id: "c", text: "Changed some stuff in Tinkercad." },
          ],
          correctOptionIds: ["a"],
          explanation: "A good entry shows the version, what changed, the result with numbers, and the decision. Someone else could repeat it.",
          competencyId: "E7",
          check: "skill",
        },
        {
          id: "show-me",
          type: "showMe",
          title: "Keep every version",
          steps: [
            { text: "Before you change anything, take a screenshot of v1 with its key dimension showing." },
            { text: "Make a copy of your design from your Tinkercad dashboard and rename it, e.g. 'organizer v2'. Keep v1 untouched." },
            { text: "Change the one thing your test pointed to. Type the exact new value." , diagram: "exact-dimension" },
            { text: "Screenshot v2 the same way, then log: what changed, why, and the next test." },
          ],
        },
      ],
    },
    {
      phase: "apply",
      title: "Revise your capstone",
      blocks: [
        {
          id: "tinkercad",
          type: "tinkercadLaunch",
          title: "Build version 2",
          steps: [
            "Open your capstone design and make a copy named v2.",
            "Pick the most important failure from your test results.",
            "Make the change that targets that failure. Use exact values.",
            "If printing, print only the part you changed.",
          ],
        },
        {
          id: "micro",
          type: "challenge",
          where: "both",
          kind: "micro",
          title: "One targeted change",
          prompt: "Make the single change that addresses your most important failed test, then re-run just that test.",
          requirements: ["Change is linked to a specific test result", "v1 and v2 both saved", "Same test re-run on v2 with a recorded result"],
          skills: ["F8", "E7"],
        },
      ],
    },
    {
      phase: "prove",
      title: "Prove it",
      blocks: [
        {
          id: "prove",
          type: "challenge",
          kind: "prove",
          title: "Show the change",
          prompt: "Show how your capstone changed from v1 to v2 (or v3). Every change must point back to a test result or user feedback, and every change must be re-tested.",
          requirements: [
            "Screenshots of v1 and v2 with the changed dimension visible",
            "At least one revision linked to a specific failed test or user comment",
            "Re-test result recorded with numbers",
            "A decision: keep, revise again, or go back to another idea",
          ],
          skills: ["F8", "F9", "E7"],
        },
        { id: "journal", type: "journal", projectKey: "capstone", promptIds: ["failed", "changed", "test"] },
        {
          id: "submit",
          type: "uploadEvidence",
          prompt: "Upload v1 and v2 screenshots side by side (or both design links) and, if printed, a photo of the re-test.",
          accepts: ["screenshot", "design_url", "stl", "physical_test"],
          competencyIds: ["F8", "F9", "E7"],
          checklist: ["Both versions are shown", "Changed dimension is visible", "Journal links the change to evidence", "Re-test result recorded"],
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
          prompt: "What did version 1 teach you that you couldn't have learned without building it?",
          sentenceStarters: ["Before testing, I thought…", "Version 1 showed me…", "In v2 I changed…"],
          competencyIds: ["F8", "F9"],
        },
      ],
    },
  ],
  teacher: {
    purpose: "Students practise revision driven by evidence, controlling what they change so they can learn from it, and documenting versions clearly.",
    preparation: [
      "Make sure students have their test results from the previous lesson.",
      "Check how students in your Tinkercad Classroom can copy a design (dashboard design menu) and demonstrate it once.",
      "Limit reprints to the changed part to keep the print queue moving.",
    ],
    equipment: ["Student devices with Tinkercad", "Ruler or calipers", "Prototypes and test results", "3D printer (optional)"],
    misconceptions: [
      { id: "guess-cause", text: "You can tell which change worked even after changing several things.", response: "Run a quick demo: change two things on a paper airplane at once. Which one made it fly further?" },
      { id: "vague-log", text: "Documentation just needs to say it works now.", response: "Ask: could someone else rebuild your v2 from your note? If not, add numbers." },
    ],
    discussionQuestions: [
      "When is it OK to change more than one thing at once?",
      "When should you stop revising and go back to a different idea?",
      "Why keep version 1 if version 2 is better?",
    ],
    printableObjects: ["Revised test slices or parts (only the changed region where possible)"],
    slicerSettings: "Keep settings identical to prototype 1 so only the design changes — starting point: PLA, 0.2 mm layers, 15% infill, 2–3 walls. Adjust for your printer.",
    troubleshooting: [
      "If a student overwrote v1, try Undo (Ctrl+Z) while the design is still open; otherwise have them record v1 dimensions from their journal and screenshots.",
      "If every test passed, push for a user test or a harder test (more repetitions, heavier load).",
      "If a revision made things worse, celebrate the data — log it and try a smaller change.",
    ],
    answerGuidance: [
      "Strong iteration log: version, the one change with numbers, linked test result, re-test result with numbers, and a decision.",
      "Proficient: at least one evidence-based revision, re-tested, with both versions shown.",
    ],
    alternatives: {
      noPrinter: "Iterate paper or cardboard prototypes, or test digitally (Ruler, side view for balance). Record which changes still need a print to verify.",
      touchDevice: "Students can screenshot with the device's screenshot tool and use the on-screen Ruler.",
    },
  },
};
