import { ClassroomApiError, type ClassroomClient, type GCourse, type GCourseWork, type GCourseWorkInput, type GStudent, type GSubmission, type GTeacher, type GTopic } from "./types";

/**
 * In-memory Classroom used by demo mode, local development without Google credentials (CLASSROOM_FAKE=true)
 * and automated tests. It behaves like the real API for the calls we make, including failures on demand.
 */
type State = {
  courses: GCourse[];
  students: Map<string, GStudent[]>;
  teachers: Map<string, GTeacher[]>;
  topics: Map<string, GTopic[]>;
  courseWork: Map<string, GCourseWork[]>;
  submissions: Map<string, GSubmission[]>;
  seq: number;
  failNext?: { status: number; times: number };
};

const g = globalThis as unknown as { __fakeClassroom?: Map<string, State> };
const states = (g.__fakeClassroom ??= new Map());

const person = (id: string, fullName: string, email: string) => ({ id, name: { fullName }, emailAddress: email });

export function defaultFakeState(teacherGoogleId: string, teacherName = "Demo Teacher", teacherEmail = "teacher@example.test"): State {
  const students = (prefix: string, names: [string, string][]) =>
    names.map(([n, e], i) => ({ courseId: prefix, userId: `${prefix}-s${i + 1}`, profile: person(`${prefix}-s${i + 1}`, n, e) }));
  const teacher = (courseId: string) => [{ courseId, userId: teacherGoogleId, profile: person(teacherGoogleId, teacherName, teacherEmail) }];
  return {
    courses: [
      { id: "gc-period-2", name: "3D Design", section: "Period 2", courseState: "ACTIVE", alternateLink: "https://classroom.google.com/" },
      { id: "gc-period-5", name: "STEAM Lab", section: "Period 5", courseState: "ACTIVE", alternateLink: "https://classroom.google.com/" },
    ],
    students: new Map([
      [
        "gc-period-2",
        [
          { courseId: "gc-period-2", userId: "demo-sub-maya", profile: person("demo-sub-maya", "Maya Okafor", "maya@example.test") },
          { courseId: "gc-period-2", userId: "demo-sub-luis", profile: person("demo-sub-luis", "Luis Hernández", "luis@example.test") },
          { courseId: "gc-period-2", userId: "demo-sub-ava", profile: person("demo-sub-ava", "Ava Chen", "ava@example.test") },
          { courseId: "gc-period-2", userId: "demo-sub-jordan", profile: person("demo-sub-jordan", "Jordan Price", "jordan@example.test") },
          { courseId: "gc-period-2", userId: "demo-sub-mia", profile: person("demo-sub-mia", "Mia Rossi", "mia@example.test") },
          { courseId: "gc-period-2", userId: "demo-sub-sam", profile: person("demo-sub-sam", "Sam Patel", "sam@example.test") },
        ],
      ],
      [
        "gc-period-5",
        students("gc-period-5", [
          ["Eli Brooks", "eli@example.test"],
          ["Nora Kim", "nora@example.test"],
          ["Theo Martin", "theo@example.test"],
          ["Zara Ali", "zara@example.test"],
        ]),
      ],
    ]),
    teachers: new Map([
      ["gc-period-2", teacher("gc-period-2")],
      ["gc-period-5", teacher("gc-period-5")],
    ]),
    topics: new Map(),
    courseWork: new Map(),
    submissions: new Map(),
    seq: 1,
  };
}

export class FakeClassroomClient implements ClassroomClient {
  constructor(
    private key: string,
    init?: () => State,
  ) {
    if (!states.has(key)) states.set(key, init ? init() : defaultFakeState(key));
  }
  get state(): State {
    return states.get(this.key)!;
  }
  static reset(key: string) {
    states.delete(key);
  }
  /** Test helper: make the next `times` calls fail with `status`. */
  failNext(status: number, times = 1) {
    this.state.failNext = { status, times };
  }
  private check() {
    const f = this.state.failNext;
    if (f && f.times > 0) {
      f.times--;
      throw new ClassroomApiError(`Fake Classroom failure ${f.status}`, f.status, '{"error":{"message":"simulated"}}');
    }
  }
  private course(id: string) {
    const c = this.state.courses.find((x) => x.id === id);
    if (!c) throw new ClassroomApiError("not found", 404);
    return c;
  }
  async listCourses() {
    this.check();
    return [...this.state.courses];
  }
  async getCourse(id: string) {
    this.check();
    return this.course(id);
  }
  async listStudents(id: string) {
    this.check();
    this.course(id);
    return [...(this.state.students.get(id) ?? [])];
  }
  async listTeachers(id: string) {
    this.check();
    return [...(this.state.teachers.get(id) ?? [])];
  }
  async listTopics(id: string) {
    this.check();
    return [...(this.state.topics.get(id) ?? [])];
  }
  async createTopic(id: string, name: string) {
    this.check();
    const t = { courseId: id, topicId: `t${this.state.seq++}`, name };
    this.state.topics.set(id, [...(this.state.topics.get(id) ?? []), t]);
    return t;
  }
  async createCourseWork(id: string, input: GCourseWorkInput) {
    this.check();
    this.course(id);
    const cw: GCourseWork = { ...input, id: `cw${this.state.seq++}`, courseId: id, alternateLink: `https://classroom.google.com/c/fake/${id}` };
    this.state.courseWork.set(id, [...(this.state.courseWork.get(id) ?? []), cw]);
    const subs = (this.state.students.get(id) ?? []).map((s) => ({ id: `sub${this.state.seq++}`, courseId: id, courseWorkId: cw.id, userId: s.userId, state: "CREATED" }));
    this.state.submissions.set(cw.id, subs);
    return cw;
  }
  async getCourseWork(id: string, cwId: string) {
    this.check();
    return (this.state.courseWork.get(id) ?? []).find((c) => c.id === cwId) ?? null;
  }
  async listSubmissions(_id: string, cwId: string, userId?: string) {
    this.check();
    return (this.state.submissions.get(cwId) ?? []).filter((s) => !userId || s.userId === userId);
  }
  async setGrade(_id: string, cwId: string, subId: string, grade: number) {
    this.check();
    const s = (this.state.submissions.get(cwId) ?? []).find((x) => x.id === subId);
    if (!s) throw new ClassroomApiError("submission not found", 404);
    s.assignedGrade = grade;
    s.draftGrade = grade;
    return s;
  }
  async returnSubmission(_id: string, cwId: string, subId: string) {
    this.check();
    const s = (this.state.submissions.get(cwId) ?? []).find((x) => x.id === subId);
    if (s) s.state = "RETURNED";
  }
}
