import type { LessonInput } from "../schema";

export const lesson: LessonInput = {
  id: "workplanes",
  number: 8,
  title: "Workplanes",
  subtitle: "Build on any face, not just the floor",
  domain: "A",
  kind: "lesson",
  summary: "Place a workplane on a sloped or vertical face so new shapes sit flat on it, then return to the main workplane.",
  estimatedMinutes: 45,
  printLevel: "digital",
  competencyIds: ["A11"],
  prerequisites: ["rotating-objects"],
  vocabulary: [
    { term: "Workplane", definition: "The grid new shapes are placed on. You can move it onto any face." },
    { term: "Face", definition: "One flat surface of a shape." },
    { term: "Default workplane", definition: "The main blue grid that represents the build plate." },
    { term: "Slope", definition: "A face that is tilted, not flat and not vertical." },
  ],
  sections: [
    {
      phase: "discover",
      title: "A floor anywhere",
      blocks: [
        {
          id: "hook",
          type: "hero",
          title: "How do you put a button on a slanted surface?",
          hook: "You could rotate a cylinder to exactly the right angle and nudge it until it touches. Or you could move the floor.",
          visual: { diagram: "workplane", alt: "A grid placed on the sloped face of a wedge." },
        },
        {
          id: "viewer",
          type: "modelViewer",
          modelId: "wedge-block",
          caption: "The wedge is 40 mm long and 30 mm wide. Its top slopes from 30 mm high down to 10 mm high.",
          showDimensions: true,
        },
        {
          id: "explain",
          type: "text",
          body: "The **Workplane** tool moves the grid onto any face you click. New shapes then land **flat on that face**, already tilted to match. Move it back when you're done.",
        },
        {
          id: "show-me",
          type: "showMe",
          title: "Use a workplane",
          steps: [
            { text: "Select the Workplane tool (or press W).", keys: "W" },
            { text: "Hover over the sloped face. A preview grid appears. Click to place it.", diagram: "workplane" },
            { text: "Drag a shape from the panel. It lands flat on the slope, tilted to match." },
            { text: "To return to the default workplane, choose the Workplane tool again and click an empty area of the workspace.", keys: "W" },
          ],
        },
        {
          id: "predict",
          type: "prediction",
          prompt: "With the workplane on the wedge's slope, you drag in a cylinder. Which way does its round top face?",
          options: [
            { id: "a", text: "Tilted, at a right angle to the slope" },
            { id: "b", text: "Straight up, like always", misconceptionId: "workplane-cosmetic" },
          ],
          expectedOptionId: "a",
          reveal: "The workplane decides what 'up' means for new shapes. On the slope, 'up' is at a right angle to the sloped face, so the cylinder is tilted.",
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
          title: "Build on the wedge",
          steps: [
            "Open Tinkercad and create a new design. Import wedge-block.stl (download below).",
            "Press W and click the sloped face.",
            "Drag in a Cylinder and make it 10 mm across and 5 mm tall. It sits flat on the slope.",
            "Press W and click the tall, vertical back face. Add a 10 × 10 × 3 mm box there.",
            "Return to the default workplane. Drag in one more shape and check it sits on the floor again.",
          ],
        },
        { id: "files", type: "modelDownload", modelIds: ["wedge-block"], showImportSteps: true },
        {
          id: "find-slope",
          type: "hotspot",
          prompt: "Click the face where you'd place the workplane to add a button that sits flat on the slope.",
          modelId: "wedge-block",
          hotspots: [
            { id: "slope", label: "Sloped top", position: [20, 15, 20], radius: 10, correct: true, feedback: "Yes. A workplane here makes new shapes sit flat on the slope." },
            { id: "front", label: "Low end", position: [40, 15, 5], radius: 6, correct: false, feedback: "That's the short vertical end. A shape here would stick out sideways, not sit on the slope." },
            { id: "back", label: "Tall back", position: [0, 15, 15], radius: 8, correct: false, feedback: "That's the tall vertical face. Useful for a label, but not for the slope." },
          ],
          explanation: "Pick the face you want to build on. The workplane copies that face's angle.",
          competencyId: "A11",
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
          title: "Control panel",
          prompt: "Turn the wedge into a control panel.",
          requirements: ["Three round buttons sit flat on the slope", "One rectangular screen 20 × 8 × 2 mm sits flat on the slope", "Nothing floats above or sinks into the slope"],
          skills: ["A11", "A9"],
        },
        {
          id: "why-workplane",
          type: "multipleChoice",
          prompt: "Why use a workplane instead of rotating each shape to match the slope?",
          options: [
            { id: "a", text: "New shapes arrive already at the slope's angle and touching the face, so no guessing" },
            { id: "b", text: "Workplanes make the slope steeper", misconceptionId: "workplane-cosmetic" },
            { id: "c", text: "Rotating shapes isn't allowed on slopes" },
          ],
          correctOptionIds: ["a"],
          explanation: "You could rotate and nudge by hand, but the workplane matches the angle exactly and places shapes on the surface.",
          competencyId: "A11",
          check: "skill",
        },
        {
          id: "forgot",
          type: "multipleChoice",
          prompt: "You finished the slope and dragged in a new box for the base, but it appears tilted in the air. What happened?",
          options: [
            { id: "a", text: "The workplane is still on the slope. Move it back to the default workplane first" },
            { id: "b", text: "The box is broken; delete it", misconceptionId: "workplane-permanent" },
          ],
          correctOptionIds: ["a"],
          explanation: "The workplane stays where you put it until you move it. Return to the default workplane before building on the floor.",
          competencyId: "A11",
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
          title: "Solar house",
          prompt: "Use Tinkercad's Roof shape on top of a box to make a small house. Add details on faces that aren't the floor. No steps.",
          requirements: [
            "A solar panel 20 × 15 × 2 mm lies flat on one sloped side of the roof",
            "A window 10 × 10 × 2 mm sits flat on a vertical wall",
            "A door 10 × 2 × 16 mm sits on the front wall, touching the workplane",
            "The house itself rests on the default workplane",
          ],
          skills: ["A11", "A9", "A7"],
        },
        {
          id: "submit",
          type: "uploadEvidence",
          prompt: "Submit a class share link or two screenshots from different angles.",
          accepts: ["design_url", "screenshot"],
          competencyIds: ["A11"],
          checklist: ["Solar panel lies flat on the slope", "Window is flat against its wall", "Workplane was returned to default for the base"],
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
          prompt: "Name a real object with features on a sloped or vertical face. How would you build one feature with a workplane?",
          sentenceStarters: ["A … has a … on its side.", "I would put the workplane on…"],
          competencyIds: ["A11"],
        },
      ],
    },
  ],
  teacher: {
    purpose: "Students place workplanes on any face to build features that sit flush, and remember to return to the default workplane.",
    preparation: ["Download wedge-block.stl and test one import plus a workplane on its slope."],
    equipment: ["Student devices with Tinkercad"],
    misconceptions: [
      { id: "workplane-cosmetic", text: "The workplane only changes the grid, not where shapes go.", response: "Drag the same shape in before and after placing a workplane on the slope. Compare." },
      { id: "workplane-permanent", text: "Once moved, the workplane can't go back (or the shape is broken).", response: "Demonstrate returning to the default workplane, then drag in a new shape." },
    ],
    discussionQuestions: [
      "Which faces of a phone could you build on with a workplane?",
      "When might rotating a shape be simpler than moving the workplane?",
    ],
    troubleshooting: [
      "If the workplane snaps to the wrong face, orbit so the target face is clearly visible, then click again.",
      "If new shapes appear tilted unexpectedly, the workplane is still on another face.",
      "The Roof shape is in the Basic Shapes panel. If students can't find it, a Wedge shape works too.",
    ],
    answerGuidance: [
      "Wedge slope: rises 20 mm over 40 mm, about 27°. Students don't need the angle — the workplane handles it.",
      "House: accept any roof slope. The solar panel may sink slightly into the roof as long as it follows the slope and doesn't float.",
    ],
    alternatives: {
      touchDevice: "Use the Workplane button in the toolbar instead of W.",
    },
  },
};
