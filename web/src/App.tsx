import { tr } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";
import { ensureLocaleContent, localeContentReady } from "./content";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { LogOut } from "lucide-react";
import { DisplayMenu } from "./display";
import { LogoMark } from "@/components/nav/logo";
import { Alert } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { readConfig, resetDevice, setCurrentClassId } from "./config";
import { currentToken, renderSignIn, signOut, tokenEmail } from "./auth";
import { cachedMe, clearCachedData, saveMe, withPending } from "./cache";
import { resumeSync, startSync, subscribeSync, syncState } from "./sync";
import { SyncPill } from "./sync-pill";
import { identityOf, isStaff, setPreviewUnlock, setStudentView, usePreviewUnlock, useStudentView } from "./state";
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

/** A usable class reply: anything else (an old saved copy, an unexpected answer) must never blank the site. */
const isMe = (x: unknown): x is Me => !!x && typeof x === "object" && !!(x as Me).user && typeof (x as Me).user.role === "string" && !!(x as Me).progress;
const goodCached = (api: string, email: string | null) => { const c = cachedMe(api, email); return isMe(c) ? c : null; };

export function App() {
  const studentView = useStudentView();
  const [cfg, setCfg] = useState(readConfig);
  const [token, setToken] = useState(currentToken);
  // show the last saved copy instantly (plus anything not yet uploaded), then refresh from Google
  const [me, setMe] = useState<Me | null>(() => {
    const email = identityOf(tokenEmail());
    if (!cfg.apiUrl || !email) return null;
    startSync(cfg.apiUrl, email);
    const cached = goodCached(cfg.apiUrl, email);
    return cached ? withPending(cached) : null;
  });
  const [error, setError] = useState<string | null>(null);
  const hash = useHash();
  // the whole app re-renders when the language changes; Spanish lessons load on first use
  const locale = useLocale();
  const [, setContentTick] = useState(0);
  useEffect(() => { void ensureLocaleContent(locale).then(() => setContentTick((n) => n + 1)); }, [locale]);

  const hasMe = useRef(!!me);
  useEffect(() => { hasMe.current = !!me; }, [me]);
  const load = useCallback(async () => {
    if (!cfg.apiUrl || !currentToken()) return;
    const email = identityOf(tokenEmail());
    if (email) startSync(cfg.apiUrl, email);
    const r = await call<Me>(cfg.apiUrl, "me");
    if (r.ok && !isMe(r.data)) {
      console.error("Unexpected class reply", r.data);
      setError(tr("Your class Sheet sent an answer this page doesn't understand. Open the Sheet's side panel, click Update now, then reload this page.") + " (" + JSON.stringify(r.data ?? null).slice(0, 120) + ")");
    } else if (r.ok) {
      saveMe(cfg.apiUrl, email, r.data);
      setMe(withPending(r.data));
      setError(null);
      if (r.data.cls) setCurrentClassId(r.data.cls.id);
    } else if (!hasMe.current) setError(r.error); // otherwise keep showing the saved copy while Google is slow or offline
  }, [cfg.apiUrl]);

  // Student view on/off switches between the teacher and their test student: show that person's saved copy, then refresh
  const lastView = useRef(studentView);
  useEffect(() => {
    if (lastView.current === studentView) return;
    lastView.current = studentView;
    const email = identityOf(tokenEmail());
    const cached = cfg.apiUrl && email ? goodCached(cfg.apiUrl, email) : null;
    setMe(cached ? withPending(cached) : null);
    hasMe.current = !!cached;
    void load();
  }, [studentView, cfg.apiUrl, load]);


  // once the background queue has uploaded everything, pull the official numbers (XP, unlocks) quietly
  useEffect(() => {
    let had = syncState().pending > 0;
    return subscribeSync(() => {
      const now = syncState().pending > 0;
      if (had && !now) void load();
      had = now;
    });
  }, [load]);
  useEffect(() => { if (token) resumeSync(); }, [token]);

  // load once, then refresh XP, streak and progress whenever a student comes back to their path
  const atHome = hash === "#/" || hash === "#/student";
  const loaded = useRef(false);
  useEffect(() => {
    if (!token) return;
    if (atHome) setMe((m) => (m ? withPending(m) : m)); // reflect just-finished work immediately
    if (atHome || !loaded.current) { loaded.current = true; void load(); }
  }, [token, atHome, load]);

  if (!cfg.apiUrl || !cfg.clientId || hash.startsWith("#/setup")) return <Frame><SetupPage cfg={cfg} onSaved={() => { setCfg(readConfig()); location.hash = "#/"; }} /></Frame>;
  if (!token) return <Frame><SignIn key={locale} clientId={cfg.clientId} onToken={setToken} /></Frame>;
  if (error) return <Frame onSignOut={() => { clearCachedData(tokenEmail()); signOut(); setToken(null); setMe(null); }}><div className="mx-auto max-w-lg py-10"><Alert tone="danger" title={tr("We couldn't open your class")}>{error}</Alert><div className="mt-4 flex flex-wrap gap-2"><Button onClick={() => void load()}>{tr("Try again")}</Button>{studentView && <Button variant="secondary" onClick={() => { setError(null); setStudentView(false); location.hash = "#/teacher"; }}>{tr("Back to teacher view")}</Button>}<Button variant="secondary" onClick={() => { signOut(); resetDevice(); location.replace(location.pathname); }}>{tr("Start over on this device")}</Button></div><p className="mt-2 text-sm text-muted">{tr("Start over forgets the class link and Google account on this computer. Then open the right link again.")}</p></div></Frame>;
  if (!me || !localeContentReady(locale)) return <Frame><p className="py-20 text-center text-muted" role="status">{tr("Loading your class…")}</p></Frame>;

  const route = hash.replace(/^#/, "");
  let page: ReactNode;
  if (route.startsWith("/lesson/")) {
    const [lessonId, focus] = route.slice(8).split("/");
    page = <LessonPage key={route} me={me} apiUrl={cfg.apiUrl} lessonId={lessonId} focusBlockId={focus} onChange={load} />;
  } else if (route.startsWith("/print/")) page = <HandoutPage me={me} lessonId={route.slice(7)} />;
  else if (me.user.role === "teacher" && (route.startsWith("/teacher") || (route === "/" && !studentView))) page = <TeacherPage me={me} apiUrl={cfg.apiUrl} clientId={cfg.clientId} onChange={load} />;
  else page = <StudentHome me={me} apiUrl={cfg.apiUrl} onChange={load} />;

  return (
    <Frame me={me} onReset={async () => { const r = await call(cfg.apiUrl ?? "", "resetPreview", { asStudent: false }); if (r.ok) { clearCachedData(identityOf(tokenEmail())); await load(); } return r.ok; }} onSwitch={(id) => { setCurrentClassId(id); void load(); }} onSignOut={() => { clearCachedData(tokenEmail()); signOut(); setToken(null); setMe(null); }}>
      {page}
    </Frame>
  );
}

function Frame({ children, me, onSignOut, onSwitch, onReset }: { children: ReactNode; me?: Me; onSignOut?: () => void; onSwitch?: (classId: string) => void; onReset?: () => Promise<boolean> }) {
  const studentView = useStudentView() && !!me && (isStaff(me) || !!me.user.preview);
  const [resetStep, setResetStep] = useState<"idle" | "sure" | "busy">("idle");
  const unlocked = usePreviewUnlock();
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-border bg-bg/90 backdrop-blur print:hidden">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
          <a href="#/" className="flex shrink-0 items-center gap-2 font-display font-bold" aria-label="3D Design Academy"><LogoMark /> <span className="hidden sm:inline">3D Design <span className="text-primary">Academy</span></span></a>
          {me && me.classes.length > 1 && onSwitch ? (
            <label className="flex min-w-0 items-center gap-2 text-sm">
              <span className="sr-only">{tr("Class")}</span>
              <select className="h-9 w-full min-w-[6rem] max-w-[11rem] truncate rounded-lg border border-border bg-surface px-2" value={me.cls?.id ?? ""} onChange={(e) => onSwitch(e.target.value)}>
                {me.classes.map((c) => <option key={c.id} value={c.id}>{c.name}{c.section ? ` · ${c.section}` : ""}</option>)}
              </select>
            </label>
          ) : me?.cls ? (
            <span className="hidden truncate text-sm text-muted sm:inline">· {me.cls.name}{me.cls.section ? ` · ${me.cls.section}` : ""}</span>
          ) : null}
          <div className="ml-auto flex shrink-0 items-center gap-1">
            {me?.user.role === "teacher" && !studentView && <a href="#/teacher" className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-surface-2">{tr("Teacher")}</a>}
            {me && <a href="#/student" className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-surface-2">{tr("Missions")}</a>}
            {me && <SyncPill />}
            <DisplayMenu allLooks={!!me && isStaff(me)} />
            {onSignOut && me && <button onClick={onSignOut} className="rounded-lg p-2 text-muted hover:bg-surface-2" aria-label={tr("Sign out")}><LogOut className="size-5" aria-hidden /></button>}
          </div>
        </div>
        {studentView && (
          <div className="border-t border-accent bg-accent-soft">
            <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-sm">
              <p className="min-w-0 flex-1"><strong>{tr("Student view")}</strong> · {tr("You're your own test student: XP, avatar, store and rewards all work. It shows on your dashboard as \"(test student)\".")}</p>
              <label className="flex items-center gap-1.5 font-semibold"><input type="checkbox" className="size-4" checked={unlocked} onChange={(e) => setPreviewUnlock(e.target.checked)} /> {tr("Unlock all missions")}</label>
              {onReset && <button className="rounded-lg px-3 py-1 font-semibold underline" disabled={resetStep === "busy"} onClick={() => {
                if (resetStep === "idle") { setResetStep("sure"); return; }
                setResetStep("busy");
                void onReset().then(() => { setResetStep("idle"); location.hash = "#/student"; });
              }}>{resetStep === "sure" ? tr("Click again to erase the test student's work") : resetStep === "busy" ? tr("Resetting…") : tr("Reset test student")}</button>}
              <button className="rounded-lg border border-accent px-3 py-1 font-semibold" onClick={() => { setStudentView(false); location.hash = "#/teacher"; }}>{tr("Back to teacher view")}</button>
            </div>
          </div>
        )}
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
      <h1 className="mt-3 font-display text-3xl font-bold">{tr("Learn to design things that work.")}</h1>
      <p className="mt-2 text-muted">{tr("Sign in with your school Google account to open your missions.")}</p>
      <div ref={ref} className="mt-6 flex justify-center" />
      <p className="mt-6 text-xs text-muted">{tr("Your work is saved to your class's Google Sheet, which only your teacher can open.")}</p>
    </div>
  );
}
