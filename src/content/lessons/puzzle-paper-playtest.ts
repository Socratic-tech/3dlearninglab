import type { LessonInput } from "../schema";

/** Puzzle Cube, day 5 of 18: build the planned puzzle by hand, swap with a partner, fix the plan before CAD. */
export const lesson: LessonInput = {
  id: "puzzle-paper-playtest",
  number: 404,
  title: "Puzzle Cube 5: Build It by Hand",
  subtitle: "A hand-made prototype finds problems while they're cheap to fix.",
  domain: "F",
  kind: "lesson",
  summary: "Students build their planned puzzle from math cubes, swap with a partner for a quick timed try, and make one change to their layer map before any CAD. Optional in a 3-week run.",
  estimatedMinutes: 55,
  printLevel: "digital",
  competencyIds: ["F5", "F6", "F8"],
  prerequisites: ["puzzle-think-in-cubes"],
  vocabulary: [
    { term: "Prototype", definition: "A quick early version built to answer a question, like 'does this fit?' or 'is this too easy?'" },
    { term: "Iteration", definition: "Changing your design because of a test, then testing again." },
  ],
  sections: [
    {
      phase: "discover",
      title: "Test it before you build it for real",
      blocks: [
        {
          id: "hook",
          type: "hero",
          title: "Fix it now, for free.",
          hook: "Changing a piece today takes 30 seconds: unsnap a cube, snap it somewhere else. Changing it after printing takes hours. Today you build your puzzle by hand and let someone else try it.",
          visual: { diagram: "design-cycle", alt: "The design cycle, looping from test back to revise." },
        },
        {
          id: "when",
          type: "prediction",
          prompt: "You find out a piece is too easy to place. When is the cheapest time to change it?",
          options: [
            { id: "now", text: "Now, while it's snapped math cubes" },
            { id: "cad", text: "Next week, in Tinkercad", misconceptionId: "fix-later" },
            { id: "print", text: "After printing, when you can really hold it", misconceptionId: "fix-later" },
          ],
          expectedOptionId: "now",
          reveal: "Every step makes changes more expensive: math cubes take seconds, CAD takes minutes, a reprint takes hours and plastic. Test early.",
        },
      ],
    },
    {
      phase: "practice",
      title: "Run a quick swap test",
      blocks: [
        {
          id: "notes-mc",
          type: "multipleChoice",
          prompt: "Which note will help you most when you change your plan?",
          hint: "Which one tells you what to change?",
          options: [
            { id: "data", text: "Solved in 40 seconds; pieces B and E went in first try" },
            { id: "vibe", text: "Partner said it was okay", misconceptionId: "opinion-is-data" },
          ],
          correctOptionIds: ["data"],
          explanation: "A time and the pieces that were easy (or stuck) point to what to change. 'Okay' doesn't.",
          competencyId: "F6",
          check: "practice",
        },
      ],
    },
    {
      phase: "apply",
      title: "Swap and change",
      blocks: [
        {
          id: "swap",
          type: "teacherLed",
          title: "Swap test",
          minutes: 20,
          students: "1. Build each piece from math cubes, snapped firmly together.\n2. Take your cube apart and hand the pieces to a partner.\n3. Start a timer. **Don't help.** Stop at 5 minutes.\n4. Write down: time, where they got stuck, and anything that broke or was too easy.\n5. Swap roles.",
          teacher: "Pairing and timing are your call; across-table pairs who haven't seen each other's plans work best. The hardest part for students is staying quiet while someone struggles with their puzzle. Name that out loud before you start, and model what 'not helping' looks like.",
        },
        { id: "journal-test", type: "journal", projectKey: "puzzle-cube", promptIds: ["prototype", "test"] },
        {
          id: "share",
          type: "teacherLed",
          title: "One change",
          minutes: 8,
          students: "Share with the class: what did your tester do that surprised you, and what one change will you make to your plan?",
          teacher: "Collect a few changes on the board and sort them: too easy, too hard, pieces that broke. It sets up week 4's playtests and shows that changing a plan after a test is normal, not failure.",
        },
      ],
    },
    {
      phase: "prove",
      title: "Prove it: plan version 2",
      blocks: [
        {
          id: "prove",
          type: "challenge",
          kind: "prove",
          where: "offline",
          title: "Plan Version 2",
          prompt: "Make one change to your layer map because of the swap test, and explain it.",
          requirements: [
            "Photo of your hand-built puzzle",
            "Partner's time and stuck spot",
            "One change to the layer map (or a clear reason why no change is needed)",
            "The new plan still adds to 27 and follows the piece rules",
          ],
          skills: ["F5", "F6", "F8"],
        },
        {
          id: "submit",
          type: "uploadEvidence",
          prompt: "Upload a photo of your hand-built puzzle and your updated layer map, with a sentence about the change.",
          accepts: ["physical_test", "screenshot", "written"],
          competencyIds: ["F5", "F6", "F8"],
          checklist: ["Photo of the prototype", "Test notes", "Updated layer map", "Reason for the change"],
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
          prompt: "What did your partner do with your puzzle that you didn't expect?",
          sentenceStarters: ["I expected … but my partner …", "So I changed …"],
          competencyIds: ["F6", "F8"],
        },
      ],
    },
  ],
  teacher: {
    purpose: "A low-cost prototype and first user test before any CAD. Students experience iteration when changes are cheap. Optional in a 3-week run: if skipped, have students build their plan from cubes for 10 minutes at the end of day 4. The day rehearses, in miniature, the full test-and-revise loop of week 4 (days 16 and 17): watch a real user, record data rather than opinions, and make one change because of the evidence. It also catches plans that can't be built at all before anyone spends time in CAD.",
    bigIdea: "Testing a cheap prototype with a real person, and writing down what they actually did, shows me what to change while a change still costs seconds.",
    successCriteria: [
      "I can build my planned puzzle from math cubes and check it against my layer map.",
      "I can run a fair test: time my partner and stay quiet while they solve.",
      "I can record test results as data (a time and where they got stuck), not just an opinion.",
      "I can make one change to my plan because of the test and explain why.",
    ],
    background: [
      { title: "What a prototype is for", body: "A **prototype** is an early version built to answer a question. Designers talk about *low-fidelity* prototypes (quick, rough, cheap: paper, cardboard, math cubes) and *high-fidelity* ones (close to the real product). Today's math-cube puzzle answers two questions: does the plan actually fit together, and is it about the right difficulty for the student's target solver? The further a design travels (sketch, math cubes, CAD, print), the more each change costs in time and material, so the cheapest moment to find a problem is now." },
      { title: "Running a fair user test", body: "Professional user researchers watch people use a product without helping, because help hides exactly the problems they're looking for. Ask testers to work alone, start a timer and stop at 5 minutes (record 'not solved in 5:00' as a result, not a failure). The designer's job is to watch and write: what the tester tried first, where they got stuck, and anything that was too easy or broke. Staying silent while someone struggles with your design is genuinely hard; naming that and modelling it before the swap helps a lot." },
      { title: "Data versus opinion", body: "A time is **quantitative** data: it can be compared after a change. 'Stuck on where C goes for 2 minutes' is a **qualitative** observation that points to what to change. 'It was okay' is an opinion and can't be compared with anything. Also keep the sample size honest: one tester is one data point. Different people solve at very different speeds, so treat today's result as a clue, not a verdict. Week 4's playtests will collect more tests and look for patterns." },
      { title: "Levers that change difficulty", body: "When a puzzle is too easy, common fixes are bending a flat piece into 3D, making two pieces look more alike (a mirror pair is the strongest version), or breaking up long straight runs that slot obviously along an edge. When it's too hard for the target solver, merge two small pieces, make a piece flatter or give one piece a distinctive shape that's easy to place. The easiest safe change is moving one cube between two neighbouring pieces: the total stays 27, and students only need to recheck the piece rules for those two pieces." },
      { title: "Math cubes are not the final product", body: "Math cubes have small connectors and a little play between them, so a prototype feels looser than the printed puzzle will. Printed pieces are smooth, solid and fit with almost no gap, so they can feel stiffer and the puzzle may behave slightly differently. That's fine: the prototype is testing the *shapes* and the *difficulty*, not the feel. The feel gets tested on day 14 with the first print." },
      { title: "Iteration is normal", body: "Students sometimes read a partner's quick solve as 'my puzzle failed'. Frame it the way designers do: the test worked, because it produced information. Sorting the class's changes on the board (too easy, too hard, broke) shows that almost everyone changed something. That normalises iteration before week 4, where a data-driven revision is a required step of the project." },
    ],
    studentQuestions: [
      { q: "My partner solved it in 20 seconds. Did I fail?", a: "No. You found out something important while it's cheap to fix. Look at which pieces went in first and make one of them harder to place." },
      { q: "Can I give my partner a hint?", a: "Not during the timed try: it would hide the problem you're looking for. Afterwards, ask them what would have helped." },
      { q: "Nobody can solve mine. Is that good?", a: "Maybe too good. Check your target solver and time from yesterday. If a first-timer can't get near it, make one change to help them." },
      { q: "Do I have to change something?", a: "Make one change, or write a clear reason why your test shows no change is needed. Either way, the reason should come from what your tester did." },
    ],
    connections: [
      "User experience (UX) researchers run usability tests where they watch people use an app or product and deliberately don't help.",
      "Board-game and video-game studios playtest early versions with paper, cards or rough levels long before final art is made.",
      "Engineers build cardboard and foam mock-ups to test size and fit before paying for expensive tooling.",
    ],
    exitTicket: [
      "Write your partner's time and where they got stuck. What does that tell you about your puzzle?",
      "What one change will you make, and what do you predict it will do to the solve time?",
      "Why is it cheaper to change your design today than next week?",
    ],
    runPlan: [
      { minutes: 5, title: "Hook", teacher: "Fix it now, for free: why test before CAD.", students: "Listen.", devices: "away" },
      { minutes: 10, title: "Build it", teacher: "Students build their planned puzzle from math cubes; check against the layer map.", students: "Build all pieces.", devices: "away" },
      { minutes: 20, title: "Swap test", teacher: "Organise pairs; remind: don't help; circulate and listen.", students: "Swap both ways, time, take notes.", devices: "away" },
      { minutes: 8, title: "One change", teacher: "Share surprises and planned changes; sort them on the board.", students: "Share; choose one change.", devices: "away" },
      { minutes: 12, title: "Plan version 2", teacher: "Devices open: update the layer map, upload photo and notes.", students: "Update the plan, upload, reflect.", devices: "open" },
    ],
    lookFors: ["Testers left to struggle without hints.", "Notes with a time and a stuck spot, not just 'it was fine'.", "Changes that respond to what the tester did."],
    differentiation: { support: ["Test with a partner who has the layer map to check against, instead of a blind solve.", "Give a notes template: time / stuck spot / one change.", "Offer a short menu of safe changes (move one cube between two pieces, bend a flat piece up) so students can choose rather than invent from scratch."], extend: ["Run a second swap with a new tester after the change.", "Make a 'hint card' that helps without giving the answer away."] },
    preparation: ["Math cubes for every student or pair (about 30). Several colours help tell pieces apart.", "Pair students with someone who hasn't seen their plan.", "Timers (phones, a class timer)."],
    equipment: ["Math cubes", "Timers"],
    misconceptions: [
      { id: "fix-later", text: "It's fine to fix problems after printing.", response: "Compare: 30 seconds with math cubes vs. a 3-hour reprint. Test now." },
      { id: "opinion-is-data", text: "A tester's opinion is the test result.", response: "Ask: could you compare this note after a change? Times and stuck spots can be compared." },
      { id: "one-test-proves", text: "One quick test proves the puzzle is good (or bad).", response: "One tester is one data point: people solve at very different speeds. Use it as a clue for one change, then test again with someone new." },
      { id: "fast-solve-is-failure", text: "If my partner solved it fast, my design failed.", response: "The test succeeded: it found something to improve while changes are cheap. Ask which pieces went in first, and change one of them." },
    ],
    discussionQuestions: [
      "What did watching someone else teach you about your own puzzle?",
      "Why is it so hard not to help someone who is stuck on your design?",
      "What is one note from today that you could compare after you change your puzzle?",
    ],
    troubleshooting: [
      "Pieces come apart when they're handed over: snap them firmly, and photograph each piece so it can be rebuilt.",
      "If the puzzle was solved in seconds, suggest bending a flat piece into 3D.",
    ],
    answerGuidance: ["Proficient: a test with a recorded time, one change linked to the test, and an updated plan that still follows the rules."],
    alternatives: { noPrinter: "No printer needed.", touchDevice: "Photograph the prototype and updated map with the tablet." },
  },
};
