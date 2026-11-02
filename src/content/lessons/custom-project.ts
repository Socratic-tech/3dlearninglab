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
    purpose: "The final mission of your custom project path. Your brief and requirements appear here for your students, and reviewing their work credits the skills of the lessons you picked. It is where students use the skills from your chosen lessons together, on a problem with more than one good answer, and practise the full design cycle: understand the brief, sketch options, build, test against the requirements, improve and share.",
    bigIdea: "A good design meets every requirement in the brief, and you prove it by checking each one, then testing and improving at least once.",
    successCriteria: [
      "I can explain the brief in my own words: who the design is for and what it must do.",
      "I can sketch more than one idea and choose the one that best meets the requirements.",
      "I can check my design against every requirement and show the evidence.",
      "I can test my design, improve one thing, and explain what I changed and why.",
    ],
    background: [
      { title: "Writing a brief students can act on", body: "A **brief** says who the design is for, what problem it solves and any limits (size, time, materials). Strong briefs name a real user, even if it is a classmate, a younger student or a family member, because designing for someone builds purpose and belonging. Keep the brief short enough to read aloud in under a minute, and avoid telling students *how* to build it. Offering a choice of user or context (for example 'a desk organiser for you or for a teacher') gives more students a way in without lowering the goal." },
      { title: "Requirements that can be checked", body: "Your 3–5 **requirements** are what you will rate against, so make each one checkable with evidence: a number (fits inside 80 × 80 × 60 mm), a feature (has at least one hole that cuts through), or a test (holds a pencil upright). Vague rules like 'looks good' or 'is creative' are hard for students to self-check and hard for you to rate fairly. If you want creativity, write it as something visible, such as 'includes one feature you designed that is not in any lesson'. Requirements that echo the lessons you picked help students know which skills to reach for." },
      { title: "The design cycle in practice", body: "The steps students see (read the brief, sketch two or three ideas, build, test, improve, share) are a simple form of the engineering design process. Sketching more than one idea matters: the first idea is rarely the best, and comparing options against the requirements is real engineering judgement. 'Test' can be digital (check dimensions, orbit for floating parts, try it on a classmate) or physical if you print. The improvement note students submit is the strongest evidence of design thinking, so ask for a specific change and the reason for it." },
      { title: "Printing in an open project", body: "Open projects produce a wide range of sizes and shapes, so printing needs a plan. Common approaches are a size limit in the requirements (it keeps print times manageable), a small **test piece** of the trickiest feature (a fit, a hole, some text) before the full print, and a review step before anything goes to the printer. Check for the usual problems first: floating parts, parts not resting on the workplane, walls or text too thin to print, and big overhangs that would need supports. If you have no printer, the design link and screenshots are enough to assess every requirement digitally." },
      { title: "Reviewing and crediting skills", body: "When you review a submission, your rating sets the level for every skill in the lessons you picked, so rate against your requirements rather than against polish or effort alone. Look at the evidence students chose (screenshot, design link, STL or written note) and accept any format that shows the requirement is met; this respects different ways of communicating. Short, specific feedback tied to a requirement ('the hole needs 2 mm more margin') is more useful than a general comment, and gives students a clear next step if they revise." },
    ],
    studentQuestions: [
      { q: "Can my project be different from everyone else's?", a: "Yes. As long as it meets every requirement in the brief, your idea can be your own." },
      { q: "How many ideas do I need to sketch?", a: "Two or three quick ones. They can be rough. Then pick the one that best meets the requirements." },
      { q: "What counts as testing if we're not printing?", a: "Check every requirement with a number or a screenshot, orbit to look for floating parts, and ask a classmate to try to find a problem." },
      { q: "Can I change my idea halfway through?", a: "Yes. Designers change direction when testing shows a problem. Just make sure the new idea still meets every requirement." },
    ],
    connections: [
      "Industrial and product designers start every job with a client brief and a list of requirements, then sketch several concepts before choosing one.",
      "Engineers use design reviews, where a team checks a design against its requirements before it goes into production.",
      "Makers and small business owners design and 3D print custom products for real customers, working from what the customer needs.",
    ],
    exitTicket: [
      "Which requirement was hardest to meet, and what evidence shows you met it?",
      "What did you test, what did you change, and why?",
      "Which skill from an earlier mission did you use most, and where?",
    ],
    runPlan: [
      { minutes: 10, title: "Day 1 · The brief", teacher: "Read the brief aloud and show the requirements. Ask students to restate who it's for and what it must do. Clarify anything vague now.", students: "Restate the brief in their own words; ask questions about the requirements.", devices: "away" },
      { minutes: 10, title: "Day 1 · Sketch options", teacher: "Ask for two or three quick sketches on paper or screen. Circulate and ask 'Which requirement does this idea meet best?'", students: "Sketch ideas, then pick one and note which requirements it meets.", devices: "away" },
      { minutes: 25, title: "Day 1 · Build", teacher: "Circulate. Point students back to the relevant lesson's Show Me rather than solving for them. Note who needs a check-in tomorrow.", students: "Build in Tinkercad, checking requirements as they go.", devices: "open" },
      { minutes: 5, title: "Day 2 · Reset", teacher: "Put the requirements on screen. Ask each student to name the requirement they'll check first today.", students: "Re-read requirements and plan the session.", devices: "away" },
      { minutes: 25, title: "Day 2 · Test and improve", teacher: "Encourage peer testing: pairs swap screens and check each other against the requirements. Ask for one specific improvement.", students: "Finish the build, test against each requirement, make and record one improvement.", devices: "open" },
      { minutes: 15, title: "Day 2 · Share and reflect", teacher: "Invite a few students to share what they changed and why. Collect submissions and the exit ticket; queue prints if you are printing.", students: "Submit evidence with a test note, write the reflection and exit ticket.", devices: "open" },
    ],
    lookFors: [
      "Students referring to the requirements while they build, not only at the end.",
      "More than one idea considered before building.",
      "A specific, explained improvement in the submission note.",
      "Earlier skills (grouping, holes, align, duplicate and so on) chosen on purpose for a requirement.",
    ],
    differentiation: {
      support: [
        "Provide a requirements checklist with space for the evidence (a number, a screenshot) next to each one.",
        "Offer a partly started design or a simpler version of the brief that keeps the same requirements.",
        "Let students explain their test and improvement by voice recording or a conversation instead of writing.",
      ],
      extend: [
        "Add a requirement of their own and explain why the user would want it.",
        "Design a second version for a different user and compare the two.",
        "Print a test piece of the trickiest feature, then revise the design based on what the print showed.",
      ],
    },
    preparation: [
      "Write a clear brief (who it's for, what it must do) and 3–5 checkable requirements in the path builder.",
      "Decide whether students print a test piece first.",
      "Build a quick version yourself to check that the requirements are achievable with the lessons in your path and fit the time you have.",
      "Decide on a size limit and a print review step if students will print.",
    ],
    equipment: ["Student devices", "Printer time if students print", "Paper for sketching ideas", "Optional: printed requirement checklists"],
    misconceptions: [
      { id: "one-right-answer", text: "There is one correct design the teacher is looking for.", response: "Show two different designs that both meet every requirement. The requirements are the test, not a hidden answer." },
      { id: "done-when-built", text: "The project is finished as soon as the model is built.", response: "Point to the test and improve steps: a design is done when every requirement is checked and one improvement is made." },
      { id: "looks-right", text: "If it looks right, it meets the requirements.", response: "Ask for the number or screenshot that proves each requirement." },
    ],
    discussionQuestions: [
      "Which requirement was hardest to meet, and why?",
      "How did testing change your design?",
      "Who is the design for, and what would they say about it?",
    ],
    troubleshooting: [
      "If the brief still shows placeholder text, the class isn't set to your custom path: check Classes → Course.",
      "If students stall at a blank screen, have them sketch on paper first and name which lesson's skill each part needs.",
      "If a design has floating or unprintable parts, ask the student to orbit and check every part touches or overlaps another before submitting.",
    ],
    answerGuidance: ["Rate the submission against your requirements; the rating sets the level for every skill in your path."],
  },
};
