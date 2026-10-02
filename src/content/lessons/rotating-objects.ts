import type { LessonInput } from "../schema";

export const lesson: LessonInput = {
  id: "rotating-objects",
  number: 7,
  title: "Rotating Objects",
  subtitle: "Pick the axis, then the angle",
  domain: "A",
  kind: "lesson",
  summary: "Rotate shapes around X, Y or Z by chosen angles, and lay tilted parts flat so they fit and print.",
  estimatedMinutes: 45,
  printLevel: "digital",
  competencyIds: ["A10"],
  prerequisites: ["exact-dimensions"],
  vocabulary: [
    { term: "Rotate", definition: "Turn a shape around an axis." },
    { term: "Axis of rotation", definition: "The imaginary line a shape spins around: X, Y or Z." },
    { term: "Degree (°)", definition: "The unit for angles. A full turn is 360°, a quarter turn is 90°." },
    { term: "Snap angle", definition: "The step size a rotation jumps by when you drag, such as 22.5°." },
  ],
  sections: [
    {
      phase: "discover",
      title: "Turning on purpose",
      blocks: [
        {
          id: "hook",
          type: "hero",
          title: "It's the right size. It still won't fit.",
          hook: "A 70 mm rod and a 30 mm block need to go into a tray. Both are turned at odd angles, and the rod sticks up far above the rim. Until they are lined up, they don't belong in the tray.",
          visual: { modelId: "toolbox-parts", alt: "A tray with a tilted rod and block next to it." },
        },
        {
          id: "viewer",
          type: "modelViewer",
          modelId: "toolbox-parts",
          caption: "Orbit the scene. The tray is 90 × 45 × 25 mm with 2 mm walls. Which way would each part need to turn to lie flat?",
        },
        {
          id: "explain",
          type: "text",
          body: "Every rotation has two parts: **which axis** it turns around, and **how many degrees**. Turning around **Z** spins a shape like a record on a turntable. Turning around **X** or **Y** tips it over.",
        },
        {
          id: "show-me",
          type: "showMe",
          title: "Rotate with handles",
          steps: [
            { text: "Select a shape. Three curved arrows appear, one for each axis.", diagram: "rotate-handles" },
            { text: "Drag a curved arrow. Close to the arrow, the angle snaps in 22.5° steps: 22.5, 45, 67.5, 90…" },
            { text: "For an exact angle, click the angle number while rotating and type it, e.g. 30.", diagram: "exact-dimension" },
            { text: "After tipping a shape over, it may float or sink. Press D to drop it back onto the workplane.", diagram: "move-z", keys: "D" },
          ],
        },
        {
          id: "predict",
          type: "prediction",
          prompt: "A 70 × 8 × 6 mm bar lies flat on the workplane. You rotate it 90° around the Z axis. What happens?",
          visual: { diagram: "rotate-handles" },
          options: [
            { id: "a", text: "It stays flat, but now points front–back instead of left–right" },
            { id: "b", text: "It stands up and is 70 mm tall", misconceptionId: "z-tips" },
            { id: "c", text: "It flips upside down", misconceptionId: "z-tips" },
          ],
          expectedOptionId: "a",
          reveal: "Z is the up axis, so turning around it spins the bar on the workplane. To stand it up, rotate around X or Y instead.",
        },
      ],
    },
    {
      phase: "practice",
      title: "Try it",
      blocks: [
        {
          id: "tinkercad",
          type: "tinkercadLaunch",
          title: "Rotation practice",
          steps: [
            "Open Tinkercad and create a new design.",
            "Make a Box 70 × 8 × 6 mm. Rotate it 90° around Y so it stands up. Press D.",
            "Rotate it back to flat. Then spin it 45° around Z.",
            "Make a second box 40 × 6 × 3 mm. Rotate it exactly 30° by typing the angle.",
            "Optional: import toolbox-parts.stl to see the tilted parts in Tinkercad.",
          ],
        },
        { id: "files", type: "modelDownload", modelIds: ["toolbox-parts"], showImportSteps: true },
        {
          id: "quarter-turns",
          type: "measurement",
          prompt: "Dragging snaps in 22.5° steps. How many steps make a quarter turn (90°)?",
          answer: 4,
          tolerance: 0,
          unit: "steps",
          hint: "90 ÷ 22.5",
          explanation: "4 × 22.5° = 90°. Two steps give 45°. For angles like 30° that aren't on the snap, type the value.",
          competencyId: "A10",
          check: "practice",
        },
      ],
    },
    {
      phase: "apply",
      title: "Micro challenge",
      blocks: [
        {
          id: "micro",
          type: "challenge",
          kind: "micro",
          title: "Pack the rod",
          prompt: "Make a rod 70 × 8 × 6 mm standing straight up. Then lay it flat so it would fit inside a tray 86 mm long, 41 mm wide and 23 mm deep.",
          requirements: ["Rod is lying flat (6 mm or 8 mm tall, not 70 mm)", "Rod rests on the workplane", "Rod is turned so its 70 mm length runs along X"],
          skills: ["A10", "A7"],
        },
        {
          id: "axis-choice",
          type: "multipleChoice",
          prompt: "A rod stands straight up, 70 mm tall. Which rotation lays it flat?",
          options: [
            { id: "a", text: "90° around X" },
            { id: "b", text: "90° around Y" },
            { id: "c", text: "90° around Z", misconceptionId: "z-tips" },
          ],
          correctOptionIds: ["a", "b"],
          explanation: "X or Y both tip it over; they just point it in different directions. Z only spins it while it stays standing.",
          competencyId: "A10",
          check: "skill",
        },
        {
          id: "twice",
          type: "multipleChoice",
          prompt: "You rotate a shape 45° around Z, then 45° around Z again. Where does it end up?",
          options: [
            { id: "a", text: "90° from where it started" },
            { id: "b", text: "Still at 45°, because the second rotation sets it to 45°", misconceptionId: "absolute-angle" },
          ],
          correctOptionIds: ["a"],
          explanation: "Each rotation turns the shape from where it is now. Rotations add up.",
          competencyId: "A10",
          check: "skill",
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
          title: "Ramp and railroad sign",
          prompt: "Build both objects. No steps — decide which axis and which angle each part needs.",
          requirements: [
            "Ramp: a plank 60 × 20 × 3 mm tilted so it rests with one end on the workplane and the other end on a 20 mm cube",
            "Sign: two bars 40 × 6 × 3 mm crossing in an X at 90° to each other",
            "The X stands upright (like a real sign), not lying flat",
            "Nothing floats or sinks below the workplane",
          ],
          skills: ["A10", "A9", "A7"],
        },
        {
          id: "submit",
          type: "uploadEvidence",
          prompt: "Submit a class share link or two screenshots: one side view of the ramp, one front view of the sign.",
          accepts: ["design_url", "screenshot"],
          competencyIds: ["A10"],
          checklist: ["Ramp touches both the workplane and the cube", "The two bars of the X are at 90° to each other", "The sign is vertical"],
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
          prompt: "How do you decide which axis to rotate around before you start dragging?",
          sentenceStarters: ["First I picture…", "If I want it to tip over, I…", "If I want it to spin, I…"],
          competencyIds: ["A10"],
        },
      ],
    },
  ],
  teacher: {
    purpose: "Students choose an axis and angle deliberately and learn to re-seat a shape on the workplane after rotating.",
    preparation: [
      "Practise one rotation with a typed angle so you can show where the angle box appears.",
      "Optional: download toolbox-parts.stl. It imports as a single shape, so it is a reference only; students build their own rod and block.",
    ],
    equipment: ["Student devices with Tinkercad", "Optional: a pencil to physically demonstrate X, Y and Z rotations"],
    misconceptions: [
      { id: "z-tips", text: "Rotating around Z tips a shape over.", response: "Hold a pencil upright and spin it between your fingers — that's Z. Tip it forward — that's X or Y." },
      { id: "absolute-angle", text: "Typing an angle sets the shape to that angle.", response: "Rotate 45° twice and show the shape has turned 90°. Each rotation adds to the last." },
    ],
    discussionQuestions: [
      "Why does a shape float or sink after you tip it over?",
      "The ramp's angle depends on the plank and cube sizes. How could you find it without a protractor?",
    ],
    troubleshooting: [
      "If rotation jumps in big steps, drag closer to or farther from the arrow; the snap amount depends on where the pointer is.",
      "If a shape seems to vanish after rotating, it may be below the workplane. Press D.",
      "If students can't get the ramp to touch both ends, suggest rotating first, then moving it on Z and X while watching from the side.",
    ],
    answerGuidance: [
      "Pack the rod: 90° around X or Y, then 90° around Z if needed so the length runs along X, then D.",
      "Ramp: about 20° gets one end of a 60 mm plank up onto a 20 mm cube; accept anything that visibly touches both. Students may type a value or use a snap step and adjust.",
      "Sign: one bar rotated +45° and one −45° (or 0° and 90°, then both turned 45°) around the same axis, then the whole X rotated 90° around X to stand up.",
    ],
    alternatives: {
      touchDevice: "Drag the rotation arrows with a finger and type the angle using the on-screen keyboard.",
    },
  },
};
