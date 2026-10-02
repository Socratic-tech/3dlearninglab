import "server-only";
import { Google, decodeIdToken, type OAuth2Tokens } from "arctic";
import { and, eq } from "drizzle-orm";
import type { DB } from "../../db/client";
import { oauthTokens, organizations, users } from "../../db/schema";
import { env, googleConfigured } from "../../env";
import { decrypt, encrypt } from "../../crypto";
import { AppError, IntegrationError } from "../../errors";
import { audit } from "../../services/audit";
import { CLASSROOM_SCOPES, SIGN_IN_SCOPES } from "./types";

export function googleProvider() {
  if (!googleConfigured) throw new AppError("Google sign-in isn't configured on this server yet.", 503);
  return new Google(env.GOOGLE_CLIENT_ID!, env.GOOGLE_CLIENT_SECRET!, `${env.APP_URL}/api/auth/google/callback`);
}

export function authorizationUrl(state: string, codeVerifier: string, intent: "signin" | "classroom", loginHint?: string) {
  const scopes = intent === "classroom" ? [...SIGN_IN_SCOPES, ...CLASSROOM_SCOPES] : SIGN_IN_SCOPES;
  const url = googleProvider().createAuthorizationURL(state, codeVerifier, scopes);
  url.searchParams.set("include_granted_scopes", "true");
  if (intent === "classroom") {
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");
  } else {
    url.searchParams.set("prompt", "select_account");
  }
  if (loginHint) url.searchParams.set("login_hint", loginHint);
  return url;
}

type IdClaims = { sub: string; email?: string; email_verified?: boolean; name?: string; hd?: string };

/**
 * Resolve (or create) the local user for a Google sign-in.
 * Order: existing googleSub → existing email (pre-rostered) → new user in the organization that owns the email domain.
 */
export async function resolveGoogleUser(db: DB, tokens: OAuth2Tokens) {
  const claims = decodeIdToken(tokens.idToken()) as IdClaims;
  if (!claims.sub || !claims.email || claims.email_verified === false) throw new AppError("Your Google account needs a verified email address.", 403);
  const email = claims.email.toLowerCase();
  const domain = email.split("@")[1];
  const platformAdmins = (process.env.PLATFORM_ADMIN_EMAILS ?? "").toLowerCase().split(",").map((s) => s.trim()).filter(Boolean);

  const [bySub] = await db.select().from(users).where(eq(users.googleSub, claims.sub)).limit(1);
  if (bySub) return bySub;

  const byEmail = await db.select().from(users).where(and(eq(users.email, email), eq(users.isDemo, false)));
  if (byEmail.length === 1) {
    const [u] = await db.update(users).set({ googleSub: claims.sub, displayName: claims.name ?? byEmail[0].displayName }).where(eq(users.id, byEmail[0].id)).returning();
    return u;
  }

  const orgs = await db.select().from(organizations).where(eq(organizations.isDemo, false));
  const staffOrg = orgs.find((o) => o.googleDomain && o.googleDomain.toLowerCase() === domain);
  const studentOrg = orgs.find((o) => o.studentGoogleDomain && o.studentGoogleDomain.toLowerCase() === domain);
  const org = studentOrg ?? staffOrg;
  if (!org) {
    throw new AppError(
      platformAdmins.includes(email)
        ? "No organization exists yet. Run `npm run db:seed -- --org` to create one (see README)."
        : "Your school isn't set up in 3D Design Academy yet. Ask your teacher or technology coordinator.",
      403,
    );
  }
  // A shared staff/student domain defaults to student; staff are promoted by an org admin or by Classroom import.
  const sharedDomain = org.googleDomain && org.studentGoogleDomain && org.googleDomain === org.studentGoogleDomain;
  const role = platformAdmins.includes(email) ? "platform_admin" : studentOrg || sharedDomain ? "student" : "teacher";
  const [created] = await db
    .insert(users)
    .values({ googleSub: claims.sub, email, displayName: claims.name ?? email.split("@")[0], role, organizationId: org.id })
    .returning();
  await audit(db, { actorId: created.id, organizationId: org.id, action: "user.create.google", targetType: "user", targetId: created.id, metadata: { role } });
  return created;
}

export async function storeTokens(db: DB, userId: string, tokens: OAuth2Tokens) {
  const scope = tokens.hasScopes() ? tokens.scopes().join(" ") : "";
  const values = {
    userId,
    provider: "google",
    accessTokenEnc: encrypt(tokens.accessToken()),
    refreshTokenEnc: tokens.hasRefreshToken() ? encrypt(tokens.refreshToken()) : null,
    scope,
    expiresAt: tokens.accessTokenExpiresAt(),
    updatedAt: new Date(),
  };
  await db
    .insert(oauthTokens)
    .values(values)
    .onConflictDoUpdate({
      target: oauthTokens.userId,
      // keep an existing refresh token when Google doesn't send a new one
      set: { ...values, refreshTokenEnc: values.refreshTokenEnc ?? undefined },
    });
}

export async function hasClassroomGrant(db: DB, userId: string): Promise<boolean> {
  const [t] = await db.select().from(oauthTokens).where(eq(oauthTokens.userId, userId)).limit(1);
  return Boolean(t?.refreshTokenEnc && CLASSROOM_SCOPES.every((s) => t.scope.includes(s)));
}

/** Returns a valid access token, refreshing with the stored refresh token when needed. */
export async function getAccessToken(db: DB, userId: string): Promise<string> {
  const [t] = await db.select().from(oauthTokens).where(eq(oauthTokens.userId, userId)).limit(1);
  if (!t) throw new IntegrationError("Connect Google Classroom first.", "google");
  if (t.expiresAt.getTime() - Date.now() > 60_000) return decrypt(t.accessTokenEnc);
  if (!t.refreshTokenEnc) throw new IntegrationError("Your Google connection expired. Reconnect Google Classroom.", "google");
  try {
    const refreshed = await googleProvider().refreshAccessToken(decrypt(t.refreshTokenEnc));
    await db
      .update(oauthTokens)
      .set({ accessTokenEnc: encrypt(refreshed.accessToken()), expiresAt: refreshed.accessTokenExpiresAt(), updatedAt: new Date() })
      .where(eq(oauthTokens.userId, userId));
    return refreshed.accessToken();
  } catch (e) {
    throw new IntegrationError("Your Google connection expired. Reconnect Google Classroom.", "google", e);
  }
}

export async function disconnectGoogle(db: DB, userId: string) {
  const [t] = await db.select().from(oauthTokens).where(eq(oauthTokens.userId, userId)).limit(1);
  if (t) {
    // best-effort revoke at Google
    const token = t.refreshTokenEnc ? decrypt(t.refreshTokenEnc) : decrypt(t.accessTokenEnc);
    await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, { method: "POST" }).catch(() => undefined);
  }
  await db.delete(oauthTokens).where(eq(oauthTokens.userId, userId));
}
