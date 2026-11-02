/**
 * Turns a lesson and its teacher guide into a slide-by-slide plan for a classroom deck (no rendering here, so it
 * runs anywhere and is easy to test). `render.ts` draws the plan as a .pptx that opens in Google Slides and
 * PowerPoint.
 *
 * The deck is for the projector: student-facing text on the slides, teacher moves and background in the speaker
 * notes. It never shows answers: the public lesson data is redacted anyway, and the full edition's data is treated
 * the same way (ordering and matching items are shuffled; correct options and explanations are left out).
 */
import type { Lesson, LessonBlock, TeacherGuide } from "@/content/schema";

export type SlideKind =
  | "title"
  | "hook"
  | "goals"
  | "agenda"
  | "vocab"
  | "section"
  | "content"
  | "step"
  | "together"
  | "think"
  | "challenge"
  | "reflect"
  | "discuss"
  | "exit"
  | "close";

export type SlideSpec = {
  kind: SlideKind;
  /** Small label above the title ("Show me · 2 of 4", "Think about it"). */
  eyebrow?: string;
  title: string;
  /** A paragraph under the title. */
  body?: string;
  /** Bulleted (or lettered/numbered) list. */
  bullets?: string[];
  listStyle?: "bullet" | "letter" | "number" | "check";
  /** Two-column rows (term/definition, minutes/segment). */
  rows?: { left: string; right: string; tag?: string }[];
  diagram?: string;
  diagramAlt?: string;
  caption?: string;
  /** A short coloured chip, e.g. "Devices down · 12 min". */
  chip?: string;
  /** Speaker notes: teacher-only. */
  notes: string;
};

export type DeckInput = {
  lesson: Pick<Lesson, "id" | "number" | "title" | "subtitle" | "summary" | "estimatedMinutes" | "vocabulary" | "sections">;
  guide?: Partial<TeacherGuide>;
  /** Real-world opener from the flavor file, if the lesson has one. */
  hook?: { headline: string; body: string };
};

const PHASE_LABEL: Record<string, string> = { discover: "Discover", practice: "Practice", apply: "Apply", prove: "Prove it", reflect: "Reflect" };

/** Markdown → plain slide text (bold, italics, code and links unwrapped). */
export function plain(md: string): string {
  return md
    .replace(/^\s*[-*]\s+/gm, "• ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/(^|[^*\w])\*([^*\n]+)\*(?!\w)/g, "$1$2")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#+\s*/gm, "")
    .trim();
}

/** Stable shuffle so a list never shows in its answer order, but the deck is the same every time. */
function stableShuffle<T>(items: T[], seed: string): T[] {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const rand = () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  // Never leave it in the original order when there's more than one item.
  if (out.length > 1 && out.every((x, i) => x === items[i])) out.push(out.shift()!);
  return out;
}

const joinNotes = (...parts: (string | number | false | undefined | null)[]) => parts.filter((p): p is string => typeof p === "string" && p.length > 0).join("\n\n");

function chunk<T>(xs: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i += n) out.push(xs.slice(i, i + n));
  return out;
}

/** "If students choose …: response" lines for options tied to a known misconception. */
function misconceptionNotes(options: { text: string; misconceptionId?: string }[], guide?: Partial<TeacherGuide>): string | undefined {
  const lines = options
    .filter((o) => o.misconceptionId)
    .map((o) => {
      const m = guide?.misconceptions?.find((x) => x.id === o.misconceptionId);
      return m ? `If students choose "${plain(o.text)}": ${plain(m.response)}` : null;
    })
    .filter(Boolean);
  return lines.length ? "Listen for misconceptions:\n" + lines.join("\n") : undefined;
}

const THINK_NOTES = "Give quiet think time first. Then have students show their choice (fingers, whiteboards or cards) before anyone explains. Ask a few students why, not just what.";

function blockSlides(b: LessonBlock, guide: Partial<TeacherGuide> | undefined, sectionTitle: string, next?: LessonBlock): SlideSpec[] {
  switch (b.type) {
    case "hero":
      return [{ kind: "content", title: b.title, body: plain(b.hook), diagram: b.visual?.diagram, diagramAlt: b.visual?.alt, notes: "Read the hook aloud, then ask: what do you already know about this?" }];
    case "text": {
      // A text block followed by a diagram shares one slide with it.
      const pair = next?.type === "diagram" ? next : undefined;
      return [{ kind: "content", title: b.title ?? sectionTitle, body: plain(b.body), diagram: pair?.name, diagramAlt: pair?.alt, caption: pair?.caption, notes: "" }];
    }
    case "diagram":
      return [{ kind: "content", title: sectionTitle, diagram: b.name, diagramAlt: b.alt, caption: b.caption, notes: "Ask: what do you notice? What do you wonder? Let students describe the picture before you explain it." }];
    case "callout":
      return [{ kind: "content", eyebrow: { tip: "Tip", warning: "Watch out", safety: "Safety", idea: "Big idea" }[b.tone], title: b.title ?? sectionTitle, body: plain(b.body), notes: b.tone === "safety" ? "Safety point: read it aloud and check understanding before devices or tools come out." : "" }];
    case "showMe":
      return b.steps.map((s, i) => ({
        kind: "step" as const,
        eyebrow: `Show me · ${i + 1} of ${b.steps.length}`,
        title: b.title,
        body: plain(s.text),
        diagram: s.diagram,
        chip: s.keys ? `Keys: ${s.keys}` : undefined,
        notes: i === 0 ? "Model this live in the CAD tool if you can, thinking aloud. Students can follow the same steps in their own lesson later." : "",
      }));
    case "teacherLed":
      return [{
        kind: "together",
        eyebrow: "Together",
        title: b.title,
        body: plain(b.students),
        chip: [b.devices === "away" ? "Devices down" : "On devices", b.minutes ? `${b.minutes} min` : ""].filter(Boolean).join(" · "),
        notes: "Your moves: " + plain(b.teacher),
      }];
    case "prediction":
    case "multipleChoice":
      return [{
        kind: "think",
        eyebrow: b.type === "prediction" ? "Predict" : "Think about it",
        title: plain(b.prompt),
        bullets: b.options.map((o) => plain(o.text)),
        listStyle: "letter",
        diagram: b.visual?.diagram,
        diagramAlt: b.visual?.alt,
        notes: joinNotes(THINK_NOTES, b.hint && `Hint if they're stuck: ${plain(b.hint)}`, misconceptionNotes(b.options, guide)),
      }];
    case "ordering":
      return [{ kind: "think", eyebrow: "Put it in order", title: plain(b.prompt), bullets: stableShuffle(b.items, b.id).map((x) => plain(x.text)), listStyle: "bullet", notes: joinNotes("Students can order these on sticky notes or by numbering them in pairs before checking in the lesson.", b.hint && `Hint: ${plain(b.hint)}`) }];
    case "matching": {
      const rights = stableShuffle(b.pairs.map((p) => p.right), b.id);
      return [{ kind: "think", eyebrow: "Match them up", title: plain(b.prompt), rows: b.pairs.map((p, i) => ({ left: plain(p.left), right: plain(rights[i]) })), notes: joinNotes("Pairs can draw lines between the columns on a whiteboard.", b.hint && `Hint: ${plain(b.hint)}`) }];
    }
    case "measurement":
    case "slider":
      return [{ kind: "think", eyebrow: "Work it out", title: plain(b.prompt), diagram: b.type === "measurement" ? b.visual?.diagram : undefined, notes: joinNotes("Ask students to show their working, not just the number. Several methods are welcome.", b.hint && `Hint: ${plain(b.hint)}`) }];
    case "hotspot":
      return [{ kind: "think", eyebrow: "Find it", title: plain(b.prompt), notes: joinNotes("Students click the model in their lesson; on the projector, open the lesson and ask volunteers to point.", b.hint && `Hint: ${plain(b.hint)}`) }];
    case "tinkercadLaunch": {
      const tool = { tinkercad: "Tinkercad", onshape: "Onshape", fusion: "Fusion" }[b.tool ?? "tinkercad"];
      return [{ kind: "content", eyebrow: `In ${tool}`, title: b.title, bullets: b.steps.map(plain), listStyle: "number", chip: "On devices", notes: "Leave this slide up while students work so the steps stay visible. Circulate and ask questions rather than taking the mouse." }];
    }
    case "challenge":
      return [{
        kind: "challenge",
        eyebrow: b.kind === "boss" ? "Boss battle" : b.kind === "prove" ? "Prove it" : "Micro challenge",
        title: b.title,
        body: plain(b.prompt),
        bullets: b.requirements.map(plain),
        listStyle: "check",
        diagram: b.visual?.diagram,
        diagramAlt: b.visual?.alt,
        notes: b.kind === "micro" ? "Short practice: let students try before you help." : "No steps from here: students decide which tools to use. Point stuck students back to their own earlier work, not to the answer.",
      }];
    case "uploadEvidence":
      return [{ kind: "content", eyebrow: "Hand it in", title: plain(b.prompt), bullets: b.checklist.map(plain), listStyle: "check", notes: "Students can show evidence in more than one way (screenshot, link, photo of a sketch or a short recording), as the lesson allows." }];
    case "reflection":
      return [{ kind: "reflect", eyebrow: "Reflect", title: plain(b.prompt), bullets: b.sentenceStarters.map(plain), listStyle: "bullet", notes: "Students may write, type, dictate or record their reflection. Sentence starters are optional." }];
    case "observe":
      return b.cards.map((c, i) => ({ kind: "think" as const, eyebrow: `${b.title} · ${i + 1} of ${b.cards.length}`, title: plain(c.label), body: c.hint ? plain(c.hint) : undefined, diagram: c.diagram, bullets: b.questions, listStyle: "bullet" as const, notes: "What students should notice: " + plain(c.reveal) }));
    case "failGallery":
      return b.cards.map((c, i) => ({ kind: "think" as const, eyebrow: `${b.title} · ${i + 1} of ${b.cards.length}`, title: c.nickname, body: plain(c.clue), diagram: c.diagram, notes: `What went wrong: ${plain(c.cause)}\nThe fix: ${plain(c.fix)}` }));
    default:
      // video, image, modelViewer, modelDownload, journal, teacherCheck: on-device only.
      return [];
  }
}

/** The whole deck, in teaching order. */
export function planDeck({ lesson, guide, hook }: DeckInput): SlideSpec[] {
  const g = guide ?? {};
  const slides: SlideSpec[] = [];
  const bg = g.background ?? [];

  slides.push({
    kind: "title",
    eyebrow: `Mission ${lesson.number} · ${lesson.estimatedMinutes} min`,
    title: lesson.title,
    body: lesson.subtitle,
    notes: joinNotes(
      g.purpose && `Why this lesson: ${plain(g.purpose)}`,
      g.preparation?.length && "Before class:\n" + g.preparation.map((p) => "• " + plain(p)).join("\n"),
      bg.length > 0 && "Background (full version in the teacher guide):\n" + bg.map((s) => `${s.title}: ${plain(s.body)}`).join("\n\n"),
    ),
  });

  if (hook) {
    slides.push({
      kind: "hook",
      eyebrow: "In the real world",
      title: hook.headline,
      body: hook.body,
      notes: joinNotes("Ask: where else have you seen this?", g.connections?.length && "More connections to share:\n" + g.connections.map((c) => "• " + plain(c)).join("\n")),
    });
  }

  if (g.bigIdea || g.successCriteria?.length) {
    slides.push({
      kind: "goals",
      eyebrow: "Today's goal",
      title: g.bigIdea ? plain(g.bigIdea) : lesson.summary,
      bullets: (g.successCriteria ?? []).map(plain),
      listStyle: "check",
      notes: "Read the goal and the 'I can' statements aloud. Students will come back to them at the end to rate themselves.",
    });
  }

  if (g.runPlan?.length) {
    slides.push({
      kind: "agenda",
      eyebrow: "The plan for today",
      title: "Today",
      rows: g.runPlan.map((r) => ({ left: `${r.minutes} min`, right: r.title, tag: r.devices === "away" ? "Devices down" : "On devices" })),
      notes: g.runPlan.map((r) => `${r.title} (${r.minutes} min): ${plain(r.teacher)}`).join("\n"),
    });
  }

  chunk(lesson.vocabulary, 4).forEach((vs, i, all) => {
    slides.push({
      kind: "vocab",
      eyebrow: all.length > 1 ? `Words to know · ${i + 1} of ${all.length}` : "Words to know",
      title: "Words to know",
      rows: vs.map((v) => ({ left: v.term, right: plain(v.definition) })),
      notes: "Say each word, have students say it back, and point to an example on screen or in the room.",
    });
  });

  for (const s of lesson.sections) {
    slides.push({ kind: "section", eyebrow: PHASE_LABEL[s.phase] ?? s.phase, title: s.title, notes: "" });
    s.blocks.forEach((b, i) => {
      const prev = s.blocks[i - 1];
      if (b.type === "diagram" && prev?.type === "text") return; // already shown with its text
      slides.push(...blockSlides(b, g, s.title, s.blocks[i + 1]));
    });
  }

  if (g.discussionQuestions?.length) {
    slides.push({ kind: "discuss", eyebrow: "Let's talk", title: "Discussion", bullets: g.discussionQuestions.map(plain), listStyle: "bullet", notes: "Try think-pair-share: a minute alone, a minute with a partner, then share out. Students can answer by speaking, writing or sketching." });
  }
  if (g.exitTicket?.length) {
    slides.push({ kind: "exit", eyebrow: "Before you go", title: "Exit ticket", bullets: g.exitTicket.map(plain), listStyle: "number", notes: joinNotes("Students can write, draw or say their answers.", g.lookFors?.length && "Look for:\n" + g.lookFors.map((l) => "• " + plain(l)).join("\n")) });
  }
  slides.push({
    kind: "close",
    eyebrow: "How did it go?",
    title: g.successCriteria?.length ? "Rate yourself" : "Today we…",
    body: g.successCriteria?.length ? "For each one: 1 = not yet, 2 = getting there, 3 = I could teach it." : plain(lesson.summary),
    bullets: (g.successCriteria ?? []).map(plain),
    listStyle: "check",
    notes: "Use the ratings to plan who you check in with first next lesson.",
  });

  // Student questions go in the notes of the slide where they're most likely to come up: the first content slide.
  if (g.studentQuestions?.length) {
    const first = slides.find((s) => s.kind === "section");
    if (first) first.notes = joinNotes(first.notes, "Questions students often ask:\n" + g.studentQuestions.map((q) => `Q: ${plain(q.q)}\nA: ${plain(q.a)}`).join("\n"));
  }
  return slides;
}
