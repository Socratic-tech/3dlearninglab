/**
 * Lesson content feed (Pages edition).
 *
 * Each teacher's Apps Script copy is the "engine": sign-in, rosters, saving work, scoring. It changes rarely.
 * Lessons, questions and answer keys are DATA published on the website (apps-script/content.json). The engine
 * downloads it, checks it, and keeps the last good copy. Lesson edits then reach every class with a push, and
 * no code from the website ever runs inside a teacher's Sheet — a bad push can at worst show wrong lesson data,
 * never touch accounts or student work.
 *
 * Answer keys are scrambled (same idea as answer-pack.ts): obfuscation so students can't casually read them.
 */
import { keystream } from "./answer-pack";

/** What this engine can understand. Bump when content needs new engine features (e.g. a new scorable block type). */
export const ENGINE = 2;
export const FEED_FORMAT = 1;
const SALT = "3dda.feed1|";

export type Feed = { format: number; engine: number; version: string; checksum: string; data: string };

/** Short non-cryptographic checksum (FNV-1a) — catches truncated or mangled downloads. */
export function checksum(text: string): string {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16) + ":" + text.length;
}

export function feedKeystream(version: string, n: number): Uint8Array {
  return keystream(SALT + version, n);
}

/** Build side (Node): content object → feed file. */
export function encodeFeed(content: unknown, version: string, engine = ENGINE): Feed {
  const text = JSON.stringify(content);
  const bytes = new TextEncoder().encode(text);
  const ks = feedKeystream(version, bytes.length);
  for (let i = 0; i < bytes.length; i++) bytes[i] ^= ks[i];
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return { format: FEED_FORMAT, engine, version, checksum: checksum(text), data: btoa(s) };
}

const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === "object" && !Array.isArray(x);

/** Returns a reason the content can't be used, or null when it looks right. Runs in the engine before switching. */
export function validateServerContent(c: unknown): string | null {
  if (!isObj(c)) return "not an object";
  const lessons = c.lessons;
  if (!isObj(lessons) || Object.keys(lessons).length === 0) return "no lessons";
  for (const [id, l] of Object.entries(lessons)) {
    if (!isObj(l) || typeof l.title !== "string" || !Array.isArray(l.prerequisites) || !Array.isArray(l.required) || !isObj(l.blocks)) return "bad lesson " + id;
    for (const [bid, b] of Object.entries(l.blocks)) {
      if (!isObj(b) || b.id !== bid || typeof b.type !== "string") return "bad block " + id + "/" + bid;
    }
  }
  const paths = c.paths;
  if (!isObj(paths)) return "no paths";
  for (const p of ["9-week", "18-week"]) {
    const list = paths[p];
    if (!Array.isArray(list) || !list.length) return "missing path " + p;
    for (const id of list) if (!lessons[id as string]) return "path " + p + " names unknown lesson " + String(id);
  }
  if (!isObj(c.competencyIds) || !isObj(c.autoAssessable) || !Array.isArray(c.journalPrompts)) return "missing competency data";
  if (c.es !== undefined && !isObj(c.es)) return "bad translations";
  return null;
}

/** Node/browser decode (tests and tools). The engine has its own copy using Apps Script's Utilities. */
export function decodeFeed(feed: Feed): unknown {
  const s = atob(feed.data);
  const bytes = new Uint8Array(s.length);
  const ks = feedKeystream(feed.version, s.length);
  for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i) ^ ks[i];
  const text = new TextDecoder().decode(bytes);
  if (checksum(text) !== feed.checksum) throw new Error("feed checksum mismatch");
  return JSON.parse(text);
}
