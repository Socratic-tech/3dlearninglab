import Link from "next/link";
import { ArrowRight, Layers, Ruler, Stethoscope, Lightbulb, Move3d, Combine } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Diagram } from "@/components/diagrams";
import { lessons, paths } from "@/content";

const stages = [
  { name: "Follow", quote: "I can do what you showed me." },
  { name: "Modify", quote: "I can change what you showed me." },
  { name: "Combine", quote: "I know which tools I need." },
  { name: "Solve", quote: "I can solve a defined problem." },
  { name: "Design", quote: "I can identify a problem and create something that works." },
];

const features = [
  { icon: Move3d, title: "CAD foundations", body: "Move, scale, rotate and place with exact numbers in Tinkercad." },
  { icon: Combine, title: "Build with geometry", body: "Holes, grouping, alignment and patterns — then a boss battle with no tutorial." },
  { icon: Ruler, title: "Precision & fit", body: "Measure real objects, test clearance on your own printer, and make it fit." },
  { icon: Layers, title: "Print engineering", body: "Layers, orientation, strength, overhangs and supports — designed out, not patched." },
  { icon: Stethoscope, title: "CAD ER", body: "Diagnose and repair a broken design. Hypothesis, fix, test, document." },
  { icon: Lightbulb, title: "Design for someone else", body: "Interview a real client, write constraints, prototype, test and revise." },
];

export default function Home() {
  return (
    <>
      <section className="bg-blueprint border-b border-border">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:py-24 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-primary">Middle school CAD · engineering · 3D printing</p>
            <h1 className="mt-3 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">Learn to design things that work.</h1>
            <p className="mt-5 max-w-xl text-lg text-muted">
              3D Design Academy teaches students how to move from an idea to a functional physical object through CAD, engineering, prototyping and 3D printing.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/login?as=teacher" size="lg">
                For teachers
              </ButtonLink>
              <ButtonLink href="/login" size="lg" variant="secondary">
                Student login
              </ButtonLink>
            </div>
            <Link href="/curriculum" className="mt-5 inline-flex items-center gap-1 font-semibold text-primary hover:underline">
              Explore the curriculum <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <div className="rounded-3xl border border-border bg-surface p-4 shadow-sm">
            <Diagram name="design-cycle" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <blockquote className="mx-auto max-w-3xl text-center font-display text-2xl font-semibold leading-snug sm:text-3xl">
          “Students shouldn&apos;t prove they can follow Tinkercad instructions. They should prove they know what to do when the instructions disappear.”
        </blockquote>
        <ol className="mt-12 grid gap-3 sm:grid-cols-5">
          {stages.map((s, i) => (
            <li key={s.name} className="rounded-2xl border border-border bg-surface p-4">
              <p className="font-mono text-xs text-muted">0{i + 1}</p>
              <p className="font-display text-lg font-bold text-primary">{s.name}</p>
              <p className="mt-1 text-sm text-muted">“{s.quote}”</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-border bg-surface">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-16 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title}>
              <f.icon className="size-7 text-primary" aria-hidden />
              <h2 className="mt-3 font-display text-lg font-bold">{f.title}</h2>
              <p className="mt-1 text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-16 lg:grid-cols-2">
        {paths.map((p) => (
          <div key={p.id} className="rounded-2xl border border-border bg-surface p-6">
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-accent">{p.id}</p>
            <h2 className="mt-1 font-display text-xl font-bold">{p.title}</h2>
            <p className="mt-2 text-muted">{p.description}</p>
            <p className="mt-4 text-sm">
              {p.weeks.reduce((n, w) => n + w.lessonIds.length, 0)} missions across {p.weeks.length} weeks
            </p>
          </div>
        ))}
        <div className="rounded-2xl border border-dashed border-border p-6 lg:col-span-2">
          <h2 className="font-display text-xl font-bold">Try it without signing in</h2>
          <p className="mt-1 text-muted">
            The demo has a full class with sample progress — {lessons.length} ready-to-teach lessons, the class skill heatmap, the 3D model viewer and the print queue.
          </p>
          <ButtonLink href="/demo" className="mt-4" variant="accent">
            Explore demo
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
