import { useState, type ReactNode } from "react";
import { ExternalLink, GraduationCap, Presentation, Users } from "lucide-react";
import { Alert, Card } from "@/components/ui/card";
import { Button, buttonClass } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { normalizeApiUrl, setApiUrl, setClientId } from "../config";

const TEMPLATE = import.meta.env.VITE_TEMPLATE_URL as string;

type Who = "teacher" | "student" | "staff";

/**
 * The page anyone sees when this browser doesn't know a class yet.
 * One question first ("who are you?"), then exactly one path, with a picture of each screen Google shows.
 */
export function SetupPage({ cfg, onSaved }: { cfg: { apiUrl: string | null; clientId: string | null }; onSaved: () => void }) {
  const [who, setWho] = useState<Who | null>(null);
  return (
    <div className="mx-auto max-w-2xl space-y-8 py-8">
      <header className="text-center">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Welcome to 3D Design Academy</h1>
        <p className="mt-2 text-lg text-muted">Who are you?</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Who are you?">
        <Choice active={who === "teacher"} onClick={() => setWho("teacher")} icon={<Presentation className="size-7" aria-hidden />} title="A teacher" sub="Set up my class" />
        <Choice active={who === "student"} onClick={() => setWho("student")} icon={<GraduationCap className="size-7" aria-hidden />} title="A student" sub="Find my class" />
        <Choice active={who === "staff"} onClick={() => setWho("staff")} icon={<Users className="size-7" aria-hidden />} title="Co-teacher or admin" sub="Join someone's class" />
      </div>

      {who === "student" && (
        <Card className="space-y-2 text-center">
          <p className="font-display text-xl font-semibold">You need your class link</p>
          <p className="text-lg">Open <b>Google Classroom</b> and click the 3D Design Academy link your teacher posted. Or scan the QR code on the board.</p>
          <p className="text-muted">No link? Ask your teacher. This page can&apos;t find your class on its own.</p>
        </Card>
      )}

      {who === "staff" && (
        <Card className="space-y-2 text-center">
          <p className="font-display text-xl font-semibold">Ask for the staff link</p>
          <p className="text-lg">You don&apos;t need your own copy. The teacher sends you a <b>staff link</b>. They find it in their Sheet&apos;s side panel, under <b>Settings</b>.</p>
          <p className="text-muted">Then open it and sign in with your school Google account.</p>
        </Card>
      )}

      {who === "teacher" && <TeacherSteps />}

      {who === "teacher" && <AlreadySetUp cfg={cfg} onSaved={onSaved} />}
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

function TeacherSteps() {
  if (!TEMPLATE) {
    return <Alert tone="warning" title="This site isn't finished setting up">Ask the person who shared it for the template Sheet link.</Alert>;
  }
  return (
    <section aria-labelledby="steps-title" className="space-y-4">
      <div>
        <h2 id="steps-title" className="font-display text-2xl font-bold">Set up in 5 steps</h2>
        <p className="text-muted">About 5 minutes, one time only. You never need to touch any code. Your students&apos; work is saved in a Google Sheet in <b>your</b> Drive.</p>
      </div>
      <ol className="space-y-4">
        <Step n={1} title="Make your copy" picture={<PicCopy />}>
          <a href={TEMPLATE} target="_blank" rel="noopener noreferrer" className={cn(buttonClass("primary", "lg"), "w-full justify-center sm:w-auto")}>
            Make my copy <ExternalLink className="size-4" aria-hidden /><span className="sr-only"> (opens Google Sheets in a new tab)</span>
          </a>
          <p>Google opens a box. Click the blue <b>Make a copy</b> button.</p>
        </Step>
        <Step n={2} title="Open the menu" picture={<PicMenu />}>
          <p>In your new Sheet, click <b>3D Design Academy</b> at the top, then <b>Set up &amp; class links</b>.</p>
          <p className="text-sm text-muted">Don&apos;t see it? Wait 10 seconds, or refresh the page.</p>
        </Step>
        <Step n={3} title="Click Allow" picture={<PicAllow />}>
          <p>Google asks for permission. Pick your school account. If you see <b>&ldquo;Google hasn&apos;t verified this app&rdquo;</b>, that&apos;s normal (it&apos;s your own copy). Click <b>Advanced</b>, then <b>Go to 3D Design Academy</b>, then <b>Allow</b>.</p>
          <p className="font-semibold">Then click the menu again: <b>3D Design Academy → Set up &amp; class links</b>.</p>
        </Step>
        <Step n={4} title="Turn on your app" picture={<PicDeploy />}>
          <p>The panel on the right shows you how, with a picture of each screen. In short: click <b>Open the script editor</b>, then <b>Deploy → New deployment</b>, pick <b>Web app</b>, set <b>Who has access</b> to <b>Anyone</b>, and click <b>Deploy</b>.</p>
          <p className="text-sm text-muted">Google requires you to do this click yourself, one time. The panel moves on by itself when it&apos;s done.</p>
        </Step>
        <Step n={5} title="Make a class and share the link" picture={<PicPanel />} last>
          <ul className="list-disc space-y-1 pl-5">
            <li>Type a class name and click <b>Create class</b>.</li>
            <li>Click <b>Copy student link</b> and post it in Google Classroom.</li>
            <li>Click <b>Open my dashboard</b> to see your class. Bookmark that page.</li>
          </ul>
          <p className="text-sm text-muted">New and improved lessons show up by themselves. Once in a while your dashboard may ask for a quick script update.</p>
        </Step>
      </ol>
      <Help />
    </section>
  );
}

function Step({ n, title, picture, children, last }: { n: number; title: string; picture: ReactNode; children: ReactNode; last?: boolean }) {
  return (
    <li className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary font-display text-lg font-bold text-primary-fg" aria-hidden>{n}</span>
        {!last && <span className="mt-1 w-0.5 flex-1 bg-border" aria-hidden />}
      </div>
      <Card className="mb-1 flex-1 space-y-3">
        <h3 className="font-display text-xl font-semibold"><span className="sr-only">Step {n}: </span>{title}</h3>
        <div className="space-y-2 text-base">{children}</div>
        <div className="overflow-hidden rounded-xl border border-border bg-surface-2" aria-hidden>{picture}</div>
      </Card>
    </li>
  );
}

function Help() {
  const items: [string, ReactNode][] = [
    ["I clicked the menu and nothing happened", <>The first click asks for permission. After you click <b>Allow</b>, click <b>3D Design Academy → Set up &amp; class links</b> one more time.</>],
    ["“Anyone” isn't in the “Who has access” list", <>Your school&apos;s Google settings block it. Ask your tech office to let teachers share Apps Script web apps with &ldquo;Anyone&rdquo;. Students still sign in with Google, and only students on your roster get in.</>],
    ["“Make a copy” doesn't open, or says I need access", <>Sign in to Chrome with your <b>school</b> Google account and click <b>Make my copy</b> again. If your school blocks copying outside the district, contact your tech office.</>],
    ["I keep coming back to this page", <>Open your Sheet, click <b>3D Design Academy → Set up &amp; class links</b>, and click <b>Open my dashboard</b>. Bookmark the page that opens. Don&apos;t bookmark this welcome page.</>],
    ["I have more than one class", <>Use the same Sheet. In the panel, click <b>Add another class</b>. Each class gets its own student link.</>],
  ];
  return (
    <div className="space-y-2">
      <h3 className="font-display text-lg font-semibold">Stuck?</h3>
      {items.map(([q, a]) => (
        <details key={q} className="rounded-xl border border-border bg-surface px-4 py-3">
          <summary className="cursor-pointer font-semibold">{q}</summary>
          <p className="mt-2">{a}</p>
        </details>
      ))}
    </div>
  );
}

function AlreadySetUp({ cfg, onSaved }: { cfg: { apiUrl: string | null; clientId: string | null }; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [api, setApi] = useState(cfg.apiUrl ?? "");
  const [cid, setCid] = useState(cfg.clientId ?? "");
  const valid = !!normalizeApiUrl(api);
  return (
    <Card className="space-y-3">
      <h2 className="font-display text-lg font-semibold">Already set up?</h2>
      <p>Open your Sheet → <b>3D Design Academy → Set up &amp; class links</b> → <b>Open my dashboard</b>.</p>
      <button className="text-sm text-muted underline" onClick={() => setOpen(!open)} aria-expanded={open}>Or paste your app address</button>
      {open && (
        <div className="space-y-4">
          <Field label="App address" htmlFor="api" hint="Starts with https://script.google.com/ and ends with /exec. It's under Settings in your Sheet's panel.">
            <Input id="api" value={api} onChange={(e) => setApi(e.target.value)} />
          </Field>
          {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
            <Field label="Google sign-in client ID" htmlFor="cid" hint="Only needed if this site was built without one.">
              <Input id="cid" value={cid} onChange={(e) => setCid(e.target.value)} />
            </Field>
          )}
          <Button disabled={!valid} onClick={() => { setApiUrl(api); setClientId(cid); onSaved(); }}>Connect</Button>
          {api.trim() && !valid && <p className="text-sm text-danger" role="alert">That doesn&apos;t look like an app address yet.</p>}
        </div>
      )}
    </Card>
  );
}

/* ───────── Simplified pictures of the Google screens (decorative; the text carries every instruction) ───────── */

const W = "w-full h-auto";
const box = "fill-surface stroke-border";
const ink = "fill-fg";
const soft = "fill-muted";
const blue = "fill-primary";

function PicCopy() {
  return (
    <svg viewBox="0 0 400 150" className={W}>
      <rect x="70" y="18" width="260" height="114" rx="10" className={box} strokeWidth="1.5" />
      <text x="90" y="48" className={ink} fontSize="15" fontWeight="600">Copy document</text>
      <text x="90" y="72" className={soft} fontSize="12">Would you like to make a copy of</text>
      <text x="90" y="88" className={soft} fontSize="12">3D Design Academy?</text>
      <rect x="218" y="100" width="98" height="24" rx="12" className={blue} />
      <text x="267" y="116" textAnchor="middle" fontSize="12" fontWeight="700" className="fill-primary-fg">Make a copy</text>
      <rect x="212" y="94" width="110" height="36" rx="18" fill="none" className="stroke-accent" strokeWidth="3" />
    </svg>
  );
}

function PicMenu() {
  return (
    <svg viewBox="0 0 400 150" className={W}>
      <rect x="0" y="0" width="400" height="34" className="fill-surface" />
      {["File", "Edit", "View", "Insert", "Format", "Data"].map((t, i) => (
        <text key={t} x={14 + i * 44} y="22" className={soft} fontSize="12">{t}</text>
      ))}
      <rect x="276" y="6" width="118" height="22" rx="5" className="fill-primary-soft" />
      <text x="335" y="21" textAnchor="middle" className={ink} fontSize="11.5" fontWeight="700">3D Design Academy</text>
      <rect x="236" y="36" width="158" height="34" rx="6" className={box} strokeWidth="1.5" />
      <text x="250" y="58" className={ink} fontSize="12.5">Set up &amp; class links</text>
      <rect x="231" y="31" width="168" height="44" rx="9" fill="none" className="stroke-accent" strokeWidth="3" />
      {[0, 1, 2, 3].map((r) => <rect key={r} x="14" y={84 + r * 16} width="200" height="10" rx="3" className="fill-border" />)}
    </svg>
  );
}

function PicAllow() {
  return (
    <svg viewBox="0 0 400 150" className={W}>
      <rect x="14" y="14" width="180" height="122" rx="10" className={box} strokeWidth="1.5" />
      <text x="28" y="40" className={ink} fontSize="12.5" fontWeight="600">Google hasn&apos;t verified</text>
      <text x="28" y="56" className={ink} fontSize="12.5" fontWeight="600">this app</text>
      <text x="28" y="88" className="fill-primary" fontSize="12" fontWeight="700">Advanced</text>
      <rect x="22" y="72" width="66" height="24" rx="8" fill="none" className="stroke-accent" strokeWidth="3" />
      <text x="28" y="112" className="fill-primary" fontSize="11" textDecoration="underline">Go to 3D Design Academy</text>
      <text x="200" y="80" className={soft} fontSize="20" textAnchor="middle">→</text>
      <rect x="208" y="14" width="180" height="122" rx="10" className={box} strokeWidth="1.5" />
      <text x="222" y="40" className={ink} fontSize="12.5" fontWeight="600">3D Design Academy wants</text>
      <text x="222" y="56" className={ink} fontSize="12.5" fontWeight="600">access to your account</text>
      <rect x="306" y="102" width="66" height="24" rx="12" className={blue} />
      <text x="339" y="118" textAnchor="middle" fontSize="12" fontWeight="700" className="fill-primary-fg">Allow</text>
      <rect x="300" y="96" width="78" height="36" rx="18" fill="none" className="stroke-accent" strokeWidth="3" />
    </svg>
  );
}

function PicDeploy() {
  return (
    <svg viewBox="0 0 400 150" className={W}>
      <rect x="0" y="0" width="400" height="34" className="fill-surface" />
      <text x="14" y="22" className={soft} fontSize="12">Apps Script · 3D Design Academy</text>
      <rect x="300" y="6" width="88" height="22" rx="5" className={blue} />
      <text x="344" y="21.5" textAnchor="middle" fontSize="12" fontWeight="700" className="fill-primary-fg">Deploy ▾</text>
      <rect x="296" y="3" width="96" height="28" rx="8" fill="none" className="stroke-accent" strokeWidth="3" />
      <rect x="40" y="46" width="220" height="96" rx="10" className={box} strokeWidth="1.5" />
      <text x="56" y="70" className={ink} fontSize="13" fontWeight="600">New deployment · Web app</text>
      <text x="56" y="92" className={soft} fontSize="11.5">Execute as: Me</text>
      <text x="56" y="110" className={ink} fontSize="11.5" fontWeight="700">Who has access: Anyone</text>
      <rect x="50" y="97" width="180" height="20" rx="5" fill="none" className="stroke-accent" strokeWidth="3" />
      <rect x="186" y="120" width="62" height="18" rx="9" className={blue} />
      <text x="217" y="133" textAnchor="middle" fontSize="11" fontWeight="700" className="fill-primary-fg">Deploy</text>
    </svg>
  );
}

function PicPanel() {
  return (
    <svg viewBox="0 0 400 150" className={W}>
      {[0, 1, 2, 3, 4, 5].map((r) => <rect key={r} x="14" y={18 + r * 20} width="210" height="10" rx="3" className="fill-border" />)}
      <rect x="240" y="8" width="152" height="134" rx="8" className={box} strokeWidth="1.5" />
      <text x="252" y="30" className={ink} fontSize="12" fontWeight="700">3D Design Academy</text>
      <circle cx="258" cy="48" r="6" className="fill-success" />
      <text x="270" y="52" className={soft} fontSize="10.5">All set up</text>
      <rect x="252" y="62" width="128" height="20" rx="5" className="fill-surface-2 stroke-border" />
      <text x="258" y="76" className={soft} fontSize="10">Class name…</text>
      <rect x="252" y="88" width="128" height="20" rx="10" className={blue} />
      <text x="316" y="102" textAnchor="middle" fontSize="10.5" fontWeight="700" className="fill-primary-fg">Create class</text>
      <rect x="252" y="114" width="128" height="20" rx="10" className="fill-surface stroke-primary" strokeWidth="1.5" />
      <text x="316" y="128" textAnchor="middle" fontSize="10.5" fontWeight="700" className="fill-primary">Copy student link</text>
    </svg>
  );
}
