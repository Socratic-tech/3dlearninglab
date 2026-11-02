import type { LessonInput } from "../schema";

/** Puzzle Cube, day 8 of 18: build the middle and top layers, then check the whole 45 mm cube. */
export const lesson: LessonInput = {
  id: "puzzle-whole-cube",
  number: 407,
  title: "Puzzle Cube 8: Build the Whole Cube",
  subtitle: "Three layers, 27 cubes, and a careful check.",
  domain: "B",
  kind: "lesson",
  summary: "Students finish the middle and top layers from their layer map, then check the whole puzzle: 45 × 45 × 45 mm, no gaps, no doubled cubes, every colour where the plan says.",
  estimatedMinutes: 55,
  printLevel: "digital",
  competencyIds: ["B1", "A7", "B5"],
  prerequisites: ["puzzle-stack-layers"],
  vocabulary: [
    { term: "Hide", definition: "The light-bulb button in the shape panel. It hides a shape so you can see what's behind it." },
    { term: "Build in place", definition: "Building every piece where it sits in the finished cube, so the pieces fit by design." },
  ],
  sections: [
    {
      phase: "discover",
      title: "Finish the cube",
      blocks: [
        {
          id: "hook",
          type: "hero",
          title: "Build it solved.",
          hook: "You're building the puzzle already put together, one colour per piece. Tomorrow you'll take it apart, and because you built it in place, the pieces are guaranteed to fit.",
          visual: { modelId: "puzzle-cube-exploded", alt: "A sample puzzle cube pulled apart into its pieces." },
        },
        {
          id: "check-steps",
          type: "showMe",
          title: "Check inside the cube",
          steps: [
            { text: "Select everything (drag a box around it) and read the size: 45 × 45 × 45.", diagram: "selection" },
            { text: "Count the cubes: there should be 27. A gap you can see through means one is missing. 28 means two cubes are sitting in one spot.", diagram: "selection" },
            { text: "Check that the size reads exactly 45.0. Something like 45.4 means one cube was dragged off the 5 mm snap grid, so drag it a little and let it snap back.", diagram: "selection" },
            { text: "Select the top layer's cubes and click the light bulb to hide them. Now you can check the middle layer.", diagram: "selection" },
            { text: "Compare each layer with your layer map, square by square.", diagram: "puzzle-layer-map" },
            { text: "Click 'Show all' (light bulb in the top toolbar) to bring everything back.", diagram: "selection" },
          ],
        },
      ],
    },
    {
      phase: "practice",
      title: "Spot the problem",
      blocks: [
        {
          id: "size-mc",
          type: "multipleChoice",
          prompt: "You select everything and the size reads 45 × 45 × 60. What's the likely problem?",
          hint: "60 is one more layer than you planned.",
          options: [
            { id: "float", text: "A cube is sitting one layer too high (at 45 mm)" },
            { id: "fine", text: "Nothing: Tinkercad adds a little extra", misconceptionId: "size-is-close" },
            { id: "wide", text: "A cube is too wide" },
          ],
          correctOptionIds: ["float"],
          explanation: "45 + 15 = 60, so something sticks up one layer. Orbit to a side view to find it, then lower it to 30 mm.",
          competencyId: "A7",
          check: "skill",
        },
        {
          id: "errors",
          type: "matching",
          prompt: "Match each check result to its fix.",
          hint: "Think about which cube is wrong and how.",
          pairs: [
            { id: "hole", left: "A gap you can see through", right: "A cube is missing: duplicate one into the gap" },
            { id: "double", left: "28 cubes when you count", right: "Two cubes are in one spot: delete one" },
            { id: "colour", left: "A cube is the wrong colour", right: "Recolour it to match the layer map" },
            { id: "size", left: "Size reads 45.4 mm", right: "A cube was dragged off the grid: re-snap it" },
          ],
          explanation: "Checking now saves a lot of trouble later: tomorrow these colours become your pieces.",
          competencyId: "B1",
          check: "practice",
        },
      ],
    },
    {
      phase: "apply",
      title: "Build layers 2 and 3",
      blocks: [
        {
          id: "tinkercad",
          type: "tinkercadLaunch",
          title: "Finish your cube",
          steps: [
            "Build the middle layer at 15 mm, coloured from your middle-layer map.",
            "Build the top layer at 30 mm, coloured from your top-layer map.",
            "Select all: check the size is 45 × 45 × 45.",
            "Hide the top layer and check the middle; hide the middle and check the bottom. Then Show all.",
          ],
        },
        {
          id: "micro",
          type: "challenge",
          kind: "micro",
          title: "Count to 27",
          prompt: "Count your cubes, one layer at a time.",
          requirements: ["9 in each layer", "27 in all", "Each colour count matches its piece size"],
          skills: ["B1"],
        },
      ],
    },
    {
      phase: "prove",
      title: "Prove it: the whole cube",
      blocks: [
        {
          id: "prove",
          type: "challenge",
          kind: "prove",
          title: "The Whole Cube",
          prompt: "Build your complete puzzle cube in place, coloured by piece.",
          requirements: ["27 exact unit cubes", "Selected together: 45 × 45 × 45 mm (30 for a keychain)", "No gaps and no doubled cubes (checked with Hide)", "Every cube coloured to match the layer map"],
          skills: ["B1", "A7", "B5"],
        },
        {
          id: "submit",
          type: "uploadEvidence",
          prompt: "Upload a screenshot of the whole cube selected (size showing), and one with the top layer hidden.",
          accepts: ["screenshot", "design_url"],
          competencyIds: ["B1", "A7"],
          checklist: ["45 × 45 × 45 visible", "Top layer hidden view", "Colours match the map"],
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
          prompt: "What did your check catch? If nothing, how did you make sure there was nothing to catch?",
          sentenceStarters: ["When I hid the top layer I saw …", "I made sure by …"],
          competencyIds: ["B1"],
        },
      ],
    },
  ],
  teacher: {
    purpose: "Students complete the in-place build and verify it systematically (size, layer-by-layer with Hide, counts). Building in place guarantees fit; the checks catch errors before pieces are grouped.",
    preparation: ["Show Hide and Show all on the projector."],
    equipment: ["Student devices with Tinkercad", "Layer maps"],
    misconceptions: [
      { id: "size-is-close", text: "A size close to 45 is fine.", response: "45 × 45 × 45 should read exactly. Anything else means a cube is out of place." },
    ],
    discussionQuestions: ["Why build the puzzle assembled rather than building each piece on its own?"],
    troubleshooting: [
      "Can't select one cube inside the stack: hide the cubes in front of it first.",
      "Slow Chromebooks: 27 cubes is fine, but avoid extra decoration until pieces are grouped.",
    ],
    answerGuidance: ["Proficient: exact 45 mm cube, 27 cubes, colours match the plan, layer check shown."],
    alternatives: { noPrinter: "Digital only.", touchDevice: "Tap shapes to select; use the toolbar's light bulb to hide." },
  },
};
