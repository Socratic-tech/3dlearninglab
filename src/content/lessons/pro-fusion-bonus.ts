import type { LessonInput } from "../schema";

export const lesson: LessonInput = {
  id: "pro-fusion-bonus",
  number: 306,
  title: "Bonus: Try It in Fusion (13+)",
  subtitle: "Same skills, different tool",
  domain: "H",
  kind: "lesson",
  summary: "Rebuild your key tag in Autodesk Fusion and compare how two pro CAD tools name the same ideas. For students 13 and older.",
  estimatedMinutes: 45,
  printLevel: "digital",
  competencyIds: ["H9", "H2", "H4"],
  prerequisites: ["pro-sketch-extrude"],
  vocabulary: [
    { term: "Timeline", definition: "Fusion's history of steps, shown along the bottom of the screen. It does the same job as Onshape's Feature list." },
    { term: "Browser", definition: "In Fusion, the tree on the left that lists your bodies, sketches and planes." },
    { term: "Join / Cut", definition: "Fusion's names for adding to a body or cutting from it with Extrude." },
  ],
  sections: [
    {
      phase: "discover",
      title: "Your skills travel",
      blocks: [
        {
          id: "hook",
          type: "hero",
          title: "Learn one pro CAD tool and the next one is half learned.",
          hook: "Fusion and Onshape both sketch, constrain, extrude and save every step. The buttons look different, but the thinking is the same.",
          visual: { diagram: "shapes-vs-sketches" },
        },
        {
          id: "age",
          type: "callout",
          tone: "warning",
          title: "For students 13 and older",
          body: "Autodesk education accounts are for people 13 and older. If you're younger, pair up with someone who has an account and do the comparison together, or do the matching activities and your teacher will give you another task.",
        },
        {
          id: "explain",
          type: "text",
          body: "Here's how Fusion names the steps you already know:\n\n- **Create Sketch**, then pick a plane.\n- **Sketch Dimension** (press **D**) to type sizes.\n- **Finish Sketch**, then **Extrude** (press **E**).\n- Extrude's **Operation**: **New Body**, **Join** (add) or **Cut** (remove).\n- Your steps appear on the **Timeline** along the bottom of the screen.\n\nFusion also colours sketch lines: blue while they can still move, black when they're fully constrained.",
        },
      ],
    },
    {
      phase: "practice",
      title: "Translate it",
      blocks: [
        {
          id: "match",
          type: "matching",
          prompt: "Match each Onshape idea to its name in Fusion.",
          hint: "Look back at the list above.",
          pairs: [
            { id: "t1", left: "Feature list", right: "Timeline" },
            { id: "t2", left: "Extrude: Add", right: "Extrude: Join" },
            { id: "t3", left: "Extrude: Remove", right: "Extrude: Cut" },
            { id: "t4", left: "Dimension tool (D)", right: "Sketch Dimension (D)" },
          ],
          explanation: "Different names, same jobs. When you know what a step is FOR, you can find it in any CAD tool.",
          competencyId: "H9",
          check: "skill",
        },
        {
          id: "fusion",
          type: "tinkercadLaunch",
          tool: "fusion",
          title: "Rebuild your key tag",
          steps: [
            "Open Fusion in your browser and sign in with your school education account.",
            "Click Create Sketch, then click the plane that lies flat (like the floor). Draw a rectangle and press D to make it 60 × 25 mm.",
            "Finish Sketch. Press E to Extrude it 4 mm as a New Body.",
            "Sketch a 6 mm circle on the top face, 6 mm from a short end. Extrude it with Cut through the tag.",
            "Look at the Timeline at the bottom. Double-click the first extrude and change it to 6 mm.",
          ],
        },
      ],
    },
    {
      phase: "apply",
      title: "Micro challenge",
      blocks: [
        {
          id: "micro",
          type: "challenge",
          kind: "micro",
          where: "fusion",
          title: "Key tag, take two",
          prompt: "Rebuild the 60 × 25 × 4 mm key tag with its 6 mm hole in Fusion.",
          requirements: ["Tag is 60 × 25 × 4 mm", "6 mm hole goes all the way through", "The Timeline shows two sketches and two extrudes"],
          skills: ["H2", "H4"],
        },
        {
          id: "which",
          type: "multipleChoice",
          prompt: "Your class uses Chromebooks and some students are 11 and 12. Which pro CAD tool fits best for the whole class?",
          hint: "Think about the age rules you read about.",
          options: [
            { id: "a", text: "Onshape, with accounts the school sets up" },
            { id: "b", text: "Fusion, because it's the newest", misconceptionId: "newest-is-best" },
            { id: "c", text: "Neither — pro CAD needs a gaming computer", misconceptionId: "needs-big-computer" },
          ],
          correctOptionIds: ["a"],
          explanation: "Both run in a browser, but Autodesk accounts are for ages 13 and up. Onshape allows younger students when a school or parent sets up or approves the account.",
          competencyId: "H9",
          check: "skill",
        },
      ],
    },
    {
      phase: "prove",
      title: "Prove it",
      blocks: [
        {
          id: "submit",
          type: "uploadEvidence",
          prompt: "Upload a screenshot of your Fusion key tag with the Timeline showing, or, if you're under 13, a written comparison of the two tools.",
          accepts: ["screenshot", "written"],
          competencyIds: ["H9", "H2", "H4"],
          checklist: ["Key tag matches the sizes, or the comparison names at least three differences", "Timeline visible (screenshot)"],
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
          prompt: "Onshape or Fusion: which would you pick for your next project, and why?",
          sentenceStarters: ["I'd pick … because…", "The biggest difference I noticed was…"],
          competencyIds: ["H9"],
        },
      ],
    },
  ],
  teacher: {
    purpose: "An optional bonus for students 13 and older: transfer sketch-and-extrude skills to Autodesk Fusion and compare tools.",
    preparation: [
      "Autodesk requires users to be 13 or older to create an account and get an education license. Check ages before assigning; students under 13 can complete the matching items and the written comparison.",
      "Fusion runs in the browser on Chromebooks for students with an Autodesk education account. Set up access through the Autodesk Education Community and test one student login before class.",
    ],
    equipment: ["Student devices with a supported browser", "Autodesk education accounts (13+ only)"],
    misconceptions: [
      { id: "newest-is-best", text: "The newest or most famous tool is always the right choice.", response: "List the real constraints: devices, ages, accounts, cost. Then decide." },
      { id: "needs-big-computer", text: "Professional CAD needs a powerful computer.", response: "Both Onshape and Fusion's browser version run on Chromebooks; the heavy work happens online." },
    ],
    discussionQuestions: ["Which names made more sense to you, Onshape's or Fusion's?", "Why might a company pick one tool over another?"],
    troubleshooting: [
      "Can't sign in to Fusion: the student may not have an education subscription yet, or may be under 13.",
      "Sketch won't extrude: the profile isn't closed; look for a gap in the rectangle.",
    ],
    answerGuidance: ["Screenshot shows a 60 × 25 × 4 mm tag with a through hole and a Timeline with two sketches and two extrudes."],
    alternatives: { noPrinter: "This lesson is digital only." },
  },
};
