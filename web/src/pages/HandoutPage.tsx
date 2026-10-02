import { useEffect } from "react";
import { Printer } from "lucide-react";
import { Alert } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Md } from "@/components/lesson/static-blocks";
import type { BlockOf, Lesson } from "@/content/schema";
import { lessonById, type Me } from "../content";

/** Challenges that happen away from the screen (or partly), as printable worksheets. */
export function offlineChallenges(lesson: Lesson) {
  return lesson.sections.flatMap((s) => s.blocks).filter((b): b is BlockOf<"challenge"> => b.type === "challenge" && (b.where ?? "tinkercad") !== "tinkercad");
}

const KIND = { micro: "Micro challenge", prove: "Prove it", boss: "Boss battle" } as const;

export function HandoutPage({ me, lessonId }: { me: Me; lessonId: string }) {
  const lesson = lessonById.get(lessonId);
  const list = lesson ? offlineChallenges(lesson) : [];
  useEffect(() => {
    const t = document.title;
    if (lesson) document.title = `${lesson.title} — handout`;
    return () => { document.title = t; };
  }, [lesson]);
  if (!lesson) return <Alert tone="warning" title="That mission doesn't exist." />;
  return (
    <div className="handout mx-auto max-w-3xl">
      <div className="mb-6 flex flex-wrap items-center gap-3 print:hidden">
        <a href={`#/lesson/${lesson.id}`} className="text-sm text-muted hover:text-fg">← Back to the mission</a>
        <Button className="ml-auto" size="lg" onClick={() => window.print()}><Printer className="size-5" aria-hidden /> Print</Button>
      </div>
      {!list.length && <Alert tone="info" title="Nothing to print for this mission">All of its challenges happen in Tinkercad.</Alert>}
      {list.map((b, i) => (
        <section key={b.id} className={i ? "mt-10 break-before-page" : ""}>
          <header className="border-b-2 border-fg pb-2">
            <p className="font-mono text-xs font-bold uppercase tracking-widest">3D Design Academy · {lesson.title}{me.cls ? ` · ${me.cls.name}` : ""}</p>
            <div className="mt-3 grid grid-cols-[1fr_9rem_9rem] gap-4 text-sm">
              <span>Name: <span className="inline-block w-full border-b border-fg" /></span>
              <span>Date: <span className="inline-block w-full border-b border-fg" /></span>
              <span>Period: <span className="inline-block w-full border-b border-fg" /></span>
            </div>
          </header>
          <p className="mt-4 font-mono text-xs font-bold uppercase tracking-widest">{KIND[b.kind]}{b.where === "both" ? " · finish in Tinkercad" : ""}</p>
          <h1 className="font-display text-2xl font-bold">{b.title}</h1>
          <Md text={b.prompt} className="mt-1 text-base" />
          <h2 className="mt-5 font-semibold">Checklist</h2>
          <table className="mt-2 w-full border-collapse text-sm">
            <thead>
              <tr><th className="w-8 border border-fg p-1.5">✓</th><th className="border border-fg p-1.5 text-left">Requirement</th><th className="w-1/2 border border-fg p-1.5 text-left">My notes / measurements</th></tr>
            </thead>
            <tbody>
              {b.requirements.map((r, j) => (
                <tr key={j}><td className="border border-fg p-1.5 text-center">☐</td><td className="border border-fg p-1.5">{r}</td><td className="h-12 border border-fg p-1.5" /></tr>
              ))}
            </tbody>
          </table>
          <h2 className="mt-5 font-semibold">Sketch &amp; work space</h2>
          <div className="bg-blueprint mt-2 h-72 rounded-lg border border-fg" />
          <p className="mt-3 text-xs">When you&apos;re done, take a photo of this page and upload it in the mission.</p>
        </section>
      ))}
    </div>
  );
}
