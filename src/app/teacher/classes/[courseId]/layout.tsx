import Link from "next/link";
import { requireUser } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { guard } from "@/server/guard";
import { actorOf } from "@/app/actions/_run";
import { getCourseForTeacher } from "@/server/services/courses";
import { Pill } from "@/components/ui/card";
import { TabNav } from "@/components/nav/tabs";

export default async function ClassLayout(props: LayoutProps<"/teacher/classes/[courseId]">) {
  const user = await requireUser("teacher", "org_admin");
  const { courseId } = await props.params;
  const course = await guard(getCourseForTeacher(await getDb(), actorOf(user), courseId));
  const base = `/teacher/classes/${courseId}`;
  const tabs = [
    ["Overview", base],
    ["Heatmap", `${base}/heatmap`],
    ["Review", `${base}/review`],
    ["Assignments", `${base}/assignments`],
    ["Settings", `${base}/settings`],
  ];
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link href="/teacher/classes" className="text-sm text-muted hover:text-fg">Classes</Link>
        <span className="text-muted">/</span>
        <h1 className="font-display text-2xl font-bold">{course.name}{course.section && <span className="text-muted"> · {course.section}</span>}</h1>
        <Pill tone="primary">{course.pathId}</Pill>
        <Pill>Join code <span className="font-mono">{course.joinCode}</span></Pill>
        {course.mapping && <Pill tone={course.mapping.lastSyncStatus === "error" ? "danger" : "success"}>Google Classroom</Pill>}
      </div>
      <TabNav label="Class sections" tabs={tabs as [string, string][]} />
      {props.children}
    </div>
  );
}
