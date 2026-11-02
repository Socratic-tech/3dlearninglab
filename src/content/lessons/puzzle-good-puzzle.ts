import type { LessonInput } from "../schema";

/**
 * Puzzle Cube, day 1 of 18: from falling-block games to 3D. Students start with a puzzle they already know (pieces
 * made of 4 squares that must fill space with no gaps), play with it in 2D using math cubes, then see what changes in 3D.
 * Tetris is named only to connect to students' experience; no game art or rules are reproduced.
 */
export const lesson: LessonInput = {
  id: "puzzle-good-puzzle",
  number: 400,
  title: "Puzzle Cube 1: From Tetris to 3D",
  subtitle: "You already know this puzzle. Now add a dimension.",
  domain: "F",
  kind: "lesson",
  summary: "Day 1 of the Puzzle Cube project. Students connect falling-block games to the project: shapes made of 4 squares that fill space with no gaps. With math cubes they fill a 4 × 4 square, make a 2D puzzle to stump a partner, then make a piece bend up into 3D and see why a 3 × 3 × 3 cube needs pieces of different sizes.",
  estimatedMinutes: 55,
  printLevel: "digital",
  competencyIds: ["B1", "F3"],
  prerequisites: [],
  vocabulary: [
    { term: "Tetromino", definition: "A flat shape made of 4 squares joined edge to edge, like the pieces in falling-block games." },
    { term: "Polycube", definition: "A 3D shape made of cubes joined face to face. Your puzzle pieces are polycubes." },
    { term: "Tiling", definition: "Covering a space with pieces so there are no gaps and no overlaps." },
  ],
  sections: [
    {
      phase: "discover",
      title: "Pieces made of squares",
      blocks: [
        {
          id: "hook",
          type: "hero",
          title: "You already know this puzzle.",
          hook: "In Tetris, every piece is made of 4 squares, and you score by filling rows with no gaps. Your puzzle cube is the same idea in 3D: pieces made of cubes that fill a box with no gaps.",
          visual: { diagram: "flat-vs-up", alt: "Four cubes lying flat like a game piece, and four cubes where one climbs up a layer." },
        },
        {
          id: "five",
          type: "diagram",
          name: "tetromino-set",
          caption: "Join 4 squares edge to edge and you only ever get these 5 shapes.",
          alt: "The five shapes made of four squares, labelled I, O, T, S and L.",
        },
        {
          id: "seven-mc",
          type: "multipleChoice",
          prompt: "There are only 5 shapes made of 4 squares. So why does the falling-block game have 7 different pieces?",
          hint: "In the game, can you flip a piece over like a pancake, or only turn it?",
          options: [
            { id: "flip", text: "You can only turn pieces in the game, not flip them, so the mirror-image S and L count as extra pieces" },
            { id: "five-sq", text: "The game adds two shapes made of 5 squares", misconceptionId: "more-squares" },
            { id: "random", text: "The game designers just picked 7", misconceptionId: "more-squares" },
          ],
          correctOptionIds: ["flip"],
          explanation: "On a screen you can turn a piece but never flip it over, so the S and its mirror (often called Z), and the L and its mirror (J), are different pieces. That's 5 + 2 = 7. With math cubes in your hand you CAN flip pieces, which matters for your puzzle.",
          competencyId: "B1",
          check: "practice",
        },
      ],
    },
    {
      phase: "practice",
      title: "Fill the square",
      blocks: [
        {
          id: "build-tip",
          type: "callout",
          tone: "tip",
          title: "Build with math cubes",
          body: "Snap math cubes into flat pieces on your desk: each piece is 4 cubes in one layer. Math cubes only snap face to face, which is exactly how puzzle pieces must join.",
        },
        {
          id: "fill-predict",
          type: "prediction",
          prompt: "You have 4 pieces: I, O, T and S. Together they're 16 cubes, and a 4 × 4 square is 16 spaces. Can they fill it with no gaps?",
          hint: "Build them and try. Give it two minutes.",
          options: [
            { id: "yes", text: "Yes, 16 cubes fill 16 spaces" },
            { id: "no", text: "No, it can't be done" },
          ],
          expectedOptionId: "no",
          reveal: "It can't be done, no matter how you turn them: the T piece never fits into a 4 × 4 square with other 4-square pieces. Mathematicians prove it with a checkerboard: the T always covers 3 squares of one colour and 1 of the other. The right count isn't enough; the shapes have to fit.",
        },
        {
          id: "fill-micro",
          type: "challenge",
          kind: "micro",
          where: "offline",
          title: "Find a fill",
          prompt: "Snap together an I, an O and two L pieces from math cubes. Fit all four into a 4 × 4 square.",
          requirements: ["4 pieces, 4 cubes each", "A 4 × 4 square with no gaps and no overlaps", "Extra: can you find a second way?"],
          skills: ["B1"],
        },
      ],
    },
    {
      phase: "apply",
      title: "Stump your partner",
      blocks: [
        {
          id: "answer",
          type: "diagram",
          name: "fill-square",
          caption: "One answer (there are others). Did yours look like this?",
          alt: "A 4 by 4 square filled with an I down the left, an O in the middle right, and two L pieces.",
        },
        {
          id: "make-2d",
          type: "text",
          title: "Make your own 2D puzzle",
          body: "1. Snap 16 math cubes into a flat 4 × 4 square.\n2. Break it into 4 or 5 pieces. Any shapes you like, 2 to 6 cubes each, all in one layer.\n3. Mix the pieces up and hand them to a partner.\n4. Time them. Then try theirs.",
        },
        {
          id: "make-micro",
          type: "challenge",
          kind: "micro",
          where: "offline",
          title: "Swap and time",
          prompt: "Make a flat puzzle, swap with a partner, and time each other.",
          requirements: ["4 × 4 square split into 4 or 5 pieces", "Partner's solve time written down", "Your time on their puzzle written down"],
          skills: ["F3"],
        },
        {
          id: "go-up",
          type: "diagram",
          name: "flat-vs-up",
          caption: "With math cubes, a piece can do something no game piece can: climb up a layer.",
          alt: "Left: four cubes lying flat in an L. Right: four cubes where one cube sits on top, climbing a layer.",
        },
        {
          id: "twenty-seven",
          type: "multipleChoice",
          prompt: "Your real puzzle is a 3 × 3 × 3 cube: 27 cubes. Could you build it from pieces that all have exactly 4 cubes?",
          hint: "How many groups of 4 make 27?",
          options: [
            { id: "no", text: "No: 27 doesn't divide by 4, so the pieces need different sizes" },
            { id: "yes", text: "Yes: use 7 pieces of 4", misconceptionId: "count-skipped" },
          ],
          correctOptionIds: ["no"],
          explanation: "6 × 4 = 24 and 7 × 4 = 28, so 4-cube pieces always miss 27. That's why your puzzle cube will mix sizes, like 5 + 5 + 5 + 4 + 4 + 4 = 27.",
          competencyId: "B1",
          check: "skill",
        },
      ],
    },
    {
      phase: "prove",
      title: "Prove it: your first puzzle",
      blocks: [
        {
          id: "prove",
          type: "challenge",
          kind: "prove",
          where: "offline",
          title: "Stump Your Partner",
          prompt: "Make a flat puzzle that's hard to solve, then make it harder by letting one piece climb up a layer.",
          requirements: [
            "A 4 × 4 flat puzzle with 4 or 5 pieces, tested on a partner with a time",
            "One change to make it harder (for example: two pieces that look alike), tested again",
            "Bonus: rebuild one piece so it climbs up a layer, and see whether your partner can still solve it",
          ],
          skills: ["B1", "F3"],
        },
        {
          id: "submit",
          type: "uploadEvidence",
          prompt: "Upload a photo of your puzzle pieces laid out, and write both solve times.",
          accepts: ["physical_test", "written", "screenshot"],
          competencyIds: ["B1", "F3"],
          checklist: ["Photo of the pieces", "First solve time", "Time after your change"],
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
          prompt: "What made your partner's flat puzzle hard? What do you think will change when pieces can climb into 3D?",
          sentenceStarters: ["Their puzzle was hard because …", "In 3D, I think …"],
          competencyIds: ["F3"],
        },
      ],
    },
  ],
  teacher: {
    purpose: "Opens the 18-mission Puzzle Cube project with something students already know. Falling-block game pieces (tetrominoes) make tiling, rotation and 'the count isn't enough, the shapes must fit' concrete in 2D, with math cubes, before the jump to 3D polycubes. The design brief comes on day 4. For a 3-week run, skip days 5, 10 and 12.",
    preparation: [
      "Math cubes: about 30 per student or pair (they snap face to face, which matches the puzzle rule).",
      "Optional: a printed sample puzzle cube to show at the end as a teaser.",
    ],
    equipment: ["Plastic math cubes", "Timers", "Student devices"],
    misconceptions: [
      { id: "more-squares", text: "Falling-block games use extra shapes.", response: "Build all 7 game pieces with cubes, then flip the S and the L over: they turn into the mirror pieces." },
      { id: "count-skipped", text: "If the cube count works, the pieces will fit.", response: "Show the I, O, T, S challenge: 16 cubes, 16 spaces, and it still can't be done. Shapes matter, not only counts." },
    ],
    discussionQuestions: [
      "Why can't I, O, T and S fill a 4 × 4 square even though the numbers work?",
      "What made the hardest flat puzzle in the room hard?",
      "What new tricks become possible when a piece can climb up a layer?",
    ],
    troubleshooting: [
      "Students stuck on the 4 × 4 fill: tell them the I goes along one edge.",
      "Fast finishers: find a second fill, or try I, S, L and L (it also works).",
      "Checkerboard proof for curious students: colour the 4 × 4 like a checkerboard (8 light, 8 dark). I, O and S always cover 2 of each, but T covers 3 of one colour, so the colours can never balance.",
    ],
    answerGuidance: [
      "4 × 4 fills that work with 4-square pieces include I+O+L+L, I+S+L+L, S+S+L+L, O+O+L+L. No fill can include a T.",
      "Proficient: a working flat puzzle tested with a time, one change and a re-test.",
    ],
    alternatives: {
      noPrinter: "No printer needed.",
      touchDevice: "Photograph the pieces with the tablet; record times in the journal.",
    },
  },
};
