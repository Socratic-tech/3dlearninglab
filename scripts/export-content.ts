/** Writes the validated curriculum as JSON (CMS migration path).  npm run content:export [outDir] */
import fs from "node:fs";
import path from "node:path";
import { lessons, competencies, domains, paths, badges, rubrics, standards, lessonStandards, modelAssets, journalPrompts } from "../src/content";

const out = path.resolve(process.argv[2] ?? "content-export");
fs.mkdirSync(out, { recursive: true });
const files = { lessons, competencies, domains, paths, badges, rubrics, standards, lessonStandards, modelAssets, journalPrompts };
for (const [name, data] of Object.entries(files)) fs.writeFileSync(path.join(out, `${name}.json`), JSON.stringify(data, null, 2));
console.log(`Exported ${Object.keys(files).length} collections to ${out}`);
