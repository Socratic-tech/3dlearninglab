import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { authorizeFileKey } from "@/server/services/evidence";
import { storage } from "@/server/storage";
import { AppError } from "@/server/errors";

/** Private file delivery: every request is authorized against the owning record (spec §39). */
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/files/[...key]">) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Sign in required", { status: 401 });
  const key = (await ctx.params).key.join("/");
  try {
    const meta = await authorizeFileKey(await getDb(), { id: user.id, role: user.role, organizationId: user.organizationId }, key);
    const file = await storage().get(key);
    if (!file) return new NextResponse("File not found", { status: 404 });
    const inline = (meta.contentType ?? file.contentType ?? "").startsWith("image/");
    return new NextResponse(new Uint8Array(file.body), {
      headers: {
        "Content-Type": inline ? (meta.contentType ?? file.contentType!) : "application/octet-stream",
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${meta.fileName.replace(/"/g, "")}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    const status = e instanceof AppError ? (e.status === 403 ? 404 : e.status) : 500;
    return new NextResponse(status === 404 ? "Not found" : "Error", { status });
  }
}
