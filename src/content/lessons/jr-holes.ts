import type { LessonInput } from "../schema";

export const lesson: LessonInput = {
  id: "jr-holes",
  number: 105,
  title: "Holes Cut Space",
  subtitle: "Solid adds. Hole takes away.",
  domain: "B",
  kind: "lesson",
  summary: "Turn a shape into a hole and use it to cut windows, doors and tassel holes.",
  estimatedMinutes: 30,
  printLevel: "digital",
  competencyIds: ["B3"],
  prerequisites: ["jr-shapes"],
  vocabulary: [
    { term: "Solid", definition: "A shape that adds plastic." },
    { term: "Hole", definition: "A see-through shape that cuts away plastic when you group it." },
  ],
  sections: [
    {
      phase: "discover",
      title: "Solid or hole?",
      blocks: [
        {
          id: "hook",
          type: "hero",
          title: "Cut it out",
          hook: "How do you make a window in a house? You don't carve it. You put a hole shape there and group.",
          visual: { diagram: "solid-vs-hole", alt: "A solid box and a striped hole shape; grouped, the hole cuts a gap in the box." },
        },
        {
          id: "how",
          type: "showMe",
          title: "Make a hole",
          steps: [
            { text: "Put a shape where you want the hole, going all the way through." },
            { text: "Click the shape, then click Hole in the shape panel. It turns see-through.", diagram: "solid-vs-hole" },
            { text: "Select the hole and the solid together, then Group. The hole cuts away.", diagram: "group-hole" },
          ],
        },
        {
          id: "predict",
          type: "prediction",
          prompt: "You made a hole shape but did not group it. You print. What happens?",
          options: [
            { id: "a", text: "Nothing gets cut. The hole only works after grouping." },
            { id: "b", text: "The hole cuts anyway.", misconceptionId: "no-group-needed" },
          ],
          expectedOptionId: "a",
          reveal: "A hole only cuts when you group it with the solid.",
        },
      ],
    },
    {
      phase: "practice",
      title: "Try it",
      blocks: [
        {
          id: "solid-hole",
          type: "matching",
          prompt: "Solid or hole?",
          hint: "Does it add plastic, or take it away?",
          pairs: [
            { id: "p1", left: "A window in a wall", right: "Hole" },
            { id: "p2", left: "A roof on a house", right: "Solid" },
            { id: "p3", left: "A spot for a tassel", right: "Hole" },
            { id: "p4", left: "A handle on a cup", right: "Solid" },
          ],
          explanation: "Holes take away. Solids add.",
          competencyId: "B3",
          check: "practice",
        },
        {
          id: "through",
          type: "multipleChoice",
          prompt: "Your tag is 3 mm thick. How tall should the hole shape be so it cuts all the way through?",
          hint: "It has to go through the whole tag, top to bottom.",
          options: [
            { id: "a", text: "Taller than 3 mm, like 5 mm" },
            { id: "b", text: "1 mm", misconceptionId: "short-hole" },
          ],
          correctOptionIds: ["a"],
          explanation: "Make the hole taller than the tag so it goes all the way through.",
          competencyId: "B3",
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
          title: "Door and window",
          prompt: "Make a box house. Use holes to cut a door and two windows. Group it.",
          requirements: ["A door hole", "Two window holes", "Grouped so the holes cut"],
          skills: ["B3"],
        },
        {
          id: "submit",
          type: "uploadEvidence",
          prompt: "Take a screenshot of your house after grouping.",
          accepts: ["screenshot", "design_url"],
          competencyIds: ["B3"],
          checklist: ["I can see through the door and windows"],
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
          prompt: "Where could a hole be useful on something you use every day?",
          sentenceStarters: ["A hole would help on my … because…"],
          competencyIds: ["B3"],
        },
      ],
    },
  ],
  teacher: {
    purpose: "Students learn negative geometry: hole shapes subtract only when grouped.",
    preparation: ["Optional: show a real object with holes (a button, a keychain, a pencil cup)."],
    equipment: ["Chromebooks"],
    misconceptions: [
      { id: "no-group-needed", text: "Holes cut without grouping.", response: "Show the design before and after grouping." },
      { id: "short-hole", text: "A hole can be shorter than the part.", response: "Orbit underneath a design where the hole doesn't go through." },
    ],
    discussionQuestions: ["How could you cut a star-shaped window?"],
    troubleshooting: ["If a hole didn't cut, check that both the solid and the hole were selected when grouping."],
    answerGuidance: ["House: a door and two windows that go all the way through after grouping."],
  },
};
