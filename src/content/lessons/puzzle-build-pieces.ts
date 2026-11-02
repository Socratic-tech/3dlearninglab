import type { LessonInput } from "../schema";

/** Puzzle Cube, day 9 of 18: group each colour into one solid piece and pull the puzzle apart. */
export const lesson: LessonInput = {
  id: "puzzle-build-pieces",
  number: 408,
  title: "Puzzle Cube 9: Group Into Pieces",
  subtitle: "Turn colours into solid pieces, then take the cube apart.",
  domain: "B",
  kind: "lesson",
  summary: "Students group each colour into one solid piece, check every piece is a single part, save a backup, and pull the puzzle apart into an exploded view.",
  estimatedMinutes: 55,
  printLevel: "digital",
  competencyIds: ["B2", "B1"],
  prerequisites: ["puzzle-whole-cube"],
  vocabulary: [
    { term: "Group", definition: "Ctrl + G joins selected shapes into one object." },
    { term: "Exploded view", definition: "The pieces of an object pulled apart so you can see each one." },
  ],
  sections: [
    {
      phase: "discover",
      title: "From colours to pieces",
      blocks: [
        {
          id: "hook",
          type: "hero",
          title: "Take it apart.",
          hook: "Right now your puzzle is 27 loose cubes. Group each colour and they become real pieces. Then pull them apart and see your puzzle for the first time.",
          visual: { modelId: "puzzle-cube-exploded", alt: "A sample puzzle cube pulled apart into its pieces." },
        },
        {
          id: "demo",
          type: "teacherLed",
          title: "Back up first",
          minutes: 5,
          students: "Watch your teacher back up a design, then group one colour into a piece and pull it out of the cube.",
          teacher: "Model the backup before anything else: it's what lets students change pieces on day 17. Then group one colour and drag it out so the class sees a piece appear.",
          devices: "open",
        },
        {
          id: "steps",
          type: "showMe",
          title: "Group one piece",
          steps: [
            { text: "Save a backup first: Tinkercad's Duplicate and Edit (or copy the whole design) keeps your ungrouped cube safe.", diagram: "selection" },
            { text: "Hold Shift and click every cube of one colour. Hide others if they're in the way.", diagram: "selection", keys: "Shift + click" },
            { text: "Press Ctrl + G. The cubes become one piece. If it turns one colour, set the piece colour again.", diagram: "group-hole", keys: "Ctrl + G" },
            { text: "Repeat for every colour, then drag the pieces apart so each sits on the workplane with space around it.", diagram: "selection" },
          ],
        },
      ],
    },
    {
      phase: "practice",
      title: "Check your pieces",
      blocks: [
        {
          id: "order",
          type: "ordering",
          prompt: "Put today's steps in order.",
          hint: "Backup first. Pull apart last.",
          items: [
            { id: "backup", text: "Save a backup of the ungrouped cube" },
            { id: "select", text: "Select all the cubes of one colour" },
            { id: "group", text: "Group them (Ctrl + G)" },
            { id: "repeat", text: "Repeat for every colour" },
            { id: "count", text: "Count: 5 or 6 groups" },
            { id: "explode", text: "Pull the pieces apart" },
          ],
          explanation: "Backing up first means a grouping mistake never costs you your work.",
          competencyId: "B2",
          check: "practice",
        },
        {
          id: "stray-mc",
          type: "multipleChoice",
          prompt: "You pull piece C away from the cube, but one blue cube stays behind. What happened?",
          hint: "Was every blue cube selected when you grouped?",
          options: [
            { id: "missed", text: "That cube wasn't selected when you grouped, so it's not part of the piece" },
            { id: "normal", text: "Grouped pieces always leave one cube behind", misconceptionId: "group-magic" },
          ],
          correctOptionIds: ["missed"],
          explanation: "Group only joins what's selected. Select the piece and the stray cube together and group again.",
          competencyId: "B2",
          check: "skill",
        },
      ],
    },
    {
      phase: "apply",
      title: "Group and explode",
      blocks: [
        {
          id: "tinkercad",
          type: "tinkercadLaunch",
          title: "Make your pieces",
          steps: [
            "Copy your design as a backup ('puzzle cube - cubes').",
            "Group each colour into one piece (Ctrl + G).",
            "Count the groups: 5 or 6, matching your plan.",
            "Drag the pieces apart so each one sits on the workplane with space around it.",
            "Orbit around each piece and compare it with your sketch.",
          ],
        },
        {
          id: "micro",
          type: "challenge",
          kind: "micro",
          title: "Piece check",
          prompt: "Click each piece. It should move as one solid part.",
          requirements: ["Each piece moves as one", "No loose cubes left on the workplane", "Same number of pieces as your plan"],
          skills: ["B2"],
        },
      ],
    },
    {
      phase: "prove",
      title: "Prove it: your pieces",
      blocks: [
        {
          id: "prove",
          type: "challenge",
          kind: "prove",
          title: "Pieces That Make One Cube",
          prompt: "Show your puzzle as grouped pieces, assembled and pulled apart.",
          requirements: ["5 or 6 grouped pieces (matching your plan), each a different colour", "A backup of the ungrouped cube", "No loose cubes", "Pieces pulled apart, each sitting on the workplane"],
          skills: ["B2", "B1"],
        },
        {
          id: "submit",
          type: "uploadEvidence",
          prompt: "Upload a screenshot of your pieces pulled apart (or share your design link).",
          accepts: ["screenshot", "design_url", "stl"],
          competencyIds: ["B2", "B1"],
          checklist: ["5 or 6 pieces", "A different colour per piece", "All on the workplane"],
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
          prompt: "Now that you can see your pieces in 3D, which one surprised you? Does it match your sketch?",
          sentenceStarters: ["Piece … looks …", "Compared with my sketch …"],
          competencyIds: ["B1"],
        },
      ],
    },
  ],
  teacher: {
    purpose: "Students turn the in-place build into real parts with grouping, and see their design as an exploded view. A backup keeps an editable cube for later changes (day 17).",
    runPlan: [
      { minutes: 5, title: "Demo", teacher: "Backup, group one colour, pull it out.", students: "Watch.", devices: "open" },
      { minutes: 25, title: "Group", teacher: "Circulate; check groups match the plan.", students: "Back up, group every piece.", devices: "open" },
      { minutes: 10, title: "Explode", teacher: "Prompt: compare each piece to its sketch.", students: "Pull pieces apart, compare.", devices: "open" },
      { minutes: 10, title: "Checks and record", teacher: "Order and stray-cube checks; screenshot of the exploded view.", students: "Answer, upload.", devices: "open" },
      { minutes: 5, title: "Share", teacher: "Two or three exploded views on the board.", students: "Look, comment.", devices: "open" },
    ],
    lookFors: ["A backup saved before grouping.", "Group count matches the plan.", "Students noticing where a piece differs from the sketch."],
    differentiation: { support: ["Group one colour at a time with the others hidden.", "A checklist: backup, group, count, explode."], extend: ["Make a clean exploded view for the showcase.", "Plan one change for version 2 now."] },
    preparation: ["Show how to copy a design (Tinkercad dashboard: Duplicate) or select-all, copy and paste into a new design."],
    equipment: ["Student devices with Tinkercad"],
    misconceptions: [
      { id: "group-magic", text: "Grouping figures out which shapes belong together.", response: "Group joins only what's selected. Select carefully, then group." },
    ],
    discussionQuestions: ["Why keep an ungrouped backup?"],
    troubleshooting: [
      "Group turned everything one colour: select the group and set its colour (or use Multicolor if offered).",
      "A piece won't stay together: a cube may only touch on an edge. Recheck the plan.",
    ],
    answerGuidance: ["Proficient: correct number of grouped pieces, backup kept, no strays, exploded view shown."],
    alternatives: { noPrinter: "Digital only.", touchDevice: "Use the toolbar's Group button; tap to add shapes to the selection." },
  },
};
