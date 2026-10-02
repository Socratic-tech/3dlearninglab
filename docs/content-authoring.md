# Content authoring

Lessons are plain TypeScript data files in `src/content/lessons/<lesson-id>.ts`, each exporting
`export const lesson: LessonInput = {...}`. They contain **no logic** — only data — so they can be exported to JSON
(`npm run content:export`) and moved into a CMS later.

After adding or renaming a lesson file:

```bash
npm run content:index      # regenerates src/content/lessons/index.ts
npm run content:validate   # schema + cross-reference validation (also runs in tests)
```

## The shape of a lesson

See `src/content/schema.ts` for the authoritative schema and `src/content/lessons/holes.ts` for a complete example.

Every lesson follows **DISCOVER → PRACTICE → APPLY → PROVE → REFLECT** using `sections` with those `phase` values.
A typical lesson: hook (`hero`) → very short explanation (`text`) → demonstration (`showMe`, `diagram`, `modelViewer`)
→ `prediction` → Tinkercad practice (`tinkercadLaunch`, `modelDownload`) → micro-challenge (`challenge` kind `micro`)
→ debug activity when appropriate (`hotspot`, `multipleChoice`) → independent skill check (`challenge` kind `prove` +
`uploadEvidence`) → `reflection`.

### Block reference

| type | purpose | scored? |
|---|---|---|
| `hero` | hook with optional diagram/model | — |
| `text` | short explanation. Supports `**bold**`, blank-line paragraphs, `- ` bullet lists, `` `code` `` | — |
| `callout` | tip / warning / safety / idea | — |
| `diagram` | inline SVG from `src/content/diagram-catalog.ts` | — |
| `image`, `video` | external media (video requires transcript) | — |
| `showMe` | step carousel; students can switch to **Read it** to see all steps as text | — |
| `modelViewer` | 3D viewer for a bundled model; `showLayers` adds a layer slider | — |
| `prediction` | student commits to an answer, then the reveal appears. `expectedOptionId` optional | completion |
| `multipleChoice` | `check: "skill"` makes it automated evidence for `competencyId` | yes |
| `ordering`, `matching` | items listed in correct order / correct pairs; UI shuffles | yes |
| `hotspot` | click a region of a 3D model; positions in model mm, Z-up (see model manifest anchors) | yes |
| `measurement` | numeric answer ± tolerance | yes |
| `slider` | drag a slider, watch a live scene (`overhang`, `clearance`, `scale`, `layers`, `infill`), answer ± tolerance | yes |
| `tinkercadLaunch` | Open Tinkercad (and the class's Tinkercad Classroom link) + steps | — |
| `modelDownload` | file cards with 3D preview, download, source and license | — |
| `uploadEvidence` | screenshot / STL / OBJ / share URL for teacher review | teacher |
| `reflection` | autosaved written reflection; becomes written evidence | teacher |
| `teacherCheck` | teacher observes and records a level | teacher |
| `challenge` | `micro`, `prove` or `boss` requirements card (boss = no tutorial, optional elapsed timer) | — |
| `journal` | embeds design-journal prompts (`journalPrompts` in `badges.ts`) | — |
| `observe` | Print-Detective style cards: notice / infer / evidence, then reveal | — |

### Rules

- Language for ages 10–14: short sentences, no walls of text, concrete numbers.
- Failure is normal: write feedback as **test results**, never "Wrong!". Ask "What would you change?"
- Never present universal tolerance numbers as absolute truth — fits depend on printer, material and calibration.
- Physical printing only where the physical result teaches something (calibration, tolerance, orientation/strength,
  critical fit, prototype, capstone). Navigation/grouping/mirror/text lessons are `digital`.
- Every misconception id used by an option must be described in `teacher.misconceptions`.
- Do not copy third-party curriculum wording, branding or assets.
- Standards mappings go in `src/content/standards.ts`, never in lesson prose.

## Flavor: real-world openers, clients and themes

`src/content/flavor.ts` adds personality without touching lesson files:

- **hook** (every lesson): an "In the real world" card on the first screen. Real facts only — check them before adding
  (e.g. the 2023 Terran 1 launch, 3D-printed hearing-aid shells and running-shoe midsoles, Dyson's 5,127 prototypes,
  OXO Good Grips, the 19.05 mm keyboard key pitch). Keep it under ~55 words.
- **clients** (by challenge id): a fictional person asking for the challenge, shown as a message. Must match the
  challenge's real requirements.
- **themes** (by challenge id): 2–3 "make it yours" options for open-ended challenges. Never for exact-spec tasks.

Style: second person, short, a little funny. No slang cosplay, no brand mascots or characters.
`tests/unit/flavor.test.ts` checks every lesson has a hook and every client/theme points at a real challenge.

`failGallery` blocks (Print Detective, Print Failures) show nicknamed fails with a clue, then reveal cause and fix.
