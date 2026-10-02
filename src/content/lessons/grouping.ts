import type { LessonInput } from "../schema";

export const lesson: LessonInput = {
  id: "grouping",
  number: 10,
  title: "Grouping",
  subtitle: "Many simple shapes, one object",
  domain: "B",
  kind: "lesson",
  summary: "Build a complex object from simple shapes, group it into one part, and ungroup it when you need to edit.",
  estimatedMinutes: 45,
  printLevel: "digital",
  competencyIds: ["B1", "B2"],
  prerequisites: ["workplanes"],
  vocabulary: [
    { term: "Primitive", definition: "A basic shape such as a box, cylinder, sphere, cone or wedge." },
    { term: "Group", definition: "Join selected shapes into one object that moves, sizes and exports together (Ctrl + G)." },
    { term: "Ungroup", definition: "Split a group back into its shapes so you can edit one (Ctrl + Shift + G)." },
    { term: "Overlap", definition: "When two shapes share some of the same space. Overlapping parts print as one connected piece." },
  ],
  sections: [
    {
      phase: "discover",
      title: "Everything is boxes and cylinders",
      blocks: [
        {
          id: "hook",
          type: "hero",
          title: "Look closely: it's just shapes.",
          hook: "A rocket is a cylinder, a cone and three wedges. A table is a box and four cylinders. Designers see the simple shapes inside complex objects.",
          visual: { diagram: "group-hole" },
        },
        {
          id: "explain",
          type: "text",
          body: "**Combine** primitives to build the form. Then **group** them so the object behaves as one: it moves, resizes and exports together. Need to change one piece? **Ungroup**, edit, and group again.",
        },
        {
          id: "show-me",
          type: "showMe",
          title: "Build and group a simple table",
          steps: [
            { text: "Make a Box 60 × 40 × 4 mm for the tabletop. Raise it 30 mm.", diagram: "move-z" },
            { text: "Make a Cylinder 6 × 6 × 30 mm for a leg. Place it under one corner so its top touches the tabletop.", diagram: "exact-dimension" },
            { text: "Make three more legs the same way, one under each corner." },
            { text: "Select all five shapes (Ctrl + A or a selection box), then Group.", diagram: "selection", keys: "Ctrl + G" },
            { text: "Drag the table. It moves as one. Ungroup to edit a single leg.", keys: "Ctrl + Shift + G" },
          ],
        },
        {
          id: "predict",
          type: "prediction",
          prompt: "A cube floats 5 mm above a cylinder, not touching it. You group them and export the file. What prints?",
          options: [
            { id: "a", text: "Two separate pieces — the cube starts in mid-air", },
            { id: "b", text: "One connected piece, because they're grouped", misconceptionId: "group-glues" },
          ],
          expectedOptionId: "a",
          reveal: "Grouping is a CAD instruction, not glue. To print as one piece, shapes must touch or overlap. A gap stays a gap.",
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
          title: "Build the table",
          steps: [
            "Open Tinkercad and create a new design.",
            "Follow the Show Me steps to build and group the table.",
            "Ungroup it. Make one leg 40 mm tall, then group again. Orbit and look at what changed.",
            "Undo (Ctrl + Z) to get the even legs back.",
          ],
        },
        {
          id: "why-group",
          type: "matching",
          prompt: "Match each situation to what grouping does.",
          pairs: [
            { id: "g1", left: "You drag the table to a new spot", right: "All parts move together" },
            { id: "g2", left: "You Shift-scale the table to 2×", right: "All parts grow together, keeping their positions" },
            { id: "g3", left: "You export the table as an STL", right: "Overlapping parts become one solid" },
            { id: "g4", left: "One leg needs to be shorter", right: "Ungroup, edit, regroup" },
          ],
          explanation: "A group behaves like one shape until you ungroup it.",
          competencyId: "B2",
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
          title: "Rocket",
          prompt: "Build a rocket from primitives and group it into one object.",
          requirements: ["At least a cylinder body, a cone nose and three fins", "About 80 mm tall", "Every part touches or overlaps the body", "One group, resting on the workplane"],
          skills: ["B1", "B2"],
        },
        {
          id: "touching",
          type: "multipleChoice",
          prompt: "You grouped a snowman: three spheres stacked up. When you print it, the head falls off. What is the most likely cause?",
          options: [
            { id: "a", text: "The head only touched the body at a single point, or not at all, so there was almost no connection" },
            { id: "b", text: "Grouping was undone during export", misconceptionId: "group-glues" },
            { id: "c", text: "Spheres can't be grouped" },
          ],
          correctOptionIds: ["a"],
          explanation: "Two spheres stacked just touching meet at one tiny point. Sink the head a few millimetres into the body so they overlap.",
          competencyId: "B1",
          check: "skill",
        },
        {
          id: "edit-group",
          type: "multipleChoice",
          prompt: "Your rocket is grouped. You need to make just the nose cone 5 mm taller. What should you do?",
          options: [
            { id: "a", text: "Ungroup, resize the cone, then group again" },
            { id: "b", text: "Drag the group's top handle up 5 mm", misconceptionId: "scale-group-part" },
            { id: "c", text: "Delete the rocket and start over" },
          ],
          correctOptionIds: ["a"],
          explanation: "Resizing a group stretches every part inside it. Ungroup to change one part only.",
          competencyId: "B2",
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
          title: "Desk buddy",
          prompt: "Design a small desk object for a classmate — a mini lamp, a robot, a tiny trophy — built only from primitives. You choose the shapes. No steps.",
          requirements: [
            "Built from at least 6 primitives, using at least 3 different shape types",
            "Fits inside 60 × 60 × 60 mm",
            "Every part touches or overlaps another so it would print as one piece",
            "Grouped into a single object that rests on the workplane",
            "One part was edited after grouping (ungroup → change → regroup)",
          ],
          skills: ["B1", "B2"],
        },
        {
          id: "submit",
          type: "uploadEvidence",
          prompt: "Submit a class share link or exported STL, plus one screenshot of the ungrouped parts pulled slightly apart.",
          accepts: ["design_url", "stl", "screenshot"],
          competencyIds: ["B1", "B2"],
          checklist: ["Six or more primitives visible in the ungrouped screenshot", "Final model is one group", "No floating parts"],
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
          prompt: "Pick an object near you. Which simple shapes would you use to build it?",
          sentenceStarters: ["The … is really a…", "I'd use a … for the…"],
          competencyIds: ["B1"],
        },
      ],
    },
  ],
  teacher: {
    purpose: "Students decompose objects into primitives, group them into a single printable part, and edit groups safely.",
    preparation: ["Build the Show Me table yourself once so you can demonstrate ungroup → edit → regroup."],
    equipment: ["Student devices with Tinkercad", "Optional: a few classroom objects to 'decompose' as a warm-up"],
    misconceptions: [
      { id: "group-glues", text: "Grouping glues shapes together even if they don't touch.", response: "Group a floating cube with a cylinder, then drag the group: the gap stays. Ask what the printer would do with the cube." },
      { id: "scale-group-part", text: "You can resize one part of a group by dragging the group's handles.", response: "Resize a grouped table and show every part stretched. Then ungroup and resize just one leg." },
    ],
    discussionQuestions: [
      "Why might you keep parts ungrouped while you're still building?",
      "How much should two parts overlap so they print as one strong piece?",
      "What objects in the room are made of three or fewer simple shapes?",
    ],
    troubleshooting: [
      "If a group turns one colour, that's normal; colour doesn't change the print. Tinkercad offers a multicolour option in the shape panel for grouped objects.",
      "If a group looks striped or partly invisible, one shape was accidentally set to Hole. Ungroup and set it back to Solid.",
      "If Ctrl + G does nothing, check that more than one shape is selected.",
    ],
    answerGuidance: [
      "Table: 60 × 40 × 4 top at 30 mm; four 6 × 6 × 30 legs under the corners; grouped.",
      "Desk buddy: check the ungrouped screenshot for 6+ primitives and the final group for no floating parts. Shapes sinking 1–3 mm into each other is good practice.",
    ],
    alternatives: {
      touchDevice: "Use the Group and Ungroup buttons in the toolbar instead of the keyboard shortcuts.",
    },
  },
};
