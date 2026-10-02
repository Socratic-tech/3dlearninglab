import type { LessonInput } from "../schema";

export const lesson: LessonInput = {
  id: "prototype",
  number: 35,
  title: "Prototype",
  subtitle: "Build the smallest thing that answers your biggest question",
  domain: "F",
  kind: "lesson",
  summary: "Decide what your design's riskiest question is, then build the quickest prototype — paper, cardboard or a small test print — that answers it.",
  estimatedMinutes: 50,
  printLevel: "prototype",
  competencyIds: ["F5", "C10", "G4"],
  prerequisites: ["writing-constraints"],
  vocabulary: [
    { term: "Prototype", definition: "An early version built to answer a question, not to be perfect." },
    { term: "Critical question", definition: "The one thing that, if it fails, makes the whole design fail." },
    { term: "Test slice", definition: "A small print of only the critical part of a design, such as one hole or one clip." },
    { term: "Low-fidelity", definition: "Quick and rough: paper, tape, cardboard or a block-out." },
  ],
  sections: [
    {
      phase: "discover",
      title: "Why this matters",
      blocks: [
        {
          id: "hook",
          type: "hero",
          title: "A prototype is a question you can hold.",
          hook: "A 3-hour print that doesn't fit wastes 3 hours. A 12-minute slice that doesn't fit teaches you the same thing in 12 minutes.",
          visual: { diagram: "prototype-critical" },
        },
        {
          id: "explain",
          type: "text",
          body: "Before building, ask: **what is most likely to go wrong?** That's your critical question. Build only enough to answer it.",
        },
        {
          id: "predict",
          type: "prediction",
          prompt: "Your desk organizer's riskiest part is a hole for a 14 mm glue stick. What should you print first?",
          visual: { diagram: "prototype-critical" },
          options: [
            { id: "a", text: "A thin slice that contains only the glue-stick hole" },
            { id: "b", text: "The whole organizer, so you can test everything at once", misconceptionId: "print-everything" },
            { id: "c", text: "Nothing — the CAD says 14 mm, so it will fit", misconceptionId: "cad-is-proof" },
          ],
          expectedOptionId: "a",
          reveal: "A 5 mm tall slice of the hole prints in minutes. If it's tight, change one number and print another slice. Only print the whole organizer once the hole works.",
        },
      ],
    },
    {
      phase: "practice",
      title: "Pick the prototype",
      blocks: [
        {
          id: "match-type",
          type: "matching",
          prompt: "Match each prototype to the question it answers best.",
          pairs: [
            { id: "paper", left: "Paper cut-out at full size", right: "Is it the right size for the space?" },
            { id: "cardboard", left: "Cardboard and tape mock-up", right: "Can the user reach and use it comfortably?" },
            { id: "slice", left: "Printed test slice", right: "Does the real object fit the hole?" },
            { id: "draft", left: "Fast, low-detail full print", right: "Does the whole thing balance and look right?" },
          ],
          explanation: "Choose the cheapest prototype that answers your question. Paper is perfect for size, but it can't tell you about fit.",
          competencyId: "F5",
          check: "practice",
        },
        {
          id: "critical-mc",
          type: "multipleChoice",
          prompt: "A wall hook must hold a 600 g backpack without snapping. Which prototype tests the critical question?",
          options: [
            { id: "a", text: "Print just the hook arm in its planned orientation and hang the backpack on it." },
            { id: "b", text: "Make a paper version to check the size." },
            { id: "c", text: "Ask a friend if it looks strong.", misconceptionId: "opinion-is-test" },
          ],
          correctOptionIds: ["a"],
          explanation: "The risk is strength, so the prototype must be real plastic, printed the way the final part will be. Paper can't answer a strength question.",
          competencyId: "F5",
          check: "skill",
        },
        {
          id: "show-me",
          type: "showMe",
          title: "Make a test slice in Tinkercad",
          steps: [
            { text: "Select your finished design and duplicate it (Ctrl+D). Move the copy to the side.", keys: "Ctrl+D" },
            { text: "Drag a large Box over the parts you DON'T need to test and switch it to Hole.", diagram: "solid-vs-hole" },
            { text: "Leave a slice about 5 mm tall around the critical feature, with a floor if it needs one.", diagram: "prototype-critical" },
            { text: "Select the copy and the hole box, then Group (Ctrl+G). Export only this slice.", keys: "Ctrl+G" },
          ],
        },
      ],
    },
    {
      phase: "apply",
      title: "Micro challenge",
      blocks: [
        { id: "files", type: "modelDownload", modelIds: ["mystery-fit-object"], showImportSteps: true },
        {
          id: "tinkercad",
          type: "tinkercadLaunch",
          title: "Practice slice",
          steps: [
            "Import the Mystery Fit Object.",
            "Decide which single feature — the round peg or the square post — you'd need to test if this were your design.",
            "Use Hole boxes to cut away everything except that feature and a thin piece of base under it.",
          ],
        },
        {
          id: "micro",
          type: "challenge",
          kind: "micro",
          title: "Slice it",
          prompt: "Turn the Mystery Fit Object into a test slice that keeps only one critical feature.",
          requirements: ["Keeps one feature (round peg or square post) untouched", "Base under it cut down to 2 mm thick and no wider than 14 mm", "Single grouped model"],
          skills: ["C10", "F5"],
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
          where: "both",
          kind: "prove",
          title: "Capstone prototype 1",
          prompt: "Write your capstone's critical question. Then build the quickest prototype that answers it — paper, cardboard, a block-out, or a test print under about 30 minutes.",
          requirements: [
            "Critical question written as one sentence",
            "Prototype tests that question and nothing extra",
            "If printed: only the critical part, sized from your measurements",
            "Plan for how you'll test it next lesson",
          ],
          skills: ["F5", "C10", "G4"],
        },
        { id: "journal", type: "journal", projectKey: "capstone", promptIds: ["prototype"] },
        {
          id: "submit",
          type: "uploadEvidence",
          prompt: "Upload your prototype: a class design link or STL if it's digital or printed, or a photo of a paper/cardboard prototype.",
          accepts: ["design_url", "stl", "screenshot"],
          competencyIds: ["F5", "C10"],
          checklist: ["Critical question is written in the journal", "Prototype only includes what's needed to answer it", "Key dimension is visible"],
          allowPrintRequest: true,
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
          prompt: "Why did you choose this kind of prototype instead of printing the whole design?",
          sentenceStarters: ["My critical question is…", "This prototype answers it because…", "Printing everything would…"],
          competencyIds: ["F5", "C10"],
        },
      ],
    },
  ],
  teacher: {
    purpose: "Students learn to prototype on purpose: identify the riskiest question, then pick the fastest, cheapest prototype that answers it.",
    preparation: [
      "Gather paper, cardboard, tape and scissors for low-fidelity prototypes.",
      "Decide your print queue rule for test slices (for example: under 30 minutes, one per student per day).",
      "Test the Mystery Fit Object import on a student device.",
    ],
    equipment: ["Student devices with Tinkercad", "Paper, cardboard, tape, scissors", "Ruler or calipers", "3D printer (optional)"],
    misconceptions: [
      { id: "print-everything", text: "The best test is printing the whole design.", response: "Compare print times: whole part vs. slice. Same answer, fraction of the time and plastic." },
      { id: "cad-is-proof", text: "If the CAD dimension is right, the print will fit.", response: "Revisit the Fit Lab: real printers vary. Only a test print proves a fit." },
      { id: "opinion-is-test", text: "Asking someone's opinion is a test.", response: "Ask: what would you measure or try? A test produces a result you can write down." },
    ],
    discussionQuestions: [
      "When is a paper prototype better than a printed one?",
      "What's the riskiest part of your capstone? How do you know?",
      "How small can a prototype be and still answer the question?",
    ],
    printableObjects: ["Student test slices (aim for under 30 minutes each)"],
    slicerSettings: "Starting point for test slices: PLA, 0.2 mm layers, 15% infill, 2–3 walls, no supports, same orientation the final part will use. Adjust for your printer.",
    troubleshooting: [
      "If a student's slice removes the feature they wanted to test, check the hole box's height and Z position.",
      "If a slice is still a long print, have them cut it thinner or narrower — only the critical feature should remain.",
      "If several students need strength tests, print them in the final orientation; strength depends on layer direction.",
    ],
    answerGuidance: [
      "Good critical questions: 'Will a 14 mm glue stick slide into the hole?' 'Will the clip grip a 12 mm clipboard?' 'Will it fit on the 50 mm ledge?'",
      "Proficient: prototype type matches the question (fit → print, size → paper, reach → cardboard).",
    ],
    alternatives: {
      noPrinter: "Use paper and cardboard prototypes for size and reach; for fit, cut the hole shape from 3 mm cardboard at the planned dimension and test the real object.",
      touchDevice: "Use the on-screen Duplicate, Hole and Group buttons.",
    },
  },
};
