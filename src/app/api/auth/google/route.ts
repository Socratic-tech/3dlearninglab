import { NextResponse, type NextRequest } from "next/server";
import { generateCodeVerifier, generateState } from "arctic";
import { authorizationUrl } from "@/server/integrations/google/oauth";
import { env, googleConfigured } from "@/server/env";
import { getCurrentUser } from "@/server/auth/session";

/** Starts Google sign-in. `?intent=classroom` asks a signed-in teacher for Classroom scopes (incremental consent). */
export async function GET(req: NextRequest) {
  if (!googleConfigured) return NextResponse.redirect(new URL("/login?error=google", env.APP_URL));
  const intent = req.nextUrl.searchParams.get("intent") === "classroom" ? "classroom" : "signin";
  let hint: string | undefined;
  if (intent === "classroom") {
    const user = await getCurrentUser();
    if (!user || user.role === "student") return NextResponse.redirect(new URL("/login", env.APP_URL));
    hint = user.email;
  }
  const state = generateState();
  const verifier = generateCodeVerifier();
  const url = authorizationUrl(state, verifier, intent, hint);
  const res = NextResponse.redirect(url);
  const opts = { httpOnly: true, secure: env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: 600 };
  res.cookies.set("g_state", state, opts);
  res.cookies.set("g_verifier", verifier, opts);
  res.cookies.set("g_intent", intent, opts);
  const next = req.nextUrl.searchParams.get("next");
  if (next?.startsWith("/") && !next.startsWith("//")) res.cookies.set("g_next", next, opts);
  return res;
}
