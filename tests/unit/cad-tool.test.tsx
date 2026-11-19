/** SimpCAD X is an opt-in, per-class design tool. Tinkercad stays the default everywhere. */
import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { renderToStaticMarkup } from "react-dom/server";
import * as s from "@/server/db/schema";
import { seededDb, otherOrg } from "../helpers/db";
import { updateCourseSettings } from "@/server/services/courses";
import { TinkercadBlock, effectiveTool } from "@/components/lesson/static-blocks";
import { allBlocks, getLesson } from "@/content";
import type { BlockOf } from "@/content/schema";

let ctx: Awaited<ReturnType<typeof seededDb>>;
beforeAll(async () => {
  ctx = await seededDb();
});

const launch: BlockOf<"tinkercadLaunch"> = { id: "t", type: "tinkercadLaunch", title: "Try it", steps: ["Tinkercad step one"], tool: "tinkercad" };
const withSimp: BlockOf<"tinkercadLaunch"> = { ...launch, stepsByTool: { simpcadx: ["SimpCAD X step one"] } };

describe("class design tool (opt-in)", () => {
  it("existing and new classes use Tinkercad until a teacher opts in", async () => {
    const [c] = await ctx.db.select().from(s.courses).where(eq(s.courses.id, ctx.seed.course.id));
    expect(c.cadTool).toBe("tinkercad");
  });

  it("a teacher can opt a class in to SimpCAD X and back out again", async () => {
    const teacher = ctx.actor(ctx.seed.teacher);
    const id = ctx.seed.course.id;
    await updateCourseSettings(ctx.db, teacher, id, { cadTool: "simpcadx" });
    expect((await ctx.db.select().from(s.courses).where(eq(s.courses.id, id)))[0].cadTool).toBe("simpcadx");
    await updateCourseSettings(ctx.db, teacher, id, { cadTool: "tinkercad" });
    expect((await ctx.db.select().from(s.courses).where(eq(s.courses.id, id)))[0].cadTool).toBe("tinkercad");
  });

  it("rejects unknown tools and other teachers' classes", async () => {
    const teacher = ctx.actor(ctx.seed.teacher);
    // @ts-expect-error not a class design tool
    await expect(updateCourseSettings(ctx.db, teacher, ctx.seed.course.id, { cadTool: "onshape" })).rejects.toThrow();
    const other = await otherOrg(ctx.db);
    await expect(updateCourseSettings(ctx.db, ctx.actor(other.teacher), ctx.seed.course.id, { cadTool: "simpcadx" })).rejects.toThrow();
  });

  it("only swaps Tinkercad work; pro CAD lessons keep their own tool", () => {
    expect(effectiveTool("tinkercad", "simpcadx")).toBe("simpcadx");
    expect(effectiveTool("tinkercad", "tinkercad")).toBe("tinkercad");
    expect(effectiveTool("onshape", "simpcadx")).toBe("onshape");
    expect(effectiveTool("fusion", "simpcadx")).toBe("fusion");
  });
});

describe("launch block by class tool", () => {
  it("a Tinkercad class sees Tinkercad steps and no SimpCAD X content", () => {
    const html = renderToStaticMarkup(<TinkercadBlock b={withSimp} classUrl="https://www.tinkercad.com/joinclass/x" />);
    expect(html).toContain("Tinkercad step one");
    expect(html).toContain("Open Tinkercad");
    expect(html).not.toContain("SimpCAD X");
  });

  it("a SimpCAD X class sees its own steps and button", () => {
    const html = renderToStaticMarkup(<TinkercadBlock b={withSimp} classUrl={null} classTool="simpcadx" />);
    expect(html).toContain("SimpCAD X step one");
    expect(html).not.toContain("Tinkercad step one");
    expect(html).toContain("https://simpcadx.com/app/");
    expect(html).toContain("does not need an account");
    expect(html).not.toContain("use Tinkercad's words");
  });

  it("without SimpCAD X steps it keeps the written steps and says they use Tinkercad's words", () => {
    const html = renderToStaticMarkup(<TinkercadBlock b={launch} classUrl={null} classTool="simpcadx" />);
    expect(html).toContain("Tinkercad step one");
    expect(html).toContain("Tinkercad&#x27;s words");
    expect(html).toContain("Open SimpCAD X");
  });

  it("teachers on a Tinkercad class can preview the SimpCAD X steps", () => {
    const html = renderToStaticMarkup(<TinkercadBlock b={withSimp} classUrl={null} teacherView />);
    expect(html).toContain("SimpCAD X step one");
  });

  it("the pilot lesson ships SimpCAD X steps", () => {
    const l = getLesson("navigating-tinkercad")!;
    const b = allBlocks(l).find((x) => x.type === "tinkercadLaunch") as BlockOf<"tinkercadLaunch">;
    expect(b.stepsByTool?.simpcadx?.length).toBeGreaterThan(0);
  });
});
