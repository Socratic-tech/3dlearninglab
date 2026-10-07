/**
 * Try-It mode: the class "Sheet" lives in this browser instead of Google.
 *
 * The site downloads the same Apps Script application bundle a teacher's Sheet runs (apps-script/bundle.js) and runs it
 * here, against small stand-ins for SpreadsheetApp, Drive, CacheService and friends. Scoring, mastery, XP, unlocks and
 * the teacher dashboard are therefore the real ones — only the storage is different:
 *
 *   - Tables are kept in localStorage (academy.trydata.book). Uploaded files go to IndexedDB (academy-tryit / files).
 *   - Nothing leaves the device. "Progress files" (export/import) are how work moves between devices or to a teacher.
 *
 * Loaded on demand (dynamic import) so Google-mode visitors never download it.
 */
import { LOCAL_API } from "./config";

export const OWNER_EMAIL = "teacher@try.local";
export const LOCAL_CLIENT_ID = "try-local";
const BOOK_KEY = "academy.trydata.book";
const FILE_PREFIX = "lf"; // file ids made here: lf<uuid>, shown to the app as Drive links and swapped for object URLs
const DRIVE_LINK = /https:\/\/drive\.google\.com\/file\/d\/(lf[\w-]+)\/view/g;

type Row = unknown[];
export type Book = { sheets: Record<string, Row[]>; props: Record<string, string> };
type StoredFile = { id: string; name: string; type: string; base64: string };
type Api = { doPost(e: { postData: { contents: string } }): string; setup(): string };

// ───────────────────────── Storage ─────────────────────────

let book: Book = { sheets: {}, props: {} };
let storageOk = true;

function readBook(): Book {
  try {
    const raw = localStorage.getItem(BOOK_KEY);
    if (raw) {
      const b = JSON.parse(raw) as Book;
      if (b && typeof b === "object" && b.sheets) return { sheets: b.sheets, props: b.props ?? {} };
    }
  } catch { storageOk = false; }
  return { sheets: {}, props: {} };
}

function saveBook() {
  try { localStorage.setItem(BOOK_KEY, JSON.stringify(book)); storageOk = true; } catch { storageOk = false; }
}

/** False when the browser refused to keep the data (private window, managed Chromebook, storage full). */
export const localStorageWorks = () => storageOk;

const DB = "academy-tryit";
function idb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore("files", { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function putFiles(files: StoredFile[]) {
  if (!files.length) return;
  try {
    const db = await idb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("files", "readwrite");
      files.forEach((f) => tx.objectStore("files").put(f));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch { /* uploads just won't open after a reload */ }
}
async function getFiles(ids: string[]): Promise<StoredFile[]> {
  if (!ids.length) return [];
  try {
    const db = await idb();
    return await Promise.all(ids.map((id) => new Promise<StoredFile | null>((resolve) => {
      const req = db.transaction("files").objectStore("files").get(id);
      req.onsuccess = () => resolve((req.result as StoredFile) ?? null);
      req.onerror = () => resolve(null);
    }))).then((xs) => xs.filter((x): x is StoredFile => !!x));
  } catch {
    return [];
  }
}
async function clearFiles() {
  try {
    const db = await idb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction("files", "readwrite");
      tx.objectStore("files").clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch { /* nothing stored */ }
}

// ───────────────────────── Byte helpers (Apps Script uses signed bytes) ─────────────────────────

const toSigned = (u: Uint8Array) => Array.from(u, (b) => (b > 127 ? b - 256 : b));
const toUnsigned = (s: number[]) => Uint8Array.from(s, (b) => b & 255);
function b64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64.replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function bytesToB64(u: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < u.length; i += 0x8000) bin += String.fromCharCode(...u.subarray(i, i + 0x8000));
  return btoa(bin);
}
const utf8 = (s: string) => new TextEncoder().encode(s);
const b64url = (u: Uint8Array) => bytesToB64(u).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/** Not cryptographic: the engine only uses the digest as a cache key for sign-ins. */
function digest(s: string): number[] {
  const out: number[] = [];
  for (let seed = 0; seed < 8; seed++) {
    let h = 0x811c9dc5 ^ seed;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
    out.push((h >>> 24) - 128, ((h >>> 16) & 255) - 128, ((h >>> 8) & 255) - 128, (h & 255) - 128);
  }
  return out;
}

// ───────────────────────── Sign-in tokens for this device ─────────────────────────

/** An unsigned token in the same shape as a Google ID token. It never leaves the browser. */
export function makeToken(email: string, name: string) {
  const header = b64url(utf8(JSON.stringify({ alg: "none", typ: "JWT" })));
  const exp = Math.floor(Date.now() / 1000) + 10 * 365 * 24 * 3600;
  const payload = b64url(utf8(JSON.stringify({ email, name, exp, sub: "local-" + email, local: true })));
  return `${header}.${payload}.local`;
}
function claimsOf(token: string) {
  try {
    const json = new TextDecoder().decode(b64ToBytes(token.split(".")[1]));
    const p = JSON.parse(json) as { email: string; name?: string; exp: number; sub?: string };
    return { aud: LOCAL_CLIENT_ID, email: p.email, email_verified: "true", exp: String(p.exp), sub: p.sub ?? "local", name: p.name ?? p.email.split("@")[0] };
  } catch {
    return null;
  }
}

// ───────────────────────── Stand-ins for the Apps Script services ─────────────────────────

function sheetOf(name: string) {
  const data = book.sheets[name];
  const sh = {
    getLastRow: () => data.length,
    getRange: (r: number, c: number, nr = 1, nc = 1) => {
      const range = {
        getValues: () => data.slice(r - 1, r - 1 + nr).map((row) => Array.from({ length: nc }, (_, j) => row[c - 1 + j] ?? "")),
        setValues: (v: Row[]) => {
          v.forEach((row, i) => {
            data[r - 1 + i] = [...(data[r - 1 + i] ?? [])];
            row.forEach((x, j) => (data[r - 1 + i][c - 1 + j] = x));
          });
          return range;
        },
        setFontWeight: () => range,
        setNumberFormat: () => range,
      };
      return range;
    },
    appendRow: (row: Row) => { data.push([...row]); return sh; },
    deleteRow: (r: number) => { data.splice(r - 1, 1); },
    setFrozenRows: () => sh,
    hideSheet: () => sh,
    clear: () => { data.length = 0; return sh; },
    autoResizeColumns: () => sh,
    getName: () => name,
  };
  return sh;
}

const spreadsheet = {
  getSheetByName: (n: string) => (book.sheets[n] ? sheetOf(n) : null),
  insertSheet: (n: string) => { book.sheets[n] = book.sheets[n] ?? []; return sheetOf(n); },
  getName: () => "Try-It (this device)",
  getId: () => "try-local",
};

const cache = new Map<string, string>();
let pendingFiles: StoredFile[] = [];

function userError(message: string) {
  const e = new Error(message) as Error & { userMessage: string };
  e.userMessage = message;
  return e;
}

function services() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Detroit";
  const blob = (bytes: number[] | string, type = "application/octet-stream", name = "file") => ({
    bytes, type, name,
    getName: () => name,
    getDataAsString: () => (Array.isArray(bytes) ? new TextDecoder().decode(toUnsigned(bytes)) : String(bytes)),
    getBytes: () => bytes,
  });
  return {
    SpreadsheetApp: {
      getActiveSpreadsheet: () => spreadsheet,
      openById: () => spreadsheet,
      getUi: () => { throw new Error("No Sheet menu in Try-It mode."); },
    },
    LockService: { getScriptLock: () => ({ tryLock: () => true, waitLock: () => {}, releaseLock: () => {} }) },
    CacheService: {
      getScriptCache: () => ({
        get: (k: string) => cache.get(k) ?? null,
        put: (k: string, v: string) => { cache.set(k, v); },
        putAll: (o: Record<string, string>) => Object.entries(o).forEach(([k, v]) => cache.set(k, v)),
        getAll: (keys: string[]) => Object.fromEntries(keys.filter((k) => cache.has(k)).map((k) => [k, cache.get(k)!])),
        remove: (k: string) => { cache.delete(k); },
        removeAll: (keys: string[]) => keys.forEach((k) => cache.delete(k)),
      }),
    },
    Session: { getEffectiveUser: () => ({ getEmail: () => OWNER_EMAIL }), getActiveUser: () => ({ getEmail: () => OWNER_EMAIL }), getScriptTimeZone: () => tz },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (k: string) => book.props[k] ?? null,
        setProperty: (k: string, v: string) => { book.props[k] = String(v); },
        deleteProperty: (k: string) => { delete book.props[k]; },
        deleteAllProperties: () => { book.props = {}; },
        getProperties: () => ({ ...book.props }),
      }),
    },
    ScriptApp: { getService: () => ({ getUrl: () => null }), getScriptId: () => "try-local", getOAuthToken: () => "" },
    Drive: {
      Files: {
        create: (_meta: { name: string }, b?: ReturnType<typeof blob>) => {
          const id = FILE_PREFIX + crypto.randomUUID().replace(/-/g, "");
          if (b && Array.isArray(b.bytes)) pendingFiles.push({ id, name: b.name, type: b.type, base64: bytesToB64(toUnsigned(b.bytes)) });
          return { id };
        },
        get: (id: string) => ({ id, trashed: false }),
      },
    },
    DriveApp: { getFolderById: () => ({}), createFolder: () => ({ getId: () => "folder" }) },
    Classroom: new Proxy({}, { get: () => { throw userError("Google Classroom isn't connected in Try-It mode. Connect a Google Sheet to import rosters."); } }),
    Utilities: {
      base64Decode: (s: string) => toSigned(b64ToBytes(String(s))),
      base64Encode: (s: string | number[]) => bytesToB64(typeof s === "string" ? utf8(s) : toUnsigned(s)),
      base64EncodeWebSafe: (b: number[] | string) => b64url(typeof b === "string" ? utf8(b) : toUnsigned(b)),
      computeDigest: (_alg: unknown, s: string) => digest(String(s)),
      DigestAlgorithm: { SHA_256: "SHA_256" },
      Charset: { UTF_8: "UTF-8" },
      getUuid: () => crypto.randomUUID(),
      sleep: () => {},
      newBlob: blob,
      formatDate: (d: Date, zone: string) => new Intl.DateTimeFormat("en-CA", { timeZone: zone || tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(d),
    },
    UrlFetchApp: {
      fetch: (url: string) => {
        // Sign-ins made on this device are read locally. Everything else (lesson feed, version checks) uses the
        // lessons built into the bundle — the same build as this website.
        const m = /tokeninfo\?id_token=([^&]+)/.exec(url);
        const claims = m ? claimsOf(decodeURIComponent(m[1])) : null;
        return { getResponseCode: () => (claims ? 200 : 404), getContentText: () => (claims ? JSON.stringify(claims) : "") };
      },
    },
    ContentService: { createTextOutput: (s: string) => ({ setMimeType: () => s, getContent: () => s }), MimeType: { JSON: "json" } },
    HtmlService: { createHtmlOutput: () => ({}), createHtmlOutputFromFile: () => ({}) },
    Logger: { log: () => {} },
  };
}

// ───────────────────────── Engine ─────────────────────────

let enginePromise: Promise<Api> | null = null;

function setConfig(key: string, value: string) {
  const rows = book.sheets.Config ?? [];
  const row = rows.find((r, i) => i > 0 && r[0] === key);
  if (row) row[1] = value;
  else rows.push([key, value, ""]);
}

export function engine(): Promise<Api> {
  if (!enginePromise) {
    enginePromise = (async () => {
      const res = await fetch(`${import.meta.env.BASE_URL}apps-script/bundle.js`, { cache: "no-cache" });
      if (!res.ok) throw new Error(`The app engine didn't download (HTTP ${res.status}).`);
      const code = await res.text();
      if (!/^\/\/ 3D Design Academy bundle /.test(code)) throw new Error("The app engine download was damaged. Reload the page.");
      book = readBook();
      const svc = services();
      const names = Object.keys(svc);
      const run = new Function(...names, `${code}\n;return { doPost: doPost, setup: setup };`) as (...a: unknown[]) => Api;
      const api = run(...names.map((n) => svc[n as keyof typeof svc]));
      if (!book.sheets.Config || book.sheets.Config.length < 2) {
        api.setup();
        setConfig("CLIENT_ID", LOCAL_CLIENT_ID);
        setConfig("ALLOWED_DOMAINS", "try.local");
        setConfig("MAX_UPLOAD_MB", "5");
        saveBook();
      }
      return api;
    })();
    enginePromise.catch(() => { enginePromise = null; });
  }
  return enginePromise;
}

/** Swap Drive-style links for files stored on this device into links the browser can open. */
const objectUrls = new Map<string, string>();
async function withFileLinks(text: string): Promise<string> {
  const ids = [...new Set([...text.matchAll(DRIVE_LINK)].map((m) => m[1]))].filter((id) => !objectUrls.has(id));
  for (const f of await getFiles(ids)) objectUrls.set(f.id, URL.createObjectURL(new Blob([b64ToBytes(f.base64)], { type: f.type })));
  return text.replace(DRIVE_LINK, (all, id: string) => objectUrls.get(id) ?? all);
}

/** Same contract as POSTing to a teacher's Apps Script: request JSON in, response JSON text out. */
export async function localPost(body: string): Promise<string> {
  const api = await engine();
  pendingFiles = [];
  const out = api.doPost({ postData: { contents: body } });
  saveBook();
  const files = pendingFiles;
  pendingFiles = [];
  await putFiles(files);
  return withFileLinks(out);
}

/** Run one action as someone on this device (setup helpers below). */
async function act<T>(email: string, name: string, action: string, args: Record<string, unknown> = {}): Promise<T> {
  const r = JSON.parse(await localPost(JSON.stringify({ action, token: makeToken(email, name), requestId: crypto.randomUUID(), args }))) as { ok: boolean; data: T; error?: string };
  if (!r.ok) throw new Error(r.error || "Something went wrong.");
  return r.data;
}

// ───────────────────────── Starting a session on this device ─────────────────────────

type ClassRow = { classId: string; name: string; pathId: string; status: string };
function classes(): ClassRow[] {
  const rows = book.sheets.Classes ?? [];
  const h = rows[0] as string[] | undefined;
  if (!h) return [];
  return rows.slice(1).map((r) => Object.fromEntries(h.map((k, i) => [k, r[i]])) as ClassRow).filter((c) => c.status !== "archived");
}

/** A student starting fresh: they join this device's Try-It class for the course length they pick. */
export async function startStudent(name: string, pathId: "9-week" | "18-week") {
  await engine();
  const label = pathId === "9-week" ? "Try-It · 9 weeks" : "Try-It · 18 weeks";
  let cls = classes().find((c) => c.name === label);
  if (!cls) {
    const made = await act<{ id: string }>(OWNER_EMAIL, "Teacher", "createClass", { name: label, section: "", pathId });
    cls = { classId: made.id, name: label, pathId, status: "active" };
  }
  const email = `s-${crypto.randomUUID().slice(0, 8)}@try.local`;
  await act(OWNER_EMAIL, "Teacher", "addStudents", { classId: cls.classId, students: [{ email, name: name.trim() || "Student" }] });
  return { token: makeToken(email, name.trim() || "Student"), classId: cls.classId };
}

/** A teacher exploring: the owner of this device's workbook (classes are made on the dashboard). */
export async function startTeacher() {
  await engine();
  return { token: makeToken(OWNER_EMAIL, "Teacher"), classId: classes()[0]?.classId ?? null };
}

/** Students already on this device, so someone can pick themselves instead of starting over. */
export async function localStudents(): Promise<{ email: string; name: string }[]> {
  await engine();
  const rows = book.sheets.Users ?? [];
  const h = rows[0] as string[] | undefined;
  if (!h) return [];
  const ix = (k: string) => h.indexOf(k);
  return rows.slice(1)
    .filter((r) => r[ix("role")] === "student" && r[ix("status")] !== "archived" && !String(r[ix("email")]).includes("+student"))
    .map((r) => ({ email: String(r[ix("email")]), name: String(r[ix("name")] || r[ix("email")]) }));
}
export const tokenFor = (email: string, name: string) => makeToken(email, name);

// ───────────────────────── Progress files ─────────────────────────

export const FILE_KIND = "3d-design-academy/progress";
export type ProgressFile = {
  kind: typeof FILE_KIND;
  version: 1;
  scope: "student" | "everything";
  exportedAt: string;
  who: { email: string; name: string } | null;
  sheets: Record<string, Row[]>;
  props?: Record<string, string>;
  files: StoredFile[];
};

// Rows that belong to one student (by email). Rewards, Gallery and Redemptions are class settings — not carried over.
const PER_STUDENT = ["Users", "Enrollments", "Progress", "Attempts", "Levels", "History", "Evidence", "Journals", "Summary", "Prints"];
const HAS_CLASS = ["Enrollments", "Prints"];

function emailCol(rows: Row[]) {
  return ((rows[0] as string[]) ?? []).indexOf("email");
}
function fileIdsIn(rows: Row[] | undefined): string[] {
  if (!rows?.length) return [];
  const i = (rows[0] as string[]).indexOf("fileId");
  return i < 0 ? [] : rows.slice(1).map((r) => String(r[i] || "")).filter((x) => x.startsWith(FILE_PREFIX));
}

/** One student's work (for turning in or moving to another device), or the whole workbook (a teacher's backup). */
export async function exportProgress(who: { email: string; name: string } | null): Promise<ProgressFile> {
  await engine();
  let sheets: Record<string, Row[]>;
  if (who) {
    sheets = {};
    for (const t of PER_STUDENT) {
      const rows = book.sheets[t];
      if (!rows?.length) continue;
      const i = emailCol(rows);
      sheets[t] = [rows[0], ...rows.slice(1).filter((r) => String(r[i]).toLowerCase() === who.email.toLowerCase())];
    }
    const mine = new Set(((sheets.Enrollments ?? []).slice(1)).map((r) => String(r[(sheets.Enrollments[0] as string[]).indexOf("classId")])));
    const cls = book.sheets.Classes ?? [];
    if (cls.length) sheets.Classes = [cls[0], ...cls.slice(1).filter((r) => mine.has(String(r[0])))];
  } else {
    sheets = JSON.parse(JSON.stringify(book.sheets));
  }
  const ids = [...new Set([...fileIdsIn(sheets.Evidence), ...fileIdsIn(sheets.Prints)])];
  return {
    kind: FILE_KIND, version: 1, scope: who ? "student" : "everything", exportedAt: new Date().toISOString(),
    who, sheets, props: who ? undefined : { ...book.props }, files: await getFiles(ids),
  };
}

export function readProgressFile(text: string): ProgressFile {
  let f: ProgressFile;
  try { f = JSON.parse(text) as ProgressFile; } catch { throw new Error("That file isn't a 3D Design Academy progress file."); }
  if (!f || f.kind !== FILE_KIND || !f.sheets || typeof f.sheets !== "object") throw new Error("That file isn't a 3D Design Academy progress file.");
  if (f.version !== 1) throw new Error("That progress file comes from a newer version of the site. Reload this page and try again.");
  return f;
}

/** Copy a row into this workbook's column order (columns are matched by header name). */
function remap(fromHeader: string[], toHeader: string[], row: Row, patch: Record<string, unknown> = {}): Row {
  return toHeader.map((h) => (h in patch ? patch[h] : (fromHeader.indexOf(h) >= 0 ? row[fromHeader.indexOf(h)] ?? "" : "")));
}

/**
 * Bring one student's file into this workbook. Their old rows here (if any) are replaced by the file's.
 * intoClassId: the teacher's class to put them in. Without it, the file's own class comes along (moving devices).
 */
export async function importStudent(f: ProgressFile, intoClassId: string | null): Promise<{ email: string; name: string; classId: string | null }> {
  await engine();
  if (f.scope !== "student" || !f.who?.email) throw new Error("That's a full backup, not one student's progress file. Use Restore a backup instead.");
  const email = f.who.email.toLowerCase();
  if (!intoClassId) {
    const src = f.sheets.Classes;
    const dst = book.sheets.Classes;
    if (src?.length && dst?.length) {
      const have = new Set(dst.slice(1).map((r) => String(r[0])));
      for (const r of src.slice(1)) if (!have.has(String(r[0]))) dst.push(remap(src[0] as string[], dst[0] as string[], r));
    }
  }
  for (const t of PER_STUDENT) {
    const src = f.sheets[t];
    const dst = book.sheets[t];
    if (!dst?.length) continue;
    const di = emailCol(dst);
    // keep rows positions stable for everyone else: rebuild without this student's rows, then add theirs at the end
    book.sheets[t] = [dst[0], ...dst.slice(1).filter((r) => String(r[di]).toLowerCase() !== email)];
    if (!src?.length) continue;
    const si = emailCol(src);
    let rows = src.slice(1).filter((r) => String(r[si]).toLowerCase() === email);
    if (t === "Enrollments" && intoClassId) rows = rows.slice(0, 1);
    const patch: Record<string, unknown> = {};
    if (intoClassId && HAS_CLASS.includes(t)) patch.classId = intoClassId;
    if (t === "Users") Object.assign(patch, { role: "student", status: "active" });
    if (t === "Enrollments") Object.assign(patch, { status: "active" });
    for (const r of rows) book.sheets[t].push(remap(src[0] as string[], dst[0] as string[], r, patch));
  }
  if (intoClassId && (f.sheets.Enrollments?.length ?? 0) <= 1) {
    const dst = book.sheets.Enrollments;
    dst.push(remap(dst[0] as string[], dst[0] as string[], [], { email, classId: intoClassId, status: "active", source: "file", createdAt: new Date().toISOString() }));
  }
  cache.clear();
  saveBook();
  await putFiles(f.files ?? []);
  const enr = f.sheets.Enrollments;
  const classId = intoClassId ?? (enr && enr.length > 1 ? String(enr[1][(enr[0] as string[]).indexOf("classId")]) : null);
  return { email, name: f.who.name || email, classId };
}

/** Replace everything on this device with a teacher's backup. */
export async function restoreEverything(f: ProgressFile) {
  await engine();
  if (f.scope !== "everything") throw new Error("That's one student's progress file. Use Add student progress files instead.");
  book = { sheets: JSON.parse(JSON.stringify(f.sheets)), props: { ...(f.props ?? {}) } };
  cache.clear();
  saveBook();
  await clearFiles();
  await putFiles(f.files ?? []);
}

/** Erase every Try-It class, student and upload on this device. */
export async function eraseDevice() {
  try { localStorage.removeItem(BOOK_KEY); } catch { /* ignore */ }
  book = { sheets: {}, props: {} };
  cache.clear();
  enginePromise = null;
  await clearFiles();
}

export { LOCAL_API };
