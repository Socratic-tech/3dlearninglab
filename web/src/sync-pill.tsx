import { useSyncExternalStore } from "react";
import { CloudOff, LoaderCircle, LogIn } from "lucide-react";
import { tr } from "@/lib/i18n";
import { subscribeSync, syncState } from "./sync";

/** Small, calm status in the header: only visible while something is waiting to reach Google. */
export function SyncPill() {
  const s = useSyncExternalStore(subscribeSync, syncState, syncState);
  if (!s.pending && s.status !== "signin") return <span className="sr-only" role="status">{tr("All work saved")}</span>;
  const view =
    s.status === "signin"
      ? { icon: <LogIn className="size-4" aria-hidden />, text: tr("Sign in again to save"), cls: "border-warning bg-warning-soft text-warning" }
      : s.status === "offline"
        ? { icon: <CloudOff className="size-4" aria-hidden />, text: tr("Offline · saved on this device"), cls: "border-warning bg-warning-soft text-warning" }
        : { icon: <LoaderCircle className="size-4 animate-spin" aria-hidden />, text: tr("Saving…"), cls: "border-border bg-surface text-muted" };
  return (
    <span role="status" title={s.lastError ?? undefined} className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold sm:inline-flex ${view.cls}`}>
      {view.icon}
      {view.text}
    </span>
  );
}
