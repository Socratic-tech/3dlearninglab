/**
 * Instant feedback for practice questions.
 *
 * The public site never contains readable answer keys. For practice questions (not skill checks) the build adds
 * a scrambled copy of the full block ("k"), so the browser can score instantly with the same scoring code the
 * server uses. The server still records every attempt and stays the source of truth. Skill checks get no pack:
 * they are always scored by the server.
 *
 * This is obfuscation, not security: a determined student with dev tools could decode it, which tells them no
 * more than trying every option would — and every attempt is still recorded.
 */
import type { LessonBlock } from "@/content/schema";

function keystream(seed: string, n: number): Uint8Array {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
    out[i] = h & 255;
  }
  return out;
}

const SALT = "3dda.k1|";

function toBase64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return typeof btoa === "function" ? btoa(s) : Buffer.from(bytes).toString("base64");
}
function fromBase64(b64: string): Uint8Array {
  if (typeof atob === "function") {
    const s = atob(b64);
    const out = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
    return out;
  }
  return new Uint8Array(Buffer.from(b64, "base64"));
}

/** Which questions get instant feedback: everything scorable except skill checks. */
export function packable(block: LessonBlock): boolean {
  const scorable = ["prediction", "multipleChoice", "ordering", "matching", "hotspot", "measurement", "slider"].includes(block.type);
  return scorable && !("check" in block && block.check === "skill");
}

export function encodePack(block: LessonBlock): string {
  const bytes = new TextEncoder().encode(JSON.stringify(block));
  const ks = keystream(SALT + block.id, bytes.length);
  for (let i = 0; i < bytes.length; i++) bytes[i] ^= ks[i];
  return toBase64(bytes);
}

export function decodePack<T extends LessonBlock>(redacted: T): T | null {
  const k = (redacted as unknown as { k?: string }).k;
  if (!k) return null;
  try {
    const bytes = fromBase64(k);
    const ks = keystream(SALT + redacted.id, bytes.length);
    for (let i = 0; i < bytes.length; i++) bytes[i] ^= ks[i];
    return JSON.parse(new TextDecoder().decode(bytes)) as T;
  } catch {
    return null;
  }
}
