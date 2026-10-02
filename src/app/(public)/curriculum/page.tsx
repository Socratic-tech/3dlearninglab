import type { Metadata } from "next";
import { paths, getLesson, domains, competenciesInDomain } from "@/content";

export const metadata: Metadata = { title: "Curriculum" };

export default function PublicCurriculum() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold">The curriculum</h1>
      <p className="mt-2 max-w-2xl text-muted">Two complete course arcs built on explicit competencies. Every mission runs Discover → Practice → Apply → Prove → Reflect.</p>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {paths.map((p) => (
          <section key={p.id} className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="font-display text-xl font-bold">{p.title}</h2>
            <p className="text-sm text-muted">{p.description}</p>
            <ol className="mt-3 space-y-2 text-sm">{p.weeks.map((w) => <li key={w.week}><strong>Week {w.week}:</strong> {w.title} — <span className="text-muted">{w.lessonIds.map((id) => getLesson(id)?.title).join(", ")}</span></li>)}</ol>
          </section>
        ))}
      </div>
      <h2 className="mt-12 font-display text-2xl font-bold">Competencies</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {domains.map((d) => (
          <section key={d.id} className="rounded-2xl border border-border bg-surface p-4">
            <h3 className="font-display font-bold">{d.id}. {d.title}</h3>
            <ul className="mt-2 space-y-0.5 text-sm">{competenciesInDomain(d.id).map((c) => <li key={c.id}><span className="font-mono text-xs text-muted">{c.id}</span> {c.title}</li>)}</ul>
          </section>
        ))}
      </div>
    </div>
  );
}
