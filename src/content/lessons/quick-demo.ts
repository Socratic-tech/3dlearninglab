import type { LessonInput } from "../schema";

/** A workshop introduction, separate from the 9- and 18-week course paths. */
export const lesson: LessonInput = {
  id: "quick-demo",
  number: 41,
  title: "Try It: One Layer at a Time",
  subtitle: "A seven-minute introduction — no experience needed",
  domain: "D",
  kind: "lab",
  summary: "Predict, explore a 3D model, try a matching activity, and share one discovery. No printer or design software needed.",
  estimatedMinutes: 7,
  printLevel: "digital",
  competencyIds: ["D1"],
  prerequisites: [],
  vocabulary: [{ term: "Layer", definition: "One thin slice of a printed object, built on the slice below it." }],
  sections: [
    {
      phase: "discover",
      title: "Make a prediction",
      blocks: [
        {
          id: "welcome",
          type: "text",
          body: "**You do not need to know how to use a 3D printer.** Most school printers build an object one thin layer at a time, like stacking rows of bricks. Try an answer, notice the feedback, and change your mind if you need to. Work alone, with a partner, or follow the projected demonstration. Open **Aa** to adjust the text or use read-aloud.",
        },
        {
          id: "predict",
          type: "prediction",
          prompt: "A printer builds a solid cube. Where does it start?",
          options: [
            { id: "bottom", text: "At the bottom, then builds upward" },
            { id: "top", text: "At the top, then builds downward" },
            { id: "all", text: "It makes the whole cube at once" },
          ],
          expectedOptionId: "bottom",
          reveal: "The first layer sits on the printer's plate. Each new layer sits on the one below it. A solid cube grows from the bottom up.",
        },
      ],
    },
    {
      phase: "practice",
      title: "Explore and connect",
      blocks: [
        {
          id: "layers",
          type: "modelViewer",
          modelId: "axis-cube-20mm",
          showLayers: true,
          caption: "Turn the cube, then move the layer slider from low to high. Watch the shape grow from the bottom. If the viewer is difficult to use, picture a tower built one row of bricks at a time.",
        },
      ],
    },
    {
      phase: "prove",
      title: "Try two familiar examples",
      blocks: [
        {
          id: "match",
          type: "matching",
          prompt: "Match each action to its familiar example.",
          hint: "Does the action add something, or take something away?",
          pairs: [
            { id: "add", left: "Adding material", right: "Stacking rows of bricks" },
            { id: "remove", left: "Removing material", right: "Carving a pumpkin" },
          ],
          explanation: "A 3D printer adds material to build a shape. Carving removes material from a shape that is already there. You can retry this activity; it is practice.",
          check: "practice",
        },
      ],
    },
    {
      phase: "reflect",
      title: "One discovery",
      blocks: [
        {
          id: "discovery",
          type: "reflection",
          prompt: "What helped you understand how a printed object grows? Write one short sentence. You can use your device's speech-to-text or agree on a sentence with a partner.",
          sentenceStarters: ["I noticed that…", "Moving the layer slider helped me see…", "The feedback helped me understand…"],
          minWords: 3,
          competencyIds: [],
        },
        {
          id: "take-it-with-you",
          type: "text",
          body: "Choose **Complete mission** when your activities are finished. In Try-It mode, choose **Save progress file** to keep a copy you can turn in to a teacher or open on another device. Your work stays in this browser until you share that file. This introduction does not replace Mission 1 or certify a skill.\n\n**Want models for your classroom?** Explore [Printables](https://www.printables.com/), [Thingiverse](https://www.thingiverse.com/), and [MakerWorld](https://makerworld.com/). A teacher can choose one small model, check its license and printer requirements, and use it to ask: What do you notice? What would you change?",
        },
      ],
    },
  ],
  teacher: {
    purpose: "Give newcomers a complete, low-stakes experience of prediction, model exploration, feedback, reflection, and saving progress. This introduction provides no scored mastery evidence. It works as a first taste for students, or as a quick walkthrough for colleagues, families or visitors who want to see how the lab teaches: one big idea (printers add material layer by layer), explored through several ways in (a picture, a 3D model, a familiar comparison and a sentence of one's own).",
    bigIdea: "A 3D printer adds material one thin layer at a time, starting at the bottom and building upwards.",
    successCriteria: [
      "I can predict where a printer starts building and check my prediction.",
      "I can use the layer slider (or the brick picture) to see a shape grow from the bottom.",
      "I can tell the difference between adding material and removing it.",
      "I can share one thing I noticed.",
    ],
    background: [
      { title: "The one idea: additive manufacturing", body: "Most school printers are **FDM** printers: they melt plastic string (filament) in a hot nozzle and draw one flat layer on the build plate, then step up and draw the next. This is **additive manufacturing**: material is added only where the object needs it. Traditional making is often **subtractive**: you start with a block and remove material (carving, drilling, milling). The matching activity uses bricks and a pumpkin so participants can reason from everyday experience rather than technical terms." },
      { title: "Why it starts at the bottom", body: "Each new layer must rest on something, so the first layer is laid on the build plate and every later layer sits on the one below. Melted plastic can't be placed in mid-air. A common layer height is 0.2 mm, so the 20 mm cube in the viewer would take around 100 layers. Participants don't need the numbers, but they make a good 'wow' if someone asks how many layers there are." },
      { title: "What the layer slider shows", body: "The model viewer's layer slider hides everything above a chosen height, so moving it from low to high shows the object growing as a printer would build it. It is a picture of the idea, not a true print simulation: real slicer previews also show the nozzle's paths, infill patterns and any supports. If the viewer is slow or hard to use on a device, the brick-tower picture carries the same idea, and completion doesn't depend on the viewer." },
      { title: "How the demo models the teaching approach", body: "In seven minutes participants meet the lab's learning cycle: **predict** (commit to an idea), **explore** (test it with a model), **practise** with feedback they can retry, then **reflect** in their own words. The welcome text names choices up front: work alone, with a partner or by following the projection, adjust text size and use read-aloud. This reflects Universal Design for Learning: several ways to take in the idea and several ways to show understanding, without lowering the goal." },
      { title: "Saving progress and finding models", body: "In Try-It mode, work stays in that browser until the participant chooses **Save progress file**, which downloads a copy they can hand in or open elsewhere. Nothing is sent anywhere automatically. The closing text points to public model libraries. Before printing any model from one, check its licence (some forbid remixing or commercial use) and whether it suits your printer (size, supports, print time)." },
    ],
    studentQuestions: [
      { q: "Do I need a 3D printer for this?", a: "No. Everything today happens on screen. The viewer shows how a printer would build the shape." },
      { q: "What is the printer's plastic made of?", a: "Most school printers use PLA, a plastic that melts at a fairly low temperature. It comes on a spool, like thick fishing line." },
      { q: "Is 3D printing the same as carving?", a: "It's the opposite. Carving takes material away from a block; a 3D printer adds material only where it's needed." },
      { q: "What if I got the prediction wrong?", a: "That's the point of a prediction. You noticed the feedback and updated your thinking, which is exactly what designers do." },
    ],
    connections: [
      "Engineers print quick prototypes to test an idea before a factory makes thousands of copies.",
      "Hospitals print models of a patient's bones or organs so surgeons can plan an operation.",
      "Teachers and makers download open models from online libraries, check the licence, and print them as hands-on learning tools.",
    ],
    exitTicket: [
      "In one sentence: how does a 3D printer build an object?",
      "What is one question you still have about 3D printing?",
    ],
    runPlan: [
      { minutes: 1, title: "Enter and predict", teacher: "Point out the Aa menu and read-aloud. Invite participants to answer the prediction without worrying about being right.", students: "Read or listen to the welcome, then make the prediction.", devices: "open" },
      { minutes: 4, title: "Explore and connect", teacher: "Model the layer slider once on the projector. Circulate and ask 'What do you notice about the bottom layers?'", students: "Turn the cube, move the layer slider, then try the matching activity (retrying is fine).", devices: "open" },
      { minutes: 2, title: "Share and save", teacher: "Take one or two discoveries aloud. Demonstrate Save progress file if time is tight.", students: "Write or say one discovery, then complete the mission and save progress.", devices: "open" },
    ],
    lookFors: [
      "Participants changing their answer after feedback, not just moving on.",
      "Participants using the slider (or the brick picture) to explain 'bottom up' in their own words.",
      "Participants contrasting adding material with removing it.",
    ],
    differentiation: {
      support: [
        "Follow the projected demonstration together instead of using individual devices.",
        "Use a real stack of blocks or bricks alongside the on-screen cube.",
        "Let participants agree on a sentence with a partner, or use speech-to-text for the reflection.",
      ],
      extend: [
        "Ask: if each layer is 0.2 mm thick, about how many layers make the 20 mm cube?",
        "Choose one model from a public library and check its licence and size for your printer.",
      ],
    },
    preparation: [
      "Open Try-It mode, enter a first name, and choose the seven-minute demo on the home page.",
      "Allow one minute to enter, four minutes to explore, and two minutes to reflect and demonstrate Save progress file.",
      "Load the 3D viewer once on the presenting device before the session so it is ready to go.",
    ],
    equipment: [
      "A browser on a computer or tablet, or a shared projected screen. No printer, account, or design software required.",
      "Optional: a printed object or a few stacking blocks to pass around.",
    ],
    misconceptions: [
      { id: "all-at-once", text: "A 3D printer makes the whole object at once.", response: "Move the layer slider slowly: only the lower layers exist partway through." },
      { id: "printer-carves", text: "A 3D printer carves the object out of a block.", response: "Use the matching activity: printing is like stacking bricks, not carving a pumpkin." },
    ],
    discussionQuestions: ["What helped you understand?", "What happened when you tried an answer?", "Where could your students use this kind of feedback?"],
    answerGuidance: ["Accept a brief observation about layers, the model, or feedback. Ask for an explanation rather than a technical term."],
    troubleshooting: [
      "If the 3D viewer does not load, use the brick analogy and continue. Model exploration is optional for completion.",
      "Show the progress-file export yourself if time is tight.",
      "If a browser blocks the progress-file download, check the browser's download settings or use a different device.",
    ],
    alternatives: { noPrinter: "Use the on-screen cube or a stack of bricks.", touchDevice: "Use the viewer's controls, or follow the projected demonstration." },
  },
};
