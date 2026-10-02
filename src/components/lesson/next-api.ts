"use client";

import { answerBlockAction, completeLessonAction, heartbeatAction, saveDraftAction, saveJournalAction, submitEvidenceAction, submitReflectionAction } from "@/app/actions/student";
import type { LessonApi } from "./api";

/** Lesson API backed by Next.js Server Actions. */
export const nextLessonApi: LessonApi = {
  answerBlock: answerBlockAction,
  saveDraft: saveDraftAction,
  submitReflection: submitReflectionAction,
  submitEvidence: submitEvidenceAction,
  saveJournal: saveJournalAction,
  completeLesson: completeLessonAction,
  heartbeat: heartbeatAction,
};
