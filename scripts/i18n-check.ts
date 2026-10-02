/**
 * Translation coverage report.  npm run i18n:check  [-- --todo <dir>]
 *
 * Lists untranslated (missing) and outdated (stale: the English it was keyed to no longer exists) strings for
 * every lesson, the course data, flavor, UI text and diagram labels. With --todo, writes the missing English
 * strings as JSON files so they can be translated and merged into src/content/i18n/es/.
 */
import fs from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { lessons } from "../src/content";
import { extractStrings, type Overlay } from "../src/lib/i18n-content";
import { collectStrings } from "../src/lib/i18n";
import { sourceStrings } from "../src/content/i18n";
import { diagramComponents } from "../src/components/diagrams";

const root = process.cwd();
const es = (f: string) => path.join(root, "src/content/i18n/es", f);
const read = (f: string): Overlay => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : {});
const todoDir = process.argv.includes("--todo") ? process.argv[process.argv.indexOf("--todo") + 1] : null;
if (todoDir) fs.mkdirSync(todoDir, { recursive: true });

let missingTotal = 0;
function report(name: string, source: Overlay, tr: Overlay) {
  const missing = Object.keys(source).filter((k) => !tr[k]);
  const stale = Object.keys(tr).filter((k) => !(k in source));
  missingTotal += missing.length;
  if (missing.length || stale.length) console.log(`${name}: ${missing.length} missing, ${stale.length} stale${stale.length ? " → " + stale.slice(0, 3).join(", ") : ""}`);
  if (todoDir && missing.length) fs.writeFileSync(path.join(todoDir, `${name.replace(/[/\\]/g, "_")}.json`), JSON.stringify(Object.fromEntries(missing.map((k) => [k, source[k]])), null, 1));
}

for (const l of lessons) report(`lessons/${l.id}`, extractStrings(l), read(es(`lessons/${l.id}.json`)));
report("course", sourceStrings.course(), read(es("course.json")));
report("flavor", sourceStrings.flavor(), read(es("flavor.json")));

// UI: every literal passed to tr()/trn() in student-facing code, plus labels passed indirectly
const files = ["src/components", "src/lib", "web/src"].flatMap((d) => walk(path.join(root, d))).filter((f) => /\.(tsx?|ts)$/.test(f));
function walk(d: string): string[] {
  return fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
}
const ui = new Set<string>();
for (const f of files) {
  if (f.includes("/diagrams/") || f.includes("TeacherPage") || f.includes("SetupPage")) continue;
  const src = fs.readFileSync(f, "utf8");
  for (const m of src.matchAll(/\btrn?\(\s*(?:[^,"()]+,\s*)?"((?:[^"\\]|\\.)*)"(?:\s*,\s*"((?:[^"\\]|\\.)*)")?/g)) {
    [m[1], m[2]].filter(Boolean).forEach((s) => ui.add(JSON.parse(`"${s}"`)));
  }
}
for (const s of INDIRECT()) ui.add(s);
report("ui", Object.fromEntries([...ui].map((s) => [s, s])), read(es("ui.json")));

// Diagram labels (collected by rendering every diagram)
const labels = collectStrings(() => {
  for (const C of Object.values(diagramComponents)) renderToStaticMarkup(createElement(C, {}));
});
report("diagrams", Object.fromEntries(labels.map((s) => [s, s])), read(es("diagrams.json")));

console.log(missingTotal ? `\n${missingTotal} strings still need Spanish.` : "\nSpanish is complete.");

/** Strings that reach tr() through variables (labels, statuses, phase names). */
function INDIRECT() {
  return [
    "Discover", "Practice", "Apply", "Prove", "Reflect",
    "Predict", "Lock in", "Check", "Check your skill", "Quick check", "Put in order", "Match", "Find the problem", "Check this spot", "Measure", "Try it",
    "Submitted", "Draft saved", "Saving…", "Couldn't save — keep this tab open and we'll retry", "Saved", "Couldn't save — retrying when you type again",
    "Screenshot (PNG/JPG)", "STL file", "OBJ file", "Tinkercad design link", "Physical test result",
    "Do this in Tinkercad", "Do this offline — paper, tools or real objects", "Part offline, part in Tinkercad", "In person, with your teacher",
    "CC0 (public domain)", "Public domain", "Permissive license",
    "Make a prediction", "Skill check", "Put the steps in order", "Match them up", "Measure it", "Submit your design",
    "You can come back to this one.",
    "Waiting for teacher", "Approved — in line", "Printing now", "Ready to pick up", "Print failed", "Cancelled",
    "Micro challenge", "Prove it", "Boss battle",
    "Blueprint", "Neon", "Arcade", "Sunset", "Galaxy",
    "done", "locked", "keep going", "start here", "ready",
    "Drag to orbit · Right-drag/two-finger to pan · Scroll/pinch to zoom",
  ];
}
