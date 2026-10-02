import type { LessonInput } from "../schema";

export const lesson: LessonInput = {
  id: "overhangs",
  number: 26,
  title: "Overhangs",
  subtitle: "Printing on thin air",
  domain: "D",
  kind: "lesson",
  summary: "Spot the parts of a design that hang out over nothing, and learn why about 45° is a useful rule of thumb.",
  estimatedMinutes: 45,
  printLevel: "digital",
  competencyIds: ["D2"],
  prerequisites: ["strength"],
  vocabulary: [
    { term: "Overhang", definition: "Any part of a print that sticks out past the layer below it." },
    { term: "Overhang angle", definition: "How far a surface leans out, measured from straight up (vertical)." },
    { term: "Droop", definition: "When an overhang sags or curls because the layer below can't hold it up." },
    { term: "Chamfer", definition: "A sloped edge that replaces a sharp, flat corner." },
  ],
  sections: [
    {
      phase: "discover",
      title: "Every layer needs something below it",
      blocks: [
        {
          id: "hook",
          type: "hero",
          title: "A printer can't draw in mid-air.",
          hook: "Each new layer is laid on top of the last one. If a layer sticks out too far past the one beneath it, the hot plastic droops.",
          visual: { diagram: "overhang-angles" },
        },
        {
          id: "explain",
          type: "text",
          body: "Each layer can stick out a little past the one below — about half a line width — and still be held up. Add up many small steps and you get a slope. Gentle slopes print well. Steep ones, and flat ledges, droop.",
        },
        {
          id: "rule",
          type: "text",
          title: "The 45° rule of thumb",
          body: "Measured from vertical, overhangs up to about **45°** print well on most printers. Past that, quality drops. Your printer, plastic and cooling fan may do better or worse — test to find out.",
        },
        { id: "viewer", type: "modelViewer", modelId: "overhang-test", caption: "Five fins leaning out at 20°, 30°, 45°, 60° and 70° from vertical. Slide the layers and watch each fin step outward.", showLayers: true },
        {
          id: "predict",
          type: "prediction",
          prompt: "If your teacher prints this test, which fins do you think will start to droop or look rough underneath?",
          options: [
            { id: "a", text: "None — the printer handles any angle", misconceptionId: "any-angle-prints" },
            { id: "b", text: "The 60° and 70° fins" },
            { id: "c", text: "Only the 20° fin, because it's the thinnest", misconceptionId: "angle-from-horizontal" },
          ],
          expectedOptionId: "b",
          reveal: "On many printers the 60° and 70° fins look rough or droopy underneath, while 20°–45° stay clean. Some well-tuned printers handle 60°. If you print the test, compare your result to the prediction.",
        },
      ],
    },
    {
      phase: "practice",
      title: "Spot the overhangs",
      blocks: [
        {
          id: "hotspot-fins",
          type: "hotspot",
          prompt: "Click every fin you think is likely to droop on a typical school printer.",
          modelId: "overhang-test",
          hotspots: [
            { id: "f20", label: "20° fin", position: [18.55, 8, 26], radius: 5, correct: false, feedback: "20° is a gentle lean — most printers handle it easily." },
            { id: "f30", label: "30° fin", position: [22.39, 18, 26], radius: 5, correct: false, feedback: "30° is well inside the usual safe range." },
            { id: "f45", label: "45° fin", position: [30, 28, 26], radius: 5, correct: false, feedback: "45° is right at the rule of thumb. Usually fine, maybe a little rough." },
            { id: "f60", label: "60° fin", position: [43.18, 38, 26], radius: 5, correct: true, feedback: "Past 45° — each layer sticks out further than the one below can support." },
            { id: "f70", label: "70° fin", position: [61.45, 48, 26], radius: 5, correct: true, feedback: "Almost flat. This one is the most likely to droop." },
          ],
          explanation: "The further a surface leans from vertical, the less each layer is supported. Past about 45°, droop is likely without support or a redesign.",
          competencyId: "D2",
          check: "practice",
        },
        {
          id: "mc-letters",
          type: "multipleChoice",
          prompt: "You print the capital letters T, A and H standing upright. Which one has an overhang that will need help?",
          options: [
            { id: "t", text: "T — its top bar sticks straight out sideways." },
            { id: "a", text: "A — its legs lean.", misconceptionId: "any-lean-fails" },
            { id: "h", text: "H — it has a crossbar.", feedback: "Good thinking — the H crossbar is a bridge, supported at both ends. That's next lesson." },
          ],
          correctOptionIds: ["t"],
          explanation: "The T's arms stick straight out at 90° with nothing underneath. The A's legs lean gently, which prints fine. The H crossbar is supported on both ends — a bridge, not an overhang.",
          competencyId: "D2",
          check: "skill",
        },
      ],
    },
    {
      phase: "apply",
      title: "Find the problem",
      blocks: [
        {
          id: "hotspot-t",
          type: "hotspot",
          prompt: "Find the problem: this T-bracket will print standing on its stem. Click every area that will print poorly without help.",
          modelId: "excessive-support-object",
          hotspots: [
            { id: "left-arm", label: "Underside of the left arm", position: [8, 10, 40], radius: 9, correct: true, feedback: "This 25 mm arm is a flat, 90° overhang — nothing is below it." },
            { id: "right-arm", label: "Underside of the right arm", position: [52, 10, 40], radius: 9, correct: true, feedback: "Same problem on this side: a flat ledge printed on air." },
            { id: "stem", label: "The stem", position: [30, 10, 20], radius: 9, correct: false, feedback: "Test result: the stem is straight up and down. Every layer sits right on top of the last — no overhang here." },
          ],
          explanation: "Both arms are flat overhangs. Next lesson you'll see two fixes: add supports, or change the design so it supports itself.",
          competencyId: "D2",
          check: "skill",
        },
        {
          id: "fix-preview",
          type: "diagram",
          name: "self-supporting",
          caption: "One fix: a 45° chamfer under a flat overhang lets the part hold itself up.",
          alt: "Replacing a flat overhang with a 45° chamfer so the part supports itself.",
        },
      ],
    },
    {
      phase: "prove",
      title: "Prove it",
      blocks: [
        {
          id: "prove",
          type: "challenge",
          kind: "prove",
          title: "The Y peg",
          prompt: "Design a coat peg shaped like a Y that prints standing up with no support. The two arms need to reach out sideways — but every overhang must be printable.",
          requirements: [
            "At least 50 mm tall, printed standing upright",
            "Each arm reaches at least 15 mm sideways from the stem",
            "No surface leans more than 45° from vertical (rotation snaps in 22.5° steps — 22.5° and 45° are easy)",
            "No flat ledges sticking out",
            "Single grouped model sitting on the workplane",
          ],
          skills: ["D2", "A10", "B2"],
        },
        {
          id: "tinkercad",
          type: "tinkercadLaunch",
          title: "Design the Y peg",
          steps: ["Create a new design.", "Plan the arm angle before you build.", "Orbit around the model and look at it from the front to check every slope."],
        },
        {
          id: "submit",
          type: "uploadEvidence",
          prompt: "Submit a front-view screenshot of your Y peg and state the steepest overhang angle in it.",
          accepts: ["screenshot", "design_url", "stl"],
          competencyIds: ["D2"],
          checklist: ["Front view shows the arm angles", "Steepest angle stated", "No flat ledges"],
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
          prompt: "Look at an object near you. Where would it have overhangs if you printed it? How would you fix one?",
          sentenceStarters: ["The overhang is…", "I would fix it by…"],
          competencyIds: ["D2"],
        },
      ],
    },
  ],
  teacher: {
    purpose: "Students learn to see a design the way a printer does — layer by layer — and spot overhangs before they become failed prints.",
    preparation: [
      "Optional: print the Overhang Angle Test ahead of time (about 30–45 minutes) so students can compare their predictions to a real result.",
      "Optional: also print the T-bracket without supports to show a drooping arm.",
    ],
    equipment: ["Student devices with Tinkercad", "Optional: printed overhang test and T-bracket"],
    misconceptions: [
      { id: "any-angle-prints", text: "A 3D printer can print any shape.", response: "Show the slicer layer preview of the 70° fin: the outer edge of each layer has nothing beneath it." },
      { id: "angle-from-horizontal", text: "Overhang angle is measured from the table, so small angles are the problem.", response: "Draw both on the board. In this course, 0° = straight up (no overhang) and 90° = flat ledge." },
      { id: "any-lean-fails", text: "Anything that leans will fail.", response: "Point to the 20° and 30° fins. Gentle leans are fine — it's steep leans and flat ledges that fail." },
    ],
    discussionQuestions: [
      "Why do you think 45° is a common rule of thumb?",
      "How could you turn a part so an overhang disappears?",
    ],
    troubleshooting: [
      "Students can't measure angles in Tinkercad: use the rotate handles, which snap in 22.5° steps, or type an exact angle.",
      "Hotspots hard to click on a small screen: zoom in first.",
    ],
    answerGuidance: [
      "Prediction: b (60° and 70°) is typical; results vary by printer.",
      "Letters: T.",
      "Find the problem: both arm undersides; the stem is fine.",
      "Y peg: arms rotated 45° or less from vertical, built from rotated boxes or cylinders, grouped and sitting on the workplane.",
    ],
    alternatives: {
      noPrinter: "Use the layer slider and slicer preview to show where layers have nothing under them.",
      touchDevice: "Tap hotspots directly; use pinch zoom to get closer.",
    },
  },
};
