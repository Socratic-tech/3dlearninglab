import type { LessonInput } from "../schema";

/** Puzzle Cube, day 12 of 18 (optional if no piece needs it): 45° chamfers for cubes that hang over air. */
export const lesson: LessonInput = {
  id: "puzzle-chamfer",
  number: 411,
  title: "Puzzle Cube 12: Chamfer the Hard Ones",
  subtitle: "A 45° slope lets a hanging cube print on its own.",
  domain: "D",
  kind: "lesson",
  summary: "Students fix pieces that hang over air in every orientation with a 45° chamfer (a Wedge hole), learn why removing plastic never blocks the fit, and decide where a chamfer is hidden or visible. Optional if no piece needs one.",
  estimatedMinutes: 55,
  printLevel: "digital",
  competencyIds: ["D5", "D2", "B3"],
  prerequisites: ["puzzle-print-plan"],
  vocabulary: [
    { term: "Chamfer", definition: "A flat, sloped cut along an edge. A 45° chamfer under a hanging cube lets it print without supports." },
    { term: "Overhang", definition: "Part of a print that sticks out over air. Up to about 45° from straight up prints well." },
  ],
  sections: [
    {
      phase: "discover",
      title: "When turning isn't enough",
      blocks: [
        {
          id: "hook",
          type: "hero",
          title: "Cut a slope, skip the supports.",
          hook: "Some pieces have a cube hanging off the side no matter how you turn them. A 45° slope under that cube lets each layer sit a little on the one below.",
          visual: { diagram: "puzzle-chamfer", alt: "A hanging cube needs supports; with a 45° wedge cut from its underside it prints on its own." },
        },
        {
          id: "angles",
          type: "diagram",
          name: "overhang-angles",
          caption: "Overhangs up to about 45° print well. Flatter than that, the plastic droops.",
          alt: "Overhangs at 20°, 45° and 70° from vertical; up to about 45° prints well, steeper ones droop.",
        },
        {
          id: "chamfer-how",
          type: "showMe",
          title: "Make a 45° chamfer in Tinkercad",
          steps: [
            { text: "Find the cube that hangs over air when the piece lies on its best side. It should be held on by one face.", diagram: "puzzle-chamfer" },
            { text: "Drag in a Wedge, make it a Hole, and type 15 × 15 × 15 (or 10 for a keychain).", diagram: "solid-vs-hole" },
            { text: "Rotate the wedge so its square corner sits at the bottom outer edge of the hanging cube, with the slope rising toward the piece.", diagram: "rotate-handles" },
            { text: "Line it up exactly with the cube's edges (Align or the snap grid), then group. The underside is now a 45° slope.", diagram: "align-handles", keys: "Ctrl + G" },
          ],
        },
      ],
    },
    {
      phase: "practice",
      title: "Will it still fit?",
      blocks: [
        {
          id: "predict-fit",
          type: "prediction",
          prompt: "A chamfer cuts away half of one cube. Will the puzzle still go together?",
          hint: "Can taking plastic away ever stop a piece from fitting into a space?",
          options: [
            { id: "yes", text: "Yes: removing plastic never blocks a fit; it leaves a small gap" },
            { id: "no", text: "No: now the piece is the wrong shape and won't fit", misconceptionId: "chamfer-breaks-fit" },
          ],
          expectedOptionId: "yes",
          reveal: "The pieces still go together, with a small triangular gap where the plastic was. Put chamfers inside the cube where they're hidden, or the notch on the outside becomes a clue for solvers.",
        },
        {
          id: "chamfer-mc",
          type: "multipleChoice",
          prompt: "Your piece has one cube sticking out sideways at the top, held on by one face, in every position you try. What's the best support-free fix?",
          hint: "Which slope can a printer build without help?",
          options: [
            { id: "chamfer", text: "Cut a 45° chamfer under that cube" },
            { id: "supports", text: "Turn on supports and sand off the scars", misconceptionId: "supports-are-fine" },
            { id: "smaller", text: "Make that one cube smaller", misconceptionId: "chamfer-breaks-fit" },
          ],
          correctOptionIds: ["chamfer"],
          explanation: "A 45° slope supports itself, so the cube prints with no supports and no scars. A smaller cube would still hang over air.",
          competencyId: "D5",
          check: "skill",
        },
        {
          id: "two-mc",
          type: "multipleChoice",
          prompt: "A piece has TWO cubes in a row sticking out over air. What should you do?",
          hint: "A 45° slope under a 30 mm arm would cut away a lot.",
          options: [
            { id: "redesign", text: "Change the piece: trade a cube with a neighbour so less hangs out" },
            { id: "huge", text: "Cut one giant chamfer under both cubes", misconceptionId: "chamfer-anything" },
          ],
          correctOptionIds: ["redesign"],
          explanation: "One hanging cube: chamfer it. Two or more: change the piece (and re-check the piece rules).",
          competencyId: "D5",
          check: "practice",
        },
      ],
    },
    {
      phase: "apply",
      title: "Fix your pieces",
      blocks: [
        {
          id: "tinkercad",
          type: "tinkercadLaunch",
          title: "Chamfer what needs it",
          steps: [
            "Open 'puzzle cube print'. Find each piece you marked yesterday.",
            "Add a Wedge hole under the hanging cube and line it up exactly.",
            "Group it with the piece. Orbit to a side view: the underside should be a 45° slope.",
            "No marked pieces? Check your orientation table again, then help a classmate.",
          ],
        },
        {
          id: "micro",
          type: "challenge",
          kind: "micro",
          title: "Side-view check",
          prompt: "Look at every piece from the side.",
          requirements: ["No cube over air (arches are OK)", "Chamfers are 45°", "Every piece still one group"],
          skills: ["D5"],
        },
      ],
    },
    {
      phase: "prove",
      title: "Prove it: support-free pieces",
      blocks: [
        {
          id: "prove",
          type: "challenge",
          kind: "prove",
          title: "Support-Free Set",
          prompt: "Make every piece printable without supports.",
          requirements: ["Each piece: every cube on the plate, on a cube, on an arch, or on a 45° chamfer", "Pieces with two or more hanging cubes redesigned", "Note saying where each chamfer is (hidden inside, or on the outside)"],
          skills: ["D5", "D2"],
        },
        {
          id: "submit",
          type: "uploadEvidence",
          prompt: "Upload a side view of any chamfered piece (or a note that none needed one, with a side view of all pieces).",
          accepts: ["screenshot", "design_url", "written"],
          competencyIds: ["D5"],
          checklist: ["Side view", "45° slopes", "Note about chamfer placement"],
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
          prompt: "Did you hide your chamfer inside the cube or leave it on the outside? Why?",
          sentenceStarters: ["I put it … because …", "A solver might notice …"],
          competencyIds: ["D5"],
        },
      ],
    },
  ],
  teacher: {
    purpose: "Applies the 45° self-supporting rule to puzzle pieces. Students reason that removing material can't block assembly, and weigh where a visible chamfer changes the puzzle. Optional when no piece needs one.",
    preparation: ["Demo placing a Wedge hole under a cube on the projector; the rotation is the tricky part."],
    equipment: ["Student devices with Tinkercad"],
    misconceptions: [
      { id: "chamfer-breaks-fit", text: "Cutting a chamfer stops the pieces fitting.", response: "Removing plastic can only leave a gap, never block a fit." },
      { id: "supports-are-fine", text: "Supports are fine for puzzle pieces.", response: "Support scars make faces rough, and rough faces stick when pieces slide past each other." },
      { id: "chamfer-anything", text: "Any overhang can be chamfered.", response: "A slope under two cubes removes most of them. Redesign instead." },
    ],
    discussionQuestions: ["Is a visible chamfer a flaw or a clue? Could it be a feature?"],
    troubleshooting: [
      "Wedge points the wrong way: rotate 90° at a time and check from the side.",
      "Wedge doesn't cut: it must be a Hole and grouped with the piece.",
    ],
    answerGuidance: ["Proficient: every piece support-free, chamfers at 45°, pieces with two+ hanging cubes redesigned."],
    alternatives: { noPrinter: "Digital only.", touchDevice: "Use the rotate arrows and type 90 in the angle box." },
  },
};
