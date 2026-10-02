# Curriculum model

- **Paths** (`src/content/paths.ts`): `9-week` and `18-week`, each a list of weeks → lesson ids. The 9-week course has its
  own finish (Mini Design Sprint); it is not the first half of the 18-week course.
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
