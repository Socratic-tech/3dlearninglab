import type { LessonInput } from "../schema";

/** Puzzle Cube, day 18 of 18: the project finale: solution card, pitch and final submission. */
export const lesson: LessonInput = {
  id: "puzzle-ship-it",
  number: 417,
  title: "Puzzle Cube 18: Ship It",
  subtitle: "Puzzle, box, solution card, and your story.",
  domain: "F",
  kind: "challenge",
  summary: "The Puzzle Cube finale (18 one-period missions, about 4 weeks): students make a solution card in the format they choose, present the journey from sketch to printed puzzle with their test data, and deliver the finished puzzle and box.",
  estimatedMinutes: 55,
  printLevel: "prototype",
  competencyIds: ["F10", "F9", "F6"],
  prerequisites: ["puzzle-revise"],
  vocabulary: [
    { term: "Solution card", definition: "A guide that shows how the pieces fit, so players can check their answer." },
    { term: "Pitch", definition: "A short talk that explains your design and why it works." },
  ],
  sections: [
    {
      phase: "discover",
      title: "Finish strong",
      blocks: [
        {
          id: "hook",
          type: "hero",
          title: "From a pencil sketch to a puzzle in someone's hands.",
          hook: "Today you package your puzzle like a real product: the puzzle, its box, a solution card, and a 60-second story of how you made it.",
          visual: { modelId: "puzzle-cube-exploded", alt: "A puzzle cube pulled apart into its pieces." },
        },
        {
          id: "card",
          type: "text",
          title: "Make a solution card your way",
          body: "Players need a way to check their answer. Pick one (or more):\n\n- A **layer map** with piece letters and colours\n- **Step photos:** one after each piece goes in\n- A short **audio or video** walkthrough\n- A **folded card** that fits in the box\n\nA person who has never seen your puzzle should be able to follow it.",
        },
        {
          id: "sample-map",
          type: "diagram",
          name: "puzzle-layer-map",
          caption: "One way to make a solution card: a layer map.",
          alt: "Three 3 by 3 layer maps with piece letters A to F.",
        },
      ],
    },
    {
      phase: "practice",
      title: "Plan your pitch",
      blocks: [
        {
          id: "pitch-order",
          type: "ordering",
          prompt: "Put a 60-second pitch in a clear order.",
          hint: "Start with who it's for; end with what you'd do next.",
          items: [
            { id: "who", text: "Who it's for and the target (from your brief)" },
            { id: "show", text: "Show the puzzle and box" },
            { id: "test", text: "What the playtests showed, with numbers" },
            { id: "change", text: "The change you made and why" },
            { id: "next", text: "What you'd change in version 3" },
          ],
          explanation: "Who → what → evidence → change → next. Numbers make your story believable.",
          competencyId: "F10",
          check: "practice",
        },
        {
          id: "card-mc",
          type: "multipleChoice",
          prompt: "How do you know your solution card works?",
          hint: "Who should try it?",
          options: [
            { id: "test", text: "Give it to someone who hasn't solved the puzzle and see if they can follow it" },
            { id: "me", text: "Read it yourself and check it makes sense", misconceptionId: "self-check" },
          ],
          correctOptionIds: ["test"],
          explanation: "You already know the answer, so the card will always make sense to you. Test it on someone else, like the puzzle itself.",
          competencyId: "F10",
          check: "skill",
        },
      ],
    },
    {
      phase: "apply",
      title: "Package it",
      blocks: [
        {
          id: "micro",
          type: "challenge",
          kind: "micro",
          where: "offline",
          title: "Card test",
          prompt: "Make your solution card and test it on someone who hasn't solved your puzzle.",
          requirements: ["Card made in your chosen format", "Tested by someone new", "Fixed anything that confused them"],
          skills: ["F10"],
        },
      ],
    },
    {
      phase: "prove",
      title: "Prove it: ship your puzzle",
      blocks: [
        {
          id: "prove",
          type: "challenge",
          kind: "prove",
          where: "both",
          title: "Ship It: The Puzzle Cube",
          prompt: "Deliver your finished puzzle cube with its box and solution card, and present the journey in about 60 seconds (out loud, on video or as a slide).",
          requirements: [
            "Printed pieces that assemble into the cube",
            "A box the cube slides into and out of",
            "A solution card someone else can follow",
            "Playtest data from version 1 and version 2",
            "A 60-second pitch: who it's for, test results, the change and why, what's next",
          ],
          skills: ["F10", "F9", "F6"],
        },
        { id: "journal-final", type: "journal", projectKey: "puzzle-cube", promptIds: ["final"] },
        {
          id: "submit",
          type: "uploadEvidence",
          prompt: "Submit a photo of the puzzle, box and card together, your solution card (photo, file or link), and your pitch (video, audio, slide or notes).",
          accepts: ["physical_test", "screenshot", "design_url", "written"],
          competencyIds: ["F10", "F9", "F6"],
          checklist: ["Puzzle, box and card photo", "Solution card", "Pitch", "v1 and v2 data"],
        },
        {
          id: "present-check",
          type: "teacherCheck",
          prompt: "Watch each pitch (live, recorded or as a slide).",
          lookFors: ["States who it's for and the target", "Gives test results with numbers", "Explains one change and the reason from the data", "Says what they'd do next"],
          competencyIds: ["F10", "F9"],
        },
      ],
    },
    {
      phase: "reflect",
      title: "Reflect",
      blocks: [
        { id: "journal-next", type: "journal", projectKey: "puzzle-cube", promptIds: ["next"] },
        {
          id: "reflect",
          type: "reflection",
          prompt: "Look back at your first sketches. What are you proudest of, and what skill will you use again?",
          sentenceStarters: ["I'm proudest of … because …", "Next time I design something, I'll …"],
          competencyIds: ["F10", "F9"],
        },
      ],
    },
  ],
  teacher: {
    purpose: "The Puzzle Cube finale. Students communicate a complete design journey (brief → sketch → plan → CAD → print → test → revise) with evidence, and produce a solution card in the format that suits them. Assigning this project from the Projects page gives the class all 18 missions in order.",
    preparation: [
      "Plan pitch format: live gallery walk, recorded videos, or slides.",
      "Optional: invite the 'client' (the person the puzzles are for), another class, or families.",
      "Have all reprints and boxes collected by the start of class.",
    ],
    equipment: ["Finished puzzles and boxes", "Paper and coloured pencils for cards", "Devices for photos and video"],
    misconceptions: [
      { id: "self-check", text: "You can check your own instructions.", response: "You know the answer already. Watch someone else follow the card." },
    ],
    discussionQuestions: [
      "What would you design next, now that you can go from sketch to print?",
      "Which step of the process surprised you most?",
    ],
    troubleshooting: [
      "Box not printed yet: present with the ring test and the box design screenshot.",
      "Nervous presenters: allow a recorded pitch or a slide with voice-over.",
    ],
    answerGuidance: [
      "Proficient: puzzle and box delivered, a card someone else can follow, v1 and v2 data, and a pitch that uses the numbers.",
      "Optional scoring: the capstone rubric's Testing & Iteration and Communication rows.",
    ],
    alternatives: { noPrinter: "Ship the real-cube version with a card, a pitch and the Tinkercad design.", touchDevice: "Record the pitch with the tablet camera." },
  },
};
