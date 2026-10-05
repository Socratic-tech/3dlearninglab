/**
 * Common technical words students meet across many missions. Any lesson text that uses one can be tapped to see
 * the meaning (each lesson's own vocabulary list comes first). English only; Spanish lessons use their own lists.
 */
export const GLOSSARY: { term: string; definition: string }[] = [
  { term: "CAD", definition: "Computer-aided design: software (like Tinkercad) for building 3D models on a computer." },
  { term: "STL", definition: "A common 3D model file. You export it from Tinkercad and open it in a slicer to print." },
  { term: "slicer", definition: "Software that cuts a 3D model into thin layers and tells the printer how to draw each one." },
  { term: "filament", definition: "The plastic thread on a spool that the printer melts to make a print." },
  { term: "nozzle", definition: "The hot tip of the printer that melts filament and draws each layer." },
  { term: "layer height", definition: "How thick each printed layer is, like 0.2 mm. Thinner layers look smoother but take longer." },
  { term: "infill", definition: "The pattern that fills the inside of a print. More infill is stronger but uses more plastic and time." },
  { term: "overhang", definition: "Part of a print that sticks out over empty air, with nothing below it." },
  { term: "support", definition: "Extra plastic printed under an overhang to hold it up. You remove it afterward." },
  { term: "tolerance", definition: "How far off a size can be and still work." },
  { term: "clearance", definition: "The small gap you leave on purpose so two parts can fit together." },
  { term: "prototype", definition: "A quick early version you build to test an idea." },
  { term: "iteration", definition: "One round of improving a design: change it, test it, learn, repeat." },
  { term: "hypothesis", definition: "A testable guess: 'If I change this, then that will happen, because…'" },
  { term: "criteria", definition: "The rules for deciding if something passes or works." },
  { term: "constraint", definition: "A must-have rule for a design, like 'fits in a 60 mm space'." },
  { term: "chamfer", definition: "A slanted edge that replaces a sharp corner. On a print, it can help an overhang support itself." },
  { term: "extrusion", definition: "Pushing melted plastic out of the nozzle. Under-extrusion means not enough plastic came out." },
  { term: "subtractive", definition: "Making something by cutting material away, like carving or drilling." },
  { term: "additive", definition: "Making something by adding material, a bit at a time — like 3D printing, layer by layer." },
  { term: "workplane", definition: "The flat grid you build on in Tinkercad. You can move it onto any face of a shape." },
  { term: "mm", definition: "Millimeter: a tiny unit of length. 10 mm = 1 cm, about the width of a fingernail." },
];
