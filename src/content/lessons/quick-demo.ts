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
    purpose: "Give newcomers a complete, low-stakes experience of prediction, model exploration, feedback, reflection, and saving progress. This introduction provides no scored mastery evidence.",
    preparation: ["Open Try-It mode, enter a first name, and choose the seven-minute demo on the home page.", "Allow one minute to enter, four minutes to explore, and two minutes to reflect and demonstrate Save progress file."],
    equipment: ["A browser on a computer or tablet, or a shared projected screen. No printer, account, or design software required."],
    discussionQuestions: ["What helped you understand?", "What happened when you tried an answer?", "Where could your students use this kind of feedback?"],
    answerGuidance: ["Accept a brief observation about layers, the model, or feedback. Ask for an explanation rather than a technical term."],
    troubleshooting: ["If the 3D viewer does not load, use the brick analogy and continue. Model exploration is optional for completion.", "Show the progress-file export yourself if time is tight."],
    alternatives: { noPrinter: "Use the on-screen cube or a stack of bricks.", touchDevice: "Use the viewer's controls, or follow the projected demonstration." },
  },
};
