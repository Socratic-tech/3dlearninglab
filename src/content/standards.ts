import type { z } from "zod";
import type { standardSchema } from "./schema";

type S = z.input<typeof standardSchema>;

/**
 * Structured standards records (spec §36). Mappings live in `lessonStandards` below — never in lesson prose —
 * so they can be revised without touching lessons. These are proposed alignments; districts should review
 * them before using them for reporting.
 */
export const standardInputs: S[] = [
  // ISTE Standards for Students (2016) — Michigan's MITECS are based on these.
  { id: "iste-1.1c", framework: "ISTE", code: "1.1.c", text: "Students use technology to seek feedback that informs and improves their practice and to demonstrate their learning in a variety of ways." },
  { id: "iste-1.4a", framework: "ISTE", code: "1.4.a", text: "Students know and use a deliberate design process for generating ideas, testing theories, creating innovative artifacts or solving authentic problems." },
  { id: "iste-1.4b", framework: "ISTE", code: "1.4.b", text: "Students select and use digital tools to plan and manage a design process that considers design constraints and calculated risks." },
  { id: "iste-1.4c", framework: "ISTE", code: "1.4.c", text: "Students develop, test and refine prototypes as part of a cyclical design process." },
  { id: "iste-1.4d", framework: "ISTE", code: "1.4.d", text: "Students exhibit a tolerance for ambiguity, perseverance and the capacity to work with open-ended problems." },
  { id: "iste-1.5c", framework: "ISTE", code: "1.5.c", text: "Students break problems into component parts, extract key information, and develop descriptive models to understand complex systems or facilitate problem-solving." },
  { id: "iste-1.6d", framework: "ISTE", code: "1.6.d", text: "Students publish or present content that customizes the message and medium for their intended audiences." },
  // NGSS Middle School Engineering Design
  { id: "ngss-3-5-ets1-1", framework: "NGSS", code: "3-5-ETS1-1", grade: "3–5", text: "Define a simple design problem reflecting a need or a want that includes specified criteria for success and constraints on materials, time, or cost." },
  { id: "ngss-3-5-ets1-2", framework: "NGSS", code: "3-5-ETS1-2", grade: "3–5", text: "Generate and compare multiple possible solutions to a problem based on how well each is likely to meet the criteria and constraints of the problem." },
  { id: "ngss-3-5-ets1-3", framework: "NGSS", code: "3-5-ETS1-3", grade: "3–5", text: "Plan and carry out fair tests in which variables are controlled and failure points are considered to identify aspects of a model or prototype that can be improved." },
  { id: "ngss-ms-ets1-1", framework: "NGSS", code: "MS-ETS1-1", grade: "6–8", text: "Define the criteria and constraints of a design problem with sufficient precision to ensure a successful solution, taking into account relevant scientific principles and potential impacts on people and the natural environment that may limit possible solutions." },
  { id: "ngss-ms-ets1-2", framework: "NGSS", code: "MS-ETS1-2", grade: "6–8", text: "Evaluate competing design solutions using a systematic process to determine how well they meet the criteria and constraints of the problem." },
  { id: "ngss-ms-ets1-3", framework: "NGSS", code: "MS-ETS1-3", grade: "6–8", text: "Analyze data from tests to determine similarities and differences among several design solutions to identify the best characteristics of each that can be combined into a new solution to better meet the criteria for success." },
  { id: "ngss-ms-ets1-4", framework: "NGSS", code: "MS-ETS1-4", grade: "6–8", text: "Develop a model to generate data for iterative testing and modification of a proposed object, tool, or process such that an optimal design can be achieved." },
  // Michigan K-12 Computer Science Standards (CSTA-based, Level 2: grades 6–8)
  { id: "mics-2-cs-01", framework: "MI-CS", code: "2-CS-01", grade: "6–8", text: "Recommend improvements to the design of computing devices, based on an analysis of how users interact with the devices." },
  { id: "mics-2-ap-13", framework: "MI-CS", code: "2-AP-13", grade: "6–8", text: "Decompose problems and subproblems into parts to facilitate the design, implementation, and review of programs." },
  { id: "mics-2-ap-15", framework: "MI-CS", code: "2-AP-15", grade: "6–8", text: "Seek and incorporate feedback from team members and users to refine a solution that meets user needs." },
  // Michigan K-12 Standards for Mathematics (CCSS)
  { id: "math-6.g.a.2", framework: "MI-MATH", code: "6.G.A.2", grade: "6", text: "Find the volume of a right rectangular prism with fractional edge lengths… Apply the formulas V = l w h and V = b h to find volumes of right rectangular prisms with fractional edge lengths in the context of solving real-world and mathematical problems." },
  { id: "math-6.ns.b.3", framework: "MI-MATH", code: "6.NS.B.3", grade: "6", text: "Fluently add, subtract, multiply, and divide multi-digit decimals using the standard algorithm for each operation." },
  { id: "math-7.g.a.1", framework: "MI-MATH", code: "7.G.A.1", grade: "7", text: "Solve problems involving scale drawings of geometric figures, including computing actual lengths and areas from a scale drawing and reproducing a scale drawing at a different scale." },
  { id: "math-7.g.a.3", framework: "MI-MATH", code: "7.G.A.3", grade: "7", text: "Describe the two-dimensional figures that result from slicing three-dimensional figures, as in plane sections of right rectangular prisms and right rectangular pyramids." },
  { id: "math-7.g.b.6", framework: "MI-MATH", code: "7.G.B.6", grade: "7", text: "Solve real-world and mathematical problems involving area, volume and surface area of two- and three-dimensional objects composed of triangles, quadrilaterals, polygons, cubes, and right prisms." },
  { id: "math-8.g.a.1", framework: "MI-MATH", code: "8.G.A.1", grade: "8", text: "Verify experimentally the properties of rotations, reflections, and translations." },
  { id: "math-8.g.a.3", framework: "MI-MATH", code: "8.G.A.3", grade: "8", text: "Describe the effect of dilations, translations, rotations, and reflections on two-dimensional figures using coordinates." },
  { id: "math-8.g.c.9", framework: "MI-MATH", code: "8.G.C.9", grade: "8", text: "Know the formulas for the volumes of cones, cylinders, and spheres and use them to solve real-world and mathematical problems." },
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
