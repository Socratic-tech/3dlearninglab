import { useEffect, useState } from "react";
import { Download, ExternalLink, Printer } from "lucide-react";
import type { ModelAsset, TeacherGuide } from "@/content/schema";
import { Alert, Card, CardTitle, Pill } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Md } from "@/components/lesson/static-blocks";
import LazyModelViewer from "@/components/viewer/LazyModelViewer";
import { printablesPicks, type PrintablesPick } from "@/content/printables";
import { lessonById, modelAssets, pathLessons, type Me } from "../content";
import { makeZip } from "../zip";


/** Our own STL files, matched to a "printable objects" line like "peg-10mm (×2)" or "Axis Cube 20 mm". */
const originals = modelAssets.filter((a) => !!a.localFilePath);
function assetIn(line: string): ModelAsset | undefined {
  const l = line.toLowerCase();
  return originals.find((a) => l.includes(a.id.toLowerCase())) ?? originals.find((a) => l.includes(a.title.toLowerCase()));
}
/** Printables pages for a lesson: the picks plus any link-out models already listed in the course. */
function picksFor(lessonId: string): PrintablesPick[] {
  const listed = modelAssets
    .filter((a) => !a.localFilePath && a.sourcePage && a.lessonIds.includes(lessonId))
    .map((a) => ({ lessonId, title: a.title, url: a.sourcePage!, creator: a.creator, printInfo: "", use: a.educationalPurpose }));
  const all = [...printablesPicks.filter((p) => p.lessonId === lessonId), ...listed];
  return all.filter((p, i) => all.findIndex((q) => q.url === p.url) === i);
}

/** Teacher prep notes ship separately from the student lessons (and without answer guidance); loaded on first use. */
type Prep = Record<string, Partial<TeacherGuide>>;
let prepCache: Prep | null = null;
function usePrep(): Prep | null {
  const [prep, setPrep] = useState<Prep | null>(prepCache);
  useEffect(() => {
    if (prepCache) return;
    void import("../generated/teacher-prep.json").then((m) => { prepCache = m.default as unknown as Prep; setPrep(prepCache); });
  }, []);
  return prep;
}

function printsFor(g?: Partial<TeacherGuide>) {
  return (g?.printableObjects ?? []).map((line) => ({ line, asset: assetIn(line) }));
}
const leadTime = (g?: Partial<TeacherGuide>) => (g?.preparation ?? []).find((p) => /weeks? ahead|days? ahead|before (the|this) lesson/i.test(p));

function Downloadable({ line, asset, preview }: { line: string; asset?: ModelAsset; preview?: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <li className="rounded-2xl border border-border bg-surface p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="min-w-0 flex-1 font-semibold">{line}</span>
        {asset?.localFilePath && (
          <>
            {preview && <Button size="sm" variant="ghost" onClick={() => setShow(!show)} aria-expanded={show}>{show ? "Hide 3D" : "View 3D"}</Button>}
            <a href={asset.localFilePath} download={asset.originalFileName} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-fg hover:brightness-110">
              <Download className="size-4" aria-hidden /> STL
            </a>
          </>
        )}
        {!asset && <span className="text-xs text-muted">Student or teacher-made print</span>}
      </div>
      {asset && <p className="mt-1 text-sm text-muted">{asset.educationalPurpose}</p>}
      {show && asset?.localFilePath && (
        <div className="mt-2">
          <LazyModelViewer src={asset.localFilePath} format={asset.format} title={asset.title} height={280} />
        </div>
      )}
    </li>
  );
}

function PicksList({ picks }: { picks: PrintablesPick[] }) {
  if (!picks.length) return null;
  return (
    <ul className="mt-3 space-y-2">
      {picks.map((p) => (
        <li key={p.url} className="rounded-2xl border border-border bg-surface p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="min-w-0 flex-1"><span className="font-semibold">{p.title}</span> <span className="text-sm text-muted">by {p.creator}</span></span>
            <a href={p.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm font-semibold hover:bg-surface-2">
              Printables <ExternalLink className="size-4" aria-hidden /><span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
          <p className="mt-1 text-sm">{p.use}</p>
          {p.printInfo && <p className="mt-0.5 text-xs text-muted">{p.printInfo}</p>}
        </li>
      ))}
    </ul>
  );
}

const LicenseNote = () => (
  <p className="mt-2 text-xs text-muted">Printables files are made by other people and download from their page. Check the license there before sharing the files outside your class.</p>
);

/** Everything a teacher needs before teaching one lesson: prep, prints, settings and talking points. */
export function TeacherGuidePage({ lessonId }: { lessonId: string }) {
  const lesson = lessonById.get(lessonId);
  const prep = usePrep();
  if (!lesson) return <Alert tone="warning" title="That lesson doesn't exist." />;
  if (!prep) return <p role="status" className="py-20 text-center text-muted">Loading the teacher guide…</p>;
  const g = prep[lesson.id];
  const prints = printsFor(g);
  const picks = picksFor(lesson.id);
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <a href="#/teacher" className="text-sm text-muted hover:text-fg">← Teacher dashboard</a>
        <a href="#/kit" className="text-sm text-muted hover:text-fg">Print kit for the whole course</a>
        <Button size="sm" variant="secondary" className="ml-auto" onClick={() => window.print()}><Printer className="size-4" aria-hidden /> Print this guide</Button>
      </div>
      <div>
        <p className="font-mono text-xs uppercase tracking-wider text-muted">Teacher guide</p>
        <h1 className="font-display text-3xl font-bold">{lesson.title}</h1>
        <p className="text-muted">{lesson.subtitle} · {lesson.estimatedMinutes} min</p>
        <p className="mt-2 flex flex-wrap gap-2 print:hidden">
          <a href={`#/lesson/${lesson.id}`} className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-fg hover:brightness-110">Open the lesson</a>
          <a href={`#/print/${lesson.id}`} className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold hover:bg-surface-2">Student handout</a>
        </p>
      </div>
      {!g && <Alert tone="info" title="No teacher notes for this lesson yet." />}
      {g?.purpose && <Card><CardTitle>Why this lesson</CardTitle><div className="mt-2"><Md text={g.purpose} /></div></Card>}
      {(prints.length > 0 || picks.length > 0) && (
        <Card>
          <CardTitle>Prints for this lesson</CardTitle>
          {leadTime(g) && <Alert tone="warning" title="Plan ahead"><Md text={leadTime(g)!} /></Alert>}
          {prints.length > 0 && <ul className="mt-3 space-y-2">{prints.map((p) => <Downloadable key={p.line} line={p.line} asset={p.asset} preview />)}</ul>}
          {g?.slicerSettings && <p className="mt-3 text-sm"><strong>Slicer settings:</strong> {g.slicerSettings}</p>}
          {picks.length > 0 && (
            <>
              <h3 className="mt-5 font-semibold">Supporting prints from Printables</h3>
              <p className="text-sm text-muted">Optional extras that fit this lesson.</p>
              <PicksList picks={picks} />
              <LicenseNote />
            </>
          )}
        </Card>
      )}
      {g?.preparation && g.preparation.length > 0 && <Card><CardTitle>Preparation</CardTitle><ol className="mt-2 list-decimal space-y-1.5 pl-5">{g.preparation.map((p) => <li key={p}><Md text={p} /></li>)}</ol></Card>}
      {g?.equipment && g.equipment.length > 0 && <Card><CardTitle>Equipment</CardTitle><ul className="mt-2 list-disc space-y-1 pl-5">{g.equipment.map((p) => <li key={p}>{p}</li>)}</ul></Card>}
      {g?.troubleshooting && g.troubleshooting.length > 0 && <Card><CardTitle>Troubleshooting</CardTitle><ul className="mt-2 list-disc space-y-1 pl-5">{g.troubleshooting.map((p) => <li key={p}><Md text={p} /></li>)}</ul></Card>}
      {g?.misconceptions && g.misconceptions.length > 0 && (
        <Card>
          <CardTitle>Common misconceptions</CardTitle>
          <ul className="mt-2 space-y-2">{g.misconceptions.map((m) => <li key={m.id}><strong>{m.text}</strong><div className="text-sm text-muted"><Md text={m.response} /></div></li>)}</ul>
        </Card>
      )}
      {g?.discussionQuestions && g.discussionQuestions.length > 0 && <Card><CardTitle>Discussion questions</CardTitle><ul className="mt-2 list-disc space-y-1 pl-5">{g.discussionQuestions.map((q) => <li key={q}>{q}</li>)}</ul></Card>}
      {g?.alternatives && Object.values(g.alternatives).some(Boolean) && (
        <Card>
          <CardTitle>If you&apos;re missing equipment</CardTitle>
          <ul className="mt-2 space-y-1 text-sm">
            {g.alternatives.noPrinter && <li><strong>No printer:</strong> {g.alternatives.noPrinter}</li>}
            {g.alternatives.noCalipers && <li><strong>No calipers:</strong> {g.alternatives.noCalipers}</li>}
          </ul>
        </Card>
      )}
    </div>
  );
}

/** Every print the course needs, in teaching order, with one-click download of all our files. */
export function PrintKitPage({ me }: { me: Me }) {
  const prep = usePrep() ?? {};
  const items = pathLessons(me.cls?.pathId ?? "18-week");
  const rows = items
    .map(({ lesson, week }) => ({ lesson: lessonById.get(lesson.id) ?? lesson, week, g: prep[lesson.id] }))
    .map((x) => ({ ...x, prints: printsFor(x.g), picks: picksFor(x.lesson.id) }))
    .filter((x) => x.prints.length || x.picks.length);
  const files = [...new Map(rows.flatMap((r) => r.prints).filter((p) => p.asset?.localFilePath).map((p) => [p.asset!.id, p.asset!])).values()];
  const [busy, setBusy] = useState(false);
  const downloadAll = async () => {
    setBusy(true);
    try {
      const data = await Promise.all(files.map(async (a) => ({ name: a.originalFileName, data: new Uint8Array(await (await fetch(a.localFilePath!)).arrayBuffer()) })));
      const url = URL.createObjectURL(makeZip(data));
      const link = document.createElement("a");
      link.href = url;
      link.download = "3d-design-academy-print-kit.zip";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <a href="#/teacher" className="text-sm text-muted hover:text-fg">← Teacher dashboard</a>
        <Button size="sm" variant="secondary" className="ml-auto" onClick={() => window.print()}><Printer className="size-4" aria-hidden /> Print this list</Button>
      </div>
      <div>
        <h1 className="font-display text-3xl font-bold">Print kit</h1>
        <p className="text-muted">Everything to print for this class&apos;s path, in the order you&apos;ll teach it. Start early: some samples need a week or two.</p>
      </div>
      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <p className="min-w-0 flex-1"><strong>{files.length} STL files</strong> made for this course (free to print and share, CC BY 4.0).</p>
          <Button disabled={busy || !files.length} onClick={() => void downloadAll()}><Download className="size-4" aria-hidden /> {busy ? "Preparing…" : "Download all (.zip)"}</Button>
        </div>
      </Card>
      {rows.map(({ lesson, week, g, prints, picks }) => (
        <Card key={lesson.id}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-muted">W{week}</span>
            <CardTitle>{lesson.title}</CardTitle>
            {leadTime(g) && <Pill tone="warning">Plan ahead</Pill>}
            <a href={`#/guide/${lesson.id}`} className="ml-auto text-sm font-semibold text-primary underline print:hidden">Teacher guide</a>
          </div>
          {leadTime(g) && <div className="mt-1 text-sm text-muted"><Md text={leadTime(g)!} /></div>}
          {prints.length > 0 && <ul className="mt-3 space-y-2">{prints.map((p) => <Downloadable key={p.line} line={p.line} asset={p.asset} />)}</ul>}
          {picks.length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-semibold">Optional supporting prints from Printables ({picks.length})</summary>
              <PicksList picks={picks} />
            </details>
          )}
        </Card>
      ))}
      <LicenseNote />
    </div>
  );
}
