import type { LessonInput } from "../schema";

export const lesson: LessonInput = {
  id: "jr-shapes",
  number: 104,
  title: "Shapes Make Things",
  subtitle: "Big things are made of simple shapes",
  domain: "B",
  kind: "lesson",
  summary: "Build an object out of boxes, cylinders and cones, then group it into one piece.",
  estimatedMinutes: 30,
  printLevel: "digital",
  competencyIds: ["B1", "B2"],
  prerequisites: ["jr-move-stretch"],
  vocabulary: [
    { term: "Shape", definition: "A simple building piece, like a box, cylinder or cone." },
    { term: "Group", definition: "Join shapes together so they become one object." },
    { term: "Overlap", definition: "When two shapes go into each other a little, so they are touching." },
  ],
  sections: [
    {
      phase: "discover",
      title: "Look for shapes",
      blocks: [
        {
          id: "hook",
          type: "hero",
          title: "Everything is shapes",
          hook: "A snowman is spheres. A house is a box and a roof. Designers build big things from simple shapes.",
          visual: { diagram: "group-hole", alt: "Several simple shapes joined into one object." },
        },
        {
          id: "observe",
          type: "observe",
          title: "Spot the shapes",
          cards: [
            { id: "house", label: "A house", reveal: "A box for the walls and a roof shape on top." },
            { id: "robot", label: "A robot", reveal: "Boxes for the body and head, cylinders for the arms." },
            { id: "rocket", label: "A rocket", reveal: "A cylinder for the body and a cone on top." },
          ],
        },
        {
          id: "predict",
          type: "prediction",
          prompt: "Two shapes are close but not touching. You group them and print. What happens?",
          options: [
            { id: "a", text: "They print as two separate pieces." },
            { id: "b", text: "Grouping glues them together.", misconceptionId: "group-glues" },
          ],
          expectedOptionId: "a",
          reveal: "Grouping doesn't move shapes. They have to touch or overlap to print as one piece.",
        },
      ],
    },
    {
      phase: "practice",
      title: "Try it",
      blocks: [
        {
          id: "how",
          type: "showMe",
          title: "Build and group",
          steps: [
            { text: "Put your shapes on the workplane and move them so they overlap a little." },
            { text: "Drag a box around all the shapes to select them.", diagram: "selection" },
            { text: "Click Group (or press Ctrl + G). Now it's one object.", diagram: "group-hole" },
          ],
        },
        {
          id: "match",
          type: "matching",
          prompt: "Match the object part to the shape.",
          hint: "Think about what each part looks like.",
          pairs: [
            { id: "p1", left: "Rocket nose", right: "Cone" },
            { id: "p2", left: "Wheel", right: "Cylinder" },
            { id: "p3", left: "Snowman's head", right: "Sphere" },
            { id: "p4", left: "Wall of a house", right: "Box" },
          ],
          explanation: "Cone for a point, cylinder for round and flat, sphere for a ball, box for flat sides.",
          competencyId: "B1",
          check: "practice",
        },
        {
          id: "group-check",
          type: "multipleChoice",
          prompt: "Your rocket's cone is floating a little above the body. What should you do before you group?",
          hint: "The shapes need to touch.",
          options: [
            { id: "a", text: "Move the cone down so it touches the body." },
            { id: "b", text: "Nothing, grouping will fix it.", misconceptionId: "group-glues" },
          ],
          correctOptionIds: ["a"],
          explanation: "Shapes must touch or overlap. Then grouping makes them one piece.",
          competencyId: "B2",
          check: "skill",
        },
      ],
    },
    {
      phase: "prove",
      title: "Show what you can do",
      blocks: [
        {
          id: "prove",
          type: "challenge",
          kind: "prove",
          title: "Shape creation",
          prompt: "Build a snowman, a robot, a house or your own idea from at least 4 shapes. Make them touch, then group it.",
          requirements: ["At least 4 shapes", "All shapes touch", "Grouped into one object"],
          skills: ["B1", "B2"],
        },
        {
          id: "submit",
          type: "uploadEvidence",
          prompt: "Take a screenshot of your creation, or share its link.",
          accepts: ["screenshot", "design_url"],
          competencyIds: ["B1", "B2"],
          checklist: ["4 or more shapes", "Everything touches", "It's grouped"],
        },
      ],
    },
    {
      phase: "reflect",
      title: "Think about it",
      blocks: [
        {
          id: "reflect",
          type: "reflection",
          prompt: "What shapes did you use, and what did each one become?",
          sentenceStarters: ["I used a … for the …"],
          competencyIds: ["B1"],
        },
      ],
    },
  ],
  teacher: {
    purpose: "Students learn that complex objects are built from simple primitives that must touch before grouping.",
    preparation: ["Optional: bring a toy or object made of simple shapes for students to pick apart."],
    equipment: ["Chromebooks"],
    misconceptions: [
      { id: "group-glues", text: "Grouping glues shapes together even if they don't touch.", response: "Group two separated shapes, then show the gap in a side view." },
    ],
    discussionQuestions: ["What object in our classroom is made of simple shapes?"],
    troubleshooting: ["If grouping is greyed out, only one shape is selected. Drag a box around all of them."],
    answerGuidance: ["Creation: 4+ shapes that touch or overlap, grouped. Accept any object."],
  },
};
