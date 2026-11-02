import type { LessonInput } from "../schema";

/** Puzzle Cube, day 2 of 18: sketch cube pieces on isometric dot paper. */
export const lesson: LessonInput = {
  id: "puzzle-sketch-cubes",
  number: 401,
  title: "Puzzle Cube 2: Sketch in Cubes",
  subtitle: "Draw 3D pieces on dot paper before you build anything.",
  domain: "F",
  kind: "lesson",
  summary: "Students learn to draw cubes and cube pieces on isometric dot paper, read a piece from the top and front, and sketch a bank of possible puzzle pieces.",
  estimatedMinutes: 55,
  printLevel: "digital",
  competencyIds: ["F3"],
  prerequisites: ["puzzle-good-puzzle"],
  vocabulary: [
    { term: "Isometric drawing", definition: "A 3D drawing where lines only go straight up and down or along two slants, so you see three faces of a cube at once." },
    { term: "Dot paper", definition: "Paper with dots in a pattern that makes isometric lines easy to draw." },
    { term: "Top view", definition: "What a piece looks like from straight above: its footprint on the table." },
  ],
  sections: [
    {
      phase: "discover",
      title: "Draw a cube in three moves",
      blocks: [
        {
          id: "hook",
          type: "hero",
          title: "Draw it before you build it.",
          hook: "A sketch takes a minute and costs nothing. A print takes hours. Designers sketch lots of ideas so they only build the good ones.",
          visual: { diagram: "iso-sketch", alt: "Drawing a cube on dot paper in three steps." },
        },
        {
          id: "how",
          type: "showMe",
          title: "One cube on dot paper",
          steps: [
            { text: "Draw a diamond for the top: join four dots that make a slanted square.", diagram: "iso-sketch" },
            { text: "From the left, front and right corners of the diamond, draw three lines straight down, one dot each.", diagram: "iso-sketch" },
            { text: "Join the bottoms of those lines. That's one cube. Shade the top lightly so it pops.", diagram: "iso-sketch" },
            { text: "To add a cube, reuse an edge you already drew, then draw only the new lines.", diagram: "iso-sketch" },
          ],
        },
        {
          id: "directions",
          type: "prediction",
          prompt: "On isometric dot paper, how many directions do the lines go?",
          hint: "Look at the three-step picture: up and down, and…?",
          options: [
            { id: "two", text: "2: across and up" },
            { id: "three", text: "3: straight up and down, and two slants" },
            { id: "any", text: "Any direction you like" },
          ],
          expectedOptionId: "three",
          reveal: "Only three: vertical and two slants. If a line goes any other way, it's not part of a cube. That makes cube pieces quick to draw and easy to check.",
        },
      ],
    },
    {
      phase: "practice",
      title: "Read a piece",
      blocks: [
        {
          id: "views",
          type: "matching",
          prompt: "Match each view to what it shows.",
          hint: "Picture standing over the piece, then in front of it.",
          pairs: [
            { id: "top", left: "Top view", right: "The footprint: the squares that touch the table" },
            { id: "front", left: "Front view", right: "How tall each part is, seen from the front" },
            { id: "iso", left: "Isometric view", right: "Three faces at once, so you see it in 3D" },
          ],
          explanation: "Each view shows something the others hide. When a piece is confusing, sketch it from the top as well.",
          competencyId: "F3",
          check: "practice",
        },
        {
          id: "count-mc",
          type: "multipleChoice",
          prompt: "You sketched an L: three cubes in a row, plus one cube on top of the end cube. How many cubes is that?",
          hint: "Count the row, then the extra.",
          options: [
            { id: "three", text: "3" },
            { id: "four", text: "4" },
            { id: "five", text: "5", misconceptionId: "count-faces" },
          ],
          correctOptionIds: ["four"],
          explanation: "3 in the row + 1 on top = 4. Write the cube count next to every sketch; you'll need the counts to make 27.",
          competencyId: "F3",
          check: "practice",
        },
        {
          id: "ways",
          type: "callout",
          tone: "idea",
          title: "Other ways to sketch",
          body: "Not a fan of dot paper? Build the piece from math cubes and trace or photograph it, or draw just the top view and write the height (1, 2 or 3) in each square. All of these count.",
        },
      ],
    },
    {
      phase: "apply",
      title: "Sketch a bank of pieces",
      blocks: [
        {
          id: "micro",
          type: "challenge",
          kind: "micro",
          where: "offline",
          title: "Warm-up: three pieces",
          prompt: "Sketch three different pieces, each with 3 to 7 cubes. At least one should bend up into 3D.",
          requirements: ["Three different shapes", "Each has 3 to 7 cubes", "Cube count written by each one", "At least one bends into 3D"],
          skills: ["F3"],
        },
        { id: "journal-ideas", type: "journal", projectKey: "puzzle-cube", promptIds: ["ideas"] },
      ],
    },
    {
      phase: "prove",
      title: "Prove it: a piece bank",
      blocks: [
        {
          id: "prove",
          type: "challenge",
          kind: "prove",
          where: "offline",
          title: "Piece Bank",
          prompt: "Sketch at least 8 different pieces you might use. You'll only need 5 or 6, so more ideas means better choices tomorrow.",
          requirements: [
            "At least 8 different piece sketches",
            "Each piece has 3 to 7 cubes, with the count written beside it",
            "At least 3 pieces bend up into 3D",
            "Each sketch is clear enough for a classmate to build it from math cubes",
          ],
          skills: ["F3"],
        },
        {
          id: "submit",
          type: "uploadEvidence",
          prompt: "Upload a photo of your piece bank (or photos of pieces built from math cubes).",
          accepts: ["screenshot", "physical_test", "written"],
          competencyIds: ["F3"],
          checklist: ["8 or more pieces", "Cube count on each", "3 or more 3D pieces"],
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
          prompt: "Which piece was hardest to draw, and what trick helped you draw it?",
          sentenceStarters: ["The hardest one was … because …", "What helped was …"],
          competencyIds: ["F3"],
        },
      ],
    },
  ],
  teacher: {
    purpose: "Students learn a quick, low-cost way to generate and communicate 3D ideas. Isometric sketching on dot paper keeps every line on the cube grid, so pieces drawn here can be built directly in week 2.",
    preparation: [
      "Print isometric dot paper (triangle-grid dots), 2–3 sheets per student.",
      "Have math cubes available for students who prefer building to drawing.",
      "Model the three-step cube on the board.",
    ],
    equipment: ["Isometric dot paper", "Pencils and erasers", "Coloured pencils (optional)", "Math cubes (optional)"],
    misconceptions: [
      { id: "count-faces", text: "Counting faces or lines instead of cubes.", response: "Point to each cube's top diamond and count those (plus any cubes hidden underneath)." },
    ],
    discussionQuestions: [
      "Why is a cheap sketch worth doing before an expensive print?",
      "Which view would you use to explain your piece to someone over the phone?",
    ],
    troubleshooting: [
      "If drawings look wobbly, check the paper is turned so the dots make vertical columns.",
      "Students who find drawing hard can build, photograph and label pieces instead.",
      "A cube hidden under another one still counts: have students build the piece if they're unsure.",
    ],
    answerGuidance: [
      "Proficient: 8+ clear, distinct pieces of 3–7 cubes with counts, at least 3 of them 3D.",
      "Clarity check: a classmate can build any sketched piece from math cubes without asking questions.",
    ],
    alternatives: {
      noPrinter: "No printer needed.",
      touchDevice: "Sketch with a stylus over a photo of dot paper, or build and photograph pieces.",
    },
  },
};
