import type { LessonInput } from "../schema";

/** Puzzle Cube, day 7 of 18: duplicate, snap and colour cubes to build the bottom layer from the layer map. */
export const lesson: LessonInput = {
  id: "puzzle-stack-layers",
  number: 406,
  title: "Puzzle Cube 7: Snap, Duplicate, Stack",
  subtitle: "Build your bottom layer straight from the layer map.",
  domain: "A",
  kind: "lesson",
  summary: "Students use duplicate, the snap grid and colour to build the bottom layer of their puzzle from their layer map, then lift a copy to 15 mm to start the middle layer.",
  estimatedMinutes: 55,
  printLevel: "digital",
  competencyIds: ["A6", "A7", "B5"],
  prerequisites: ["puzzle-one-cube"],
  vocabulary: [
    { term: "Duplicate", definition: "Ctrl + D makes an exact copy in the same spot, ready to move." },
    { term: "Cone handle", definition: "The small black cone above a selected shape. Drag it to lift the shape up or down." },
  ],
  sections: [
    {
      phase: "discover",
      title: "Copy, move, repeat",
      blocks: [
        {
          id: "hook",
          type: "hero",
          title: "27 cubes, one snap at a time.",
          hook: "You won't make 27 cubes from scratch. You'll copy one perfect cube, snap it into place, and colour it to match your layer map.",
          visual: { diagram: "duplicate-pattern", alt: "Copy a shape, move it once, then repeat." },
        },
        {
          id: "steps",
          type: "showMe",
          title: "Build a layer",
          steps: [
            { text: "Select a cube and press Ctrl + D. The copy sits right on top of the original.", diagram: "duplicate-pattern", keys: "Ctrl + D" },
            { text: "Drag the copy three snaps (15 mm). Press Ctrl + D again: Tinkercad repeats the same move, so the next copy lands in line.", diagram: "duplicate-pattern", keys: "Ctrl + D" },
            { text: "Make a 3 × 3 square: 9 cubes. Colour each cube to match its piece letter in your layer map.", diagram: "puzzle-layer-map" },
            { text: "To start the next layer, select some cubes, duplicate, and drag the cone handle up until it shows 15 mm.", diagram: "move-z" },
          ],
        },
      ],
    },
    {
      phase: "practice",
      title: "Small errors grow",
      blocks: [
        {
          id: "predict-gap",
          type: "prediction",
          prompt: "You drag a cube with the snap grid off. It stops 14.6 mm from its neighbour instead of 15. What happens later?",
          hint: "15 − 14.6 = ? Where does that 0.4 mm go?",
          options: [
            { id: "overlap", text: "The cubes overlap by 0.4 mm, that piece ends up short, and the cube won't close properly." },
            { id: "fine", text: "Nothing: 0.4 mm is too small to matter.", misconceptionId: "close-enough" },
          ],
          expectedOptionId: "overlap",
          reveal: "Small errors add up across three cubes. If one piece is short and another long, the puzzle won't fit together. Snap or type every position.",
        },
        {
          id: "lift",
          type: "measurement",
          prompt: "Your bottom layer sits on the workplane. How high (in mm) should the bottom of the TOP layer's cubes be?",
          hint: "It sits on two layers of 15 mm cubes.",
          answer: 30,
          tolerance: 0,
          unit: "mm",
          explanation: "Two layers × 15 mm = 30 mm. Middle layer at 15 mm, top layer at 30 mm (20 mm for 10 mm keychain cubes).",
          competencyId: "A7",
          check: "skill",
        },
        {
          id: "colour-tip",
          type: "callout",
          tone: "tip",
          title: "Colour = piece",
          body: "Use one colour per piece letter, and keep a key on your layer map (A = red, B = blue …). When you build the next layers, the colours show you which piece each cube belongs to. Choose colours that differ in lightness too, not just hue, so they're easy to tell apart.",
        },
      ],
    },
    {
      phase: "apply",
      title: "Build your bottom layer",
      blocks: [
        {
          id: "tinkercad",
          type: "tinkercadLaunch",
          title: "Bottom layer from your plan",
          steps: [
            "Open your 'puzzle cube' design. Check Snap Grid is 5 mm.",
            "Duplicate cubes to make a 3 × 3 square of 9 cubes touching face to face.",
            "Colour each cube to match its letter in your bottom-layer map.",
            "Orbit and zoom to check there are no gaps.",
            "Ready early? Start the middle layer at 15 mm.",
          ],
        },
        {
          id: "micro",
          type: "challenge",
          kind: "micro",
          title: "Layer check",
          prompt: "Select all 9 cubes and read the size.",
          requirements: ["Size reads 45 × 45 × 15 mm (30 × 30 × 10 for a keychain)", "Colours match the bottom layer map"],
          skills: ["A6", "B5"],
        },
      ],
    },
    {
      phase: "prove",
      title: "Prove it: the bottom layer",
      blocks: [
        {
          id: "prove",
          type: "challenge",
          kind: "prove",
          title: "Bottom Layer",
          prompt: "Build the bottom layer of your puzzle exactly as your layer map shows.",
          requirements: ["9 exact unit cubes, face to face", "Selected together, the layer is 45 × 45 × 15 mm", "Each cube coloured by its piece", "Matches the bottom layer of your map"],
          skills: ["A6", "A7", "B5"],
        },
        {
          id: "submit",
          type: "uploadEvidence",
          prompt: "Upload a screenshot from above with the whole layer selected (size showing), next to a photo of your layer map.",
          accepts: ["screenshot", "design_url"],
          competencyIds: ["A6", "B5"],
          checklist: ["45 × 45 × 15 visible", "Colours match the map"],
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
          prompt: "What shortcut saved you the most time today?",
          sentenceStarters: ["The biggest time-saver was …", "Next layer I will …"],
          competencyIds: ["B5"],
        },
      ],
    },
  ],
  teacher: {
    purpose: "Students apply duplicate, repeat-duplicate, snapping and vertical moves to a real build, using the layer map from week 1 as their spec.",
    preparation: ["Students need their layer maps (paper or photo).", "Demo Ctrl + D twice in a row (repeat duplicate) on the projector."],
    equipment: ["Student devices with Tinkercad", "Layer maps"],
    misconceptions: [
      { id: "close-enough", text: "A fraction of a millimetre doesn't matter.", response: "Three cubes each 0.4 mm off is over 1 mm. The pieces must close a cube with no gaps." },
    ],
    discussionQuestions: ["Why use colour instead of just remembering which cube is which?"],
    troubleshooting: [
      "Repeat duplicate only repeats if you move the copy right after Ctrl + D, then press Ctrl + D again.",
      "Size reads 45.4: one cube was dragged with snap off. Re-place it.",
      "Colour-blind students: pair colour with a letter label (Text shape, deleted before printing) or use very different lightness.",
    ],
    answerGuidance: ["Proficient: bottom layer exact (45 × 45 × 15), coloured to match the map."],
    alternatives: { noPrinter: "Digital only.", touchDevice: "Use the toolbar's Duplicate button and drag with a finger; snapping still works." },
  },
};
