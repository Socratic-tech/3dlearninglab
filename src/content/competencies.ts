import type { Domain } from "./schema";
import type { z } from "zod";
import type { competencySchema } from "./schema";

type C = z.input<typeof competencySchema>;

export const domains: Domain[] = [
  { id: "A", title: "CAD Foundations", shortTitle: "Foundations", description: "Find your way around a 3D workspace and place objects exactly where you mean to." },
  { id: "B", title: "Building with Geometry", shortTitle: "Construction", description: "Combine, subtract, align and repeat simple shapes to build complex objects." },
  { id: "C", title: "Precision Design", shortTitle: "Precision", description: "Measure the real world and design parts that actually fit it." },
  { id: "D", title: "Design for Additive Manufacturing", shortTitle: "Print Engineering", description: "Design objects that print well, print strong and don't waste material." },
  { id: "E", title: "Troubleshooting", shortTitle: "Troubleshooting", description: "Diagnose what went wrong, change one thing, test again and document it." },
  { id: "F", title: "Product Design", shortTitle: "Product Design", description: "Solve a real person's problem through iterative, user-centered design." },
  { id: "G", title: "Capstone: Design for Someone Else", shortTitle: "Capstone", description: "Find a real problem, design for a real person, and show your process." },
];

export const competencyInputs: C[] = [
  // A — CAD Foundations
  { id: "A1", domain: "A", title: "Navigate the 3D workspace", canStatement: "I can find my way around the 3D workspace and get back to a useful view.", stage: "follow" },
  { id: "A2", domain: "A", title: "Orbit", canStatement: "I can orbit the view to look at a design from any side.", stage: "follow" },
  { id: "A3", domain: "A", title: "Pan", canStatement: "I can pan the view to slide my work into the center of the screen.", stage: "follow" },
  { id: "A4", domain: "A", title: "Zoom", canStatement: "I can zoom in for detail and zoom out to see the whole design.", stage: "follow" },
  { id: "A5", domain: "A", title: "Select objects", canStatement: "I can select one object, several objects, or everything on purpose.", stage: "follow" },
  { id: "A6", domain: "A", title: "Move on the X/Y plane", canStatement: "I can move objects across the workplane along X and Y.", stage: "follow" },
  { id: "A7", domain: "A", title: "Move vertically", canStatement: "I can raise and lower objects along Z and check that they sit on the workplane.", stage: "modify" },
  { id: "A8", domain: "A", title: "Scale objects", canStatement: "I can resize objects in one direction or proportionally.", stage: "follow" },
  { id: "A9", domain: "A", title: "Use exact dimensions", canStatement: "I can type exact dimensions instead of dragging by eye.", stage: "modify" },
  { id: "A10", domain: "A", title: "Rotate objects", canStatement: "I can rotate objects around X, Y or Z by a chosen angle.", stage: "follow" },
  { id: "A11", domain: "A", title: "Use the workplane", canStatement: "I can place a workplane on any face to build on it.", stage: "modify" },
  // B — Building with Geometry
  { id: "B1", domain: "B", title: "Combine primitives", canStatement: "I can build a complex object out of simple shapes.", stage: "modify" },
  { id: "B2", domain: "B", title: "Group objects", canStatement: "I can group shapes into one object and ungroup them to edit.", stage: "follow" },
  { id: "B3", domain: "B", title: "Create holes", canStatement: "I can use hole shapes to subtract material.", stage: "modify" },
  { id: "B4", domain: "B", title: "Align objects", canStatement: "I can align objects to each other's centers and edges.", stage: "follow" },
  { id: "B5", domain: "B", title: "Duplicate objects", canStatement: "I can duplicate objects without losing their size or position.", stage: "follow" },
  { id: "B6", domain: "B", title: "Repeat duplicate", canStatement: "I can use repeat-duplicate to make evenly spaced patterns.", stage: "combine" },
  { id: "B7", domain: "B", title: "Mirror objects", canStatement: "I can mirror objects to make symmetric designs.", stage: "follow" },
  { id: "B8", domain: "B", title: "Copy and paste", canStatement: "I can copy and paste shapes, including between designs.", stage: "follow" },
  { id: "B9", domain: "B", title: "Use shape parameters", canStatement: "I can change a shape's settings (sides, bevel, segments) to get the form I need.", stage: "modify" },
  { id: "B10", domain: "B", title: "Add text", canStatement: "I can add raised or recessed text that will print clearly.", stage: "modify" },
  // C — Precision Design
  { id: "C1", domain: "C", title: "Use the Tinkercad ruler", canStatement: "I can use the ruler to read and set distances from a point I choose.", stage: "modify" },
  { id: "C2", domain: "C", title: "Position objects numerically", canStatement: "I can place an object at an exact distance from another.", stage: "modify" },
  { id: "C3", domain: "C", title: "Measure physical objects", canStatement: "I can measure a real object and record its critical dimensions.", stage: "combine", autoAssessable: true },
  { id: "C4", domain: "C", title: "Use digital calipers", canStatement: "I can measure outside, inside and depth dimensions with calipers.", stage: "combine", autoAssessable: true },
  { id: "C5", domain: "C", title: "Understand clearance", canStatement: "I can explain why a hole must be a little bigger than the part that goes in it.", stage: "combine", autoAssessable: true },
  { id: "C6", domain: "C", title: "Understand tolerance", canStatement: "I can explain tolerance and why my printer's results may differ from someone else's.", stage: "combine", autoAssessable: true },
  { id: "C7", domain: "C", title: "Design mating components", canStatement: "I can design two parts that fit together.", stage: "solve" },
  { id: "C8", domain: "C", title: "Design holes for real objects", canStatement: "I can design a hole that fits a real object I measured.", stage: "solve" },
  { id: "C9", domain: "C", title: "Understand wall thickness", canStatement: "I can choose a wall thickness that is strong enough and still prints.", stage: "combine", autoAssessable: true },
  { id: "C10", domain: "C", title: "Prototype only the critical portion", canStatement: "I can print a small test piece instead of the whole design when I'm testing one dimension.", stage: "solve" },
  // D — Design for Additive Manufacturing
  { id: "D1", domain: "D", title: "Understand layers", canStatement: "I can explain how a printer builds an object one layer at a time.", stage: "follow", autoAssessable: true },
  { id: "D2", domain: "D", title: "Recognize overhangs", canStatement: "I can spot overhangs that will print poorly.", stage: "modify", autoAssessable: true },
  { id: "D3", domain: "D", title: "Understand bridging", canStatement: "I can predict when a printer can bridge a gap between two supports.", stage: "modify", autoAssessable: true },
  { id: "D4", domain: "D", title: "Understand supports", canStatement: "I can explain what supports are and when they are needed.", stage: "modify", autoAssessable: true },
  { id: "D5", domain: "D", title: "Minimize unnecessary supports", canStatement: "I can change a design so it needs fewer or no supports.", stage: "solve" },
  { id: "D6", domain: "D", title: "Choose print orientation", canStatement: "I can choose how to place a part on the build plate and justify it.", stage: "combine", autoAssessable: true },
  { id: "D7", domain: "D", title: "Understand anisotropic strength", canStatement: "I can explain why a print is weakest between layers.", stage: "combine", autoAssessable: true },
  { id: "D8", domain: "D", title: "Understand infill", canStatement: "I can explain what infill does and choose a sensible amount.", stage: "modify", autoAssessable: true },
  { id: "D9", domain: "D", title: "Understand perimeters and walls", canStatement: "I can explain how wall count affects strength.", stage: "modify", autoAssessable: true },
  { id: "D10", domain: "D", title: "Estimate material use", canStatement: "I can estimate and compare how much material a design uses.", stage: "combine", autoAssessable: true },
  { id: "D11", domain: "D", title: "Recognize common print failures", canStatement: "I can name common print failures and their likely causes.", stage: "combine", autoAssessable: true },
  { id: "D12", domain: "D", title: "Optimize designs for printing", canStatement: "I can improve a design so it prints faster, stronger or cleaner.", stage: "solve" },
  // E — Troubleshooting
  { id: "E1", domain: "E", title: "Diagnose design problems", canStatement: "I can find what's wrong with a design and explain why.", stage: "solve" },
  { id: "E2", domain: "E", title: "Diagnose fit problems", canStatement: "I can figure out why two parts don't fit.", stage: "solve" },
  { id: "E3", domain: "E", title: "Diagnose support problems", canStatement: "I can figure out why a design needs too much support.", stage: "solve" },
  { id: "E4", domain: "E", title: "Diagnose strength problems", canStatement: "I can figure out why a part breaks where it does.", stage: "solve" },
  { id: "E5", domain: "E", title: "Diagnose excessive material use", canStatement: "I can find where a design wastes material.", stage: "solve" },
  { id: "E6", domain: "E", title: "Modify an existing design", canStatement: "I can improve someone else's design without starting over.", stage: "solve" },
  { id: "E7", domain: "E", title: "Document iteration", canStatement: "I can record what I changed, why, and what happened.", stage: "solve" },
  // F — Product Design
  { id: "F1", domain: "F", title: "Identify a user need", canStatement: "I can describe a real problem a specific person has.", stage: "design" },
  { id: "F2", domain: "F", title: "Write design constraints", canStatement: "I can write measurable requirements a solution must meet.", stage: "design" },
  { id: "F3", domain: "F", title: "Sketch concepts", canStatement: "I can sketch several different ideas before choosing one.", stage: "design" },
  { id: "F4", domain: "F", title: "Select a concept", canStatement: "I can choose an idea using my constraints, not just my favorite.", stage: "design" },
  { id: "F5", domain: "F", title: "Build a prototype", canStatement: "I can build a prototype that tests my most important question.", stage: "design" },
  { id: "F6", domain: "F", title: "Test a prototype", canStatement: "I can test a prototype against my constraints and record results.", stage: "design" },
  { id: "F7", domain: "F", title: "Gather feedback", canStatement: "I can ask my user useful questions and listen to the answers.", stage: "design" },
  { id: "F8", domain: "F", title: "Revise a design", canStatement: "I can change my design based on test results and feedback.", stage: "design" },
  { id: "F9", domain: "F", title: "Document iteration", canStatement: "I can show how my design changed from version to version.", stage: "design" },
  { id: "F10", domain: "F", title: "Communicate a final design", canStatement: "I can explain my design, who it's for and why it works.", stage: "design" },
  // G — Capstone
  { id: "G1", domain: "G", title: "Interview a client", canStatement: "I can interview a real person to understand their problem.", stage: "design" },
  { id: "G2", domain: "G", title: "Define the problem and constraints", canStatement: "I can turn an interview into a clear problem and constraints.", stage: "design" },
  { id: "G3", domain: "G", title: "Generate multiple approaches", canStatement: "I can come up with at least three different approaches.", stage: "design" },
  { id: "G4", domain: "G", title: "Prototype, test and revise", canStatement: "I can build, test and revise a solution at least once.", stage: "design" },
  { id: "G5", domain: "G", title: "Deliver a final product", canStatement: "I can deliver a final object that solves my client's problem.", stage: "design" },
  { id: "G6", domain: "G", title: "Reflect and present", canStatement: "I can present my process and reflect on what I'd do next.", stage: "design" },
];

/** Grouped columns for the teacher heatmap (spec §25). */
export const heatmapGroups: { id: string; label: string; competencyIds: string[] }[] = [
  { id: "navigate", label: "Navigate", competencyIds: ["A1", "A2", "A3", "A4", "A5"] },
  { id: "move", label: "Move", competencyIds: ["A6", "A7"] },
  { id: "scale", label: "Scale", competencyIds: ["A8", "A9"] },
  { id: "rotate", label: "Rotate", competencyIds: ["A10", "A11"] },
  { id: "group", label: "Group", competencyIds: ["B1", "B2"] },
  { id: "holes", label: "Holes", competencyIds: ["B3"] },
  { id: "align", label: "Align", competencyIds: ["B4"] },
  { id: "pattern", label: "Pattern", competencyIds: ["B5", "B6", "B7", "B8"] },
  { id: "detail", label: "Params & Text", competencyIds: ["B9", "B10"] },
  { id: "measure", label: "Measure", competencyIds: ["C1", "C2", "C3", "C4"] },
  { id: "tolerance", label: "Tolerance", competencyIds: ["C5", "C6", "C7", "C8"] },
  { id: "walls", label: "Walls & Proto", competencyIds: ["C9", "C10"] },
  { id: "printability", label: "Printability", competencyIds: ["D1", "D2", "D3", "D4", "D5", "D6"] },
  { id: "strength", label: "Strength & Material", competencyIds: ["D7", "D8", "D9", "D10", "D11", "D12"] },
  { id: "troubleshoot", label: "Troubleshoot", competencyIds: ["E1", "E2", "E3", "E4", "E5", "E6"] },
  { id: "iterate", label: "Iterate", competencyIds: ["E7", "F8", "F9"] },
  { id: "product", label: "Product Design", competencyIds: ["F1", "F2", "F3", "F4", "F5", "F6", "F7", "F10"] },
  { id: "capstone", label: "Capstone", competencyIds: ["G1", "G2", "G3", "G4", "G5", "G6"] },
];
