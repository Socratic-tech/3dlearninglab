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

export function signOut() {
  try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
  window.google?.accounts.id.disableAutoSelect();
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
    auto_select: true,
    callback: (r: { credential: string }) => {
      try { sessionStorage.setItem(KEY, r.credential); } catch { /* ignore */ }
      onToken(r.credential);
    },
  });
  g.accounts.id.renderButton(el, { theme: "outline", size: "large", shape: "pill", text: "signin_with" });
  g.accounts.id.prompt();
}
