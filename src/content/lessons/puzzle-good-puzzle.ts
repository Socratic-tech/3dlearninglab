import type { LessonInput } from "../schema";

/**
 * Puzzle Cube, day 1 of 18: from falling-block games to 3D. A teacher-led day: the class works with math cubes and
 * talk, devices mostly down. The screens hold the reference pictures, one quick check and the evidence.
 * Tetris is named only to connect to students' experience; no game art or rules are reproduced.
 */
export const lesson: LessonInput = {
  id: "puzzle-good-puzzle",
  number: 400,
  title: "Puzzle Cube 1: From Tetris to 3D",
  subtitle: "You already know this puzzle. Now add a dimension.",
  domain: "F",
  kind: "lesson",
  summary: "Day 1 of the Puzzle Cube project, led by the teacher with math cubes. Students connect falling-block games to the project (shapes made of 4 squares that fill space with no gaps), struggle with a fill that can't be done, make a flat puzzle to stump a partner, then see what changes when a piece climbs into 3D.",
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
          id: "launch",
          type: "teacherLed",
          title: "You already know this puzzle",
          minutes: 8,
          students: "Snap 4 math cubes into a flat shape (one layer). Compare with your table: how many **different** shapes can you find? Turning or flipping a shape doesn't make it new.",
          teacher: "Open with what students know. Some teachers ask who has played Tetris and let a student describe it; some sketch the pieces on the board or show a short clip. Make sure students who haven't played get the core idea: pieces made of 4 squares, filling space with no gaps.\n\nThen hand out math cubes and pose the table challenge. Collect shapes at the front as they're found. There are exactly 5. If a table claims more, ask them to turn or flip theirs to match one already found. The 'why 7 in the game?' question (you can't flip pieces on screen) is a good one to leave open for a minute.",
        },
        {
          id: "five",
          type: "diagram",
          name: "tetromino-set",
          caption: "The 5 shapes made of 4 squares. Did your class find them all?",
          alt: "The five shapes made of four squares, labelled I, O, T, S and L.",
        },
      ],
    },
    {
      phase: "practice",
      title: "Fill the square",
      blocks: [
        {
          id: "impossible",
          type: "teacherLed",
          title: "Can these fill a 4 × 4 square?",
          minutes: 12,
          students: "Build an I, an O, a T and an S. That's 16 cubes, and a 4 × 4 square has 16 spaces. Try to fill it with no gaps.\n\nThen try an I, an O and two L pieces.",
          teacher: "Let them struggle. It can't be done, and that's the point: the count is right but the shapes don't fit. Resist confirming 'impossible' too early; let pairs compare attempts first.\n\nWhen the room is ready, ask how they could be sure it's impossible rather than just hard. If no one gets there, colour a 4 × 4 like a checkerboard (8 light, 8 dark): I, O and S always cover 2 of each, but a T covers 3 of one colour and 1 of the other, so the colours can never balance.\n\nI + O + L + L does work. It's a quick win to finish this part.",
        },
        {
          id: "answer",
          type: "diagram",
          name: "fill-square",
          caption: "One way to fill it with I, O, L and L. There are others.",
          alt: "A 4 by 4 square filled with an I down the left, an O in the middle right, and two L pieces.",
        },
      ],
    },
    {
      phase: "apply",
      title: "Stump your partner",
      blocks: [
        {
          id: "stump",
          type: "teacherLed",
          title: "Make a puzzle someone else can't solve",
          minutes: 15,
          students: "1. Snap 16 math cubes into a flat 4 × 4 square.\n2. Break it into 4 or 5 pieces (2 to 6 cubes each, all flat).\n3. Mix them up and hand them to a partner. Time them.\n4. Make one change to make it harder. Time a new solver.",
          teacher: "Your call on grouping and timing. Circulate and ask about strategy: Which piece did you place first, and why? What makes a piece hard to place? Pieces that look alike and pieces with no straight edge tend to slow solvers down. Those ideas carry straight into the 3D puzzle.",
        },
        {
          id: "leap",
          type: "teacherLed",
          title: "Now go up a layer",
          minutes: 8,
          students: "Take one of your pieces and make one cube climb on top of another. What can a puzzle do now that a flat one couldn't?",
          teacher: "Bring the class back together. Show the flat-vs-up picture, or hold up a piece that bends up. Then ask: our real puzzle is a 3 × 3 × 3 cube, 27 cubes. Could every piece have 4 cubes? (No: 27 doesn't divide by 4.) That's why the puzzle cube will mix piece sizes. It's a nice way to end on a question for tomorrow.",
        },
        {
          id: "up",
          type: "diagram",
          name: "flat-vs-up",
          caption: "With real cubes, a piece can do something no game piece can: climb up a layer.",
          alt: "Left: four cubes lying flat in an L. Right: four cubes where one cube sits on top, climbing a layer.",
        },
      ],
    },
    {
      phase: "prove",
      title: "Record what you made",
      blocks: [
        {
          id: "twenty-seven",
          type: "multipleChoice",
          prompt: "The puzzle cube is 3 × 3 × 3: 27 cubes. Could you build it from pieces that all have exactly 4 cubes?",
          hint: "How many groups of 4 make 27?",
          options: [
            { id: "no", text: "No: 27 doesn't divide by 4, so the pieces need different sizes" },
            { id: "yes", text: "Yes: use 7 pieces of 4", misconceptionId: "count-skipped" },
          ],
          correctOptionIds: ["no"],
          explanation: "6 × 4 = 24 and 7 × 4 = 28, so 4-cube pieces always miss 27. Your puzzle cube will mix sizes, like 5 + 5 + 5 + 4 + 4 + 4 = 27.",
          competencyId: "B1",
          check: "skill",
        },
        {
          id: "prove",
          type: "challenge",
          kind: "prove",
          where: "offline",
          title: "Stump Your Partner",
          prompt: "Show your flat puzzle and how it did.",
          requirements: [
            "A 4 × 4 flat puzzle with 4 or 5 pieces",
            "Your partner's solve time",
            "One change you made to make it harder, and the new time",
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
          prompt: "What made a flat puzzle hard to solve? What do you think will change when pieces can climb into 3D?",
          sentenceStarters: ["A puzzle was hard when …", "In 3D, I think …"],
          competencyIds: ["F3"],
        },
      ],
    },
  ],
  teacher: {
    purpose: "Opens the 18-mission Puzzle Cube project with something students already know. This is a teacher-led day: math cubes, talk and a productive struggle, with devices down for most of the period. The screens are reference points, one quick check and the evidence upload. Falling-block game pieces (tetrominoes) make tiling, rotation and 'the count isn't enough, the shapes must fit' concrete in 2D before the jump to 3D polycubes. The design brief comes on day 4. For a 3-week run, skip days 5, 10 and 12. Underneath the fun, students meet three ideas the whole project depends on: two shapes are 'the same' if one can be turned (or flipped) to match the other, a correct count is necessary but not enough for pieces to fit, and some things can be proved impossible rather than just found hard.",
    bigIdea: "A puzzle is about shape, not just count: pieces can have exactly the right number of squares and still not fit, and a third dimension gives pieces new ways to fit together.",
    successCriteria: [
      "I can find the different flat shapes made of 4 squares and explain why a turned or flipped copy isn't a new shape.",
      "I can explain why having the right number of squares doesn't guarantee that pieces will fill a space.",
      "I can make a flat puzzle, time a partner solving it, and change it to make it harder.",
      "I can describe one thing a piece can do in 3D that a flat piece can't.",
    ],
    background: [
      { title: "Polyominoes and polycubes", body: "A **tetromino** is a flat shape made of 4 squares joined edge to edge. It belongs to a family called *polyominoes*, named and made popular by the mathematician Solomon Golomb in the 1950s: dominoes (2 squares), trominoes (3), tetrominoes (4), pentominoes (5) and so on. If turning and flipping are allowed, there is 1 domino, 2 trominoes, 5 tetrominoes and 12 pentominoes. The 3D cousins are **polycubes**: cubes joined face to face. Every piece in this project is a polycube, so today's flat work with math cubes is the 2D warm-up for the real thing." },
      { title: "Why 5 shapes, but 7 in the game", body: "In a falling-block game a piece can be rotated on screen but never picked up and turned over, so mirror-image pairs (the S and its mirror, the L and its mirror) count as different pieces: 5 shapes + 2 mirror twins = 7. On a desk, a student can lift a flat piece and flip it, so a mirror image is just the same piece turned over. This is worth leaving open for a minute in the launch, because it plants an idea that returns on day 3: some pieces that *aren't* flat have mirror twins you can never turn to match, like a left and a right hand." },
      { title: "The checkerboard proof", body: "The I, O, T, S fill is a classic example of an *impossibility proof*. Colour the 4 × 4 square like a checkerboard: 8 light and 8 dark squares. Wherever you put an I, O or S, it covers 2 light and 2 dark. A T always covers 3 of one colour and 1 of the other. So I + O + S cover 6 light and 6 dark, and the T can only add 3 + 1, never the 2 + 2 needed. No amount of trying will ever work. The lesson for students is the reasoning move: instead of 'I tried lots of times', look for something that stays the same in every attempt. Colouring arguments like this also work in 3D, so they are a good extension for students who love proof." },
      { title: "Running a productive struggle", body: "The impossible fill only works if students are allowed to struggle before anyone says 'impossible'. Useful moves: ask pairs to compare their closest attempts ('which square is always left over?'), ask 'how could we be *sure*?' rather than 'is it possible?', and celebrate the switch from trying to explaining. Some students find an unsolvable task unsettling. Name it as normal and deliberate: designers and mathematicians spend a lot of time ruling ideas out, and today ruling one out *is* the success." },
      { title: "What makes a puzzle hard", body: "The stump-your-partner swap gives you real evidence for ideas the class will use all project. Puzzles tend to get harder when pieces look alike (solvers mix them up), when pieces have no long straight edge to line up against a side, and when a piece can be placed in many orientations, because every orientation is another option to try. Symmetrical pieces such as the O look the same however you turn them, so they have fewer options and tend to be easy. Collect students' explanations in their own words now; on days 4, 5 and 16 they will use them to tune their own puzzle." },
      { title: "Where the project goes from here", body: "Day 2 sketches 3D pieces on isometric dot paper, day 3 sets the piece rules, day 4 plans the whole 3 × 3 × 3 cube as a layer map and sets a design brief, and day 5 tests a math-cube prototype. Week 2 builds the cube in Tinkercad, week 3 prints it and week 4 boxes, playtests and ships it. Puzzles like this have a long history: the best known is the **Soma cube**, invented by the Danish designer and poet Piet Hein, which students meet on day 3. You don't need to teach any of this today; it helps to know where each idea lands." },
    ],
    studentQuestions: [
      { q: "Do I need to have played Tetris?", a: "No. All you need is the idea: pieces made of 4 squares that fill a space with no gaps and no overlaps." },
      { q: "If I flip a shape over, is it a new shape?", a: "Not with real cubes: you can pick it up and turn it over, so it's the same piece. A game won't let you flip pieces, which is why it treats mirror images as different." },
      { q: "Is it impossible, or am I just bad at it?", a: "Great question. Trying many times can't prove something is impossible. You need a reason that works for every attempt. Keep going for now, and notice what always goes wrong." },
      { q: "Will our real puzzle be flat?", a: "No. It will be a 3 × 3 × 3 cube, and some pieces will climb up a layer. That's what makes 3D puzzles more interesting." },
    ],
    connections: [
      "Packing is a real job: logistics planners and the software they use work out how to fit boxes of different shapes into lorries, shipping containers and warehouse shelves with as little empty space as possible.",
      "Game and puzzle designers tune difficulty by playtesting, timing players just like today's swap, then changing one thing at a time.",
      "Tilers, brick-layers and architects plan floors, walls and paving as tilings, choosing shapes that cover a space with no gaps.",
      "Computer scientists study packing puzzles as search problems: programs that try placements, back up when stuck and try again.",
    ],
    exitTicket: [
      "Two shapes made of 4 squares look different on your desk. How could you check whether they are really the same shape?",
      "In your own words, why doesn't having the right number of squares guarantee a puzzle will fit?",
      "What is one change that made a flat puzzle harder to solve, and why do you think it worked?",
    ],
    preparation: [
      "Math cubes: about 30 per student or pair. They snap face to face, which matches the puzzle rule.",
      "Optional: something to show falling-block pieces (a sketch, a short clip, or a student who can describe the game).",
      "Optional: a printed sample puzzle cube to tease the end goal.",
    ],
    equipment: ["Plastic math cubes", "Board or document camera", "Timers", "Student devices (end of class)"],
    runPlan: [
      { minutes: 8, title: "Launch: you already know this puzzle", teacher: "Connect to falling-block games; build shapes made of 4 cubes; collect the 5 shapes at the front.", students: "Build flat 4-cube shapes and find the different ones.", devices: "away" },
      { minutes: 12, title: "The impossible fill", teacher: "Pose I, O, T, S in a 4 × 4. Let them struggle, pair-share, then surface why (checkerboard). Finish with I, O, L, L.", students: "Try, compare attempts, explain why it can't work.", devices: "away" },
      { minutes: 15, title: "Stump your partner", teacher: "Circulate and confer about strategy; push for one change that makes a puzzle harder.", students: "Make a flat 4 × 4 puzzle, swap, time, revise.", devices: "away" },
      { minutes: 8, title: "Up a layer", teacher: "Whole class: a piece that climbs; 27 isn't divisible by 4, so sizes must mix.", students: "Make a piece climb; answer the 27 question.", devices: "away" },
      { minutes: 7, title: "Record and reflect", teacher: "Devices open for the quick check, a photo and the reflection.", students: "Quick check, upload photo and times, reflect.", devices: "open" },
      { minutes: 5, title: "Clean up", teacher: "Cubes back in bags; preview tomorrow: sketching pieces on dot paper.", students: "Return cubes.", devices: "away" },
    ],
    lookFors: [
      "Students turning and flipping pieces to test whether two shapes are the same.",
      "Explanations that go past counting: 'the numbers work, but the shape doesn't'.",
      "Strategy talk during the swap: which piece first, and why.",
      "Students who stall: do they keep trying new placements, or wait for help?",
    ],
    differentiation: {
      support: [
        "Start the 4 × 4 fill with the I already placed along one edge.",
        "Give a 2 × 4 rectangle (two 4-square pieces) before the full square.",
        "For students who don't know the game: the idea is just 'shapes made of 4 squares that fill space'.",
      ],
      extend: [
        "Find every 4 × 4 fill that uses 4-square pieces (I + O + L + L, I + S + L + L, S + S + L + L, O + O + L + L, and more with repeats).",
        "Can all 5 shapes fill a 4 × 5 rectangle? (No, and the checkerboard shows why.)",
        "Build a 2 × 2 × 2 cube from two pieces. How many different ways can you split it?",
      ],
    },
    misconceptions: [
      { id: "count-skipped", text: "If the cube count works, the pieces will fit.", response: "The I, O, T, S challenge: 16 cubes, 16 spaces, and it still can't be done. Shapes matter, not only counts." },
      { id: "flip-is-new", text: "A flipped (mirror-image) flat shape is a new shape.", response: "Pick the piece up and turn it over on the desk: it lands on top of its mirror image. Games treat mirrors as different only because you can't flip pieces on screen." },
      { id: "impossible-means-hard", text: "If nobody has solved it yet, it must just be very hard.", response: "Ask what would convince everyone it can never work. A reason (like the checkerboard colours) beats any number of failed tries." },
    ],
    discussionQuestions: [
      "How do you know something is impossible, not just hard?",
      "Why does the game have 7 pieces when there are only 5 shapes made of 4 squares?",
      "What made the hardest flat puzzle in the room hard?",
    ],
    troubleshooting: [
      "Cubes come apart: snap firmly; flat pieces only need one layer.",
      "Students racing ahead on devices: the screens can wait until the last ten minutes. Nothing on them is needed earlier.",
    ],
    answerGuidance: [
      "No 4 × 4 fill using 4-square pieces can include a T. Fills that work include I + O + L + L, I + S + L + L, S + S + L + L, O + O + L + L.",
      "Proficient: a working flat puzzle tested with a time, one change and a re-test.",
    ],
    alternatives: {
      noPrinter: "No printer needed.",
      touchDevice: "Photograph the pieces with the tablet at the end of class.",
    },
  },
};
