import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { LogOut } from "lucide-react";
import { DisplayMenu } from "./display";
import { LogoMark } from "@/components/nav/logo";
import { Alert } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { readConfig, setCurrentClassId } from "./config";
import { currentToken, renderSignIn, signOut } from "./auth";
import { call } from "./api";
import type { Me } from "./content";
import { StudentHome } from "./pages/StudentHome";
import { LessonPage } from "./pages/LessonPage";
import { TeacherPage } from "./pages/TeacherPage";
import { SetupPage } from "./pages/SetupPage";
import { HandoutPage } from "./pages/HandoutPage";

function useHash() {
  const [hash, setHash] = useState(() => location.hash || "#/");
  useEffect(() => {
    const on = () => setHash(location.hash || "#/");
    addEventListener("hashchange", on);
    return () => removeEventListener("hashchange", on);
  }, []);
  return hash;
}

export function App() {
  const [cfg, setCfg] = useState(readConfig);
  const [token, setToken] = useState(currentToken);
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hash = useHash();

  const load = useCallback(async () => {
    if (!cfg.apiUrl || !currentToken()) return;
    const r = await call<Me>(cfg.apiUrl, "me");
    if (r.ok) { setMe(r.data); setError(null); if (r.data.cls) setCurrentClassId(r.data.cls.id); }
    else setError(r.error);
  }, [cfg.apiUrl]);

  // load once, then refresh XP, streak and progress whenever a student comes back to their path
  const atHome = hash === "#/" || hash === "#/student";
  const loaded = useRef(false);
  useEffect(() => {
    if (!token) return;
    if (atHome || !loaded.current) { loaded.current = true; void load(); }
  }, [token, atHome, load]);

  if (!cfg.apiUrl || !cfg.clientId || hash.startsWith("#/setup")) return <Frame><SetupPage cfg={cfg} onSaved={() => { setCfg(readConfig()); location.hash = "#/"; }} /></Frame>;
  if (!token) return <Frame><SignIn clientId={cfg.clientId} onToken={setToken} /></Frame>;
  if (error) return <Frame onSignOut={() => { signOut(); setToken(null); setMe(null); }}><div className="mx-auto max-w-lg py-10"><Alert tone="danger" title="We couldn't open your class">{error}</Alert><Button className="mt-4" onClick={() => void load()}>Try again</Button></div></Frame>;
  if (!me) return <Frame><p className="py-20 text-center text-muted" role="status">Loading your class…</p></Frame>;

  const route = hash.replace(/^#/, "");
  let page: ReactNode;
  if (route.startsWith("/lesson/")) {
    const [lessonId, focus] = route.slice(8).split("/");
    page = <LessonPage key={route} me={me} apiUrl={cfg.apiUrl} lessonId={lessonId} focusBlockId={focus} onChange={load} />;
  } else if (route.startsWith("/print/")) page = <HandoutPage me={me} lessonId={route.slice(7)} />;
  else if (me.user.role === "teacher" && (route.startsWith("/teacher") || route === "/")) page = <TeacherPage me={me} apiUrl={cfg.apiUrl} clientId={cfg.clientId} onChange={load} />;
  else page = <StudentHome me={me} apiUrl={cfg.apiUrl} onChange={load} />;

  return (
    <Frame me={me} onSwitch={(id) => { setCurrentClassId(id); void load(); }} onSignOut={() => { signOut(); setToken(null); setMe(null); }}>
      {page}
    </Frame>
  );
}

function Frame({ children, me, onSignOut, onSwitch }: { children: ReactNode; me?: Me; onSignOut?: () => void; onSwitch?: (classId: string) => void }) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-border bg-bg/90 backdrop-blur print:hidden">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
          <a href="#/" className="flex items-center gap-2 font-display font-bold"><LogoMark /> <span>3D Design <span className="text-primary">Academy</span></span></a>
          {me && me.classes.length > 1 && onSwitch ? (
            <label className="flex min-w-0 items-center gap-2 text-sm">
              <span className="sr-only">Class</span>
              <select className="h-9 max-w-[11rem] truncate rounded-lg border border-border bg-surface px-2" value={me.cls?.id ?? ""} onChange={(e) => onSwitch(e.target.value)}>
                {me.classes.map((c) => <option key={c.id} value={c.id}>{c.name}{c.section ? ` · ${c.section}` : ""}</option>)}
              </select>
            </label>
          ) : me?.cls ? (
            <span className="hidden truncate text-sm text-muted sm:inline">· {me.cls.name}{me.cls.section ? ` · ${me.cls.section}` : ""}</span>
          ) : null}
          <div className="ml-auto flex items-center gap-1">
            {me?.user.role === "teacher" && <a href="#/teacher" className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-surface-2">Teacher</a>}
            {me && <a href="#/student" className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-surface-2">Missions</a>}
            <DisplayMenu />
            {onSignOut && me && <button onClick={onSignOut} className="rounded-lg p-2 text-muted hover:bg-surface-2" aria-label="Sign out"><LogOut className="size-5" aria-hidden /></button>}
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-5xl px-4 pb-24 pt-6">{children}</main>
    </div>
  );
}

function SignIn({ clientId, onToken }: { clientId: string; onToken: (t: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (ref.current) void renderSignIn(ref.current, clientId, onToken); }, [clientId, onToken]);
  return (
    <div className="bg-blueprint mx-auto mt-10 max-w-md rounded-3xl border border-border bg-surface p-8 text-center">
      <LogoMark size={48} />
      <h1 className="mt-3 font-display text-3xl font-bold">Learn to design things that work.</h1>
      <p className="mt-2 text-muted">Sign in with your school Google account to open your missions.</p>
      <div ref={ref} className="mt-6 flex justify-center" />
      <p className="mt-6 text-xs text-muted">Your work is saved to your class&apos;s Google Sheet, which only your teacher can open.</p>
    </div>
  );
}
