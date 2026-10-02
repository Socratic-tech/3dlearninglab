import type { LessonInput } from "../schema";

export const lesson: LessonInput = {
  id: "orientation",
  number: 24,
  title: "Orientation",
  subtitle: "Same part, different strength",
  domain: "D",
  kind: "lesson",
  summary: "Choose how a part sits on the build plate by thinking about where the load goes and which way the layers run.",
  estimatedMinutes: 45,
  printLevel: "digital",
  competencyIds: ["D6", "D7"],
  prerequisites: ["layers"],
  vocabulary: [
    { term: "Orientation", definition: "How a part is turned and placed on the build plate before printing." },
    { term: "Load", definition: "The force a part has to carry, like the weight of a bag on a hook." },
    { term: "Layer boundary", definition: "The joint between two layers — usually the weakest place in a print." },
    { term: "Anisotropic", definition: "Stronger in one direction than another. Prints are strong along layers and weaker between them." },
  ],
  sections: [
    {
      phase: "discover",
      title: "Which way up?",
      blocks: [
        {
          id: "hook",
          type: "hero",
          title: "One hook. Three ways to print it. Only one survives the backpack.",
          hook: "The CAD file is identical every time. The only thing that changes is how the part sits on the plate — and that changes where the layers are.",
          visual: { diagram: "orientation-strength" },
        },
        {
          id: "explain",
          type: "text",
          body: "Layers stick to each other, but not perfectly. A print is strong **along** its layers and weaker **between** them. Pulling layers apart is like peeling sticky notes off a stack.",
        },
        { id: "viewer", type: "modelViewer", modelId: "orientation-hook", caption: "This is the hook standing up. Slide the layers — where would it snap?", showLayers: true },
        {
          id: "which-orientation",
          type: "multipleChoice",
          prompt: "Which orientation? The hook will hang on a wall and carry a heavy bag pulling straight down on the curved end.",
          options: [
            { id: "standing", text: "Standing upright", diagram: "hook-standing", misconceptionId: "tall-is-strong", feedback: "Test result: the layers run across the stem and the bend. The bag pulls those layers apart, and it tends to snap at the bend." },
            { id: "flat", text: "Lying flat on its side", diagram: "hook-flat", feedback: "Layers run along the whole hook shape, so the load pulls along the lines of plastic instead of between them." },
            { id: "upside-down", text: "Upside down on its tip", diagram: "hook-upside-down", misconceptionId: "orientation-only-looks", feedback: "Test result: it balances on a tiny contact area, so it may fall over mid-print — and the layers still run across the stem." },
          ],
          correctOptionIds: ["flat"],
          explanation: "Lying flat, every layer is a full hook-shaped slice. The load pulls along those continuous lines of plastic. Standing up, the bend is made of short stacked layers — that boundary is where it breaks.",
          competencyId: "D6",
          check: "skill",
        },
        {
          id: "reveal",
          type: "diagram",
          name: "orientation-strength",
          caption: "Standing: layers across the hook (weak). Flat: layers along the hook (strong).",
          alt: "A hook printed standing (layers across the hook — weak) versus printed flat (layers along the hook — strong).",
        },
      ],
    },
    {
      phase: "practice",
      title: "Think like the printer",
      blocks: [
        {
          id: "show-me",
          type: "showMe",
          title: "Choose an orientation in three questions",
          steps: [
            { text: "Where does the load go? Draw an arrow showing the force.", diagram: "orientation-strength" },
            { text: "Turn the part so the layers run ALONG that force, not across it.", diagram: "layers-stack" },
            { text: "Check the base: is there a big flat face to sit on? Are there overhangs that would need support?", diagram: "overhang-angles" },
          ],
        },
        {
          id: "mc-strip",
          type: "multipleChoice",
          prompt: "A long, thin ruler (150 × 20 × 3 mm) will be bent a little when used. Which orientation is best?",
          options: [
            { id: "a", text: "Flat on the plate — every layer is a full ruler shape." },
            { id: "b", text: "Standing on its short end — 150 mm tall.", misconceptionId: "tall-is-strong" },
            { id: "c", text: "It doesn't matter for a ruler.", misconceptionId: "orientation-only-looks" },
          ],
          correctOptionIds: ["a"],
          explanation: "Flat, the layers run the full length so bending pulls along the plastic. Standing on its end, it would have hundreds of small layer boundaries and a tiny base — weak and wobbly.",
          competencyId: "D7",
          check: "skill",
        },
        {
          id: "mc-tradeoff",
          type: "multipleChoice",
          prompt: "Orientation can change more than strength. Which of these can it also change? Choose all that apply.",
          options: [
            { id: "a", text: "How much support material is needed" },
            { id: "b", text: "How smooth a curved surface looks" },
            { id: "c", text: "How long the print takes" },
            { id: "d", text: "The colour of the plastic" },
          ],
          correctOptionIds: ["a", "b", "c"],
          explanation: "Orientation is a trade-off: strength, supports, surface finish and time all change. Pick the one that matters most for this part's job.",
          competencyId: "D6",
          check: "practice",
        },
      ],
    },
    {
      phase: "apply",
      title: "Rotate for the plate",
      blocks: [
        {
          id: "tinkercad",
          type: "tinkercadLaunch",
          title: "Lay the hook down",
          steps: [
            "Download the Orientation Hook and import it.",
            "Rotate it 90° so it lies flat on its side (use the curved arrow handles; they snap in 22.5° steps).",
            "Press D to drop it onto the workplane. Check the height is now 10 mm.",
          ],
        },
        { id: "files", type: "modelDownload", modelIds: ["orientation-hook"], showImportSteps: true },
        {
          id: "micro",
          type: "challenge",
          kind: "micro",
          title: "Orientation card",
          prompt: "For the hook in its new position, write one sentence about each: strength, supports, base.",
          requirements: ["Hook lies flat, 10 mm tall", "Sitting on the workplane (Z = 0)", "Three sentences written"],
          skills: ["D6", "A10"],
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
          title: "The headphone hanger",
          prompt: "Design a headphone hanger that clamps under a 20 mm thick desk and holds headphones underneath. Then place it in Tinkercad exactly how you would put it on the build plate.",
          requirements: [
            "Clamp opening fits a 20 mm desk edge (add your class clearance)",
            "Hook that sticks out at least 40 mm to hold headphones",
            "Placed in your chosen print orientation, sitting on the workplane",
            "An arrow or note showing which way the load pulls",
            "Two sentences justifying the orientation using the words \"layers\" and \"load\"",
          ],
          skills: ["D6", "D7", "A10"],
        },
        {
          id: "submit",
          type: "uploadEvidence",
          prompt: "Submit a screenshot of the hanger in its print orientation, plus your justification.",
          accepts: ["screenshot", "design_url", "stl"],
          competencyIds: ["D6", "D7"],
          checklist: ["Part sits on the workplane", "Load direction shown", "Justification mentions layers and load"],
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
          prompt: "Why can the same CAD file make a strong part or a weak part?",
          sentenceStarters: ["The difference is…", "Layers are strongest when…"],
          competencyIds: ["D7"],
        },
      ],
    },
  ],
  teacher: {
    purpose: "Students learn to choose print orientation from the load direction, layer direction and practical trade-offs. Next lesson they test the hook physically.",
    preparation: [
      "Optional but powerful: print two hooks before class (one standing, one flat) and let students try to bend them by hand over a tray.",
      "Check the Orientation Hook imports cleanly on a student device.",
    ],
    equipment: ["Student devices with Tinkercad", "Optional: pre-printed hooks in two orientations"],
    misconceptions: [
      { id: "tall-is-strong", text: "Standing a part upright makes it stronger because it is printed 'the way it's used'.", response: "Use a stack of sticky notes: pull along the stack vs. peel the top off. Layers peel apart too." },
      { id: "orientation-only-looks", text: "Orientation only changes how a print looks.", response: "Pass around two hooks printed differently and ask students to compare how they flex." },
    ],
    discussionQuestions: [
      "Where have you seen a print break? Which way were the layers?",
      "Can you think of a part where the strongest orientation needs lots of support? What would you do?",
    ],
    troubleshooting: [
      "If the rotated hook floats above or sinks below the workplane, select it and press D.",
      "If rotation lands on an odd angle, type 90 into the angle box while dragging.",
    ],
    answerGuidance: [
      "Which orientation: flat.",
      "Ruler: flat.",
      "Trade-offs: supports, surface finish, print time.",
      "Headphone hanger: usually printed lying on its side so the clamp-and-hook profile is in every layer; justification should link load direction to layer direction.",
    ],
    alternatives: {
      noPrinter: "Use sticky-note stacks or a stack of paper to model layer boundaries.",
      touchDevice: "Use the rotate handles by touch and type 90 for the angle.",
    },
  },
};
