import type { LessonInput } from "../schema";

export const lesson: LessonInput = {
  id: "jr-words",
  number: 107,
  title: "Words You Can Print",
  subtitle: "Big, raised and touching",
  domain: "B",
  kind: "lesson",
  summary: "Add raised letters to a design and learn how big letters must be to print.",
  estimatedMinutes: 30,
  printLevel: "digital",
  competencyIds: ["B10"],
  prerequisites: ["jr-design-rules"],
  vocabulary: [
    { term: "Raised", definition: "Sticking up from a surface, like the letters on a sign." },
    { term: "Text shape", definition: "The Tinkercad shape that makes letters." },
  ],
  sections: [
    {
      phase: "discover",
      title: "Letters that stick up",
      blocks: [
        {
          id: "hook",
          type: "hero",
          title: "Put your name on it",
          hook: "Raised letters stick up from a flat shape. They have to be big enough to print, and they have to touch.",
          visual: { diagram: "text-raised-recessed", alt: "Letters standing up from a flat plate." },
        },
        {
          id: "how",
          type: "showMe",
          title: "Add your name",
          steps: [
            { text: "Drag the Text shape onto the workplane." },
            { text: "Type your name in the Text box of the shape panel." },
            { text: "Set the height to 1 mm, so the letters stick up 1 mm." },
            { text: "Lift the letters to sit right on top of your flat shape. They must touch!", diagram: "move-z" },
          ],
        },
        {
          id: "size",
          type: "callout",
          tone: "tip",
          title: "How big?",
          body: "Make letters at least 8 mm tall. Tiny letters turn into blobs.",
        },
      ],
    },
    {
      phase: "practice",
      title: "Try it",
      blocks: [
        {
          id: "lift-letters",
          type: "measurement",
          prompt: "Your bookmark is 2 mm thick. How high should you lift the letters so they sit right on top?",
          answer: 2,
          tolerance: 0,
          unit: "mm",
          hint: "The bottom of the letters goes where the top of the bookmark is.",
          explanation: "Lift them 2 mm. Then they sit on top and touch.",
          competencyId: "B10",
          check: "skill",
        },
        {
          id: "big-enough",
          type: "multipleChoice",
          prompt: "Which name will print clearly?",
          hint: "Remember the tip: at least 8 mm tall.",
          options: [
            { id: "a", text: "Letters 10 mm tall" },
            { id: "b", text: "Letters 2 mm tall", misconceptionId: "tiny-text" },
          ],
          correctOptionIds: ["a"],
          explanation: "10 mm letters are big enough. 2 mm letters turn into blobs.",
          competencyId: "B10",
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
          title: "Name plate",
          prompt: "Make a flat box 60 × 20 × 2 mm. Put your name on it: raised 1 mm, at least 8 mm tall, touching the top.",
          requirements: ["Box 60 × 20 × 2 mm", "Name raised 1 mm", "Letters 8 mm or taller", "Letters touch the box"],
          skills: ["B10"],
        },
        {
          id: "submit",
          type: "uploadEvidence",
          prompt: "Take a screenshot from the side, so we can see the letters touching.",
          accepts: ["screenshot", "design_url"],
          competencyIds: ["B10"],
          checklist: ["The letters touch the box", "The letters are at least 8 mm tall"],
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
          prompt: "What would you put words on, if you could print anything?",
          sentenceStarters: ["I would put words on…"],
          competencyIds: ["B10"],
        },
      ],
    },
  ],
  teacher: {
    purpose: "Students add printable raised text, sized and placed so it actually prints. Text is the most personal part of the boss-battle bookmark, and it combines every skill so far: typed sizes, lifting, touching shapes and the design rules. It also introduces a new idea: small details have a minimum printable size, because the printer draws with a line of plastic of a fixed width.",
    bigIdea: "Raised letters print well when they are big enough, stick up a little, and sit right on top of the shape so they touch.",
    successCriteria: [
      "I can add the Text shape and type my name.",
      "I can make letters big enough to print clearly.",
      "I can lift letters so they sit exactly on top of a flat shape.",
      "I can check from the side that the letters touch.",
    ],
    background: [
      { title: "Raised and sunken text", body: "**Raised** (embossed) text sticks up from a surface, like a sign or a trophy plate. **Sunken** (engraved) text is cut into the surface, which in Tinkercad means setting the text to Hole and grouping. This lesson uses raised text because it's easier to see and feel; engraving is a natural extension for students who finished early, and it reuses the Holes lesson. Either way, the text is just another shape: Tinkercad turns the letters into solid 3D pieces." },
      { title: "Two kinds of 'tall'", body: "Students (and adults) mix up two sizes. When text lies flat on a base, the **letter size** is how big the letters look from above: this is the '8 mm or taller' rule, measured across the plate. The **height** in Tinkercad is how far the letters **stick up** from the base: the '1 mm' rule. Changing one doesn't change the other. Show this by selecting the text and pointing to each number in turn. Also, the size Tinkercad shows is the box around the *whole word*, so a name with low-hanging letters like g or y will have slightly smaller letters than the number suggests." },
      { title: "Why letters need to be big", body: "The printer draws with a line of melted plastic roughly as wide as its nozzle, often about 0.4 mm. Each stroke of a letter (the line of an 'l' or the curve of an 'o') has to be a few of those lines wide to come out crisp. Small letters have thin strokes and tiny gaps (inside an 'e' or 'a') that close up, turning words into blobs. Around 8 mm is a safe minimum for young designers with a plain, chunky font. Thin, fancy or curly fonts need to be even bigger, so encourage students to try a bold, simple font if their letters look spidery." },
      { title: "Sitting exactly on top", body: "New text lands on the workplane, so it starts *beside* or *inside* the base rather than on top of it. The letters must be lifted so their bottom is at the base's top surface: the lift equals the thickness of the base (for example, on a 3 mm base the letters would be lifted 3 mm). Lifted too little, they sink in and stick up less; lifted too much, they float and fall off, breaking the no-floating rule. Orbiting to a side view is the quickest check. Tinkercad's **Workplane** tool (W) can also place a temporary workplane on top of the base so new shapes land there, a useful tip for confident students." },
      { title: "How text prints in layers", body: "With 0.2 mm layers, a 2 mm base takes about 10 layers and 1 mm letters about 5 more. Because the letters start at a single height, many slicers let you add a pause or colour change at that layer, so the base prints in one colour and the letters in another. The boss battle uses this idea. It also shows students why the letters must touch: their first layer is printed directly onto the top of the base." },
    ],
    studentQuestions: [
      { q: "Can I use a fancy font?", a: "You can try, but thin or curly fonts are harder to print. If the letters look thin, make them bigger or pick a chunkier font." },
      { q: "My name is long. It doesn't fit!", a: "Make the letters smaller but keep them at least 8 mm, or use your first name or initials." },
      { q: "Why do the letters have to touch?", a: "The printer builds the letters on top of the bookmark. If they float, there's nothing underneath, and they'd fall off." },
      { q: "Can I put letters on more than one line?", a: "Yes. Use one Text shape per line and line them up, each one touching the base." },
    ],
    connections: [
      "Sign makers design raised and cut-out letters for shops, schools and street signs, and they choose letter sizes people can read.",
      "Braille signs use raised dots at a set size and height so people can read them by touch.",
      "Trophy and medal engravers put names on plates that have to be big and clear enough to last.",
    ],
    exitTicket: [
      "What are two things raised letters need to print well?",
      "Draw your name plate from the side. Show where the letters sit.",
    ],
    runPlan: [
      { minutes: 4, title: "Hook", teacher: "Show a sign, trophy or name tag with raised letters. Read the hero aloud. Ask: 'What do you notice about the letters?'", students: "Feel or look at raised letters and describe them.", devices: "away" },
      { minutes: 6, title: "Show me", teacher: "Model adding text, setting how far it sticks up, sizing the letters and lifting them onto a base. Point to the two different 'tall' numbers.", students: "Watch, then use hands to show 'how big the letters are' versus 'how far they stick up'.", devices: "away" },
      { minutes: 6, title: "Try it", teacher: "Circulate during the practice questions. Ask 'Where is the bottom of your letters? Where is the top of your base?'", students: "Add text to a test box, then answer the two questions.", devices: "open" },
      { minutes: 11, title: "Name plate", teacher: "Encourage students to orbit to a side view before screenshotting. Ask them to read their sizes to a partner.", students: "Build the 60 × 20 × 2 mm name plate with raised name, check from the side, and submit.", devices: "open" },
      { minutes: 3, title: "Reflect", teacher: "Share a few ideas for things with words. Collect exit tickets.", students: "Reflection and exit ticket.", devices: "open" },
    ],
    lookFors: [
      "Students telling apart letter size (across the plate) and how far letters stick up.",
      "Letters lifted to sit exactly on the base, checked from the side.",
      "Students choosing clear, chunky fonts or enlarging thin letters.",
      "Students adjusting a long name (smaller letters, initials, two lines) rather than breaking the size rule.",
    ],
    differentiation: {
      support: [
        "Let students use their initials instead of a full name.",
        "Give a card with a side-view picture: base, then letters sitting on top.",
        "Pair students so one reads the sizes aloud while the other types.",
      ],
      extend: [
        "Make a second plate with the name engraved (text set to Hole, cut into the base) and compare.",
        "Add a border or a small shape that also touches the base.",
        "Try two fonts at the same size and predict which will print more clearly.",
      ],
    },
    preparation: [
      "Optional: print a text-size test plate to show which letter sizes print clearly (see the Printables pick).",
      "Optional: bring a sign, name badge or trophy with raised letters.",
      "Try typing a long name yourself so you can show options when names don't fit.",
    ],
    equipment: ["Chromebooks", "Projector for live modelling", "Optional: objects with raised letters"],
    misconceptions: [
      { id: "tiny-text", text: "Any size text will print.", response: "Show a printed plate with tiny letters next to big ones." },
      { id: "height-is-size", text: "The height number is how big the letters look.", response: "Change only the height while everyone watches from the top: the letters look the same size. Then orbit to the side." },
    ],
    discussionQuestions: [
      "Why do the letters have to touch the box?",
      "Why might small letters turn into blobs?",
    ],
    printableObjects: ["Optional: a text-size test plate"],
    troubleshooting: [
      "If letters sink into the box, set their lift to the box's thickness (2 mm).",
      "If letters float above the box, lower them until their bottom meets the box's top, then check from the side.",
      "If a long name won't fit at 8 mm, suggest initials, a nickname or two lines.",
    ],
    answerGuidance: ["Lift letters 2 mm on a 2 mm bookmark.", "Name plate: 60 × 20 × 2 mm, letters 1 mm high and at least 8 mm tall, touching."],
  },
};
