import type { z } from "zod";
import type { pathSchema } from "./schema";

type P = z.input<typeof pathSchema>;

export const pathInputs: P[] = [
  {
    id: "9-week",
    title: "9-Week Course: Design Things That Work",
    description:
      "A condensed arc with its own finish line: core CAD skills, one boss battle, precision and printability, a repair challenge and a mini product design challenge.",
    weeks: [
      { week: 1, title: "What is additive manufacturing?", focus: "Print Detective and finding your way around Tinkercad", lessonIds: ["what-is-3d-printing", "print-detective", "navigating-tinkercad"] },
      { week: 2, title: "Move, resize, rotate", focus: "Exact placement and the workplane", lessonIds: ["moving-objects", "scaling-objects", "exact-dimensions", "rotating-objects", "workplanes"] },
      { week: 3, title: "Group, holes and align", focus: "Building with positive and negative geometry", lessonIds: ["grouping", "holes", "align"] },
      { week: 4, title: "Patterns and text", focus: "Duplicate, repeat, mirror, text", lessonIds: ["duplicate", "repeat-duplicate", "mirror", "text"] },
      { week: 5, title: "Boss Battle: The Mystery Die", focus: "Combine every skill — no tutorial", lessonIds: ["boss-die"] },
      { week: 6, title: "Measure and fit", focus: "Ruler, real-world measurement and tolerance", lessonIds: ["ruler", "measuring-real-objects", "tolerances"] },
      { week: 7, title: "Design for printing", focus: "Layers, orientation, strength and supports", lessonIds: ["layers", "orientation", "strength", "supports"] },
      { week: 8, title: "CAD ER", focus: "Diagnose and repair a broken design", lessonIds: ["cad-er"] },
      { week: 9, title: "Mini Design Challenge", focus: "A functional design that solves a defined problem", lessonIds: ["mini-design-sprint"] },
    ],
  },
  {
    id: "18-week",
    title: "18-Week Course: From Idea to Object",
    description:
      "The complete course: every CAD foundation, two boss battles, precision fit, print engineering, CAD ER and a full client-centered capstone with a Maker Showcase.",
    weeks: [
      { week: 1, title: "Additive manufacturing + Print Detective", focus: "How objects are made layer by layer", lessonIds: ["what-is-3d-printing", "print-detective"] },
      { week: 2, title: "Navigation and placement", focus: "Orbit, pan, zoom, select and move", lessonIds: ["navigating-tinkercad", "moving-objects"] },
      { week: 3, title: "Scale and dimensions", focus: "Resize by eye, then by number", lessonIds: ["scaling-objects", "exact-dimensions"] },
      { week: 4, title: "Rotation and workplanes", focus: "Angles and building on any face", lessonIds: ["rotating-objects", "workplanes", "workspace-rescue"] },
      { week: 5, title: "Grouping and holes", focus: "Positive and negative geometry", lessonIds: ["grouping", "holes"] },
      { week: 6, title: "Alignment, duplicate and mirror", focus: "Precision patterns and symmetry", lessonIds: ["align", "duplicate", "repeat-duplicate", "mirror"] },
      { week: 7, title: "Boss Battle #1", focus: "Text, then The Mystery Die", lessonIds: ["text", "boss-die"] },
      { week: 8, title: "Measurement and ruler", focus: "Measure the real world", lessonIds: ["ruler", "measuring-real-objects", "calipers"] },
      { week: 9, title: "Tolerance and fit", focus: "Clearance, tolerance, Make It Fit", lessonIds: ["tolerances", "make-it-fit"] },
      { week: 10, title: "Layers and orientation", focus: "How the printer sees your design", lessonIds: ["layers", "orientation"] },
      { week: 11, title: "Strength", focus: "Layer direction, walls and infill", lessonIds: ["strength"] },
      { week: 12, title: "Overhangs, bridges and supports", focus: "Design out unnecessary support", lessonIds: ["overhangs", "bridging", "supports"] },
      { week: 13, title: "Material and time", focus: "Optimization and common failures", lessonIds: ["material-efficiency", "print-failures"] },
      { week: 14, title: "CAD ER", focus: "Diagnose and repair", lessonIds: ["cad-er"] },
      { week: 15, title: "Product Design Sprint", focus: "The design process end to end", lessonIds: ["product-design"] },
      { week: 16, title: "Client research and ideation", focus: "Interview a user and write constraints", lessonIds: ["interviewing-a-user", "writing-constraints"] },
      { week: 17, title: "Prototype, test, revise", focus: "Build to learn", lessonIds: ["prototype", "testing", "iteration"] },
      { week: 18, title: "Maker Showcase", focus: "Deliver and present", lessonIds: ["final-capstone", "maker-showcase"] },
    ],
  },
];
