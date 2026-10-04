"use client";
/**
 * Speak instead of type (UDL: multiple tools for expression). Uses the browser's built-in speech recognition
 * (Chrome, Edge, Chromebooks, Safari). Shows nothing where the browser can't do it.
 */
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Mic, MicOff } from "lucide-react";
import { getLocale, tr } from "@/lib/i18n";
import { cn } from "@/lib/cn";

type Rec = { lang: string; continuous: boolean; interimResults: boolean; start(): void; stop(): void; onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null };
type RecCtor = new () => Rec;

const noSubscribe = () => () => {};

function recognizer(): RecCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecCtor; webkitSpeechRecognition?: RecCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Appends what the student says to the text (each finished phrase calls onText with the added words). */
export function DictateButton({ onText, disabled, className }: { onText: (words: string) => void; disabled?: boolean; className?: string }) {
  const supported = useSyncExternalStore(noSubscribe, () => !!recognizer(), () => false);
  const [on, setOn] = useState(false);
  const rec = useRef<Rec | null>(null);
  useEffect(() => () => rec.current?.stop(), []);
  if (!supported) return null;
  const toggle = () => {
    if (on) { rec.current?.stop(); return; }
    const R = recognizer();
    if (!R) return;
    const r = new R();
    r.lang = getLocale() === "es" ? "es-US" : "en-US";
    r.continuous = true;
    r.interimResults = false;
    r.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) onText(e.results[i][0].transcript.trim());
    };
    r.onend = () => setOn(false);
    r.onerror = () => setOn(false);
    rec.current = r;
    r.start();
    setOn(true);
  };
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={toggle}
      aria-pressed={on}
      className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold", on ? "border-danger bg-danger-soft text-danger" : "border-border hover:bg-surface-2", className)}
    >
      {on ? <MicOff className="size-4" aria-hidden /> : <Mic className="size-4" aria-hidden />}
      {on ? tr("Stop talking") : tr("Speak instead")}
    </button>
  );
}
