import "server-only";
import path from "node:path";
import fs from "node:fs/promises";
import { env } from "../env";

/**
 * Object storage behind an interface (spec §38). Keys look like `evidence/<orgId>/<studentId>/<uuid>-<name>`.
 * Private files are only ever delivered through /api/files after an authorization check.
 */
export interface StorageProvider {
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<{ body: Buffer; contentType?: string } | null>;
  delete(key: string): Promise<void>;
}

class LocalStorage implements StorageProvider {
  constructor(private root: string) {}
  private file(key: string) {
    const resolved = path.resolve(this.root, key);
    if (!resolved.startsWith(path.resolve(this.root) + path.sep)) throw new Error("Invalid storage key");
    return resolved;
  }
  async put(key: string, body: Buffer, contentType: string) {
    const f = this.file(key);
    await fs.mkdir(path.dirname(f), { recursive: true });
    await fs.writeFile(f, body);
    await fs.writeFile(f + ".meta.json", JSON.stringify({ contentType }));
  }
  async get(key: string) {
    try {
      const f = this.file(key);
      const body = await fs.readFile(f);
      const meta = JSON.parse(await fs.readFile(f + ".meta.json", "utf8").catch(() => "{}"));
      return { body, contentType: meta.contentType as string | undefined };
    } catch {
      return null;
    }
  }
  async delete(key: string) {
    const f = this.file(key);
    await fs.rm(f, { force: true });
    await fs.rm(f + ".meta.json", { force: true });
  }
}

/** Supabase Storage via its REST API (no SDK dependency). Bucket must be PRIVATE. */
class SupabaseStorage implements StorageProvider {
  constructor(
    private url: string,
    private serviceKey: string,
    private bucket: string,
  ) {}
  private endpoint(key: string) {
    return `${this.url.replace(/\/$/, "")}/storage/v1/object/${this.bucket}/${key.split("/").map(encodeURIComponent).join("/")}`;
  }
  private headers(extra: Record<string, string> = {}) {
    return { Authorization: `Bearer ${this.serviceKey}`, apikey: this.serviceKey, ...extra };
  }
  async put(key: string, body: Buffer, contentType: string) {
    const res = await fetch(this.endpoint(key), {
      method: "POST",
      headers: this.headers({ "Content-Type": contentType, "x-upsert": "true" }),
      body: new Uint8Array(body),
    });
    if (!res.ok) throw new Error(`Supabase upload failed: ${res.status} ${await res.text()}`);
  }
  async get(key: string) {
    const res = await fetch(this.endpoint(key), { headers: this.headers() });
    if (res.status === 404 || res.status === 400) return null;
    if (!res.ok) throw new Error(`Supabase download failed: ${res.status}`);
    return { body: Buffer.from(await res.arrayBuffer()), contentType: res.headers.get("content-type") ?? undefined };
  }
  async delete(key: string) {
    await fetch(`${this.url.replace(/\/$/, "")}/storage/v1/object/${this.bucket}`, {
      method: "DELETE",
      headers: this.headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({ prefixes: [key] }),
    });
  }
}

let provider: StorageProvider | undefined;
export function storage(): StorageProvider {
  if (provider) return provider;
  if (env.STORAGE_PROVIDER === "supabase") {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for STORAGE_PROVIDER=supabase");
    provider = new SupabaseStorage(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, env.SUPABASE_STORAGE_BUCKET);
  } else {
    provider = new LocalStorage(path.resolve(env.LOCAL_STORAGE_DIR));
  }
  return provider;
}

export function setStorageForTests(p: StorageProvider | undefined) {
  provider = p;
}

export class MemoryStorage implements StorageProvider {
  files = new Map<string, { body: Buffer; contentType: string }>();
  async put(key: string, body: Buffer, contentType: string) {
    this.files.set(key, { body, contentType });
  }
  async get(key: string) {
    return this.files.get(key) ?? null;
  }
  async delete(key: string) {
    this.files.delete(key);
  }
}

// ───────── Upload validation (spec §39) ─────────

export type UploadKind = "screenshot" | "stl" | "obj";
const RULES: Record<UploadKind, { exts: string[]; mimes: string[]; maxMb: number }> = {
  screenshot: { exts: [".png", ".jpg", ".jpeg", ".webp", ".gif"], mimes: ["image/png", "image/jpeg", "image/webp", "image/gif"], maxMb: 10 },
  stl: { exts: [".stl"], mimes: ["model/stl", "application/sla", "application/vnd.ms-pki.stl", "application/octet-stream", "model/x.stl-binary", "model/x.stl-ascii", ""], maxMb: 50 },
  obj: { exts: [".obj"], mimes: ["model/obj", "text/plain", "application/octet-stream", ""], maxMb: 50 },
};

export function kindForFileName(name: string): UploadKind | null {
  const ext = path.extname(name).toLowerCase();
  for (const [k, r] of Object.entries(RULES)) if (r.exts.includes(ext)) return k as UploadKind;
  return null;
}

/** Validates by extension, declared type, size AND magic bytes. Returns the safe content type. */
export function validateUpload(name: string, declaredType: string, body: Buffer, orgMaxMb?: number): { kind: UploadKind; contentType: string } {
  const kind = kindForFileName(name);
  if (!kind) throw new Error("Only PNG/JPG/WebP/GIF screenshots and STL/OBJ model files can be uploaded.");
  const rule = RULES[kind];
  const maxMb = Math.min(rule.maxMb, orgMaxMb ?? env.MAX_UPLOAD_MB);
  if (body.length > maxMb * 1024 * 1024) throw new Error(`That file is larger than ${maxMb} MB.`);
  if (body.length === 0) throw new Error("That file is empty.");
  if (declaredType && !rule.mimes.includes(declaredType)) throw new Error("That file type doesn't match its name.");
  const head = body.subarray(0, 16);
  if (kind === "screenshot") {
    const isPng = head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
    const isJpg = head[0] === 0xff && head[1] === 0xd8;
    const isGif = head.subarray(0, 3).toString("ascii") === "GIF";
    const isWebp = head.subarray(0, 4).toString("ascii") === "RIFF" && body.subarray(8, 12).toString("ascii") === "WEBP";
    if (!(isPng || isJpg || isGif || isWebp)) throw new Error("That image file looks damaged or isn't really an image.");
    return { kind, contentType: isPng ? "image/png" : isJpg ? "image/jpeg" : isGif ? "image/gif" : "image/webp" };
  }
  if (kind === "stl") {
    const ascii = body.subarray(0, 5).toString("ascii").toLowerCase() === "solid";
    const binaryOk = body.length >= 84 && 84 + body.readUInt32LE(80) * 50 === body.length;
    if (!ascii && !binaryOk) throw new Error("That STL file looks damaged. Try exporting it again.");
    return { kind, contentType: "model/stl" };
  }
  const text = body.subarray(0, 4096).toString("utf8");
  if (!/^\s*(#|v |o |g |mtllib|vn |vt |f )/m.test(text)) throw new Error("That OBJ file looks damaged. Try exporting it again.");
  return { kind, contentType: "model/obj" };
}

export function safeFileName(name: string): string {
  const base = path.basename(name).replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-80);
  return base || "file";
}
