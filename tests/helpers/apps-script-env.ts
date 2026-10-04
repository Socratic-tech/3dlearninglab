/** In-memory fakes of the Apps Script runtime that execute apps-script/dist for tests and local smoke runs. */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createHash } from "node:crypto";

const dist = path.join(process.cwd(), "apps-script/dist");

/** Test tokens are "tok:<email>" or an unsigned JWT whose payload has an email claim. */
function emailFromToken(t: string) {
  if (t.startsWith("tok:")) return t.slice(4);
  try { return JSON.parse(Buffer.from(t.split(".")[1], "base64url").toString()).email as string; } catch { return "bad@x"; }
}

export type Row = unknown[];
function fakeSheet() {
  const data: Row[] = [];
  const sh = {
    getLastRow: () => data.length,
    getRange: (r: number, c: number, nr = 1, nc = 1) => {
      const range = {
      getValues: () => data.slice(r - 1, r - 1 + nr).map((row) => Array.from({ length: nc }, (_, j) => (row[c - 1 + j] ?? ""))),
      setValues: (v: Row[]) => { v.forEach((row, i) => { data[r - 1 + i] = [...(data[r - 1 + i] ?? [])]; row.forEach((x, j) => (data[r - 1 + i][c - 1 + j] = x)); }); return range; },
      setFontWeight: () => range,
      };
      return range;
    },
    appendRow: (row: Row) => data.push([...row]),
    setFrozenRows: () => {},
    autoResizeColumns: () => {},
    data,
  };
  return sh;
}

type ScriptApiCall = { method: string; path: string; body: unknown };
export type ScriptApiFake = (call: ScriptApiCall) => { code: number; body: unknown };

/** Default fake of the Apps Script API: versions and deployments succeed, web app open to Anyone. */
export const okScriptApi: ScriptApiFake = ({ method, path }) => {
  if (method === "post" && path === "/versions") return { code: 200, body: { versionNumber: 1 } };
  if (method === "post" && path === "/deployments") return { code: 200, body: { deploymentId: "AKfyAuto", entryPoints: [{ entryPointType: "WEB_APP", webApp: { url: "https://script.google.com/a/macros/school.org/s/AKfyAuto/exec", entryPointConfig: { access: "ANYONE_ANONYMOUS", executeAs: "USER_DEPLOYING" } } }] } };
  return { code: 200, body: {} };
};

export function makeEnv(owner = "teacher@school.org", opts: { webAppUrl?: string; scriptId?: string; scriptApi?: ScriptApiFake } = {}) {
  const scriptApiCalls: ScriptApiCall[] = [];
  const sheets = new Map<string, ReturnType<typeof fakeSheet>>();
  const book = {
    getSheetByName: (n: string) => sheets.get(n) ?? null,
    insertSheet: (n: string) => { const s = fakeSheet(); sheets.set(n, s); return s; },
  };
  const cache = new Map<string, string>();
  const files: { name: string }[] = [];
  const folders: string[] = [];
  const folder = { getFoldersByName: () => ({ hasNext: () => false }), createFolder: () => folder, createFile: (b: { name: string }) => { files.push(b); return { getId: () => "file" + files.length }; }, getId: () => "root" };
  const props = new Map<string, string>();
  const ctx: Record<string, unknown> = {
    console,
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ ...book, getName: () => "Test book" }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }) },
    CacheService: { getScriptCache: () => ({ get: (k: string) => cache.get(k) ?? null, put: (k: string, v: string) => cache.set(k, v), remove: (k: string) => cache.delete(k) }) },
    Session: { getEffectiveUser: () => ({ getEmail: () => owner }), getScriptTimeZone: () => "America/Detroit" },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k: string) => props.get(k) ?? null, setProperty: (k: string, v: string) => props.set(k, v), deleteAllProperties: () => props.clear() }) },
    ScriptApp: { getService: () => ({ getUrl: () => opts.webAppUrl ?? null }), getScriptId: () => opts.scriptId ?? "script-1", getOAuthToken: () => "oauth" },
    DriveApp: { getFolderById: () => folder, createFolder: () => folder },
    Drive: {
      Files: {
        create: (meta: { name: string; mimeType?: string }, blob?: { name: string }) => {
          if (blob) files.push(blob);
          else folders.push(meta.name);
          return { id: (blob ? "file" : "folder") + (blob ? files.length : folders.length) };
        },
        get: (id: string) => ({ id, trashed: false }),
      },
    },
    Utilities: {
      base64EncodeWebSafe: (b: number[]) => Buffer.from(b).toString("base64url"),
      computeDigest: (_a: unknown, s: string) => [...createHash("sha256").update(s).digest()],
      DigestAlgorithm: { SHA_256: "sha" },
      getUuid: () => Math.random().toString(36).slice(2),
      sleep: () => {},
      base64Decode: (s: string) => [...Buffer.from(s, "base64")].map((b) => (b > 127 ? b - 256 : b)),
      newBlob: (_b: unknown, type: string, name: string) => ({ name, type, getName: () => name }),
      formatDate: (d: Date, tz: string) => new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(d),
    },
    UrlFetchApp: {
      // token format for tests: "tok:<email>"
      fetch: (url: string, o: { method?: string; payload?: string } = {}) => {
        const api = url.match(/^https:\/\/script\.googleapis\.com\/v1\/projects\/[^/]+(\/.*)$/);
        if (api) {
          const call = { method: o.method ?? "get", path: api[1], body: o.payload ? JSON.parse(o.payload) : undefined };
          scriptApiCalls.push(call);
          const r = (opts.scriptApi ?? okScriptApi)(call);
          return { getResponseCode: () => r.code, getContentText: () => JSON.stringify(r.body) };
        }
        const email = emailFromToken(decodeURIComponent(url.split("id_token=")[1]));
        const ok = !email.startsWith("bad");
        return {
          getResponseCode: () => (ok ? 200 : 400),
          getContentText: () => JSON.stringify({ aud: "client-123", email, email_verified: "true", exp: String(Math.floor(Date.now() / 1000) + 3600), sub: "sub-" + email, name: email.split("@")[0] }),
        };
      },
    },
    ContentService: { createTextOutput: (s: string) => ({ setMimeType: () => s }), MimeType: { JSON: "json" } },
  };
  vm.createContext(ctx);
  for (const f of ["Lib.js", "Content.js", "Code.js"]) vm.runInContext(fs.readFileSync(path.join(dist, f), "utf8"), ctx, { filename: f });
  vm.runInContext("setup()", ctx);
  const cfg = sheets.get("Config")!;
  cfg.data.forEach((r) => { if (r[0] === "CLIENT_ID") r[1] = "client-123"; if (r[0] === "ALLOWED_DOMAINS") r[1] = "school.org"; });
  const raw = (body: string) => vm.runInContext(`doPost(${JSON.stringify({ postData: { contents: body } })})`, ctx) as string;
  const call = (email: string, action: string, args: Record<string, unknown> = {}) => JSON.parse(raw(JSON.stringify({ action, token: "tok:" + email, args })));
  const run = (code: string) => JSON.parse(vm.runInContext(`JSON.stringify(${code})`, ctx) as string);
  return { call, raw, run, sheets, files, folders, props, scriptApiCalls };
}

