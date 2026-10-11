import type { LessonInput } from "../schema";

/**
 * The final mission of a teacher's custom project path. The teacher's project title, brief and requirements replace
 * the placeholder text below for their class (see web/src/custom-path.ts), and the server credits the skills of the
 * lessons the teacher picked when this work is reviewed. Not part of any standard course.
 */
export const lesson: LessonInput = {
  id: "custom-project",
  number: 200,
  title: "Your Project",
  subtitle: "Put your skills to work",
  domain: "F",
  kind: "boss",
  summary: "Design the project your teacher set, check it against the requirements, and share it for review.",
  estimatedMinutes: 90,
  printLevel: "prototype",
  competencyIds: ["F5", "F6", "F8"],
  prerequisites: [],
  vocabulary: [
    { term: "Brief", definition: "A short description of what you need to design and who it is for." },
    { term: "Requirement", definition: "Something your design must do. Check every one before you submit." },
  ],
  sections: [
    {
      phase: "discover",
      title: "The project",
      blocks: [
        { id: "hook", type: "hero", title: "Your project", hook: "Your teacher will describe the project here.", visual: { diagram: "design-cycle", alt: "The design cycle: plan, build, test, improve." } },
        {
          id: "how",
          type: "showMe",
          title: "How to work",
          steps: [
            { text: "Read the brief and the requirements. Ask about anything that isn't clear." },
            { text: "Sketch two or three ideas, then pick the one that best meets the requirements.", diagram: "sketch-concepts" },
            { text: "Build it in Tinkercad. Check each requirement as you go." },
            { text: "Test it, improve one thing, then share it.", diagram: "design-cycle" },
          ],
        },
      ],
    },
    {
      phase: "prove",
      title: "Build and share",
      blocks: [
        {
          id: "project",
          type: "challenge",
          kind: "boss",
          title: "Your project",
          prompt: "Design your project in Tinkercad and meet every requirement.",
          requirements: ["Meets every requirement in the brief"],
          skills: ["F5"],
        },
        {
          id: "submit",
          type: "uploadEvidence",
          prompt: "Share your project: upload a screenshot, the design link or the STL file. Add a note about what you tested and changed.",
          accepts: ["screenshot", "design_url", "stl", "written"],
          competencyIds: ["F5", "F6", "F8"],
          checklist: ["Meets every requirement in the brief"],
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
          prompt: "Which skill from the earlier missions helped you most on this project? What would you change next time?",
          sentenceStarters: ["The skill that helped most was… because…", "Next time I would…"],
          competencyIds: ["F8"],
        },
      ],
    },
  ],
  teacher: {
    purpose: "The final mission of your custom project path. Your brief and requirements appear here for your students, and reviewing their work credits the skills of the lessons you picked.",
    preparation: ["Write a clear brief (who it's for, what it must do) and 3–5 checkable requirements in the path builder.", "Decide whether students print a test piece first."],
    equipment: ["Student devices", "Printer time if students print"],
    misconceptions: [],
    discussionQuestions: ["Which requirement was hardest to meet, and why?"],
    troubleshooting: ["If the brief still shows placeholder text, the class isn't set to your custom path: check Classes → Course."],
    answerGuidance: ["Rate the submission against your requirements; the rating sets the level for every skill in your path."],
  },
};
