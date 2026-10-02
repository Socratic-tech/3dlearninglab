import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy" };

export default function Privacy() {
  return (
    <div className="prose-lesson mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold">Privacy</h1>
      <p>3D Design Academy is built for K–12 schools and designed to support FERPA- and COPPA-conscious operation. Your school controls the data; this summary describes how the software behaves.</p>
      <ul>
        <li>We store only what learning needs: name, school email, Google account ID, role, class membership, and the work students submit.</li>
        <li>No advertising, no behavioural tracking for marketing, no sale of student data, no public student profiles, no birthdates.</li>
        <li>Student work is visible only to the student and their teachers. School administrators see aggregate usage unless the school opts in.</li>
        <li>Google sign-in uses OAuth; we never see passwords. Classroom tokens are encrypted and can be revoked by disconnecting.</li>
        <li>Teachers should use school-approved Tinkercad Classroom practices (teacher-moderated classes, Safe Mode) and avoid public sharing by students.</li>
      </ul>
      <p>See docs/privacy.md in the repository for technical details.</p>
    </div>
  );
}
