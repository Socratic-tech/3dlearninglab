import { getLocale } from "@/lib/i18n";
/** Sign in with Google (Google Identity Services). The ID token is sent with every API call and verified by Apps Script. */
type Gis = {
  accounts: { id: { initialize(o: object): void; renderButton(el: HTMLElement, o: object): void; prompt(): void; disableAutoSelect(): void } };
};
declare global {
  interface Window { google?: Gis }
}

const KEY = "academy.idtoken";

export function currentToken(): string | null {
  try {
    const t = sessionStorage.getItem(KEY);
    if (!t) return null;
    const exp = JSON.parse(atob(t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).exp as number;
    return exp * 1000 > Date.now() + 60_000 ? t : null;
  } catch {
    return null;
  }
}

const SIGNED_OUT = "academy.signedout";

export function signOut() {
  try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
  // after a sign-out, don't let Google sign the same account straight back in (shared computers)
  try { localStorage.setItem(SIGNED_OUT, "1"); } catch { /* ignore */ }
  window.google?.accounts.id.disableAutoSelect();
}

function signedOut() {
  try { return localStorage.getItem(SIGNED_OUT) === "1"; } catch { return false; }
}

function whenGis(): Promise<Gis> {
  return new Promise((resolve) => {
    const tick = () => (window.google?.accounts?.id ? resolve(window.google) : setTimeout(tick, 100));
    tick();
  });
}

export async function renderSignIn(el: HTMLElement, clientId: string, onToken: (t: string) => void) {
  const g = await whenGis();
  g.accounts.id.initialize({
    client_id: clientId,
    auto_select: !signedOut(),
    callback: (r: { credential: string }) => {
      try { sessionStorage.setItem(KEY, r.credential); } catch { /* ignore */ }
      try { localStorage.removeItem(SIGNED_OUT); } catch { /* ignore */ }
      onToken(r.credential);
    },
  });
  g.accounts.id.renderButton(el, { theme: "outline", size: "large", shape: "pill", text: "signin_with", locale: getLocale() });
  g.accounts.id.prompt();
}

/** Email in the current sign-in token (used to keep each student's offline queue and cache separate). */
export function tokenEmail(): string | null {
  const t = currentToken();
  if (!t) return null;
  try {
    const p = JSON.parse(decodeURIComponent(escape(atob(t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")))));
    return typeof p.email === "string" ? p.email.toLowerCase() : null;
  } catch {
    return null;
  }
}
