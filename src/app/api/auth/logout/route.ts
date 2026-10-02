import { NextResponse, type NextRequest } from "next/server";
import { signOut } from "@/server/auth/session";
import { env } from "@/server/env";

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(env.APP_URL).host && origin !== req.nextUrl.origin) return new NextResponse("Forbidden", { status: 403 });
  await signOut();
  return NextResponse.redirect(new URL("/", env.APP_URL), 303);
}
