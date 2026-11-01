/**
 * The friendly pieces of the teacher's Simple view: a greeting with the class's progress, today's wins and where the
 * class is on the mission trail. Purely presentational: everything is worked out from the class data already loaded.
 */
import type { ReactNode } from "react";
import { Check, ClipboardCheck, Printer, Trophy, Users } from "lucide-react";
import type { Lesson } from "@/content/schema";
import { ProgressRing } from "@/components/ui/progress";
import { cn } from "@/lib/cn";
import { Avatar } from "../store";

type Student = { email: string; name: string; status: string };
type Progress = { email: string; lessonId: string; status: string; updatedAt: string };
type PathItem = { lesson: Lesson; week: number; weekTitle: string };

const COLORS = ["color-blue", "color-orange", "color-green", "color-purple", "color-pink", "color-gold"];
const initialsOf = (name: string) => name.split(/\s+/).filter(Boolean).map((w) => w[0]).join("").slice(0, 2);
const colorFor = (email: string) => COLORS[[...email].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7) % COLORS.length];

/** Students the teacher teaches: not archived, not the teacher's own test student. */
export const classStudents = <S extends Student>(students: S[]) => students.filter((s) => s.status !== "archived" && !s.email.includes("+student@"));

/** A colourful initials badge: the same colour for a student every time. */
export function StudentBadge({ s, size = 32 }: { s: { email: string; name: string }; size?: number }) {
  return <Avatar eq={{ body: "body-initials", color: colorFor(s.email) }} initials={initialsOf(s.name)} size={size} />;
}

export function greeting(now = new Date()) {
  const h = now.getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

/** Share of the path finished, averaged over the class (0–100). */
export function classCompletion(students: Student[], progress: Progress[], path: PathItem[]) {
  if (!students.length || !path.length) return 0;
  const ids = new Set(path.map((p) => p.lesson.id));
  const emails = new Set(students.map((s) => s.email));
  const done = progress.filter((p) => p.status === "completed" && ids.has(p.lessonId) && emails.has(p.email)).length;
  return (done / (students.length * ids.size)) * 100;
}

/** Missions finished today, newest first. */
export function winsToday(students: Student[], progress: Progress[], today = new Date().toISOString().slice(0, 10)) {
  const byEmail = new Map(students.map((s) => [s.email, s]));
  return progress
    .filter((p) => p.status === "completed" && String(p.updatedAt).slice(0, 10) === today && byEmail.has(p.email))
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
    .map((p) => ({ student: byEmail.get(p.email)!, lessonId: p.lessonId }));
}

/** Each student's next unfinished mission, grouped by unit (week). Students who finished everything are counted as done. */
export function whereTheClassIs(students: Student[], progress: Progress[], path: PathItem[]) {
  const done = new Set(progress.filter((p) => p.status === "completed").map((p) => `${p.email}|${p.lessonId}`));
  const weeks = [...new Map(path.map((p) => [p.week, p.weekTitle])).entries()].map(([week, title]) => ({ week, title, here: [] as Student[], total: 0, finished: 0 }));
  const finishedAll: Student[] = [];
  for (const s of students) {
    const next = path.find((p) => !done.has(`${s.email}|${p.lesson.id}`));
    if (next) weeks.find((w) => w.week === next.week)?.here.push(s);
    else finishedAll.push(s);
  }
  for (const w of weeks) {
    const inWeek = path.filter((p) => p.week === w.week);
    w.total = inWeek.length * students.length;
    w.finished = inWeek.reduce((n, p) => n + students.filter((s) => done.has(`${s.email}|${p.lesson.id}`)).length, 0);
  }
  return { weeks, finishedAll };
}

function Tile({ icon, value, label, tone, href }: { icon: ReactNode; value: number; label: string; tone: "primary" | "accent" | "success"; href?: string }) {
  const tones = { primary: "bg-primary-soft text-primary", accent: "bg-accent-soft text-accent", success: "bg-success-soft text-success" };
  const body = (
    <>
      <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", tones[tone])} aria-hidden>{icon}</span>
      <span className="min-w-0">
        <span className="block font-display text-2xl font-bold leading-none">{value}</span>
        <span className="mt-1 block text-xs text-muted sm:text-sm">{label}</span>
      </span>
    </>
  );
  const cls = "flex flex-col items-start gap-2 rounded-2xl border border-border bg-surface p-3 sm:flex-row sm:items-center sm:gap-3";
  return href ? <a href={href} className={cn(cls, "hover:border-primary")}>{body}</a> : <div className={cls}>{body}</div>;
}

export function ClassHero({ firstName, className, percent, active, toReview, prints }: { firstName: string; className: string; percent: number; active: number; toReview: number; prints: number }) {
  return (
    <section className="bg-blueprint rounded-3xl border border-border bg-surface p-5 sm:p-6">
      <div className="flex items-center gap-4 sm:gap-6">
        <ProgressRing value={percent} size={76} stroke={8} label={`${className}: missions finished`} />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-primary">{greeting()}</p>
          <h2 className="font-display text-2xl font-bold sm:text-3xl">{firstName}</h2>
          <p className="text-sm text-muted sm:text-base">{className} has finished {Math.round(percent)}% of its missions.</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
        <Tile icon={<Users className="size-5" />} value={active} label="active today" tone="success" />
        <Tile icon={<ClipboardCheck className="size-5" />} value={toReview} label="to review" tone="accent" href="#review-h" />
        <Tile icon={<Printer className="size-5" />} value={prints} label={prints === 1 ? "print waiting" : "prints waiting"} tone="primary" href="#prints-h" />
      </div>
    </section>
  );
}

export function SectionHeading({ id, icon, children, count, tone = "primary" }: { id: string; icon: ReactNode; children: ReactNode; count?: number; tone?: "primary" | "accent" | "success" }) {
  const tones = { primary: "bg-primary-soft text-primary", accent: "bg-accent-soft text-accent", success: "bg-success-soft text-success" };
  return (
    <div className="flex items-center gap-3">
      <span className={cn("grid size-9 place-items-center rounded-xl", tones[tone])} aria-hidden>{icon}</span>
      <h2 id={id} className="scroll-mt-20 font-display text-xl font-bold">{children}</h2>
      {!!count && <span className="rounded-full bg-accent px-2.5 py-0.5 text-sm font-bold text-white">{count}</span>}
    </div>
  );
}

export function TodaysWins({ wins, title }: { wins: { student: Student; lessonId: string }[]; title: (lessonId: string) => string }) {
  return (
    <section aria-labelledby="wins-h" className="rounded-3xl border border-border bg-surface p-5">
      <SectionHeading id="wins-h" icon={<Trophy className="size-5" />} tone="success" count={wins.length}>Today&apos;s wins</SectionHeading>
      {wins.length === 0 ? (
        <p className="mt-3 text-muted">Missions students finish today show up here. A good thing to read out at the end of class.</p>
      ) : (
        <ul className="mt-3 flex flex-wrap gap-2">
          {wins.slice(0, 12).map((w, i) => (
            <li key={i} className="flex items-center gap-2 rounded-full border border-success/30 bg-success-soft py-1 pl-1 pr-3 text-sm">
              <StudentBadge s={w.student} size={28} />
              <span><strong>{w.student.name.split(" ")[0]}</strong> finished {title(w.lessonId)}</span>
            </li>
          ))}
          {wins.length > 12 && <li className="self-center text-sm text-muted">+{wins.length - 12} more</li>}
        </ul>
      )}
    </section>
  );
}

/** One stop on the trail: a ring that fills with the class's progress, the unit number (or a check) in the middle. */
function TrailStop({ pct, full, week, label }: { pct: number; full: boolean; week: number; label: string }) {
  const size = 44, stroke = 5, rad = (size - stroke) / 2, c = 2 * Math.PI * rad;
  return (
    <span className="relative grid shrink-0 place-items-center" role="img" aria-label={label}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={rad} fill="var(--surface)" stroke="var(--surface-2)" strokeWidth={stroke} />
        {pct > 0 && <circle cx={size / 2} cy={size / 2} r={rad} fill="none" stroke={full ? "var(--success)" : "var(--primary)"} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${(Math.max(0, Math.min(100, pct)) / 100) * c} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />}
      </svg>
      <span className="absolute inset-0 grid place-items-center text-sm font-bold" aria-hidden>{full ? <Check className="size-5 text-success" /> : week}</span>
    </span>
  );
}

/** The class on the mission trail: one stop per unit, filled by how much of it the class has finished, with who's there now. */
export function ClassTrail({ trail }: { trail: ReturnType<typeof whereTheClassIs> }) {
  const { weeks, finishedAll } = trail;
  return (
    <section aria-labelledby="trail-h" className="rounded-3xl border border-border bg-surface p-5">
      <h2 id="trail-h" className="font-display text-xl font-bold">Where the class is</h2>
      <p className="text-sm text-muted">Each stop is a unit. The ring fills as the class finishes it; faces show who is working there now.</p>
      <ol className="mt-4 flex gap-1 overflow-x-auto pb-2">
        {weeks.map((w, i) => {
          const pct = w.total ? (w.finished / w.total) * 100 : 0;
          const full = w.total > 0 && w.finished === w.total;
          return (
            <li key={w.week} className="flex min-w-[6.5rem] flex-1 flex-col items-center text-center">
              <div className="flex w-full items-center">
                <span className={cn("h-1 flex-1 rounded", i === 0 ? "invisible" : pct > 0 ? "bg-primary" : "bg-surface-2")} aria-hidden />
                <TrailStop pct={pct} full={full} week={w.week} label={`Unit ${w.week}, ${w.title}: class has finished ${Math.round(pct)}%`} />
                <span className={cn("h-1 flex-1 rounded", i === weeks.length - 1 ? "invisible" : full ? "bg-primary" : "bg-surface-2")} aria-hidden />
              </div>
              <p className="mt-1 line-clamp-2 text-xs font-semibold">{w.title}</p>
              {w.here.length > 0 && (
                <div className="mt-1 flex -space-x-1" aria-label={`${w.here.length} working here: ${w.here.map((s) => s.name).join(", ")}`} role="img">
                  {w.here.slice(0, 3).map((s) => <StudentBadge key={s.email} s={s} size={26} />)}
                  {w.here.length > 3 && <span className="grid size-6 place-items-center rounded-full bg-surface-2 text-[10px] font-bold ring-2 ring-surface">+{w.here.length - 3}</span>}
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {finishedAll.length > 0 && <p className="mt-2 text-sm"><Trophy className="mr-1 inline size-4 text-accent" aria-hidden /><strong>Finished the whole course:</strong> {finishedAll.map((s) => s.name.split(" ")[0]).join(", ")}</p>}
    </section>
  );
}
