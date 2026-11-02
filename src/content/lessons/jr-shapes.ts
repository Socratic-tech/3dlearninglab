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
    purpose: "Students learn that complex objects are built from simple primitives that must touch before grouping. Seeing big things as simple shapes (decomposition) is a core design and computational-thinking habit, and grouping is the move that turns many shapes into one printable object. The rule that shapes must touch or overlap connects back to Lesson 1: the printer can't build a part with nothing underneath it.",
    bigIdea: "Big designs are made of simple shapes, and the shapes must touch or overlap before I group them into one piece.",
    successCriteria: [
      "I can find the simple shapes inside an everyday object.",
      "I can move shapes so they touch or overlap a little.",
      "I can select several shapes and group them into one object.",
      "I can check my design from the side to make sure nothing is floating.",
    ],
    background: [
      { title: "Primitives: the building blocks", body: "The ready-made shapes in Tinkercad (box, cylinder, sphere, cone, roof, and others) are called **primitives**. Almost any object can be roughed out from them: a rocket is a cylinder plus a cone, a robot is boxes and cylinders. Breaking a big thing into simple parts is called **decomposition**, and it is the same thinking students use in maths (splitting a shape to find its area) and coding (splitting a big task into small steps). The observe cards practise this with no device needed." },
      { title: "What Group really does", body: "When you select shapes and click **Group** (or **Ctrl + G**), Tinkercad combines them into one object you can move, size and copy as a unit. Where solids overlap, the overlapping space simply becomes part of the one object. Engineers call this a **union**. Group never moves shapes, so a gap stays a gap. You can always **Ungroup** (Ctrl + Shift + G) to get the separate shapes back and adjust them. A grouped object usually shows in a single colour; that's normal and doesn't affect the print." },
      { title: "Touching, overlapping and floating", body: "If two shapes in a group don't touch, the file still contains two separate pieces. On the printer, a piece resting on the plate prints as its own loose part, and a piece hanging in the air has nothing to be built on, so it usually turns into a stringy mess. That's why the rule is **touch or overlap a little**. Overlapping is the safer habit: shapes that only just meet can share a hairline join, and round shapes such as spheres only touch at a single point. A snowman of spheres that just touch would snap at the neck; sink each sphere a few millimetres into the one below so they share a fat join." },
      { title: "Selecting several shapes", body: "Students can select several shapes in two ways: drag a selection box around them on empty workplane, or hold **Shift** and click each shape. The drag method fails if they start the drag *on* a shape (that moves the shape instead), so start on empty space. If the Group button is greyed out, only one shape is selected. On touch devices, the on-screen Group button in the top toolbar works the same as the shortcut." },
      { title: "Checking from the side", body: "From the default view, a shape floating 2 mm above another can look like it's touching. Orbiting to a side view (or clicking a side of the view cube) shows any gap clearly. This links to Lesson 2's orbit skills and builds the habit of **checking before printing**, which becomes a formal rule in the Design Rules lesson and the bookmark boss battle." },
    ],
    studentQuestions: [
      { q: "My shapes changed colour when I grouped them. Did I break it?", a: "No. A group usually shows in one colour. The shapes are all still there, and the printer uses one colour of plastic anyway." },
      { q: "Can I un-group?", a: "Yes. Select the group and click Ungroup (Ctrl + Shift + G). Your shapes come back separately." },
      { q: "How much should shapes overlap?", a: "Just a little, a millimetre or a few. Enough that they share a join you can see when you orbit." },
      { q: "Can I group a group?", a: "Yes. You can group groups together to make bigger objects." },
    ],
    connections: [
      "Toy designers sketch new toys as simple blocks and tubes first, then add details later.",
      "Architects start a building as boxes for rooms and a roof shape, then refine it.",
      "Video game artists build early versions of characters and worlds from simple shapes, often called 'blocking out'.",
    ],
    exitTicket: [
      "Name an object in the room and the simple shapes it is made of.",
      "What must you check before you group your shapes?",
    ],
    runPlan: [
      { minutes: 4, title: "Hook: spot the shapes", teacher: "Hold up a toy or classroom object. Read the hero and the observe cards aloud. Ask: 'What shapes can you see?'", students: "Name the shapes in each object; point or sketch if they prefer.", devices: "away" },
      { minutes: 4, title: "Predict", teacher: "Pose the prediction about two shapes that don't touch. Use two real blocks held apart, then pushed together.", students: "Vote on the prediction and explain their thinking.", devices: "away" },
      { minutes: 6, title: "Build and group", teacher: "Model overlapping, drag-selecting from empty space, grouping, and orbiting to the side to check for gaps.", students: "Try grouping two shapes, then complete the matching and multiple-choice questions.", devices: "open" },
      { minutes: 13, title: "Shape creation", teacher: "Circulate. Ask 'How do you know those shapes touch? Show me from the side.' Let students choose their object.", students: "Build an object from at least 4 touching shapes, group it, and submit a screenshot or link.", devices: "open" },
      { minutes: 3, title: "Reflect", teacher: "Share two creations and ask the class to name the shapes inside each.", students: "Reflection and exit ticket.", devices: "open" },
    ],
    lookFors: [
      "Shapes overlapping a little, checked from a side view.",
      "Students selecting all parts before grouping (drag box from empty space or Shift + click).",
      "Students ungrouping to fix a part instead of deleting everything.",
      "Students naming the shapes they used and what each one became.",
    ],
    differentiation: {
      support: [
        "Start with a 2-shape rocket (cylinder and cone) before adding more shapes.",
        "Give a picture card of the snowman, robot and house broken into shapes to copy.",
        "Let students describe their object orally while a partner builds, then swap roles.",
      ],
      extend: [
        "Build an object that uses at least 6 shapes, including one that is rotated or lifted.",
        "Make a copy of the group (Ctrl + C, Ctrl + V) and change one part to make a new version.",
      ],
    },
    preparation: [
      "Optional: bring a toy or object made of simple shapes for students to pick apart.",
      "Optional: two wooden blocks or LEGO bricks to show touching versus not touching.",
    ],
    equipment: ["Chromebooks", "Projector for live modelling", "Optional: blocks or a simple toy"],
    misconceptions: [
      { id: "group-glues", text: "Grouping glues shapes together even if they don't touch.", response: "Group two separated shapes, then show the gap in a side view." },
      { id: "touch-from-front", text: "If shapes look like they touch from the front, they touch.", response: "Orbit to the side or top: a gap that was hidden from the front is often easy to see." },
    ],
    discussionQuestions: [
      "What object in our classroom is made of simple shapes?",
      "Why is it smart to overlap shapes a little instead of just touching?",
    ],
    troubleshooting: [
      "If grouping is greyed out, only one shape is selected. Drag a box around all of them.",
      "If dragging a selection box moves a shape instead, start the drag on empty workplane.",
      "If a part is missing after grouping, it may have been left out of the selection. Ungroup, select everything, and group again.",
    ],
    answerGuidance: ["Creation: 4+ shapes that touch or overlap, grouped. Accept any object."],
  },
};
