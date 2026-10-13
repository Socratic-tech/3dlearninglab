import type { ReactNode } from "react";
import { Accessibility, BookOpen, Check, GraduationCap, HardDrive, Laptop, Lock, Printer, Puzzle, ShieldCheck, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { pathInputs } from "@/content/paths";

/** Who schools contact with questions. Change here if the program contact changes. */
const CONTACT = { name: "Berrien RESA · John Phillips", email: "john.phillips@berrienresa.org" };

/**
 * Public "Get started" page for schools (#/start): what 3D Design Academy is, what a school needs, how setup goes,
 * privacy and notes for the tech office. Works before any setup; links to Try-It mode and the setup walkthrough.
 */
export function GetStartedPage({ onTry }: { onTry: () => void }) {
  const lessonCount = (id: string) => pathInputs.find((p) => p.id === id)?.weeks.reduce((n, w) => n + w.lessonIds.length, 0) ?? 0;
  const courses = [
    { title: "18-week course", sub: "Grades 6–8 · full semester", body: `${lessonCount("18-week")} missions from first shapes to precision fit, print engineering, a repair challenge and a client capstone.` },
    { title: "9-week course", sub: "Grades 6–8 · quarter or wheel", body: `${lessonCount("9-week")} missions: core CAD skills, a boss battle, printability, CAD ER and a mini design challenge.` },
    { title: "Grades 4–5: Maker Junior", sub: "Elementary starter unit", body: `${lessonCount("jr-starter")} short lessons (25–30 min), read-aloud first, whole millimeters only, ending with a printed name bookmark.` },
    { title: "Custom project path", sub: "Any grade · your project", body: "Pick only the lessons your students need, in your order, ending with your own project. Reviewing it credits every skill in the path." },
  ];
  return (
    <div className="mx-auto max-w-4xl space-y-12 py-6">
      {/* Hero */}
      <section className="bg-blueprint rounded-3xl border border-border bg-surface px-6 py-10 text-center sm:px-10">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-accent">For teachers and schools</p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">Teach 3D design and printing, ready on day one.</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted">Missions in Tinkercad with built-in feedback, XP and boss battles for students, and a live dashboard for you. It runs on your own Google Sheet: nothing to buy or install.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button size="lg" variant="accent" onClick={onTry}>Try it now</Button>
          <a href="#/setup/teacher" className="inline-flex h-12 items-center rounded-xl bg-primary px-6 font-semibold text-primary-fg hover:brightness-110">Set up my class</a>
        </div>
        <p className="mt-3 text-sm text-muted">Try it needs no account. Setup takes about 10 minutes, one time.</p>
      </section>

      {/* Courses */}
      <section aria-labelledby="courses-h" className="space-y-4">
        <h2 id="courses-h" className="font-display text-2xl font-bold">Pick the course that fits</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {courses.map((c) => (
            <Card key={c.title}>
              <p className="font-display text-xl font-semibold">{c.title}</p>
              <p className="text-sm font-semibold text-accent">{c.sub}</p>
              <p className="mt-2">{c.body}</p>
            </Card>
          ))}
        </div>
        <p className="text-sm text-muted">Switch a class’s course any time; student work is kept.</p>
      </section>

      {/* What you need */}
      <section aria-labelledby="need-h" className="space-y-4">
        <h2 id="need-h" className="font-display text-2xl font-bold">What your school needs</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          <Need icon={<GraduationCap className="size-6" aria-hidden />} title="School Google accounts">Teachers and students sign in with the accounts they already use.</Need>
          <Need icon={<Laptop className="size-6" aria-hidden />} title="Chromebooks or laptops">Any up-to-date browser. A mouse helps a lot for 3D work; every lesson also works on a trackpad.</Need>
          <Need icon={<Puzzle className="size-6" aria-hidden />} title="Tinkercad (free)">Students join your Tinkercad class with a class code and nickname, so students under 13 don’t need their own accounts.</Need>
          <Need icon={<Printer className="size-6" aria-hidden />} title="A 3D printer (optional)">Lessons work without one. If you print, the print kit lists every file and sample, in teaching order.</Need>
        </ul>
      </section>

      {/* How setup works */}
      <section aria-labelledby="how-h" className="space-y-4">
        <h2 id="how-h" className="font-display text-2xl font-bold">How setup works</h2>
        <ol className="grid gap-3 sm:grid-cols-4">
          {[
            ["Make your copy", "One click copies the class Sheet into your Google Drive."],
            ["Click Allow", "Google asks permission for your own copy. That’s normal."],
            ["Turn on your app", "The Sheet’s side panel walks you through one Google screen."],
            ["Create a class", "Share the class link in Google Classroom or print the QR poster."],
          ].map(([t, d], i) => (
            <li key={t} className="rounded-2xl border border-border bg-surface p-4">
              <span className="grid size-8 place-items-center rounded-full bg-primary font-display font-bold text-primary-fg" aria-hidden>{i + 1}</span>
              <p className="mt-2 font-semibold">{t}</p>
              <p className="text-sm text-muted">{d}</p>
            </li>
          ))}
        </ol>
        <p>After that, your dashboard has a <b>Get your class ready</b> checklist, a <b>Check my setup</b> button that finds problems and tells you the fix, and a printable class poster. Updates arrive with one <b>Update now</b> click, and you can undo them.</p>
        <a href="#/setup/teacher" className="inline-flex h-11 items-center rounded-xl bg-primary px-5 font-semibold text-primary-fg hover:brightness-110">Start setup with pictures of each screen</a>
      </section>

      {/* Every learner */}
      <section aria-labelledby="ud-h" className="space-y-4">
        <h2 id="ud-h" className="font-display text-2xl font-bold">Built for every learner</h2>
        <ul className="grid gap-3 sm:grid-cols-3">
          <Need icon={<Accessibility className="size-6" aria-hidden />} title="Access built in">Read aloud on every screen, dictation, text size and contrast settings, keyboard support.</Need>
          <Need icon={<BookOpen className="size-6" aria-hidden />} title="Spanish and vocabulary">Full Spanish, plus tap-to-define for technical words.</Need>
          <Need icon={<Sparkles className="size-6" aria-hidden />} title="Designed with UDL 3.0">Choice in how students learn and show it, clear goals and feedback. Aligned to NGSS engineering design and ISTE.</Need>
        </ul>
      </section>

      {/* Privacy */}
      <section aria-labelledby="priv-h" className="space-y-4">
        <h2 id="priv-h" className="font-display text-2xl font-bold">Student privacy</h2>
        <Card className="space-y-2">
          <Fact icon={<HardDrive className="size-5" aria-hidden />}>Student work is saved in the teacher’s own Google Sheet, in the teacher’s Drive. There is no separate company database.</Fact>
          <Fact icon={<Lock className="size-5" aria-hidden />}>Students sign in with Google. Only students on a teacher’s roster (or joining through the class link, if the teacher allows it) can get in.</Fact>
          <Fact icon={<ShieldCheck className="size-5" aria-hidden />}>No ads, no selling data. The website only serves the lessons. For speed, the student’s browser keeps a copy of their own work, and the teacher’s Google script keeps a short-lived copy (up to 6 hours) in its own Google cache.</Fact>
          <p className="text-sm text-muted">Check with your district that this fits your student data agreements, as you would with any classroom tool.</p>
        </Card>
      </section>

      {/* Tech office */}
      <section aria-labelledby="tech-h" className="space-y-3">
        <h2 id="tech-h" className="font-display text-2xl font-bold">Notes for your tech office</h2>
        <Tech q="Apps Script web apps shared with “Anyone”">Each teacher’s copy runs a small Google Apps Script web app that the site talks to. It must be deployed with <b>Execute as: Me</b> and <b>Who has access: Anyone</b>. Students still sign in with Google, and the script checks every request against the teacher’s roster. Some Workspace settings hide the “Anyone” option for teachers.</Tech>
        <Tech q="Google sign-in for this site">The site uses Google Sign-In to identify users (email and name only). If your Workspace restricts third-party apps, an admin may need to allow this site’s sign-in client under Admin console → Security → API controls → App access control.</Tech>
        <Tech q="Websites to allow"><b>script.google.com</b> and <b>script.googleusercontent.com</b> (the teacher’s Sheet), <b>accounts.google.com</b> (sign-in), <b>www.tinkercad.com</b> (design work), and this site.</Tech>
        <Tech q="What is stored where">In the teacher’s Sheet: roster, progress, answers, uploaded evidence links, XP. Uploaded files go to a folder in the teacher’s Drive. To keep a full class fast, the teacher’s Apps Script also keeps temporary copies of each student’s rows in its built-in script cache (Google CacheService, cleared within 6 hours), and each student’s browser keeps a copy of that student’s own work. Nothing is stored on the website itself.</Tech>
        <Tech q="Will it keep up with a full class?">Yes. It was tested on a Sheet holding a full semester of work for 150 students, with 30 students opening it at the same moment: once the class was warmed up, the typical wait was about 2 seconds, and no requests failed. Opening the teacher dashboard before class gets everyone’s data ready.</Tech>
      </section>

      {/* Contact */}
      <section className="rounded-3xl border border-border bg-surface p-6 text-center">
        <p className="font-display text-xl font-semibold">Questions?</p>
        <p className="mt-1 text-muted">{CONTACT.name} · <a className="font-semibold text-primary underline" href={`mailto:${CONTACT.email}?subject=3D%20Design%20Academy`}>{CONTACT.email}</a></p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Button variant="secondary" onClick={onTry}>Try it now</Button>
          <a href="#/setup/teacher" className="inline-flex h-10 items-center rounded-xl border border-border px-4 font-semibold hover:bg-surface-2">Set up my class</a>
        </div>
      </section>
    </div>
  );
}

function Need({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <li className="flex gap-3 rounded-2xl border border-border bg-surface p-4">
      <span className="text-primary">{icon}</span>
      <span><span className="block font-semibold">{title}</span><span className="text-sm text-muted">{children}</span></span>
    </li>
  );
}
function Fact({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return <p className="flex gap-3"><span className="mt-0.5 shrink-0 text-success">{icon}</span><span>{children}</span></p>;
}
function Tech({ q, children }: { q: string; children: ReactNode }) {
  return (
    <details className="rounded-xl border border-border bg-surface px-4 py-3">
      <summary className="cursor-pointer font-semibold"><Check className="mr-2 inline size-4 text-success" aria-hidden />{q}</summary>
      <p className="mt-2">{children}</p>
    </details>
  );
}
