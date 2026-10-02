import { printTransitionAction } from "@/app/actions/teacher";
import { allowedPrintTransitions, type PrintStatus } from "@/server/policy";
import { PRINT_STATUS_LABEL, type PrintJob } from "@/server/services/print-queue";
import { ActionForm } from "@/components/ui/action-form";
import { Field, Input, Select } from "@/components/ui/field";
import { getLesson } from "@/content";

export function PrintJobCard({ job, student, course }: { job: PrintJob; student: string; course: string }) {
  const next = allowedPrintTransitions("teacher", job.status as PrintStatus);
  return (
    <article className="rounded-xl border border-border bg-surface p-3 text-sm">
      <p className="font-semibold">{job.title}</p>
      <p className="text-muted">{student} · {course}{job.lessonId && ` · ${getLesson(job.lessonId)?.title}`}</p>
      {job.estimatedSize && <p className="text-xs text-muted">Size: {job.estimatedSize}</p>}
      {job.notes && <p className="mt-1 text-xs">“{job.notes}”</p>}
      <a href={`/api/files/${job.fileKey}`} className="mt-1 inline-block text-xs text-primary underline">Download {job.fileName}</a>
      {(job.printer || job.estimatedMinutes) && <p className="text-xs text-muted">{job.printer} {job.filament && `· ${job.filament}`} {job.estimatedMinutes && `· ~${job.estimatedMinutes} min`}</p>}
      {job.failureReason && <p className="text-xs text-danger">Failed: {job.failureReason}</p>}
      {next.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs font-semibold text-primary">Update</summary>
          <ActionForm action={printTransitionAction.bind(null, job.id)} submit="Update" size="sm" className="mt-2">
            <Field label="Move to" htmlFor={`to-${job.id}`}>
              <Select id={`to-${job.id}`} name="to">{next.map((s) => <option key={s} value={s}>{PRINT_STATUS_LABEL[s]}</option>)}</Select>
            </Field>
            <Field label="Printer" htmlFor={`pr-${job.id}`}><Input id={`pr-${job.id}`} name="printer" defaultValue={job.printer ?? ""} /></Field>
            <Field label="Filament" htmlFor={`fi-${job.id}`}><Input id={`fi-${job.id}`} name="filament" defaultValue={job.filament ?? ""} /></Field>
            <Field label="Est. minutes" htmlFor={`em-${job.id}`}><Input id={`em-${job.id}`} name="estimatedMinutes" type="number" min={0} defaultValue={job.estimatedMinutes ?? ""} /></Field>
            <Field label="Slicer notes" htmlFor={`sn-${job.id}`}><Input id={`sn-${job.id}`} name="slicerNotes" defaultValue={job.slicerNotes ?? ""} /></Field>
            <Field label="Note to student (required for revision)" htmlFor={`no-${job.id}`}><Input id={`no-${job.id}`} name="note" /></Field>
            <Field label="Failure reason (required if failed)" htmlFor={`fr-${job.id}`}><Input id={`fr-${job.id}`} name="failureReason" defaultValue={job.failureReason ?? ""} /></Field>
          </ActionForm>
        </details>
      )}
    </article>
  );
}
