import "server-only";
import { ClassroomApiError, type ClassroomClient, type GCourse, type GCourseWork, type GCourseWorkInput, type GStudent, type GSubmission, type GTeacher, type GTopic } from "./types";

const BASE = "https://classroom.googleapis.com/v1";

/** Google Classroom REST client. `getToken` returns a fresh access token (refreshing if needed). */
export class HttpClassroomClient implements ClassroomClient {
  constructor(private getToken: () => Promise<string>) {}

  private async req<T>(path: string, init: RequestInit = {}, attempt = 0): Promise<T> {
    const token = await this.getToken();
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
      signal: AbortSignal.timeout(15000),
    });
    if ((res.status === 429 || res.status >= 500) && attempt < 2) {
      await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
      return this.req<T>(path, init, attempt + 1);
    }
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new ClassroomApiError(`Classroom API ${init.method ?? "GET"} ${path} → ${res.status}`, res.status, body.slice(0, 2000));
    }
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  private async paged<T>(path: string, key: string): Promise<T[]> {
    const out: T[] = [];
    let pageToken: string | undefined;
    for (let i = 0; i < 50; i++) {
      const sep = path.includes("?") ? "&" : "?";
      const data = await this.req<Record<string, unknown>>(`${path}${sep}pageSize=100${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""}`);
      out.push(...((data[key] as T[]) ?? []));
      pageToken = data.nextPageToken as string | undefined;
      if (!pageToken) break;
    }
    return out;
  }

  listCourses() {
    return this.paged<GCourse>("/courses?teacherId=me&courseStates=ACTIVE", "courses");
  }
  getCourse(courseId: string) {
    return this.req<GCourse>(`/courses/${encodeURIComponent(courseId)}`);
  }
  listStudents(courseId: string) {
    return this.paged<GStudent>(`/courses/${encodeURIComponent(courseId)}/students`, "students");
  }
  listTeachers(courseId: string) {
    return this.paged<GTeacher>(`/courses/${encodeURIComponent(courseId)}/teachers`, "teachers");
  }
  listTopics(courseId: string) {
    return this.paged<GTopic>(`/courses/${encodeURIComponent(courseId)}/topics`, "topic");
  }
  createTopic(courseId: string, name: string) {
    return this.req<GTopic>(`/courses/${encodeURIComponent(courseId)}/topics`, { method: "POST", body: JSON.stringify({ name }) });
  }
  createCourseWork(courseId: string, input: GCourseWorkInput) {
    return this.req<GCourseWork>(`/courses/${encodeURIComponent(courseId)}/courseWork`, { method: "POST", body: JSON.stringify(input) });
  }
  async getCourseWork(courseId: string, courseWorkId: string) {
    try {
      return await this.req<GCourseWork>(`/courses/${encodeURIComponent(courseId)}/courseWork/${encodeURIComponent(courseWorkId)}`);
    } catch (e) {
      if (e instanceof ClassroomApiError && e.status === 404) return null;
      throw e;
    }
  }
  listSubmissions(courseId: string, courseWorkId: string, userId?: string) {
    const q = userId ? `?userId=${encodeURIComponent(userId)}` : "";
    return this.paged<GSubmission>(`/courses/${encodeURIComponent(courseId)}/courseWork/${encodeURIComponent(courseWorkId)}/studentSubmissions${q}`, "studentSubmissions");
  }
  setGrade(courseId: string, courseWorkId: string, submissionId: string, grade: number) {
    return this.req<GSubmission>(
      `/courses/${encodeURIComponent(courseId)}/courseWork/${encodeURIComponent(courseWorkId)}/studentSubmissions/${encodeURIComponent(submissionId)}?updateMask=draftGrade,assignedGrade`,
      { method: "PATCH", body: JSON.stringify({ draftGrade: grade, assignedGrade: grade }) },
    );
  }
  async returnSubmission(courseId: string, courseWorkId: string, submissionId: string) {
    await this.req(`/courses/${encodeURIComponent(courseId)}/courseWork/${encodeURIComponent(courseWorkId)}/studentSubmissions/${encodeURIComponent(submissionId)}:return`, {
      method: "POST",
      body: "{}",
    });
  }
}
