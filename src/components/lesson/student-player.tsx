"use client";

import { LessonPlayer, type PlayerProps } from "./player";
import { nextLessonApi } from "./next-api";

/** Next.js edition: the lesson player wired to Server Actions. */
export function StudentLessonPlayer(props: Omit<PlayerProps, "api">) {
  return <LessonPlayer {...props} api={nextLessonApi} />;
}
