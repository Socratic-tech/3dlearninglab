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
    purpose: "Students learn negative geometry: hole shapes subtract only when grouped. This is the first time students design empty space on purpose, and it unlocks windows, doors, cups and the tassel hole on the boss-battle bookmark. It builds directly on grouping from the last lesson: a solid group adds, and a hole in the group takes away.",
    bigIdea: "A solid shape adds plastic and a hole shape takes it away, but a hole only cuts when I group it with a solid.",
    successCriteria: [
      "I can switch a shape from Solid to Hole.",
      "I can group a hole with a solid to cut a gap.",
      "I can make a hole that goes all the way through.",
      "I can say whether a part of an object should be solid or a hole.",
    ],
    background: [
      { title: "Solid and Hole", body: "Every Tinkercad shape has a **Solid / Hole** switch in the shape panel that appears when it is selected. A hole looks see-through and grey-striped. On its own a hole does nothing; it's a placeholder that marks where material should be removed. Tinkercad's Basic Shapes also includes ready-made hole versions of common shapes, but any shape (a star, a heart, a letter) can be switched to Hole, which lets students cut fun windows." },
      { title: "Why grouping makes the cut", body: "The hole only cuts when it is **grouped** with a solid. When grouped, Tinkercad removes the solid's material wherever the hole overlaps it. Engineers call this a **subtraction** or **difference**, the opposite of the union from last lesson. If students ungroup (Ctrl + Shift + G), the solid comes back whole and the hole shape reappears, so nothing is lost. This is a good way to fix mistakes: ungroup, adjust the hole, and group again." },
      { title: "All the way through", body: "A hole only removes material where it overlaps. If the hole shape is shorter than the part, or starts above the bottom, it leaves a dent or a thin skin instead of a gap. For a **through hole** (a window, a tassel hole), the hole shape should reach past *both* faces of the part. Making the hole a little taller (or deeper) than the part, and making sure it starts at or below the part's bottom, is a reliable habit. Students check by orbiting underneath or to the side after grouping: they should be able to see straight through." },
      { title: "Lining a hole up", body: "Holes have to sit in the right place before grouping. For a window, the hole goes into the wall; for a door, it also has to reach the bottom of the house so the door opens at ground level. Students position holes with the arrow keys and typed sizes from the Move, Stretch, Lift lesson. A hole that only overlaps a corner of the solid will only cut that corner. Orbiting around the ungrouped design is the quickest way to check placement." },
      { title: "Why this matters for printing", body: "Holes are how printed objects get openings: a keyring loop, a bookmark's tassel hole, the hollow inside a pencil cup. Holes also save plastic and print time. In the next lesson (Design Rules), students learn that a hole needs a band of plastic around it so the edge doesn't tear, which becomes one of the five bookmark rules." },
    ],
    studentQuestions: [
      { q: "Why is my hole striped and see-through?", a: "That's how Tinkercad shows a hole. It hasn't cut anything yet. Select it and the solid together, then Group." },
      { q: "I grouped and everything went grey and striped!", a: "Everything in the group was set to Hole. Ungroup, click your main shape, and switch it back to Solid." },
      { q: "Can I make a star-shaped window?", a: "Yes! Any shape can be a hole. Drag a star in, switch it to Hole, put it in the wall and group." },
      { q: "Can I get my hole back after grouping?", a: "Yes. Ungroup, and the hole shape comes back so you can move or resize it." },
    ],
    connections: [
      "Button makers put holes in buttons for the thread, and keychain designers add a hole for the ring.",
      "Architects plan windows and doors as gaps in a wall before anything is built.",
      "Machinists use drills and cutters to remove metal from a solid block: the real-world version of a hole shape.",
    ],
    exitTicket: [
      "Draw something that has a hole in it. Label the solid part and the hole.",
      "Your hole didn't cut anything. What is one thing you would check?",
    ],
    runPlan: [
      { minutes: 4, title: "Hook", teacher: "Hold up an object with holes (a button, keychain or cup). Read the hero aloud. Ask: 'How would you make a window in a house?'", students: "Point out holes in objects around them and say what each hole is for.", devices: "away" },
      { minutes: 5, title: "Show me", teacher: "Model switching to Hole, placing it and grouping. Then ungroup to show nothing is lost. Pose the prediction before you group.", students: "Watch, then vote on the prediction.", devices: "away" },
      { minutes: 6, title: "Try it", teacher: "Circulate as students sort solid and hole and answer the through-hole question. Ask 'How can you check it goes all the way through?'", students: "Try one hole in a box, then complete the matching and multiple-choice questions.", devices: "open" },
      { minutes: 12, title: "Door and window", teacher: "Encourage students to orbit and look through their windows. Ask 'What happens if you ungroup and move it?'", students: "Build a box house with a door and two windows, group it, and take a screenshot.", devices: "open" },
      { minutes: 3, title: "Reflect", teacher: "Share a few ideas for useful holes. Collect exit tickets.", students: "Reflection and exit ticket.", devices: "open" },
    ],
    lookFors: [
      "Students switching shapes to Hole and selecting both hole and solid before grouping.",
      "Holes that reach past both faces, checked by orbiting.",
      "Students ungrouping to adjust a hole instead of starting again.",
      "Students explaining whether a part should add or take away plastic.",
    ],
    differentiation: {
      support: [
        "Start with one big window in a thin wall so the cut is easy to see.",
        "Give a three-step card: 1. Hole button, 2. select both, 3. Group.",
        "Let students check each other's houses by orbiting and saying 'I can see through it'.",
      ],
      extend: [
        "Cut a star- or heart-shaped window using a shape from the library.",
        "Hollow out the house so it has an inside and a floor, using a hole box lifted off the workplane.",
        "Add a chimney (solid) and a round window (hole) to the roof.",
      ],
    },
    preparation: [
      "Optional: show a real object with holes (a button, a keychain, a pencil cup).",
      "Build a quick example house before class so you can ungroup and regroup it live.",
    ],
    equipment: ["Chromebooks", "Projector for live modelling", "Optional: objects with holes"],
    misconceptions: [
      { id: "no-group-needed", text: "Holes cut without grouping.", response: "Show the design before and after grouping." },
      { id: "short-hole", text: "A hole can be shorter than the part.", response: "Orbit underneath a design where the hole doesn't go through." },
      { id: "hole-adds", text: "A hole shape adds a see-through piece of plastic.", response: "Group a hole with a solid and orbit around it: there is less plastic, not more." },
    ],
    discussionQuestions: [
      "How could you cut a star-shaped window?",
      "Why might a designer cut a hole instead of building walls around a gap?",
    ],
    troubleshooting: [
      "If a hole didn't cut, check that both the solid and the hole were selected when grouping.",
      "If grouping turns everything grey and striped, the main shape was set to Hole by mistake. Ungroup and switch it back to Solid.",
      "If a thin skin covers the window, make the hole deeper so it passes right through the wall.",
      "If the door doesn't reach the ground, move the hole down so it starts at or below the bottom of the house.",
    ],
    answerGuidance: ["House: a door and two windows that go all the way through after grouping."],
  },
};
