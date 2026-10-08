import type { LessonInput } from "../schema";

export const lesson: LessonInput = {
  id: "jr-meet-tinkercad",
  number: 102,
  title: "Meet Tinkercad",
  subtitle: "Your design space",
  domain: "A",
  kind: "lesson",
  summary: "Join your class in Tinkercad, look around your workplane and put your first shapes on it.",
  estimatedMinutes: 30,
  printLevel: "digital",
  competencyIds: ["A1", "A2", "A4", "A5"],
  prerequisites: ["jr-layers"],
  vocabulary: [
    { term: "Tinkercad", definition: "A free website where you design 3D objects with shapes." },
    { term: "Workplane", definition: "The blue grid where you build. It is like a table for your shapes." },
    { term: "Orbit", definition: "Turn your view to look at your design from another side." },
    { term: "Zoom", definition: "Move closer to see details, or farther away to see everything." },
  ],
  sections: [
    {
      phase: "discover",
      title: "Your design space",
      blocks: [
        {
          id: "hook",
          type: "hero",
          title: "Welcome to Tinkercad",
          hook: "Tinkercad is where you will design things to print. Today you learn to look around and add shapes.",
          visual: { diagram: "view-controls", alt: "The Tinkercad view buttons: home, zoom in and zoom out." },
        },
        {
          id: "join",
          type: "tinkercadLaunch",
          title: "Join your class",
          steps: [
            "Open Tinkercad from the button your teacher gives you.",
            "Type the class code your teacher gives you.",
            "Type your nickname.",
            "Click Create, then 3D Design.",
          ],
        },
        {
          id: "how",
          type: "showMe",
          title: "Look around",
          steps: [
            { text: "Drag a shape from the right side onto the blue workplane.", diagram: "selection" },
            { text: "To orbit, hold the right mouse button and drag. On a trackpad, use the view cube in the corner." },
            { text: "To zoom, use the mouse wheel, or the + and − buttons on the left.", diagram: "view-controls" },
            { text: "Click the house button to get back to the start view." },
          ],
        },
      ],
    },
    {
      phase: "practice",
      title: "Try it",
      blocks: [
        {
          id: "match",
          type: "matching",
          prompt: "Match each job to the tool.",
          hint: "Orbit turns the view. Zoom moves you closer.",
          pairs: [
            { id: "p1", left: "See the back of a shape", right: "Orbit" },
            { id: "p2", left: "See a tiny detail", right: "Zoom in" },
            { id: "p3", left: "Get back to the start view", right: "Home button" },
            { id: "p4", left: "Remove a shape", right: "Delete key" },
          ],
          explanation: "Orbit to turn, zoom to get closer, home to reset, Delete to remove.",
          competencyId: "A1",
          check: "practice",
        },
        {
          id: "undo",
          type: "multipleChoice",
          prompt: "Oops! You deleted the wrong shape. What do you do?",
          hint: "There is a button that takes back your last step.",
          options: [
            { id: "a", text: "Click Undo (or press Ctrl + Z)." },
            { id: "b", text: "Start a whole new design.", misconceptionId: "start-over" },
            { id: "c", text: "It is gone forever.", misconceptionId: "gone-forever" },
          ],
          correctOptionIds: ["a"],
          explanation: "Undo takes back your last step. You can press it more than once.",
          competencyId: "A5",
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
          title: "Shape parade",
          prompt: "Put 5 different shapes on your workplane in a line. Then orbit to look at them from the back.",
          requirements: ["5 different shapes", "In a line", "Look from the back"],
          skills: ["A1", "A2"],
        },
        {
          id: "submit",
          type: "uploadEvidence",
          prompt: "Take a screenshot of your shape parade from the back.",
          accepts: ["screenshot", "design_url"],
          competencyIds: ["A1", "A2"],
          checklist: ["I have 5 shapes", "I orbited to the back"],
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
          prompt: "What was easy today? What was tricky?",
          sentenceStarters: ["Easy: …", "Tricky: …"],
          competencyIds: ["A1"],
        },
      ],
    },
  ],
  teacher: {
    purpose: "Students get comfortable joining the class and controlling the view, so later lessons can focus on building.",
    preparation: [
      "Create a Tinkercad class before this lesson and write the class code and nicknames where students can see them. Students under 13 join with the class code and a nickname, with no personal account.",
      "Test one Chromebook first. A mouse helps a lot; on a trackpad, show the view cube and the + / − buttons.",
    ],
    equipment: ["Chromebooks (mice if you have them)", "The Tinkercad class code"],
    misconceptions: [
      { id: "start-over", text: "A mistake means starting over.", response: "Model pressing Undo several times. Mistakes are normal in design." },
      { id: "gone-forever", text: "Deleted shapes are gone forever.", response: "Delete something on purpose, then Undo it in front of the class." },
    ],
    discussionQuestions: ["Why would a designer need to look at the back of a design?"],
    troubleshooting: ["If a student gets lost in the view, click the house (home) button.", "If the class code fails, check that the class is active in Tinkercad."],
    answerGuidance: ["Shape parade: 5 different shapes on the workplane, screenshot taken from a turned view."],
  },
};
