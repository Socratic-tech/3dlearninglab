import { validateCurriculum, lessons } from "../src/content";

const problems = validateCurriculum();
console.log(`${lessons.length} lessons loaded.`);
if (problems.length) {
  console.log(problems.join("\n"));
  process.exit(1);
}
console.log("Curriculum is valid.");
