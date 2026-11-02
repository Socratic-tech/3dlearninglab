import type { LessonInput } from "../schema";

/** Puzzle Cube, day 1 of 18: meet the project, explore a sample puzzle, write a design brief. */
export const lesson: LessonInput = {
  id: "puzzle-good-puzzle",
  number: 400,
  title: "Puzzle Cube 1: What Makes a Good Puzzle?",
  subtitle: "Meet the project and decide who your puzzle is for.",
  domain: "F",
  kind: "lesson",
  summary: "Day 1 of the Puzzle Cube project. Students explore a sample puzzle cube, learn the 27-cube idea, see the four-week road map from paper sketch to printed puzzle, and write a short design brief: who will solve it, how hard, and how big.",
  estimatedMinutes: 55,
  printLevel: "digital",
  competencyIds: ["F1", "F2"],
  prerequisites: [],
  vocabulary: [
    { term: "Puzzle cube", definition: "A cube split into 5 or 6 solid pieces that a solver has to fit back together." },
    { term: "Unit cube", definition: "One small cube. Every piece is built from these: 15 mm each (or 10 mm for a keychain)." },
    { term: "Design brief", definition: "A short plan that says who a design is for and what it has to do." },
    { term: "Solver", definition: "The person who tries to put your puzzle together." },
  ],
  sections: [
    {
      phase: "discover",
      title: "The project",
      blocks: [
        {
          id: "hook",
          type: "hero",
          title: "Design a puzzle someone else can't put down.",
          hook: "In four weeks you'll go from a pencil sketch to a 3D-printed puzzle cube: five or six odd pieces that fit together into one cube. Then a classmate tries to solve it.",
          visual: { modelId: "puzzle-cube-exploded", alt: "A sample puzzle cube pulled apart into six pieces." },
        },
        {
          id: "roadmap",
          type: "text",
          title: "The road map",
          body: "- **Week 1 · Paper:** sketch pieces, learn the rules, plan the cube, build it by hand\n- **Week 2 · Tinkercad:** build your pieces in 3D, exactly\n- **Week 3 · Printing:** turn pieces so they print well, slice, print, check\n- **Week 4 · Finish:** a box, playtests, one improvement, ship it\n\nEach day is one mission. Your teacher will tell you if your class skips any.",
        },
        {
          id: "sample",
          type: "modelViewer",
          modelId: "puzzle-cube-exploded",
          caption: "A sample puzzle, pulled apart. Orbit it, zoom in, and count the pieces.",
        },
        {
          id: "notice",
          type: "observe",
          title: "Look closely at the sample",
          cards: [
            { id: "count", label: "How many pieces? Are any the same shape?", hint: "Count them. Then compare shapes.", reveal: "Six pieces, and no two are the same shape. If two pieces matched, the solver would have fewer choices to make." },
            { id: "bend", label: "Which pieces lie flat, and which bend up?", hint: "Imagine setting each piece on a table.", reveal: "Some pieces are flat, others bend into 3D. Bent pieces are what make a puzzle tricky." },
            { id: "cubes", label: "What are the pieces made of?", hint: "Look at the edges and faces.", reveal: "Every piece is made of the same small cubes joined face to face. That's the secret: design with cubes and the pieces always fit." },
          ],
        },
      ],
    },
    {
      phase: "practice",
      title: "The numbers behind a puzzle cube",
      blocks: [
        {
          id: "count-cubes",
          type: "measurement",
          prompt: "A puzzle cube is 3 unit cubes wide, 3 deep and 3 tall. How many unit cubes does it hold?",
          hint: "Count one layer (3 × 3), then think about how many layers there are.",
          answer: 27,
          tolerance: 0,
          unit: "cubes",
          explanation: "3 × 3 = 9 cubes in a layer, and 3 layers: 9 × 3 = 27. All your pieces together must use exactly 27 cubes.",
          competencyId: "F2",
          check: "practice",
        },
        {
          id: "size",
          type: "measurement",
          prompt: "Each unit cube is 15 mm. How wide is the finished puzzle cube?",
          hint: "It's 3 unit cubes wide.",
          answer: 45,
          tolerance: 0,
          unit: "mm",
          explanation: "3 × 15 = 45 mm, about the size of a big ice cube. A keychain version uses 10 mm cubes: 30 mm across.",
          check: "practice",
        },
        {
          id: "harder",
          type: "prediction",
          prompt: "Which puzzle would take a classmate longer to solve?",
          hint: "Think about how many ways each piece could go in.",
          options: [
            { id: "flat", text: "Six pieces that all lie flat, like thick tiles" },
            { id: "bent", text: "Pieces where some bend up into 3D" },
          ],
          expectedOptionId: "bent",
          reveal: "Flat pieces stack in layers, so they're quick to solve. A piece that bends into 3D fills parts of two layers at once, so the solver has to think in 3D too.",
        },
      ],
    },
    {
      phase: "apply",
      title: "Who is it for?",
      blocks: [
        {
          id: "brief-tip",
          type: "text",
          title: "A design brief answers four questions",
          body: "1. **Who** will solve it? (a classmate, a younger student, a family member)\n2. **How hard?** A target time, like 'a first-timer needs 1 to 5 minutes'\n3. **How big?** Desk size (15 mm cubes, 45 mm puzzle) or keychain (10 mm cubes, 30 mm puzzle)\n4. **How many pieces?** 5 or 6\n\nYou can change your answers later. Designers update their brief when they learn something new.",
        },
        { id: "journal-brief", type: "journal", projectKey: "puzzle-cube", promptIds: ["user", "constraints"] },
      ],
    },
    {
      phase: "prove",
      title: "Prove it: your design brief",
      blocks: [
        {
          id: "prove",
          type: "challenge",
          kind: "prove",
          where: "offline",
          title: "My Puzzle Brief",
          prompt: "Write (or record) a design brief for your puzzle cube.",
          requirements: [
            "Who will solve it",
            "A target solve time with a number (for example, 1 to 5 minutes)",
            "Desk size (45 mm) or keychain size (30 mm)",
            "5 or 6 pieces",
            "One sentence: what would make your puzzle fun?",
          ],
          skills: ["F1", "F2"],
        },
        {
          id: "submit",
          type: "uploadEvidence",
          prompt: "Type your brief, or upload a photo of it written down, or a short audio or video recording.",
          accepts: ["written", "screenshot", "physical_test"],
          competencyIds: ["F1", "F2"],
          checklist: ["Who", "Target time with a number", "Size", "Number of pieces"],
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
          prompt: "Think of a puzzle or game you liked. What made it fun to figure out, and how could your cube feel like that?",
          sentenceStarters: ["I liked … because …", "My puzzle could feel like that if …"],
          competencyIds: ["F1"],
        },
      ],
    },
  ],
  teacher: {
    purpose: "Launch day for the 18-mission Puzzle Cube project (about four weeks of 55-minute classes). Students see the finished goal, connect it to volume (27 cubes) and write a measurable brief they'll test against in week 4. For a 3-week run, skip days 5, 10 and 12.",
    preparation: [
      "If you can, print the sample puzzle (puzzle-cube-exploded model, or any student set from a past class) for students to handle.",
      "Collect small cubes for week 1: linking cubes, sugar cubes, dice or paper cubes, about 30 per student or pair.",
      "Print isometric dot paper for day 2.",
      "Decide whether students may choose the keychain size (more fiddly to build and print).",
    ],
    equipment: ["Student devices", "Sample puzzle (optional)", "Paper and pencils"],
    misconceptions: [],
    discussionQuestions: [
      "What makes a puzzle frustrating instead of fun?",
      "Why might a designer write down who a puzzle is for before drawing anything?",
    ],
    troubleshooting: [
      "Students who can't decide on a solver can design for 'a classmate in this room' and a 1–5 minute target.",
      "Brief can be spoken: accept audio or video recordings.",
    ],
    answerGuidance: [
      "Strong brief: 'For my little brother (age 9). A first try should take 2–4 minutes. Desk size, 6 pieces. Fun because two pieces look almost the same.'",
      "Proficient: all four brief questions answered, with a number for the target time.",
    ],
    alternatives: {
      noPrinter: "Day 1 needs no printer.",
      touchDevice: "Orbit the sample with one finger, zoom with two.",
    },
  },
};
