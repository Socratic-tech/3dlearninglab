import { tr } from "@/lib/i18n";
import { useCallback, useEffect, useRef, useState } from "react";
import { Printer } from "lucide-react";
import { Alert, Card, Pill } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { call, fileToBase64 } from "../api";
import { tokenEmail } from "../auth";
import type { PrintJob } from "./TeacherPage";

const STATUS: Record<string, { label: string; help: string; tone: "neutral" | "primary" | "accent" | "success" | "danger" }> = {
  queued: { label: "In the print queue", help: "Waiting for its turn. Oldest requests print first.", tone: "primary" },
  redo: { label: "Changes needed", help: "Read the note, fix your design, and send it again.", tone: "danger" },
  printing: { label: "Printing now", help: "It's on the printer.", tone: "accent" },
  printed: { label: "Printed: ready to pick up", help: "Pick it up from the place named in the note.", tone: "success" },
  failed: { label: "Print failed", help: "Something went wrong with the print. Check the note, then send it again.", tone: "danger" },
  cancelled: { label: "Cancelled", help: "This request was cancelled.", tone: "neutral" },
};
const OPEN = ["queued", "redo", "printing"];
const MAX_MB = 10;

/**
 * School-wide print queue (#/queue). Anyone who signs in with an allowed school Google account can send a file or a
 * design link, class or no class. The person is identified by their verified Google sign-in, shown at the top.
 */
export function QueuePage({ apiUrl }: { apiUrl: string }) {
  const email = tokenEmail();
  const [prints, setPrints] = useState<PrintJob[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    const r = await call<{ prints: PrintJob[] }>(apiUrl, "myPrints");
    if (r.ok) { setPrints(r.data.prints); setError(null); } else setError(r.error);
  }, [apiUrl]);
  useEffect(() => { void load(); }, [load]);

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-4">
      <header>
        <h1 className="flex items-center gap-2 font-display text-3xl font-bold tracking-tight"><Printer className="size-8 text-primary" aria-hidden /> {tr("Send something to the 3D printer")}</h1>
        <p className="mt-1 text-lg text-muted">{tr("Three steps: choose your design, say what you need, send it. You can see where it is in line below.")}</p>
        {email && <p className="mt-2 text-sm" role="status">{tr("Signed in as")} <b>{email}</b>. {tr("Your request will have this name on it.")}</p>}
      </header>
      {error && !prints && <Alert tone="danger" title={tr("We couldn't open the print queue")}>{error}</Alert>}
      {(prints || !error) && <SubmitForm apiUrl={apiUrl} openCount={(prints ?? []).filter((p) => OPEN.includes(p.status)).length} onSent={load} />}
      {prints && <MyList apiUrl={apiUrl} prints={prints} onChange={load} />}
    </div>
  );
}

function SubmitForm({ apiUrl, openCount, onSent }: { apiUrl: string; openCount: number; onSent: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [copies, setCopies] = useState("1");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const tooBig = !!file && file.size > MAX_MB * 1024 * 1024;
  const ready = (!!file || /^https:\/\/\S+$/.test(url.trim())) && !tooBig;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready || busy) return;
    setBusy(true);
    setMsg(null);
    const payload = file ? { file: { name: file.name, type: file.type, base64: await fileToBase64(file) } } : {};
    const r = await call(apiUrl, "submitPrint", { ...payload, url: url.trim(), copies: Number(copies) || 1, note: note.trim() });
    setBusy(false);
    if (r.ok) {
      setFile(null); setUrl(""); setCopies("1"); setNote("");
      if (fileRef.current) fileRef.current.value = "";
      setMsg({ ok: true, text: tr("Sent! It's in the print queue. You can watch it below.") });
      onSent();
    } else setMsg({ ok: false, text: r.error });
  };

  return (
    <Card>
      <form onSubmit={send} className="space-y-5" aria-label={tr("Send a print request")}>
        <fieldset className="space-y-3">
          <legend className="font-display text-xl font-semibold">{tr("1. Choose your design")}</legend>
          <Field label={tr("Upload a file (.stl, .obj or .3mf)")} htmlFor="q-file" hint={tr("Up to 10 MB. In Tinkercad: Export → .STL.")}>
            <input ref={fileRef} id="q-file" type="file" accept=".stl,.obj,.3mf" className="block w-full text-base" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </Field>
          {tooBig && <p className="text-sm text-danger" role="alert">{tr("That file is bigger than 10 MB. Try exporting a smaller file, or paste a link instead.")}</p>}
          <p className="text-center text-sm font-semibold text-muted">{tr("or")}</p>
          <Field label={tr("Paste a link to your design")} htmlFor="q-url" hint={tr("Starts with https://. Make sure anyone at school with the link can view it.")}>
            <Input id="q-url" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
          </Field>
        </fieldset>
        <fieldset className="space-y-3">
          <legend className="font-display text-xl font-semibold">{tr("2. Say what you need")}</legend>
          <Field label={tr("How many copies?")} htmlFor="q-copies">
            <Input id="q-copies" type="number" min={1} max={10} value={copies} onChange={(e) => setCopies(e.target.value)} className="max-w-24" />
          </Field>
          <Field label={tr("Anything the printer person should know? (optional)")} htmlFor="q-note" hint={tr("Color, size, what it's for, or when you need it.")}>
            <Input id="q-note" value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} />
          </Field>
        </fieldset>
        <div className="space-y-2">
          <h2 className="font-display text-xl font-semibold">{tr("3. Send it")}</h2>
          <Button size="lg" disabled={!ready || busy}>{busy ? tr("Sending…") : tr("Send to the print queue")}</Button>
          {!ready && !busy && <p className="text-sm text-muted">{tr("Choose a file or paste a link to turn this button on.")}</p>}
          {openCount > 0 && <p className="text-sm text-muted">{tr("You have")} {openCount} {tr("open request(s). You can have up to 5 waiting at once.")}</p>}
          {msg && <p role={msg.ok ? "status" : "alert"} className={msg.ok ? "font-semibold text-success" : "font-semibold text-danger"}>{msg.text}</p>}
        </div>
      </form>
    </Card>
  );
}

function MyList({ apiUrl, prints, onChange }: { apiUrl: string; prints: PrintJob[]; onChange: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const sorted = [...prints].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const cancel = async (id: string) => {
    setBusy(id);
    const r = await call(apiUrl, "cancelMyPrint", { printId: id });
    setBusy(null);
    if (r.ok) { setErr(null); onChange(); } else setErr(r.error);
  };
  return (
    <section aria-labelledby="mine-h" className="space-y-3">
      <h2 id="mine-h" className="font-display text-2xl font-bold">{tr("My print requests")}</h2>
      {err && <p role="alert" className="text-danger">{err}</p>}
      {!sorted.length && <p className="text-muted">{tr("Nothing yet. Your requests will show up here.")}</p>}
      <ul className="space-y-2">
        {sorted.map((p) => {
          const st = STATUS[p.status] ?? STATUS.queued;
          return (
            <li key={p.id} className="space-y-1 rounded-xl border border-border bg-surface p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{p.fileName || (p.link ? tr("Design link") : tr("Print"))}{(p.copies ?? 1) > 1 ? ` × ${p.copies}` : ""}</span>
                <span className="text-sm text-muted">{new Date(p.createdAt).toLocaleDateString()}</span>
                <span className="ml-auto"><Pill tone={st.tone}>{tr(st.label)}</Pill></span>
              </div>
              <p className="text-sm text-muted">{tr(st.help)}</p>
              {p.teacherNote && <p className="rounded-lg bg-surface-2 p-2 text-sm"><b>{tr("Note from the printer person:")}</b> {p.teacherNote}</p>}
              {(p.status === "queued" || p.status === "redo") && <Button size="sm" variant="secondary" disabled={busy === p.id} onClick={() => void cancel(p.id)}>{tr("Cancel this request")}</Button>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
