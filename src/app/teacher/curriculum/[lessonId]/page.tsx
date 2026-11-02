import { notFound } from "next/navigation";
import { requireUser } from "@/server/auth/session";
import { assetsForLesson, competencies, getCompetency, getLesson, getRubric, standardsForLesson } from "@/content";
import { Card, CardTitle, PageHeader, Pill } from "@/components/ui/card";
import { Md, ModelCard } from "@/components/lesson/static-blocks";
import { LessonPlayer } from "@/components/lesson/player";
import { SlidesButton } from "@/components/teacher/slides-button";

function List({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (<div><h3 className="font-semibold">{title}</h3><ul className="mt-1 list-disc space-y-1 pl-5 text-sm">{items.map((x, i) => <li key={i}>{x}</li>)}</ul></div>);
}

export default async function TeacherView(props: PageProps<"/teacher/curriculum/[lessonId]">) {
  await requireUser("teacher", "org_admin");
  const lesson = getLesson((await props.params).lessonId);
  if (!lesson) notFound();
  const t = lesson.teacher;
  const rubric = t.rubricId ? getRubric(t.rubricId) : null;
  const assets = assetsForLesson(lesson);
  return (
    <>
      <PageHeader eyebrow={`Teacher view · Mission ${lesson.number}`} title={lesson.title} description={lesson.summary} />
      <div className="mb-6"><SlidesButton lesson={lesson} guide={t} size="md" variant="primary" /></div>
      {(t.bigIdea || t.successCriteria.length > 0 || t.background.length > 0) && (
        <div className="mb-6 grid gap-6 lg:grid-cols-[1fr_2fr]">
          <Card className="space-y-3">
            <CardTitle>Today&apos;s goal</CardTitle>
            {t.bigIdea && <p className="font-semibold">{t.bigIdea}</p>}
            <List title="Success criteria" items={t.successCriteria} />
            <List title="Exit ticket" items={t.exitTicket} />
          </Card>
          {t.background.length > 0 && (
            <Card className="space-y-4">
              <CardTitle>Teacher background</CardTitle>
              {t.background.map((b) => <section key={b.title}><h3 className="font-semibold">{b.title}</h3><div className="text-sm"><Md text={b.body} /></div></section>)}
            </Card>
          )}
        </div>
      )}
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <CardTitle>Plan</CardTitle>
          <p>{t.purpose}</p>
          <div className="flex flex-wrap gap-2"><Pill>{lesson.estimatedMinutes} min</Pill><Pill tone="primary">{lesson.printLevel}</Pill>{lesson.competencyIds.map((c) => <Pill key={c}>{c} {getCompetency(c)?.title}</Pill>)}</div>
          {t.runPlan.length > 0 && <List title="Run the lesson" items={t.runPlan.map((r) => `${r.minutes} min · ${r.title} (${r.devices === "away" ? "devices down" : "on devices"}): ${r.teacher}`)} />}
          <List title="Preparation" items={t.preparation} />
          <List title="Equipment" items={t.equipment} />
          <List title="Printable objects" items={t.printableObjects} />
          {t.slicerSettings && <div><h3 className="font-semibold">Suggested slicer settings</h3><p className="text-sm">{t.slicerSettings}</p></div>}
          <List title="Vocabulary" items={lesson.vocabulary.map((v) => `${v.term} — ${v.definition}`)} />
          {Object.entries(t.alternatives).filter(([, v]) => v).map(([k, v]) => <p key={k} className="text-sm"><strong>{k === "noCalipers" ? "No calipers" : k === "noPrinter" ? "No printer" : "Touch devices"}:</strong> {v}</p>)}
        </Card>
        <Card className="space-y-4">
          <CardTitle>Teach</CardTitle>
          <div><h3 className="font-semibold">Expected misconceptions</h3><ul className="mt-1 space-y-2 text-sm">{t.misconceptions.map((m) => <li key={m.id}><strong>{m.text}</strong><br /><span className="text-muted">Response: {m.response}</span></li>)}</ul></div>
          <List title="Discussion questions" items={t.discussionQuestions} />
          {t.studentQuestions.length > 0 && <div><h3 className="font-semibold">Questions students ask</h3><ul className="mt-1 space-y-2 text-sm">{t.studentQuestions.map((q) => <li key={q.q}><strong>“{q.q}”</strong><br /><span className="text-muted">{q.a}</span></li>)}</ul></div>}
          <List title="Watch and listen for" items={t.lookFors} />
          <List title="More support" items={t.differentiation.support} />
          <List title="Ready for more" items={t.differentiation.extend} />
          <List title="In the real world" items={t.connections} />
          <List title="Troubleshooting" items={t.troubleshooting} />
          <List title="Answer guidance" items={t.answerGuidance} />
          {rubric && <div><h3 className="font-semibold">{rubric.title}</h3><ul className="mt-1 space-y-1 text-sm">{rubric.criteria.map((c) => <li key={c.id}><strong>{c.label}</strong> (/{c.max}): {c.descriptors[0]}</li>)}</ul></div>}
          <List title="Standards" items={standardsForLesson(lesson.id).map((s) => `${s.framework} ${s.code}`)} />
        </Card>
      </div>
      {assets.length > 0 && <section className="mb-8"><h2 className="mb-3 font-display text-xl font-bold">Model files</h2><div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{assets.map((a) => <ModelCard key={a.id} a={a} />)}</div></section>}
      <h2 className="mb-3 font-display text-xl font-bold">Student view (preview)</h2>
      <LessonPlayer courseId="" lesson={lesson} entries={{}} requiredBlockIds={[]} evidence={[]} assets={Object.fromEntries(assets.map((a) => [a.id, a]))} competencyTitles={Object.fromEntries(competencies.map((c) => [c.id, c.title]))} journalPrompts={[]} journals={{}} tinkercadClassUrl={null} startedAt={null} completed={false} readOnly teacherView mode="scroll" />
    </>
  );
}
