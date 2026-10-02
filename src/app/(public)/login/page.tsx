import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, homeFor } from "@/server/auth/session";
import { demoEnabled, googleConfigured } from "@/server/env";
import { Alert } from "@/components/ui/card";
import { LogoMark } from "@/components/nav/logo";

export const metadata: Metadata = { title: "Sign in" };

const ERRORS: Record<string, string> = {
  state: "That sign-in link expired. Please try again.",
  google: "Google sign-in didn't finish. Please try again.",
  "no-org": "Your school isn't set up in 3D Design Academy yet. Ask your teacher or technology coordinator.",
  "demo-disabled": "Demo accounts are turned off on this server.",
  denied: "Sign-in was cancelled.",
};

export default async function LoginPage(props: PageProps<"/login">) {
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user.role));
  const sp = await props.searchParams;
  const error = typeof sp.error === "string" ? sp.error : undefined;
  const message = typeof sp.message === "string" ? sp.message : undefined;
  return (
    <div className="bg-blueprint flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <LogoMark size={40} />
          <h1 className="font-display text-2xl font-bold">Sign in</h1>
        </div>
        <p className="mt-2 text-muted">Use your school Google account. We never see or store your password.</p>
        {(error || message) && (
          <div className="mt-4">
            <Alert tone="danger">{message ?? ERRORS[error!] ?? "Sign-in failed. Please try again."}</Alert>
          </div>
        )}
        {googleConfigured ? (
          <a href="/api/auth/google" className="mt-6 flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-border bg-surface font-semibold hover:bg-surface-2">
            <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.6 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
              <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.6 15.1 18.9 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 38.2 44 33 44 24c0-1.3-.1-2.4-.4-3.5z" />
            </svg>
            Sign in with Google
          </a>
        ) : (
          <div className="mt-6">
            <Alert tone="warning" title="Google sign-in isn't configured on this server">
              Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET (see README). {demoEnabled && "You can explore with demo accounts meanwhile."}
            </Alert>
          </div>
        )}
        {demoEnabled && (
          <p className="mt-6 text-center text-sm text-muted">
            Just looking?{" "}
            <Link href="/demo" className="font-semibold text-primary underline">
              Explore the demo
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
