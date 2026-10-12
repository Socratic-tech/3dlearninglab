import type { z } from "zod";
import type { standardSchema } from "./schema";

type S = z.input<typeof standardSchema>;

/**
 * Structured standards records (spec §36). Mappings live in `lessonStandards` below — never in lesson prose —
 * so they can be revised without touching lessons. These are proposed alignments; districts should review
 * them before using them for reporting.
 *
 * `text` is a short plain-language SUMMARY written for this course, not the official wording (the official
 * standards are copyrighted by their publishers). Look a standard up by its code for the exact language.
 */
export const standardInputs: S[] = [
  // ISTE Standards for Students (2016) — Michigan's MITECS are based on these.
  { id: "iste-1.1c", framework: "ISTE", code: "1.1.c", text: "Use technology to get feedback on your work and show what you learned in different ways." },
  { id: "iste-1.4a", framework: "ISTE", code: "1.4.a", text: "Follow a design process to come up with ideas, test them and make things that solve real problems." },
  { id: "iste-1.4b", framework: "ISTE", code: "1.4.b", text: "Pick digital tools to plan and manage a design project, keeping its limits and risks in mind." },
  { id: "iste-1.4c", framework: "ISTE", code: "1.4.c", text: "Build, test and improve prototypes in repeated design cycles." },
  { id: "iste-1.4d", framework: "ISTE", code: "1.4.d", text: "Stick with open-ended problems and stay comfortable when there is no single right answer." },
  { id: "iste-1.5c", framework: "ISTE", code: "1.5.c", text: "Break a problem into parts, pull out the key information and build models to understand it." },
  { id: "iste-1.6d", framework: "ISTE", code: "1.6.d", text: "Share work in a form and format that fits the people who will see it." },
  // NGSS Middle School Engineering Design
  { id: "ngss-3-5-ets1-1", framework: "NGSS", code: "3-5-ETS1-1", grade: "3–5", text: "Describe a simple design problem, including what success looks like and the limits on materials, time or cost." },
  { id: "ngss-3-5-ets1-2", framework: "NGSS", code: "3-5-ETS1-2", grade: "3–5", text: "Come up with several possible solutions and compare how well each meets the success criteria and limits." },
  { id: "ngss-3-5-ets1-3", framework: "NGSS", code: "3-5-ETS1-3", grade: "3–5", text: "Run fair tests to find where a model or prototype fails and what to improve." },
  { id: "ngss-ms-ets1-1", framework: "NGSS", code: "MS-ETS1-1", grade: "6–8", text: "Define a design problem's criteria and constraints precisely, including effects on people and the environment." },
  { id: "ngss-ms-ets1-2", framework: "NGSS", code: "MS-ETS1-2", grade: "6–8", text: "Judge competing design solutions in a systematic way against the criteria and constraints." },
  { id: "ngss-ms-ets1-3", framework: "NGSS", code: "MS-ETS1-3", grade: "6–8", text: "Use test data to compare designs and combine the best features of each into a better one." },
  { id: "ngss-ms-ets1-4", framework: "NGSS", code: "MS-ETS1-4", grade: "6–8", text: "Build a model to test and refine a design over several rounds until it works as well as possible." },
  // Michigan K-12 Computer Science Standards (CSTA-based, Level 2: grades 6–8)
  { id: "mics-2-cs-01", framework: "MI-CS", code: "2-CS-01", grade: "6–8", text: "Suggest improvements to a device's design based on how people actually use it." },
  { id: "mics-2-ap-13", framework: "MI-CS", code: "2-AP-13", grade: "6–8", text: "Break a problem into smaller parts to make it easier to design, build and review a solution." },
  { id: "mics-2-ap-15", framework: "MI-CS", code: "2-AP-15", grade: "6–8", text: "Get feedback from teammates and users and use it to improve a solution." },
  // Michigan K-12 Standards for Mathematics (CCSS)
  { id: "math-6.g.a.2", framework: "MI-MATH", code: "6.G.A.2", grade: "6", text: "Find the volume of rectangular prisms, including ones with fractional side lengths, in real problems." },
  { id: "math-6.ns.b.3", framework: "MI-MATH", code: "6.NS.B.3", grade: "6", text: "Add, subtract, multiply and divide decimals accurately." },
  { id: "math-7.g.a.1", framework: "MI-MATH", code: "7.G.A.1", grade: "7", text: "Work with scale drawings: find real lengths and areas and redraw at a different scale." },
  { id: "math-7.g.a.3", framework: "MI-MATH", code: "7.G.A.3", grade: "7", text: "Describe the flat shapes you get when you slice 3D solids." },
  { id: "math-7.g.b.6", framework: "MI-MATH", code: "7.G.B.6", grade: "7", text: "Solve real problems with area, volume and surface area of 2D and 3D shapes." },
  { id: "math-8.g.a.1", framework: "MI-MATH", code: "8.G.A.1", grade: "8", text: "Explore by experiment how rotations, reflections and translations behave." },
  { id: "math-8.g.a.3", framework: "MI-MATH", code: "8.G.A.3", grade: "8", text: "Describe how moving, turning, flipping or resizing a shape changes its coordinates." },
  { id: "math-8.g.c.9", framework: "MI-MATH", code: "8.G.C.9", grade: "8", text: "Use the volume formulas for cones, cylinders and spheres in real problems." },
];

/** Many-to-many lesson ↔ standard mapping. */
export const lessonStandards: { lessonId: string; standardIds: string[] }[] = [
  { lessonId: "jr-layers", standardIds: ["iste-1.4a"] },
  { lessonId: "jr-meet-tinkercad", standardIds: ["iste-1.4b"] },
  { lessonId: "jr-move-stretch", standardIds: ["iste-1.4b"] },
  { lessonId: "jr-shapes", standardIds: ["ngss-3-5-ets1-2"] },
  { lessonId: "jr-holes", standardIds: ["iste-1.4b"] },
  { lessonId: "jr-design-rules", standardIds: ["ngss-3-5-ets1-1", "ngss-3-5-ets1-3"] },
  { lessonId: "jr-words", standardIds: ["iste-1.4b"] },
  { lessonId: "jr-boss-bookmark", standardIds: ["ngss-3-5-ets1-1", "ngss-3-5-ets1-3", "iste-1.4c"] },
  { lessonId: "what-is-3d-printing", standardIds: ["iste-1.4a"] },
  { lessonId: "print-detective", standardIds: ["ngss-ms-ets1-3", "iste-1.5c"] },
  { lessonId: "navigating-tinkercad", standardIds: ["iste-1.4b"] },
  { lessonId: "moving-objects", standardIds: ["math-8.g.a.1", "math-8.g.a.3"] },
  { lessonId: "scaling-objects", standardIds: ["math-7.g.a.1"] },
  { lessonId: "exact-dimensions", standardIds: ["math-6.ns.b.3", "math-7.g.a.1"] },
  { lessonId: "rotating-objects", standardIds: ["math-8.g.a.1", "math-8.g.a.3"] },
  { lessonId: "workplanes", standardIds: ["iste-1.4b"] },
  { lessonId: "workspace-rescue", standardIds: ["iste-1.4d", "math-8.g.a.1"] },
  { lessonId: "grouping", standardIds: ["iste-1.5c"] },
  { lessonId: "holes", standardIds: ["math-7.g.b.6"] },
  { lessonId: "align", standardIds: ["iste-1.4b"] },
  { lessonId: "duplicate", standardIds: ["math-8.g.a.1"] },
  { lessonId: "repeat-duplicate", standardIds: ["math-8.g.a.3", "mics-2-ap-13"] },
  { lessonId: "mirror", standardIds: ["math-8.g.a.1", "math-8.g.a.3"] },
  { lessonId: "text", standardIds: ["iste-1.6d"] },
  { lessonId: "boss-nametag", standardIds: ["iste-1.4d", "math-7.g.b.6"] },
  { lessonId: "ruler", standardIds: ["math-6.ns.b.3"] },
  { lessonId: "measuring-real-objects", standardIds: ["math-6.ns.b.3", "ngss-ms-ets1-1"] },
  { lessonId: "calipers", standardIds: ["math-6.ns.b.3"] },
  { lessonId: "tolerances", standardIds: ["ngss-ms-ets1-3", "math-6.ns.b.3"] },
  { lessonId: "make-it-fit", standardIds: ["ngss-ms-ets1-4", "iste-1.4c"] },
  { lessonId: "layers", standardIds: ["math-7.g.a.3"] },
  { lessonId: "orientation", standardIds: ["ngss-ms-ets1-2", "math-7.g.a.3"] },
  { lessonId: "strength", standardIds: ["ngss-ms-ets1-3", "ngss-ms-ets1-4"] },
  { lessonId: "overhangs", standardIds: ["ngss-ms-ets1-2"] },
  { lessonId: "bridging", standardIds: ["ngss-ms-ets1-3"] },
  { lessonId: "supports", standardIds: ["ngss-ms-ets1-2"] },
  { lessonId: "material-efficiency", standardIds: ["math-6.g.a.2", "math-8.g.c.9", "ngss-ms-ets1-1"] },
  { lessonId: "print-failures", standardIds: ["ngss-ms-ets1-3"] },
  { lessonId: "cad-er", standardIds: ["ngss-ms-ets1-2", "ngss-ms-ets1-4", "mics-2-cs-01"] },
  { lessonId: "product-design", standardIds: ["iste-1.4a", "ngss-ms-ets1-1"] },
  { lessonId: "interviewing-a-user", standardIds: ["mics-2-ap-15", "iste-1.4a"] },
  { lessonId: "writing-constraints", standardIds: ["ngss-ms-ets1-1"] },
  { lessonId: "prototype", standardIds: ["iste-1.4c", "ngss-ms-ets1-4"] },
  { lessonId: "testing", standardIds: ["ngss-ms-ets1-3", "iste-1.4c"] },
  { lessonId: "iteration", standardIds: ["mics-2-ap-15", "ngss-ms-ets1-4", "iste-1.1c"] },
  { lessonId: "final-capstone", standardIds: ["ngss-ms-ets1-1", "ngss-ms-ets1-2", "ngss-ms-ets1-4", "iste-1.4a", "iste-1.4c"] },
  { lessonId: "maker-showcase", standardIds: ["iste-1.6d"] },
  { lessonId: "mini-design-sprint", standardIds: ["ngss-ms-ets1-1", "ngss-ms-ets1-4", "iste-1.4a"] },
];

/** Credit lines for the standards frameworks referenced above (shown wherever standards are listed). */
export const STANDARDS_CREDITS: Record<string, string> = {
  NGSS: "NGSS is a registered trademark of WestEd. Neither WestEd nor the lead states and partners that developed the Next Generation Science Standards were involved in the production of this product, and do not endorse it.",
  ISTE: "ISTE Standards are a registered trademark of ISTE (iste.org). Codes are referenced for alignment only; summaries are this course's own wording.",
  "MI-CS": "Michigan K-12 Computer Science Standards are based on the CSTA K-12 Computer Science Standards. Summaries are this course's own wording.",
  "MI-MATH": "Michigan K-12 Standards for Mathematics are based on the Common Core State Standards (© Copyright 2010 National Governors Association Center for Best Practices and Council of Chief State School Officers). Summaries are this course's own wording.",
};

