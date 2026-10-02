import type { LessonInput } from "../schema";

export const lesson: LessonInput = {
  id: "scaling-objects",
  number: 5,
  title: "Scaling Objects",
  subtitle: "Stretch one way, or grow all together",
  domain: "A",
  kind: "lesson",
  summary: "Resize shapes with handles in one direction or proportionally, and predict what scaling does to size and material.",
  estimatedMinutes: 45,
  printLevel: "digital",
  competencyIds: ["A8"],
  prerequisites: ["moving-objects"],
  vocabulary: [
    { term: "Scale", definition: "Change the size of a shape." },
    { term: "Proportional", definition: "All directions change by the same factor, so the shape keeps its look." },
    { term: "Handle", definition: "A small square on a selected shape that you drag to resize it." },
    { term: "Volume", definition: "How much space a shape fills, which decides how much plastic it uses." },
  ],
  sections: [
    {
      phase: "discover",
      title: "Bigger isn't just bigger",
      blocks: [
        {
          id: "hook",
          type: "hero",
          title: "Double the size. How much more plastic?",
          hook: "Make a cube twice as wide, twice as deep and twice as tall. It looks twice as big. It uses a lot more than twice the plastic.",
          visual: { diagram: "scale-handles" },
        },
        {
          id: "explain",
          type: "text",
          body: "Corner handles change **width and depth** together. Side handles change **one direction**. The top handle changes **height**. Hold **Shift** while dragging to keep proportions.",
        },
        {
          id: "show-me",
          type: "showMe",
          title: "Three kinds of resize",
          steps: [
            { text: "Select a Box. White squares appear: corners, sides and one on top.", diagram: "scale-handles" },
            { text: "Drag a side handle. Only one direction changes — the box gets longer, not wider." },
            { text: "Drag the top handle to change only the height." },
            { text: "Hold Shift and drag a corner handle. Everything grows together and the shape keeps its proportions.", keys: "Shift + drag" },
          ],
        },
        {
          id: "predict",
          type: "prediction",
          prompt: "A 20 mm cube is scaled to 40 mm on every side. How much more material does the new cube use?",
          options: [
            { id: "a", text: "2× as much", misconceptionId: "linear-volume" },
            { id: "b", text: "4× as much", misconceptionId: "linear-volume" },
            { id: "c", text: "8× as much" },
          ],
          expectedOptionId: "c",
          reveal: "2 × 2 × 2 = 8. The cube doubled in three directions, so its volume is 8× bigger: 8,000 mm³ became 64,000 mm³. Small size changes can mean big print-time changes.",
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
          title: "Resize practice",
          steps: [
            "Open Tinkercad and create a new design.",
            "Drag in a Box (20 × 20 × 20 mm). Drag a side handle until it is 50 mm long.",
            "Drag in a Cylinder. Use the top handle to make it 5 mm tall, like a coin.",
            "Drag in any shape from the shapes panel (a heart, star or letter). Shift + drag a corner until it is about 3× bigger. Check it still looks the same, only larger.",
            "Now drag a corner without Shift. Watch it get squashed or stretched.",
          ],
        },
        {
          id: "which-handle",
          type: "matching",
          prompt: "Match each goal to the handle you'd use.",
          pairs: [
            { id: "h1", left: "Make a coin thinner", right: "Top handle" },
            { id: "h2", left: "Make a bar longer, but not wider", right: "Side handle" },
            { id: "h3", left: "Make a star bigger without squashing it", right: "Shift + corner handle" },
            { id: "h4", left: "Make a box wider and deeper at once", right: "Corner handle" },
          ],
          explanation: "Pick the handle that changes only the directions you want. Shift keeps the shape's proportions.",
          competencyId: "A8",
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
          title: "Family of shapes",
          prompt: "Make three versions of the same star: small, medium and large. Then make one 'stretched' star.",
          requirements: ["Small, medium, large all have the same proportions (Shift)", "The large one is roughly 2× the width of the small one", "The stretched star is taller in Z but the same width as the medium"],
          skills: ["A8"],
        },
        {
          id: "squashed",
          type: "multipleChoice",
          prompt: "You resized a sphere and now it looks like an egg. What happened?",
          options: [
            { id: "a", text: "You dragged a handle without Shift, so one direction grew more than the others" },
            { id: "b", text: "Spheres always turn into eggs when they get bigger", misconceptionId: "shape-changes" },
            { id: "c", text: "The snap grid is set wrong" },
          ],
          correctOptionIds: ["a"],
          explanation: "Without Shift, a side or top handle changes one direction only. Undo (Ctrl + Z) and drag again holding Shift.",
          competencyId: "A8",
          check: "skill",
        },
        {
          id: "half-size",
          type: "multipleChoice",
          prompt: "A box is 40 × 20 × 10 mm. You scale it proportionally to half the size. What are its new dimensions?",
          options: [
            { id: "a", text: "20 × 10 × 5 mm" },
            { id: "b", text: "20 × 20 × 10 mm", misconceptionId: "one-axis" },
            { id: "c", text: "38 × 18 × 8 mm", misconceptionId: "subtract-scale" },
          ],
          correctOptionIds: ["a"],
          explanation: "Proportional scaling multiplies every dimension by the same number: here × ½.",
          competencyId: "A8",
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
          title: "Shrink ray",
          prompt: "Build a simple robot or animal from at least four shapes, about 60 mm tall. Then build a copy that is half the size in every direction. You decide how.",
          requirements: [
            "Original is about 60 mm tall and made of at least 4 shapes",
            "Copy is about 30 mm tall and keeps the same proportions",
            "At least one shape in the original was stretched in only one direction on purpose",
            "Both models rest on the workplane",
          ],
          skills: ["A8", "A7"],
        },
        {
          id: "submit",
          type: "uploadEvidence",
          prompt: "Submit a class share link or a screenshot with both models side by side.",
          accepts: ["design_url", "screenshot"],
          competencyIds: ["A8"],
          checklist: ["Both models visible", "Copy looks like a smaller twin, not a squashed one", "Heights are visible or noted"],
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
          prompt: "Why does doubling a part's size make the print take much more than twice as long?",
          sentenceStarters: ["When every side doubles…", "This matters because…"],
          competencyIds: ["A8"],
        },
      ],
    },
  ],
  teacher: {
    purpose: "Students control which directions they resize and understand that proportional scaling multiplies volume quickly.",
    preparation: ["Try the Shift + corner drag on a student device so you can show where the handles are."],
    equipment: ["Student devices with Tinkercad", "Optional: two printed cubes, 10 mm and 20 mm, to pass around (the 20 mm one uses about 8× the plastic)"],
    misconceptions: [
      { id: "linear-volume", text: "Doubling a part's size doubles the material it uses.", response: "Stack eight 1 cm cubes into a 2 cm cube on the table. Count them." },
      { id: "shape-changes", text: "Shapes change form when they get bigger.", response: "Show that a Shift-scaled sphere stays round; only unequal scaling squashes it." },
      { id: "one-axis", text: "Scaling 'to half size' only means one direction.", response: "Ask: is a half-size toy car shorter but just as wide? Proportional means every direction." },
      { id: "subtract-scale", text: "Scaling down means subtracting the same amount from each side.", response: "Scaling multiplies. Compare 40 − 2 with 40 × ½ on a simple sketch." },
    ],
    discussionQuestions: [
      "When would you want to stretch a shape in only one direction?",
      "If a print takes 20 minutes, roughly how long might a 2× scaled version take? Why only roughly?",
    ],
    troubleshooting: [
      "If a shape won't resize smoothly, the Snap Grid may be large; set it to 1 mm or smaller.",
      "If Shift doesn't keep proportions, make sure Shift is held down before the drag starts and released after.",
    ],
    answerGuidance: [
      "Micro: accept approximate sizes; the skill is Shift for proportional and single handles for stretching.",
      "Prove it: the copy can be made by selecting all original shapes and Shift-scaling together, or by rebuilding each shape at half size. Both are valid. Copy/paste is fine if students discover it.",
    ],
    alternatives: {
      touchDevice: "Some tablets don't have a Shift key. Instead, click the dimension numbers and type each value (half of each original value).",
    },
  },
};
