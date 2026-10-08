import type { LessonInput } from "../schema";

export const lesson: LessonInput = {
  id: "jr-design-rules",
  number: 106,
  title: "Design Rules",
  subtitle: "Check before you build",
  domain: "E",
  kind: "lesson",
  summary: "Learn the rules that make a design print well, then sort designs into will print and won't print.",
  estimatedMinutes: 25,
  printLevel: "digital",
  competencyIds: ["E1", "C9"],
  prerequisites: ["jr-holes"],
  vocabulary: [
    { term: "Rule", definition: "Something a design must do. Designers check every rule." },
    { term: "Too thin", definition: "So skinny that the printed part bends or breaks." },
    { term: "Floating", definition: "Not touching the rest of the design. It prints loose, or not at all." },
  ],
  sections: [
    {
      phase: "discover",
      title: "Will it print?",
      blocks: [
        {
          id: "hook",
          type: "hero",
          title: "Be a design checker",
          hook: "Some designs look great on the screen but break when they print. Designers check the rules first.",
          visual: { modelId: "bookmark-thin" },
        },
        {
          id: "rules",
          type: "text",
          body: "**Three big rules:**\n\n1. **Not too thin.** Thin parts snap.\n2. **No floating parts.** Everything touches.\n3. **Holes need space around them.** Leave plastic around a hole so it doesn't tear.",
        },
        {
          id: "compare",
          type: "modelViewer",
          modelId: "bookmark-good",
          caption: "A good bookmark: 2 mm thick, with plenty of plastic around its hole.",
          showDimensions: true,
        },
      ],
    },
    {
      phase: "practice",
      title: "Sort the designs",
      blocks: [
        {
          id: "sort",
          type: "matching",
          prompt: "Will it print? Match each design to what happens.",
          hint: "Check each design against the three rules.",
          pairs: [
            { id: "p1", left: "A bookmark as thin as paper", right: "Bends and snaps" },
            { id: "p2", left: "Letters floating above the bookmark", right: "Letters fall off" },
            { id: "p3", left: "A hole right at the edge", right: "The tassel tears out" },
            { id: "p4", left: "2 mm thick, letters touching, hole with space", right: "Prints well" },
          ],
          explanation: "Thick enough, everything touching, and space around holes.",
          competencyId: "E1",
          check: "practice",
        },
        {
          id: "thin-check",
          type: "multipleChoice",
          prompt: "Look at the thin bookmark at the top of this lesson. What is wrong with it?",
          hint: "Two of the rules are broken.",
          options: [
            { id: "a", text: "It's too thin, and its hole is too close to the edge." },
            { id: "b", text: "It's too thick.", misconceptionId: "thicker-worse" },
            { id: "c", text: "Nothing, it will print fine.", misconceptionId: "screen-is-real" },
          ],
          correctOptionIds: ["a"],
          explanation: "It's under 1 mm thick, and the hole almost touches the edge. Both will break.",
          competencyId: "E1",
          check: "skill",
        },
      ],
    },
    {
      phase: "prove",
      title: "Show what you can do",
      blocks: [
        {
          id: "prove",
          type: "challenge",
          where: "offline",
          kind: "prove",
          title: "Fix the sketch",
          prompt: "Your teacher gives you a bookmark sketch that breaks a rule. Circle the problem and draw the fix.",
          requirements: ["Circle what's wrong", "Write which rule it breaks", "Draw the fix"],
          skills: ["E1"],
        },
        {
          id: "submit",
          type: "uploadEvidence",
          prompt: "Take a photo of your fixed sketch, or tell what you fixed.",
          accepts: ["screenshot", "written"],
          competencyIds: ["E1"],
          checklist: ["I circled the problem", "I drew the fix"],
        },
      ],
    },
    {
      phase: "reflect",
      title: "Think about it",
      blocks: [
        {
          id: "reflect",
          type: "reflection",
          prompt: "Which rule do you think is easiest to forget?",
          sentenceStarters: ["The rule I might forget is… because…"],
          competencyIds: ["E1"],
        },
      ],
    },
  ],
  teacher: {
    purpose: "Students check a design against simple printability rules before building, which prepares them for the boss battle.",
    preparation: [
      "Print one bookmark-good and one bookmark-thin about a week ahead so students can hold and gently bend them.",
      "Print or draw 4–6 bookmark sketches, each breaking one rule (too thin, floating letters, hole at the edge), for the Fix the sketch task.",
    ],
    equipment: ["The two sample bookmarks", "Bookmark sketches", "Pencils"],
    misconceptions: [
      { id: "thicker-worse", text: "Thicker is always worse.", response: "Bend both samples (gently). Thicker is stronger, but too thick won't fit in a book." },
      { id: "screen-is-real", text: "If it looks fine on screen, it will print fine.", response: "Show the printed thin sample next to its on-screen view." },
    ],
    discussionQuestions: ["Why check the rules before printing instead of after?"],
    printableObjects: ["bookmark-good", "bookmark-thin"],
    slicerSettings: "PLA, 0.2 mm layers, 15% infill. Print both flat on the plate.",
    troubleshooting: ["If the thin sample doesn't print at all, that's still a good example: show students the empty spot."],
    answerGuidance: ["Thin bookmark: too thin and the hole is too close to the edge."],
    alternatives: { noPrinter: "Use the 3D viewer and paper models: a sheet of paper bends like the thin bookmark, cardboard is like the good one." },
  },
};
