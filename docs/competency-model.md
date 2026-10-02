# Competency & proficiency model

66 competencies in domains A–G (`src/content/competencies.ts`), each with an “I can…” statement, a stage
(Follow → Modify → Combine → Solve → Design) and `autoAssessable` (conceptual skills a skill check may verify).

Levels: NOT YET ATTEMPTED · DEVELOPING (I) · PROFICIENT (II) · INDEPENDENT (III). Always shown with glyph + text.

Rules (`src/lib/mastery.ts`, tested in `tests/unit/mastery.test.ts`):

- Stored in `student_competencies`, separate from `lesson_progress`. Completing a lesson grants no level.
- **Best level wins** — an early failure never lowers mastery; Week-14 evidence can lift a Week-4 struggle.
- Auto checks: correct *skill* check → Proficient for auto-assessable competencies, Developing otherwise; attempts → Developing.
- Teacher ratings on evidence (1/2/3) and rubric criteria (score/max ≥ 75 % → Proficient, 100 % → Independent) record evidence.
- Teacher override sets the level and starts a new evidence window: effective = max(override, evidence since override).
  Every change is written to `competency_history`; overrides also to `audit_logs`.
- Badges (`src/content/badges.ts`) are awarded when all required competencies reach the badge's level and removed only if a teacher lowers a level.
- Heatmap groups (`heatmapGroups`) aggregate competencies (floor of the mean, at least Developing once attempted).
