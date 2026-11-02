import type { LessonInput } from "../schema";

/** Puzzle Cube, day 3 of 18: the rules every puzzle piece must follow, checked against the student's piece bank. */
export const lesson: LessonInput = {
  id: "puzzle-piece-rules",
  number: 402,
  title: "Puzzle Cube 3: Piece Rules",
  subtitle: "Check every piece: strong, different and printable.",
  domain: "F",
  kind: "lesson",
  summary: "Students learn the piece rules (face-to-face joins, 3 to 7 cubes, no repeated shapes, at least two 3D pieces, a side to lie on) and test their piece bank against them with real cubes.",
  estimatedMinutes: 55,
  printLevel: "digital",
  competencyIds: ["F2", "B1"],
  prerequisites: ["puzzle-sketch-cubes"],
  vocabulary: [
    { term: "Face", definition: "A flat, square side of a cube. Cubes in a piece must share a whole face." },
    { term: "Same shape", definition: "Two pieces are the same if you can turn one so it matches the other exactly." },
    { term: "Constraint", definition: "A rule your design must follow, that you can check." },
  ],
  sections: [
    {
      phase: "discover",
      title: "Why pieces need rules",
      blocks: [
        {
          id: "hook",
          type: "hero",
          title: "A great idea can still break the rules.",
          hook: "Some pieces fall apart. Some can't print. Some make the puzzle too easy. Five quick checks catch all of them before you build anything.",
          visual: { diagram: "face-vs-edge", alt: "Two cubes sharing a face make a strong piece; two touching only on an edge snap apart." },
        },
        {
          id: "rules",
          type: "text",
          title: "The piece rules",
          body: "1. Each piece has **3 to 7 cubes**.\n2. Every cube shares a **whole face** with another cube in its piece.\n3. **No two pieces are the same shape**, even turned around.\n4. At least **2 pieces bend in 3D**: they can't lie completely flat.\n5. Each piece has **one side it can lie on** with no cube hanging over air. (That's how it prints without supports. In week 3 you'll learn a trick for pieces that break this one.)",
        },
        {
          id: "predict-edge",
          type: "prediction",
          prompt: "Two cubes in your piece touch only along one edge. You print the piece. What happens?",
          hint: "How much plastic is there along a line with no width?",
          options: [
            { id: "apart", text: "The cubes come off the printer as two separate parts." },
            { id: "weak", text: "It holds together, but it's a little weak.", misconceptionId: "edge-is-enough" },
            { id: "fine", text: "It's fine: touching is touching.", misconceptionId: "edge-is-enough" },
          ],
          expectedOptionId: "apart",
          reveal: "An edge is a line with no thickness, so no plastic joins the cubes. Tinkercad and the printer treat them as separate parts. Join cubes on a whole face.",
        },
      ],
    },
    {
      phase: "practice",
      title: "Spot the broken rules",
      blocks: [
        {
          id: "spot-loose",
          type: "hotspot",
          prompt: "One of these pieces breaks the face rule. Click the cube that would come off.",
          hint: "Orbit to look from above. Which cube only touches its piece on an edge?",
          modelId: "puzzle-piece-checkup",
          hotspots: [
            { id: "loose", label: "Corner cube of the middle piece", position: [107.5, 37.5, 15], radius: 9, correct: true, feedback: "Found it. This cube touches its neighbour only along an edge, so it's a separate part. Move it so it shares a face." },
            { id: "body", label: "Start of the middle piece", position: [77.5, 7.5, 15], radius: 9, correct: false, feedback: "This cube shares a whole face with the next one. It's solidly joined. Keep looking." },
            { id: "good", label: "End of the flat L piece", position: [37.5, 22.5, 15], radius: 9, correct: false, feedback: "This L piece follows the rules: every cube shares a face. Look at the other pieces." },
          ],
          explanation: "Look along every joint. If cubes meet only on an edge or a corner, they aren't one piece.",
          competencyId: "B1",
          check: "practice",
        },
        {
          id: "same-mc",
          type: "multipleChoice",
          prompt: "Piece A is an L lying flat. Piece B is the same L standing up on its end. Are they different pieces?",
          hint: "Could you turn piece B so it matches piece A?",
          options: [
            { id: "same", text: "No: turn B over and it matches A, so it's the same shape." },
            { id: "diff", text: "Yes: they're pointing different ways.", misconceptionId: "turned-is-new" },
          ],
          correctOptionIds: ["same"],
          explanation: "Turning a piece doesn't change its shape. The fastest check is to build both from real cubes and try to make them match.",
          competencyId: "F2",
          check: "skill",
        },
        {
          id: "rule-match",
          type: "matching",
          prompt: "Match each problem to the rule it breaks.",
          hint: "Read the five rules again.",
          pairs: [
            { id: "edge", left: "Two cubes meet only at an edge", right: "Every cube shares a whole face" },
            { id: "copy", left: "Two pieces are the same L", right: "No two pieces the same shape" },
            { id: "flat", left: "Every piece is flat", right: "At least 2 pieces bend in 3D" },
            { id: "big", left: "One piece has 9 cubes", right: "3 to 7 cubes per piece" },
          ],
          explanation: "Each rule exists for a reason: strength, variety, challenge, and pieces that are easy to hold.",
          competencyId: "F2",
          check: "practice",
        },
      ],
    },
    {
      phase: "apply",
      title: "Test your piece bank",
      blocks: [
        {
          id: "micro",
          type: "challenge",
          kind: "micro",
          where: "offline",
          title: "Build and check",
          prompt: "Build each piece from your piece bank out of real cubes. Check it against all five rules.",
          requirements: [
            "Run a finger over every joint: whole faces only",
            "Set the piece on the table: find a side with no cube over air",
            "Compare pieces: cross out any shape that's a copy of another",
            "Mark each sketch ✓ (passes) or ✗ (fix or drop it)",
          ],
          skills: ["F2", "B1"],
        },
      ],
    },
    {
      phase: "prove",
      title: "Prove it: a checked piece bank",
      blocks: [
        {
          id: "prove",
          type: "challenge",
          kind: "prove",
          where: "offline",
          title: "Rule Check",
          prompt: "Show your piece bank with every piece marked pass or fail, and fix at least one piece that failed.",
          requirements: [
            "Every piece marked ✓ or ✗ with the rule it breaks",
            "At least one failing piece redrawn so it passes",
            "At least 6 pieces that pass all the rules",
          ],
          skills: ["F2", "B1"],
        },
        {
          id: "submit",
          type: "uploadEvidence",
          prompt: "Upload a photo of your marked piece bank (sketches or real-cube pieces).",
          accepts: ["screenshot", "physical_test", "written"],
          competencyIds: ["F2", "B1"],
          checklist: ["Each piece marked", "One piece fixed", "6+ pieces pass"],
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
          prompt: "Which rule did your pieces break most often? Why do you think that rule matters?",
          sentenceStarters: ["My pieces kept breaking the … rule because …", "That rule matters because …"],
          competencyIds: ["F2"],
        },
      ],
    },
  ],
  teacher: {
    purpose: "Turns 'make cool pieces' into checkable constraints. Each rule has a physical reason students can test with real cubes: strength (face joins), variety (no copies), challenge (3D pieces), handling (3–7 cubes) and printing (a side to lie on).",
    preparation: ["Real cubes for building pieces (30 or more per student or pair).", "Students' piece banks from day 2."],
    equipment: ["Small cubes", "Piece banks", "Pencils"],
    misconceptions: [
      { id: "edge-is-enough", text: "Cubes that touch on an edge or corner are joined.", response: "Hold two real cubes edge to edge and let go of one. Nothing holds them in the print either." },
      { id: "turned-is-new", text: "A piece turned a different way is a new piece.", response: "Build both and turn one in your hand until it matches. Same pieces make a puzzle easier, not harder." },
    ],
    discussionQuestions: ["Which rule is about strength? Which is about the solver? Which is about the printer?"],
    troubleshooting: [
      "Rule 5 check: set the piece on a table; it passes if every cube touches the table or sits on another cube.",
      "If a student's favourite piece fails rule 5, keep it marked: day 12 teaches a chamfer that can fix one hanging cube.",
    ],
    answerGuidance: ["Proficient: every piece marked with the broken rule named, at least one fixed, 6+ passing pieces."],
    alternatives: { noPrinter: "No printer needed.", touchDevice: "Photograph real-cube pieces and mark them in a photo app." },
  },
};
