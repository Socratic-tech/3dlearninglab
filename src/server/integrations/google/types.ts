/** Subset of the Google Classroom v1 REST resources this app uses. */
export type GCourse = { id: string; name: string; section?: string; courseState?: string; alternateLink?: string; ownerId?: string };
export type GUserProfile = { id: string; name?: { fullName?: string; givenName?: string; familyName?: string }; emailAddress?: string };
export type GStudent = { courseId: string; userId: string; profile: GUserProfile };
export type GTeacher = GStudent;
export type GTopic = { courseId: string; topicId: string; name: string };
export type GCourseWorkInput = {
  title: string;
  description?: string;
  materials?: { link: { url: string; title?: string } }[];
  workType: "ASSIGNMENT";
  state: "PUBLISHED" | "DRAFT";
  maxPoints?: number;
  dueDate?: { year: number; month: number; day: number };
  dueTime?: { hours: number; minutes: number };
  topicId?: string;
};
export type GCourseWork = GCourseWorkInput & { id: string; courseId: string; alternateLink?: string };
export type GSubmission = { id: string; courseId: string; courseWorkId: string; userId: string; state?: string; assignedGrade?: number; draftGrade?: number };

export interface ClassroomClient {
  listCourses(): Promise<GCourse[]>;
  getCourse(courseId: string): Promise<GCourse>;
  listStudents(courseId: string): Promise<GStudent[]>;
  listTeachers(courseId: string): Promise<GTeacher[]>;
  listTopics(courseId: string): Promise<GTopic[]>;
  createTopic(courseId: string, name: string): Promise<GTopic>;
  createCourseWork(courseId: string, input: GCourseWorkInput): Promise<GCourseWork>;
  getCourseWork(courseId: string, courseWorkId: string): Promise<GCourseWork | null>;
  listSubmissions(courseId: string, courseWorkId: string, userId?: string): Promise<GSubmission[]>;
  setGrade(courseId: string, courseWorkId: string, submissionId: string, grade: number): Promise<GSubmission>;
  returnSubmission(courseId: string, courseWorkId: string, submissionId: string): Promise<void>;
}

/** Scopes requested only when a teacher connects Classroom (incremental authorization). */
export const CLASSROOM_SCOPES = [
  "https://www.googleapis.com/auth/classroom.courses.readonly",
  "https://www.googleapis.com/auth/classroom.rosters.readonly",
  "https://www.googleapis.com/auth/classroom.profile.emails",
  "https://www.googleapis.com/auth/classroom.coursework.students",
  "https://www.googleapis.com/auth/classroom.topics",
];
export const SIGN_IN_SCOPES = ["openid", "email", "profile"];

export class ClassroomApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: string,
  ) {
    super(message);
  }
}
