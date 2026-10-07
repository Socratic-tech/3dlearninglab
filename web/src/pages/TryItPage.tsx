/**
 * Try-It mode screens: the start screen (who are you?) and the bar shown over every page while in Try-It mode.
 * The class lives in this browser (local-engine.ts). Progress files move work to another device or to a teacher.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Download, FolderOpen, GraduationCap, HardDrive, Presentation, Upload, UserPlus } from "lucide-react";
import { Alert, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { resetDevice, setCurrentClassId } from "../config";
import { setLocalToken, signOut } from "../auth";
import type { Me } from "../content";

type Engine = typeof import("../local-engine");
const engine = (): Promise<Engine> => import("../local-engine");

function storageWorks() {
  try {
    localStorage.setItem("academy.trydata.probe", "1");
    localStorage.removeItem("academy.trydata.probe");
    return true;
  } catch {
    return false;
  }
}

/** Read a chosen file as text. */
const readText = (f: File) => new Promise<string>((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(String(r.result));
  r.onerror = () => reject(r.error);
  r.readAsText(f);
});

function download(name: string, data: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
const safeName = (s: string) => s.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 40) || "student";
const today = () => new Date().toISOString().slice(0, 10);

/** Leave Try-It mode for the Google Sheet setup. Work on this device stays (it can be re-entered later). */
function connectGoogle() {
  signOut();
  resetDevice();
  location.replace(location.pathname);
}

// ───────────────────────── Start screen ─────────────────────────

export function TryItStart({ onStarted }: { onStarted: (token: string) => void }) {
  const [who, setWho] = useState<"student" | "teacher" | null>(null);
  const [name, setName] = useState("");
  const [pathId, setPathId] = useState<"9-week" | "18-week">("18-week");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [known, setKnown] = useState<{ email: string; name: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const kept = storageWorks();

  useEffect(() => { void engine().then((e) => e.localStudents()).then(setKnown).catch(() => setKnown([])); }, []);

  const begin = async (fn: (e: Engine) => Promise<{ token: string; classId: string | null }>) => {
    setBusy(true);
    setErr(null);
    try {
      const r = await fn(await engine());
      if (r.classId) setCurrentClassId(r.classId);
      setLocalToken(r.token);
      onStarted(r.token);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  };

  const loadFile = async (f: File | undefined) => {
    if (!f) return;
    await begin(async (e) => {
      const file = e.readProgressFile(await readText(f));
      if (file.scope === "everything") {
        await e.restoreEverything(file);
        return e.startTeacher();
      }
      const s = await e.importStudent(file, null);
      return { token: e.tokenFor(s.email, s.name), classId: s.classId };
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-8">
      <header className="text-center">
        <p className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-sm font-semibold"><HardDrive className="size-4" aria-hidden /> Try-It mode</p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">Start designing right now</h1>
        <p className="mt-2 text-lg text-muted">No Google account, no setup. Your work is saved in this browser, on this device.</p>
      </header>

      {!kept && (
        <Alert tone="warning" title="This browser won't keep your work">
          It may be a private window or a locked-down computer. You can still try everything, but use <b>Save progress file</b> before you close the tab.
        </Alert>
      )}

      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Who are you?">
        <Choice active={who === "student"} onClick={() => setWho("student")} icon={<GraduationCap className="size-7" aria-hidden />} title="I'm a student" sub="Start my missions" />
        <Choice active={who === "teacher"} onClick={() => setWho("teacher")} icon={<Presentation className="size-7" aria-hidden />} title="I'm a teacher" sub="Explore the course and dashboard" />
      </div>

      {who === "student" && (
        <Card className="space-y-5">
          {known.length > 0 && (
            <div>
              <p className="font-display text-lg font-semibold">Pick up where you left off</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {known.map((s) => (
                  <Button key={s.email} variant="secondary" disabled={busy} onClick={() => void begin(async (e) => ({ token: e.tokenFor(s.email, s.name), classId: null }))}>{s.name}</Button>
                ))}
              </div>
              <p className="mt-4 border-t border-border pt-4 font-display text-lg font-semibold">Or start new</p>
            </div>
          )}
          <form className="space-y-4" onSubmit={(ev) => { ev.preventDefault(); void begin((e) => e.startStudent(name, pathId)); }}>
            <Field label="Your first name" htmlFor="tryit-name" hint="It's only shown on this device.">
              <Input id="tryit-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" maxLength={40} required />
            </Field>
            <fieldset>
              <legend className="mb-2 font-semibold">Which course is your class doing?</legend>
              <div className="flex flex-wrap gap-2">
                {(["9-week", "18-week"] as const).map((p) => (
                  <label key={p} className={cn("flex cursor-pointer items-center gap-2 rounded-xl border-2 px-4 py-2", pathId === p ? "border-primary bg-primary-soft" : "border-border")}>
                    <input type="radio" name="tryit-path" className="size-4" checked={pathId === p} onChange={() => setPathId(p)} />
                    {p === "9-week" ? "9 weeks" : "18 weeks"}
                  </label>
                ))}
              </div>
              <p className="mt-1 text-sm text-muted">Not sure? Pick 18 weeks.</p>
            </fieldset>
            <Button type="submit" size="lg" disabled={busy || !name.trim()}>{busy ? "Getting ready…" : "Start my missions"}</Button>
          </form>
        </Card>
      )}

      {who === "teacher" && (
        <Card className="space-y-3">
          <p className="text-lg">You&apos;ll get the full teacher dashboard and can switch to <b>Student view</b> to play any mission yourself.</p>
          <ul className="list-disc space-y-1 pl-5 text-muted">
            <li>Students in Try-It mode save on their own devices. They click <b>Save progress file</b> and turn it in (for example on Google Classroom).</li>
            <li>You click <b>Add student files</b> to see their work on your dashboard.</li>
            <li>Ready for live class tracking? Connect a Google Sheet any time.</li>
          </ul>
          <Button size="lg" disabled={busy} onClick={() => void begin((e) => e.startTeacher())}>{busy ? "Getting ready…" : "Open the teacher dashboard"}</Button>
        </Card>
      )}

      {err && <Alert tone="danger" title="That didn't work">{err}</Alert>}

      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
        <button type="button" className="inline-flex items-center gap-1.5 font-semibold underline" onClick={() => fileRef.current?.click()} disabled={busy}>
          <FolderOpen className="size-4" aria-hidden /> I have a progress file
        </button>
        <input ref={fileRef} type="file" accept=".json,application/json" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => void loadFile(e.target.files?.[0])} />
        <button type="button" className="font-semibold underline" onClick={connectGoogle}>Use a Google Sheet instead</button>
      </div>
    </div>
  );
}

function Choice({ active, onClick, icon, title, sub }: { active: boolean; onClick: () => void; icon: ReactNode; title: string; sub: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 rounded-2xl border-2 bg-surface p-5 text-center transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
        active ? "border-primary bg-primary-soft" : "border-border",
      )}
    >
      <span className="text-primary">{icon}</span>
      <span className="font-display text-lg font-semibold">{title}</span>
      <span className="text-sm text-muted">{sub}</span>
    </button>
  );
}

// ───────────────────────── Bar shown on every page ─────────────────────────

export function TryItBar({ me, studentView }: { me: Me; studentView: boolean }) {
  const [msg, setMsg] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const openRef = useRef<HTMLInputElement>(null);
  const addRef = useRef<HTMLInputElement>(null);
  const restoreRef = useRef<HTMLInputElement>(null);
  const teacher = me.user.role === "teacher" && !studentView;

  const run = async (fn: (e: Engine) => Promise<string | void>) => {
    setBusy(true);
    setMsg(null);
    try {
      const text = await fn(await engine());
      if (text) setMsg({ tone: "success", text });
    } catch (e) {
      setMsg({ tone: "danger", text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  };

  const saveMine = () => run(async (e) => {
    download(`3D-Design-Academy-${safeName(me.user.name)}-${today()}.json`, await e.exportProgress({ email: me.user.email, name: me.user.name }));
    return "Saved. Turn this file in where your teacher asks (for example Google Classroom), or open it on another device.";
  });
  const backup = () => run(async (e) => {
    download(`3D-Design-Academy-backup-${today()}.json`, await e.exportProgress(null));
    return "Backup saved. Restore it on any computer to bring back every class, student and upload.";
  });
  const openMine = (f: File | undefined) => f && run(async (e) => {
    const s = await e.importStudent(e.readProgressFile(await readText(f)), null);
    if (s.classId) setCurrentClassId(s.classId);
    setLocalToken(e.tokenFor(s.email, s.name));
    location.reload();
  });
  // takes a copy of the chosen files: the picker is cleared right after (so the same file can be chosen again)
  const addStudents = (files: File[]) => files.length > 0 && run(async (e) => {
    if (!me.cls) throw new Error("Create a class first, then add student files to it.");
    const names: string[] = [];
    for (const f of files) {
      const s = await e.importStudent(e.readProgressFile(await readText(f)), me.cls.id);
      names.push(s.name);
    }
    setTimeout(() => location.reload(), 1200);
    return `Added to ${me.cls.name}: ${names.join(", ")}. Refreshing…`;
  });
  const restore = (f: File | undefined) => f && run(async (e) => {
    const file = e.readProgressFile(await readText(f));
    if (!confirm("Replace everything in Try-It mode on this device with this backup?")) return;
    await e.restoreEverything(file);
    location.reload();
  });

  return (
    <div className="border-t border-border bg-surface-2 print:hidden">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-2 gap-y-1 px-4 py-2 text-sm">
        <p className="mr-auto flex min-w-0 items-center gap-1.5"><HardDrive className="size-4 shrink-0" aria-hidden /><span><strong>Try-It mode</strong> · saved in this browser only</span></p>
        {teacher ? (
          <>
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => addRef.current?.click()}><UserPlus className="size-4" aria-hidden /> Add student files</Button>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => void backup()}><Download className="size-4" aria-hidden /> Back up</Button>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => restoreRef.current?.click()}><Upload className="size-4" aria-hidden /> Restore</Button>
            <Button size="sm" variant="ghost" onClick={connectGoogle}>Connect a Google Sheet</Button>
          </>
        ) : (
          <>
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => void saveMine()}><Download className="size-4" aria-hidden /> Save progress file</Button>
            {!studentView && <Button size="sm" variant="ghost" disabled={busy} onClick={() => openRef.current?.click()}><FolderOpen className="size-4" aria-hidden /> Open a file</Button>}
          </>
        )}
        <input ref={openRef} type="file" accept=".json,application/json" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => void openMine(e.target.files?.[0])} />
        <input ref={addRef} type="file" accept=".json,application/json" multiple className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => { const files = Array.from(e.target.files ?? []); e.target.value = ""; void addStudents(files); }} />
        <input ref={restoreRef} type="file" accept=".json,application/json" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; void restore(f); }} />
      </div>
      {msg && <div className="mx-auto max-w-5xl px-4 pb-2" role="status"><Alert tone={msg.tone}>{msg.text}</Alert></div>}
    </div>
  );
}
