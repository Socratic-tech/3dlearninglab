import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/server/db/client";
import { env } from "@/server/env";
import { googleProvider, resolveGoogleUser, storeTokens } from "@/server/integrations/google/oauth";
import { createSession, getCurrentUser, homeFor, SESSION_COOKIE } from "@/server/auth/session";
import { AppError } from "@/server/errors";

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const fail = (code: string, message?: string) => {
    const to = new URL("/login", env.APP_URL);
    to.searchParams.set("error", code);
    if (message) to.searchParams.set("message", message);
    return NextResponse.redirect(to);
  };
  if (url.searchParams.get("error")) return fail("denied");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const savedState = req.cookies.get("g_state")?.value;
  const verifier = req.cookies.get("g_verifier")?.value;
  const intent = req.cookies.get("g_intent")?.value === "classroom" ? "classroom" : "signin";
  if (!code || !state || !savedState || state !== savedState || !verifier) return fail("state");

  const db = await getDb();
  try {
    const tokens = await googleProvider().validateAuthorizationCode(code, verifier);
    let destination: string;
    let token: string | null = null;
    if (intent === "classroom") {
      const current = await getCurrentUser();
      if (!current) return fail("state");
      const googleUser = await resolveGoogleUser(db, tokens);
      if (googleUser.id !== current.id) return fail("google", "Connect Google Classroom with the same Google account you signed in with.");
      await storeTokens(db, current.id, tokens);
      destination = "/teacher/classroom?connected=1";
    } else {
      const user = await resolveGoogleUser(db, tokens);
      token = await createSession(db, user.id);
      destination = req.cookies.get("g_next")?.value ?? homeFor(user.role);
    }
    const res = NextResponse.redirect(new URL(destination, env.APP_URL));
    if (token) res.cookies.set(SESSION_COOKIE, token, { httpOnly: true, secure: env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 14 * 86400 });
    for (const c of ["g_state", "g_verifier", "g_intent", "g_next"]) res.cookies.delete(c);
    return res;
  } catch (e) {
    console.error("[auth] Google callback failed", e);
    if (e instanceof AppError) return fail("google", e.userMessage);
    return fail("google");
  }
}
