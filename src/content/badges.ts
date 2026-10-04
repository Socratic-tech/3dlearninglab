import type { z } from "zod";
import type { badgeSchema, rubricSchema } from "./schema";

type B = z.input<typeof badgeSchema>;
type R = z.input<typeof rubricSchema>;

/** Badges represent demonstrated competencies — never awarded for opening lessons (spec §32). */
export const badgeInputs: B[] = [
  { id: "shape-wrangler", name: "Shape Wrangler", icon: "move-3d", description: "Moves, scales and rotates objects with exact values.", requires: ["A6", "A7", "A8", "A9", "A10"] },
  { id: "workspace-navigator", name: "Workspace Navigator", icon: "compass", description: "Finds any view, selects with intent and uses custom workplanes.", requires: ["A1", "A2", "A3", "A4", "A5", "A11"] },
  { id: "boolean-builder", name: "Boolean Builder", icon: "combine", description: "Builds with grouping and holes.", requires: ["B1", "B2", "B3"] },
  { id: "pattern-maker", name: "Pattern Maker", icon: "copy", description: "Aligns, duplicates, repeats and mirrors with precision.", requires: ["B4", "B5", "B6", "B7"] },
  { id: "precision-designer", name: "Precision Designer", icon: "ruler", description: "Places features with the ruler and exact dimensions.", requires: ["A9", "C1", "C2"] },
  { id: "fit-engineer", name: "Fit Engineer", icon: "puzzle", description: "Designs parts that fit real objects using clearance and tolerance.", requires: ["C5", "C6", "C7", "C8"] },
  { id: "support-skeptic", name: "Support Skeptic", icon: "scissors", description: "Redesigns parts to eliminate unnecessary support.", requires: ["D2", "D3", "D4", "D5"] },
  { id: "print-engineer", name: "Print Engineer", icon: "layers", description: "Chooses orientation and settings based on layer strength.", requires: ["D1", "D6", "D7", "D8", "D9"] },
  { id: "cad-medic", name: "CAD Medic", icon: "stethoscope", description: "Diagnoses and repairs flawed designs.", requires: ["E1", "E2", "E3", "E4", "E5", "E6"] },
  { id: "product-designer", name: "Product Designer", icon: "lightbulb", description: "Completes iterative, user-centered design.", requires: ["F1", "F2", "F5", "F6", "F8", "F10"] },
  { id: "client-champion", name: "Client Champion", icon: "handshake", description: "Designed and delivered a working solution for someone else.", requires: ["G1", "G2", "G4", "G5", "G6"], minLevel: "proficient" },
];

const d4 = (a: string, b: string, c: string, d: string) => [a, b, c, d];

export const rubricInputs: R[] = [
  {
    id: "capstone",
    title: "Capstone — Design for Someone Else (24 pts)",
    criteria: [
      { id: "cad", label: "CAD Construction", max: 4, competencyIds: ["B1", "B2", "B3", "B4"], descriptors: d4("Model is cleanly grouped, aligned and easy for someone else to edit.", "Model is grouped and aligned with minor stray geometry.", "Model works but has loose or overlapping parts.", "Model is incomplete or cannot be printed as one object.") },
      { id: "accuracy", label: "Dimensional Accuracy", max: 4, competencyIds: ["A9", "C2", "C3", "C8"], descriptors: d4("Critical dimensions are measured, designed and verified with clearance.", "Critical dimensions are measured and designed; most fit.", "Some dimensions are guessed.", "Dimensions are not connected to measurements.") },
      { id: "dfam", label: "Design for Additive Manufacturing", max: 4, competencyIds: ["D5", "D6", "D7", "D12"], descriptors: d4("Orientation, supports and material use are deliberate and justified.", "Prints successfully with sensible orientation.", "Prints but wastes material or relies on avoidable supports.", "Not printable as designed.") },
      { id: "problem", label: "Problem Solving", max: 4, competencyIds: ["G2", "F2", "F4"], descriptors: d4("Solution clearly meets the client's constraints; choices are justified.", "Solution meets most constraints.", "Solution is loosely connected to the problem.", "Problem or constraints are unclear.") },
      { id: "iteration", label: "Testing & Iteration", max: 4, competencyIds: ["G4", "F6", "F8", "E7"], descriptors: d4("At least one test drove a documented, meaningful revision.", "Tested and revised once.", "Tested but did not revise.", "No testing documented.") },
      { id: "communication", label: "Communication", max: 4, competencyIds: ["G6", "F10"], descriptors: d4("Journal and presentation tell a clear story of user → problem → solution → next steps.", "Journal is complete and understandable.", "Journal is partially complete.", "Little documentation.") },
    ],
  },
  {
    id: "boss-nametag",
    title: "Boss Battle — The Name Tag (16 pts)",
    criteria: [
      { id: "dims", label: "Tag exactly 50 × 20 × 3 mm", max: 4, competencyIds: ["A9"], descriptors: d4("Verified exactly, with a screenshot of the grouped size.", "Within 0.5 mm.", "Off by more than 0.5 mm on one axis.", "Not measured.") },
      { id: "name", label: "Raised, readable, centered name", max: 4, competencyIds: ["B10", "B4"], descriptors: d4("Raised 1 mm, touching, 6 mm+ letters, centered with Align.", "Raised and readable, slightly off-center.", "Floating, too small or clearly off-center.", "No name.") },
      { id: "hole", label: "Key-ring hole with a margin", max: 4, competencyIds: ["B3"], descriptors: d4("5 mm hole cuts through with 2 mm+ of plastic all around.", "Hole works; margin a little under 2 mm.", "Hole breaks the edge or doesn't cut through.", "No hole.") },
      { id: "group", label: "Single grouped part", max: 4, competencyIds: ["B2"], descriptors: d4("One clean group, no stray shapes.", "One group with a stray shape.", "Several groups.", "Not grouped.") },
    ],
  },
  {
    id: "cad-er",
    title: "CAD ER — Repair Report (16 pts)",
    criteria: [
      { id: "diagnosis", label: "Diagnosis", max: 4, competencyIds: ["E1", "E3", "E4", "E5"], descriptors: d4("All five symptoms traced to specific causes.", "Four symptoms traced.", "Two or three symptoms traced.", "Symptoms listed without causes.") },
      { id: "hypothesis", label: "Hypothesis", max: 4, competencyIds: ["E7"], descriptors: d4("Each fix states a testable prediction.", "Most fixes have predictions.", "Predictions are vague.", "No predictions.") },
      { id: "repair", label: "Repair", max: 4, competencyIds: ["E6", "E2", "D12"], descriptors: d4("Model fixes every symptom without creating new ones.", "Fixes most symptoms.", "Fixes some symptoms.", "Model largely unchanged.") },
      { id: "results", label: "Test & Results", max: 4, competencyIds: ["E7"], descriptors: d4("Tested (digitally or printed) and documented honestly, including what still fails.", "Tested and documented.", "Partially documented.", "No results.") },
    ],
  },
  {
    id: "make-it-fit",
    title: "Make It Fit (12 pts)",
    criteria: [
      { id: "measure", label: "Measurement", max: 4, competencyIds: ["C3", "C4"], descriptors: d4("Critical dimensions measured more than once and recorded with units.", "Measured and recorded.", "Measured once with errors.", "Not measured.") },
      { id: "clearance", label: "Clearance decision", max: 4, competencyIds: ["C5", "C6", "C8"], descriptors: d4("Clearance chosen from the class tolerance test and justified.", "Clearance added with a reason.", "Clearance added without reason.", "No clearance.") },
      { id: "test", label: "Test piece & iteration", max: 4, competencyIds: ["C10", "E2"], descriptors: d4("Printed only the interface, tested, and adjusted.", "Printed a test piece.", "Printed the whole part first.", "No test.") },
    ],
  },
];

/** Design journal prompts (spec §30). Lessons reference these ids. */
export const journalPrompts: { id: string; title: string; prompt: string }[] = [
  { id: "problem", title: "Problem", prompt: "What problem are you solving? Describe it so someone else could understand it." },
  { id: "user", title: "User", prompt: "Who are you designing for? What did you learn from them?" },
  { id: "constraints", title: "Constraints", prompt: "What must the solution do? Use numbers wherever you can (size, weight, fit)." },
  { id: "ideas", title: "Ideas", prompt: "Describe at least three different approaches." },
  { id: "first-idea", title: "First idea", prompt: "Which idea are you building first?" },
  { id: "why", title: "Why I chose it", prompt: "Which constraints does this idea meet best?" },
  { id: "prototype", title: "Prototype", prompt: "What did you build? What question is this prototype testing?" },
  { id: "test", title: "Test", prompt: "How did you test it? What happened?" },
  { id: "failed", title: "What failed?", prompt: "What didn't work as expected? Failure is data." },
  { id: "changed", title: "What changed?", prompt: "What did you change, and why?" },
  { id: "final", title: "Final design", prompt: "Describe your final design and how it meets the constraints." },
  { id: "next", title: "What would I change next?", prompt: "With another week, what would you change?" },
];
