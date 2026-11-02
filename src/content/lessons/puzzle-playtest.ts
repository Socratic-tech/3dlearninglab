import type { LessonInput } from "../schema";

/** Puzzle Cube, day 16 of 18: run real playtests and collect data you can compare. */
export const lesson: LessonInput = {
  id: "puzzle-playtest",
  number: 415,
  title: "Puzzle Cube 16: Playtest",
  subtitle: "Hand it to someone else. Watch. Write it down.",
  domain: "F",
  kind: "lesson",
  summary: "Students run timed playtests of their printed puzzle with two classmates who haven't seen it, use a hint ladder, and record comparable data (time, hints, where solvers got stuck) against the target in their brief.",
  estimatedMinutes: 55,
  printLevel: "digital",
  competencyIds: ["F6", "F7"],
  prerequisites: ["puzzle-fit-box"],
  vocabulary: [
    { term: "Playtest", definition: "Watching a real person use your design to find out what works and what doesn't." },
    { term: "Hint ladder", definition: "Hints that start small and get more helpful only if the solver asks again." },
    { term: "Data", definition: "Facts you can compare later: times, counts, what happened." },
  ],
  sections: [
    {
      phase: "discover",
      title: "How to run a playtest",
      blocks: [
        {
          id: "hook",
          type: "hero",
          title: "You can't playtest your own puzzle.",
          hook: "You already know the answer, so it will always look easy to you. The only way to know how hard it is: hand it to someone else and stay quiet.",
          visual: { diagram: "design-cycle", alt: "The design cycle, looping from test back to revise." },
        },
        {
          id: "protocol",
          type: "text",
          title: "The playtest plan",
          body: "1. Take the cube apart and hand all the pieces to your tester. No peeking at your layer map.\n2. Start a timer. **Don't explain or help.** Watch where they get stuck.\n3. Hint ladder, only if they ask: first 'Start with the biggest piece', then 'This piece goes in a corner', then show one piece's spot.\n4. Stop at 10 minutes. Write down: **time, number of hints, where they got stuck, what they said.**",
        },
        {
          id: "dignity",
          type: "callout",
          tone: "idea",
          title: "The puzzle is being tested, not the person",
          body: "Thank your tester whatever happens. If they're stuck, that's data about your puzzle. Use a role in your notes ('Tester 1'), not a full name.",
        },
      ],
    },
    {
      phase: "practice",
      title: "Collect useful data",
      blocks: [
        {
          id: "data-mc",
          type: "multipleChoice",
          prompt: "Which playtest notes will help you most when you revise?",
          hint: "Which notes could you compare between version 1 and version 2?",
          options: [
            { id: "data", text: "Solved in 6 min 20 s, 2 hints, stuck on where piece E goes" },
            { id: "vibe", text: "They said it was cool", misconceptionId: "opinion-is-data" },
            { id: "none", text: "They finished it", misconceptionId: "opinion-is-data" },
          ],
          correctOptionIds: ["data"],
          explanation: "Time, hints and the stuck spot are facts you can compare after a change. 'Cool' is nice to hear, but it doesn't say what to change.",
          competencyId: "F6",
          check: "skill",
        },
        {
          id: "target-mc",
          type: "multipleChoice",
          prompt: "Your brief said 'a first-timer needs 1 to 5 minutes'. Tester 1 took 40 seconds, Tester 2 took 1 minute 10 seconds. What does the data say?",
          hint: "Compare each time with the target.",
          options: [
            { id: "easy", text: "It's on the easy side: one tester was under the target, one just inside it" },
            { id: "perfect", text: "It's perfect: both finished", misconceptionId: "opinion-is-data" },
            { id: "hard", text: "It's too hard" },
          ],
          correctOptionIds: ["easy"],
          explanation: "Comparing with the target turns times into a decision. Tomorrow you'll decide what to change.",
          competencyId: "F6",
          check: "practice",
        },
      ],
    },
    {
      phase: "apply",
      title: "Run two playtests",
      blocks: [
        {
          id: "micro",
          type: "challenge",
          kind: "micro",
          where: "offline",
          title: "Two testers",
          prompt: "Run the playtest plan with two classmates who haven't seen your puzzle. Be a tester for others too.",
          requirements: ["Two testers who haven't seen it", "Same timer and hint ladder both times", "Time, hints and stuck spot recorded for each"],
          skills: ["F6", "F7"],
        },
        { id: "journal-test", type: "journal", projectKey: "puzzle-cube", promptIds: ["test", "failed"] },
      ],
    },
    {
      phase: "prove",
      title: "Prove it: playtest record",
      blocks: [
        {
          id: "prove",
          type: "challenge",
          kind: "prove",
          where: "offline",
          title: "Playtest Record",
          prompt: "Record two playtests and compare them with the target in your brief.",
          requirements: [
            "Two playtests with time, hints and stuck spot",
            "One quote or observation from each tester",
            "A sentence comparing the results with your target",
          ],
          skills: ["F6", "F7"],
        },
        {
          id: "submit",
          type: "uploadEvidence",
          prompt: "Upload your playtest notes (typed, a photo, or a recording).",
          accepts: ["written", "screenshot", "physical_test"],
          competencyIds: ["F6", "F7"],
          checklist: ["Two testers", "Times and hints", "Stuck spots", "Compared with the target"],
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
          prompt: "What was the hardest part of staying quiet while someone tried your puzzle? What did you learn by watching?",
          sentenceStarters: ["It was hard not to … because …", "Watching showed me …"],
          competencyIds: ["F7"],
        },
      ],
    },
  ],
  teacher: {
    purpose: "A real user test with comparable data. Students practise the hardest research skill, watching without helping, and compare results with the measurable target from day 1.",
    preparation: [
      "Pair students across tables so testers haven't seen the puzzle; rotate so everyone tests and is tested twice.",
      "Post the playtest plan and hint ladder; have timers ready.",
      "Optional: invite another class or younger students as guest testers.",
    ],
    equipment: ["Printed, assembled puzzles", "Timers", "Paper or devices for notes"],
    misconceptions: [
      { id: "opinion-is-data", text: "Testers' opinions are the test result.", response: "Ask: could you compare this note between version 1 and version 2? Times, hints and stuck spots can be compared." },
    ],
    discussionQuestions: ["Why is staying silent the hardest part of running a playtest?", "What makes a puzzle hard but still fun?"],
    troubleshooting: [
      "Puzzle not printed yet: playtest the real-cube version from day 5 and note it.",
      "A tester gets upset when stuck: stop, thank them, and note the stuck spot: it's useful data.",
    ],
    answerGuidance: ["Proficient: two playtests with times, hints and stuck spots, compared with the brief's target."],
    alternatives: { noPrinter: "Playtest the hand-built real-cube puzzle.", touchDevice: "Record notes as audio on the tablet." },
  },
};
