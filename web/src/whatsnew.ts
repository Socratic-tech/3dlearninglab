/**
 * "What's new" for teachers who already use the tool. Newest release last. Each release has a sortable id
 * (date first); a teacher sees every release newer than the last one they dismissed, once, on their dashboard.
 * Add a release here when something changes that teachers should know about; no other code changes are needed.
 */
export type Release = {
  id: string;
  title: string;
  items: string[];
  action?: { label: string; href: string };
};

export const RELEASES: Release[] = [
  {
    id: "2026-11-19-print-queue",
    title: "A school print queue, and easier setup",
    items: [
      "Print queue for your whole school. Anyone at school can send a file or design link to your 3D printer by signing in with their school Google account. Every request shows who sent it. No class or student list needed.",
      "One page to run it. Open the print queue to see every request, start prints, mark them done, or send one back with a note. It has a link and QR code you can share or print for the wall.",
      "Your class Prints tab now also shows requests from the school link.",
      "Setup is now 3 steps. New teachers choose “Run a 3D print queue” or “Teach the course” on the welcome page.",
      "The Sheet's side panel has a Check for updates button, so you don't have to wait to see a new version.",
    ],
    action: { label: "Open the print queue", href: "#/queue/manage" },
  },
];

const NEW_TEACHER_FLAGS = ["academy.setupStepsDone.teacher", "academy.setupStepsDone.queue"];

/** Releases the teacher hasn't dismissed yet, oldest first. */
export function unseenReleases(seen: string | null, releases: Release[] = RELEASES): Release[] {
  return releases.filter((r) => !seen || r.id > seen);
}

/** The newest release id (what "Got it" remembers). */
export const latestReleaseId = (releases: Release[] = RELEASES) => releases[releases.length - 1]?.id ?? "";

/**
 * A teacher who just went through the setup steps on this device is new, not returning, so nothing is "new" to them.
 * (The setup walkthrough saves its checkboxes in this browser.)
 */
export function isNewTeacherDevice(read: (key: string) => string | null): boolean {
  return NEW_TEACHER_FLAGS.some((k) => read(k) !== null);
}
