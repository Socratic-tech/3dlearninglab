import type { LessonInput } from "../schema";

/** Puzzle Cube, day 14 of 18: inspect the printed pieces, diagnose problems, clean up and assemble. */
export const lesson: LessonInput = {
  id: "puzzle-first-print",
  number: 413,
  title: "Puzzle Cube 14: Unbox the Print",
  subtitle: "Inspect, fix, and put your puzzle together for the first time.",
  domain: "E",
  kind: "lesson",
  summary: "Students inspect their printed pieces, name any print problems and their causes, clean up (strings, bulging bottom edges), assemble the cube for the first time and decide whether any piece needs a reprint.",
  estimatedMinutes: 55,
  printLevel: "required",
  competencyIds: ["D11", "E1", "E7"],
  prerequisites: ["puzzle-slice-print"],
  vocabulary: [
    { term: "Elephant's foot", definition: "A bulge on the bottom layer, where the first layer squishes a little wider." },
    { term: "Stringing", definition: "Thin wisps of plastic left between parts." },
    { term: "Warping", definition: "Corners curling up off the build plate as plastic cools." },
  ],
  sections: [
    {
      phase: "discover",
      title: "Your pieces are real",
      blocks: [
        {
          id: "hook",
          type: "hero",
          title: "Hold your puzzle for the first time.",
          hook: "Before you snap it together, look closely. Real prints have little problems. Spotting them and knowing why they happen is what makers do.",
          visual: { diagram: "failure-elephant-foot", alt: "The bottom layers bulging outward wider than the rest." },
        },
        {
          id: "fails",
          type: "failGallery",
          title: "Common puzzle-piece problems",
          cards: [
            { id: "foot", nickname: "The Bulge", diagram: "failure-elephant-foot", clue: "The bottom edge of a piece sticks out a little and catches on the next piece.", cause: "Elephant's foot: the first layer squishes wider than the rest.", fix: "Scrape or sand the bottom edge lightly with a file or nail file." },
            { id: "string", nickname: "Spider Webs", diagram: "failure-stringing", clue: "Hair-thin threads between pieces.", cause: "Stringing: plastic oozed as the nozzle moved between pieces.", fix: "Pull or trim them off. Harmless." },
            { id: "warp", nickname: "Curled Corners", diagram: "failure-warping", clue: "A corner lifts off a flat surface; the piece rocks.", cause: "Warping: the corner cooled and shrank before the rest.", fix: "Usually fine for a puzzle. If it stops the cube closing, reprint that piece (a brim helps)." },
            { id: "shift", nickname: "The Lean", diagram: "failure-layer-shift", clue: "The top half of a piece is shifted sideways.", cause: "Layer shift: the printer skipped or got bumped.", fix: "Reprint that piece; it won't fit as is." },
          ],
        },
      ],
    },
    {
      phase: "practice",
      title: "Diagnose",
      blocks: [
        {
          id: "diag-mc",
          type: "multipleChoice",
          prompt: "Your pieces fit in Tinkercad, but in real life two pieces scrape and won't slide past each other. The scraping is only at their bottom edges. Most likely cause?",
          hint: "Which problem only happens at the very bottom of a print?",
          options: [
            { id: "foot", text: "Elephant's foot on the bottom edge" },
            { id: "design", text: "The design is wrong", misconceptionId: "design-is-wrong" },
            { id: "string", text: "Stringing" },
          ],
          correctOptionIds: ["foot"],
          explanation: "Problems only at the bottom edge point to the first layer. A light sanding usually fixes it; no need to change the design.",
          competencyId: "D11",
          check: "skill",
        },
        {
          id: "match",
          type: "matching",
          prompt: "Match each problem to the best fix.",
          hint: "Which ones can you clean up, and which need a reprint?",
          pairs: [
            { id: "string", left: "Thin threads between pieces", right: "Pull or trim them off" },
            { id: "foot", left: "Bulging bottom edge", right: "Sand or scrape it lightly" },
            { id: "shift", left: "Top half shifted sideways", right: "Reprint that piece" },
          ],
          explanation: "Clean up what you can. Reprint only when a piece can't fit.",
          competencyId: "E1",
          check: "practice",
        },
      ],
    },
    {
      phase: "apply",
      title: "Inspect and assemble",
      blocks: [
        {
          id: "safety",
          type: "callout",
          tone: "safety",
          title: "Tools safely",
          body: "Sand or file away from your body, on a table. Use the tools your teacher gives you. Wipe up plastic dust; don't blow it.",
        },
        {
          id: "micro",
          type: "challenge",
          kind: "micro",
          where: "offline",
          title: "Inspection report",
          prompt: "Check each piece, clean it up, then put the cube together.",
          requirements: ["Each piece: OK, cleaned up, or needs a reprint", "Name the problem and its cause for any piece that wasn't OK", "Assemble the cube: does it close?"],
          skills: ["D11", "E1"],
        },
        { id: "journal-test", type: "journal", projectKey: "puzzle-cube", promptIds: ["test", "failed"] },
      ],
    },
    {
      phase: "prove",
      title: "Prove it: first assembly",
      blocks: [
        {
          id: "prove",
          type: "challenge",
          kind: "prove",
          where: "offline",
          title: "First Assembly",
          prompt: "Inspect your printed pieces, fix what you can, and put your puzzle together.",
          requirements: [
            "Inspection report: every piece checked",
            "Each problem named with its likely cause",
            "Cleanup done (strings, bulges) where needed",
            "Photo of the assembled cube, or a note on which piece stops it and why",
            "Decision: reprint any piece? Why or why not?",
          ],
          skills: ["D11", "E1", "E7"],
        },
        {
          id: "submit",
          type: "uploadEvidence",
          prompt: "Upload a photo of your pieces and your assembled cube, plus your inspection report.",
          accepts: ["physical_test", "written", "screenshot"],
          competencyIds: ["D11", "E1", "E7"],
          checklist: ["Every piece checked", "Problems named with causes", "Assembled photo or a clear note"],
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
          prompt: "What was different about holding the real puzzle compared with the one on screen?",
          sentenceStarters: ["On screen … but in my hand …", "The thing I didn't expect was …"],
          competencyIds: ["E7"],
        },
      ],
    },
  ],
  teacher: {
    purpose: "Students meet real-world print variation, diagnose it with vocabulary and causes, and make a reasoned reprint decision. The first assembly also gives measurements for day 15's box.",
    preparation: [
      "Have all sets printed and labelled by student.",
      "Files, sanding sponges or nail files; a tray to catch dust.",
      "If prints aren't ready, run day 15 first (box design from the CAD size + 0.3 mm), and return to this mission when prints arrive.",
    ],
    equipment: ["Printed puzzle sets", "Files or fine sandpaper", "Flush cutters (teacher use or supervised)"],
    misconceptions: [
      { id: "design-is-wrong", text: "If printed parts don't fit, the design must be wrong.", response: "Check where they scrape. Bottom-edge-only scraping is the printer, not the design." },
    ],
    discussionQuestions: ["Which problems come from the printer, and which from the design? How can you tell?"],
    troubleshooting: [
      "Cube won't close at all: compare the printed pieces with the layer map; a piece may have been printed from an old version.",
      "Many sets show elephant's foot: lower first-layer squish or add a small 0.4 mm chamfer to bottom edges next time.",
    ],
    answerGuidance: ["Proficient: every piece checked, problems named with causes, sensible cleanup and reprint decision, assembly attempted."],
    alternatives: { noPrinter: "Use the fail gallery and a teacher-printed sample set; assemble the real-cube version.", touchDevice: "Photograph the inspection with the tablet." },
  },
};
