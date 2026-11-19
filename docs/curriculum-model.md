# Curriculum model

- **Paths** (`src/content/paths.ts`): `9-week`, `18-week`, `jr-starter` (grades 4–5), `level-up` (Pro CAD) and
  `puzzle-cube` (a 6-week project), each a list of weeks → lesson ids. The 9-week course has its own finish (Mini Design
  Sprint); it is not the first half of the 18-week course. Project paths open with review missions that teachers can
  turn off for classes that already know them.
- **Lessons** (`src/content/lessons/*.ts`): data-only records validated by `lessonSchema` (`src/content/schema.ts`):
  id, number, domain, kind (lesson/boss/lab/challenge/capstone/showcase), printLevel (digital/prototype/required),
  competencyIds, prerequisites, vocabulary, sections (DISCOVER/PRACTICE/APPLY/PROVE/REFLECT) of typed blocks, and a
  full teacher guide.
- **Blocks**: 22 reusable types (see docs/content-authoring.md). Scored blocks are graded on the server
  (`src/lib/scoring.ts`); answer keys are redacted before reaching the browser.
- **Per-course overrides** (`course_lesson_settings`): enabled, due date, print level, manual unlock.
- **Unlocking**: a lesson unlocks when its prerequisites *that are in the course path and enabled* are completed, or when
  the teacher manually unlocks it (e.g. Tinkercad unavailable). Completion — not proficiency — unlocks.
- **Standards** (`src/content/standards.ts`): structured records + a separate lesson↔standard mapping.
- The DB stores only stable string ids, so curriculum releases never require data migrations. `npm run content:export`
  dumps everything to JSON for a future CMS.

## Design tool per class

`courses.cad_tool` is `tinkercad` (default) or `simpcadx` (opt-in, set under Class settings → Design tool). It swaps only Tinkercad work: `tinkercadLaunch` buttons and steps (`stepsByTool.simpcadx`) and the "Do this in…" tag on challenges. Pro CAD missions keep the tool the lesson names (`onshape` or `fusion`). Lesson text, diagrams and vocabulary are still Tinkercad-worded until a lesson is adapted, and a SimpCAD X class sees a note on such steps. `navigating-tinkercad` is the pilot. The Pages (Apps Script) edition is Tinkercad-only for now.
