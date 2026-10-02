import type { LessonBlock, BlockOf } from "@/content/schema";
import { nearestHotspot } from "@/components/viewer/geometry";

/**
 * Server-side scoring of interactive blocks, plus redaction so answers are never sent to the browser
 * before a student responds. Pure functions — unit tested.
 */
export type ScorableType = "prediction" | "multipleChoice" | "ordering" | "matching" | "hotspot" | "measurement" | "slider";
export const SCORABLE: ScorableType[] = ["prediction", "multipleChoice", "ordering", "matching", "hotspot", "measurement", "slider"];
export const isScorable = (b: LessonBlock): b is BlockOf<ScorableType> => (SCORABLE as string[]).includes(b.type);

export type BlockResponse =
  | { type: "prediction"; optionId: string }
  | { type: "multipleChoice"; optionIds: string[] }
  | { type: "ordering"; order: string[] }
  | { type: "matching"; pairs: Record<string, string> } // leftId -> rightId (pair ids)
  | { type: "hotspot"; point: [number, number, number] }
  | { type: "measurement"; value: number }
  | { type: "slider"; value: number };

export type ScoreResult = {
  /** null when the block has no right answer (open predictions) */
  correct: boolean | null;
  /** short headline in "test result" language */
  headline: string;
  feedback?: string;
  explanation: string;
  misconceptionId?: string;
  /** extra data revealed after answering (e.g. correct option ids, hotspot regions) */
  reveal: Record<string, unknown>;
};

const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));

/** Result headlines in each language (the rest of the feedback comes from the lesson content). */
const ES_HEADLINES: Record<string, string> = {
  "Test result: that works.": "Resultado: ¡funciona!",
  "Test result: not quite yet.": "Resultado: todavía no.",
  "Test result: sequence works.": "Resultado: el orden funciona.",
  "Test result: {n} of {total} in the right place.": "Resultado: {n} de {total} en el lugar correcto.",
  "Test result: every match holds.": "Resultado: todas las parejas son correctas.",
  "Test result: {n} of {total} matches hold.": "Resultado: {n} de {total} parejas son correctas.",
  "Found it: {label}.": "¡Lo encontraste! {label}.",
  "Test result: {label} looks okay.": "Resultado: {label} se ve bien.",
  "Test result: nothing wrong there. Look again.": "Resultado: ahí no hay ningún problema. Vuelve a mirar.",
  "Test result: that measurement checks out.": "Resultado: esa medida es correcta.",
  "Test result: that doesn't match yet.": "Resultado: todavía no coincide.",
  "Nailed it!": "¡Lo lograste!",
  "Not quite — try a bit more.": "Casi: prueba con un poco más.",
  "Not quite — try a bit less.": "Casi: prueba con un poco menos.",
};
export type Lang = "en" | "es";
const H = (lang: Lang, en: string, vars: Record<string, string | number> = {}) =>
  (lang === "es" ? ES_HEADLINES[en] ?? en : en).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));

export function scoreBlock(block: LessonBlock, response: BlockResponse, lang: Lang = "en"): ScoreResult {
  if (block.type !== response.type) throw new Error(`Response type ${response.type} does not match block ${block.type}`);
  switch (block.type) {
    case "prediction": {
      const r = response as Extract<BlockResponse, { type: "prediction" }>;
      const opt = block.options.find((o) => o.id === r.optionId);
      if (!opt) throw new Error("Unknown option");
      const correct = block.expectedOptionId ? r.optionId === block.expectedOptionId : null;
      return {
        correct,
        headline: block.revealTitle,
        feedback: opt.feedback,
        explanation: block.reveal,
        misconceptionId: opt.misconceptionId,
        reveal: { expectedOptionId: block.expectedOptionId ?? null },
      };
    }
    case "multipleChoice": {
      const r = response as Extract<BlockResponse, { type: "multipleChoice" }>;
      const correct = sameSet(r.optionIds, block.correctOptionIds);
      const chosen = block.options.filter((o) => r.optionIds.includes(o.id));
      const wrongChosen = chosen.find((o) => !block.correctOptionIds.includes(o.id));
      return {
        correct,
        headline: correct ? H(lang, "Test result: that works.") : H(lang, "Test result: not quite yet."),
        feedback: (wrongChosen ?? chosen[0])?.feedback,
        explanation: block.explanation,
        misconceptionId: wrongChosen?.misconceptionId,
        reveal: { correctOptionIds: correct ? block.correctOptionIds : [] },
      };
    }
    case "ordering": {
      const r = response as Extract<BlockResponse, { type: "ordering" }>;
      const target = block.items.map((i) => i.id);
      const correct = r.order.length === target.length && r.order.every((id, i) => id === target[i]);
      const inPlace = r.order.filter((id, i) => id === target[i]).length;
      return {
        correct,
        headline: correct ? H(lang, "Test result: sequence works.") : H(lang, "Test result: {n} of {total} in the right place.", { n: inPlace, total: target.length }),
        explanation: block.explanation,
        reveal: correct ? { order: target } : {},
      };
    }
    case "matching": {
      const r = { ...(response as Extract<BlockResponse, { type: "matching" }>) };
      r.pairs = { ...r.pairs };
      // A choice is right if it belongs to ANY pair with the same left label, so "sort into groups" blocks
      // (two Subtractive rows, two Additive rows) accept either example in either row.
      const pairForChoice = (choice: string | undefined) => block.pairs.find((q) => choice === q.id || choice === matchToken(block.id, q.id));
      const ok = (p: { id: string; left: string }) => pairForChoice(r.pairs[p.id])?.left === p.left;
      const used = Object.values(r.pairs);
      if (new Set(used).size !== used.length) {
        // the same example picked twice can only be right once
        const seen = new Set<string>();
        for (const p of block.pairs) {
          const c = r.pairs[p.id];
          if (c && seen.has(c)) delete r.pairs[p.id];
          else if (c) seen.add(c);
        }
      }
      const right = block.pairs.filter(ok).length;
      const correct = right === block.pairs.length;
      return {
        correct,
        headline: correct ? H(lang, "Test result: every match holds.") : H(lang, "Test result: {n} of {total} matches hold.", { n: right, total: block.pairs.length }),
        explanation: block.explanation,
        reveal: correct ? {} : { correctPairIds: block.pairs.filter(ok).map((p) => p.id) },
      };
    }
    case "hotspot": {
      const r = response as Extract<BlockResponse, { type: "hotspot" }>;
      const hit = nearestHotspot(r.point, block.hotspots);
      const h = hit ? block.hotspots.find((x) => x.id === hit.id) : undefined;
      const correct = Boolean(h?.correct);
      return {
        correct,
        headline: h ? (correct ? H(lang, "Found it: {label}.", { label: h.label }) : H(lang, "Test result: {label} looks okay.", { label: h.label })) : H(lang, "Test result: nothing wrong there. Look again."),
        feedback: h?.feedback,
        explanation: correct ? block.explanation : "",
        reveal: { hitId: h?.id ?? null, revealedIds: correct ? [h!.id] : h ? [h.id] : [] },
      };
    }
    case "measurement": {
      const r = response as Extract<BlockResponse, { type: "measurement" }>;
      if (!Number.isFinite(r.value)) throw new Error("Not a number");
      const correct = Math.abs(r.value - block.answer) <= block.tolerance + 1e-9;
      return {
        correct,
        headline: correct ? H(lang, "Test result: that measurement checks out.") : H(lang, "Test result: that doesn't match yet."),
        feedback: correct ? undefined : block.hint,
        explanation: correct ? block.explanation : "",
        reveal: correct ? { answer: block.answer } : {},
      };
    }
    case "slider": {
      const r = response as Extract<BlockResponse, { type: "slider" }>;
      if (!Number.isFinite(r.value) || r.value < block.min - 1e-9 || r.value > block.max + 1e-9) throw new Error("Out of range");
      const correct = Math.abs(r.value - block.answer) <= block.tolerance + 1e-9;
      return {
        correct,
        headline: correct ? H(lang, "Nailed it!") : r.value < block.answer ? H(lang, "Not quite — try a bit more.") : H(lang, "Not quite — try a bit less."),
        feedback: correct ? undefined : block.hint,
        explanation: correct ? block.explanation : "",
        reveal: correct ? { answer: block.answer } : {},
      };
    }
    default:
      throw new Error(`Block type ${(block as LessonBlock).type} is not scorable`);
  }
}

/** After repeated attempts, reveal the explanation even if still incorrect so nobody is stuck (spec §47). */
export const REVEAL_AFTER_ATTEMPTS = 3;

/**
 * Remove answer keys before sending a block to a student's browser.
 * Explanations/answers are returned by the server only after a response.
 */
export function redactBlock(block: LessonBlock): LessonBlock {
  switch (block.type) {
    case "prediction":
      return { ...block, expectedOptionId: undefined, reveal: "", options: block.options.map((o) => ({ ...o, feedback: undefined, misconceptionId: undefined })) };
    case "multipleChoice":
      return {
        ...block,
        // keep the number of correct answers so the UI can choose radio vs checkbox
        correctOptionIds: block.correctOptionIds.map((_, i) => `?${i}`),
        explanation: "",
        options: block.options.map((o) => ({ ...o, feedback: undefined, misconceptionId: undefined })),
      };
    case "ordering":
      return { ...block, items: deterministicShuffle(block.items, block.id), explanation: "" };
    case "matching": {
      const rights = deterministicShuffle(
        block.pairs.map((p) => ({ id: p.id, right: p.right })),
        block.id + ":r",
      );
      // left side in authored order, right side shuffled: ids are kept so responses map pairId → pairId
      // right options carry opaque tokens so the DOM doesn't reveal which right belongs to which left
      return { ...block, pairs: block.pairs.map((p, i) => ({ id: p.id, left: p.left, right: `${matchToken(block.id, rights[i].id)}::${rights[i].right}` })), explanation: "" };
    }
    case "hotspot":
      return { ...block, explanation: "", hotspots: block.hotspots.map((h) => ({ ...h, correct: false, feedback: "" })) };
    case "measurement":
      return { ...block, answer: 0, tolerance: 0, explanation: "" };
    case "slider":
      return { ...block, answer: 0, tolerance: 0, hint: undefined, explanation: "" };
    default:
      return block;
  }
}

/** Opaque, stable token for a matching option (not guessable from the left-side id). */
export function matchToken(blockId: string, pairId: string): string {
  let h = 2166136261;
  for (const c of `${blockId}|${pairId}|academy`) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return "m" + (h >>> 0).toString(36);
}

/** Seeded shuffle so server and client render the same order. Never returns the original order for ≥3 items. */
export function deterministicShuffle<T>(items: T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
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
  if (out.length >= 3 && out.every((x, i) => x === items[i])) out.push(out.shift()!);
  return out;
}

/** What the browser is allowed to know about a scored response. */
export type ClientResult = {
  correct: boolean | null;
  headline: string;
  feedback?: string;
  explanation?: string;
  reveal: Record<string, unknown>;
  locked: boolean;
  attempts: number;
};

export function toClientResult(block: LessonBlock, score: ScoreResult, attemptsSoFar: number): ClientResult {
  const locked = block.type === "prediction" || score.correct === true || score.correct === null;
  const showExplanation = locked || attemptsSoFar >= REVEAL_AFTER_ATTEMPTS;
  let reveal = score.reveal;
  let explanation = showExplanation ? score.explanation || undefined : undefined;
  if (showExplanation && score.correct === false) {
    // after several tries, show the worked answer too
    const full = scoreBlockAnswerKey(block);
    reveal = { ...reveal, ...full.reveal };
    explanation = full.explanation;
  }
  return { correct: score.correct, headline: score.headline, feedback: score.feedback, explanation, reveal, locked, attempts: attemptsSoFar };
}

/** The answer key, revealed only after enough attempts. */
function scoreBlockAnswerKey(block: LessonBlock): { explanation: string; reveal: Record<string, unknown> } {
  switch (block.type) {
    case "multipleChoice":
      return { explanation: block.explanation, reveal: { correctOptionIds: block.correctOptionIds } };
    case "ordering":
      return { explanation: block.explanation, reveal: { order: block.items.map((i) => i.id) } };
    case "matching":
      return { explanation: block.explanation, reveal: { correctPairIds: block.pairs.map((p) => p.id), solved: true } };
    case "hotspot":
      return { explanation: block.explanation, reveal: { revealedIds: block.hotspots.filter((h) => h.correct).map((h) => h.id) } };
    case "measurement":
    case "slider":
      return { explanation: block.explanation, reveal: { answer: block.answer } };
    default:
      return { explanation: "", reveal: {} };
  }
}

