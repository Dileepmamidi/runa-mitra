import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Download, X } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useCopy } from "../i18n/useCopy";
import { Button } from "../ui";
import { updateNoticeCopy } from "./UpdateNotice.copy";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const DISMISS_KEY = "runa-update-dismissed";

// Android app only: compares this app's build number with version.json on the
// website and offers the newer APK. Shown once per new version (until
// "Later"), never blocks the app, and does nothing on the web.
export function UpdateNotice() {
  const { language } = useApp();
  const s = useCopy(updateNoticeCopy);
  const [update, setUpdate] = useState(null);

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !API_BASE) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const { App } = await import("@capacitor/app");
        const info = await App.getInfo();
        const res = await fetch(`${API_BASE}/version.json`, { cache: "no-store" });
        const latest = (await res.json())?.android;
        const current = Number(info.build) || 0;
        let dismissed = 0;
        try {
          dismissed = Number(localStorage.getItem(DISMISS_KEY)) || 0;
        } catch {
          /* ignore */
        }
        if (!cancelled && latest?.versionCode > current && latest.versionCode > dismissed && latest.apkUrl) setUpdate(latest);
      } catch {
        /* offline or file missing: try again next launch */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!update) return null;

  const download = async () => {
    const { Browser } = await import("@capacitor/browser");
    Browser.open({ url: update.apkUrl });
  };
  const later = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(update.versionCode));
    } catch {
      /* ignore */
    }
    setUpdate(null);
  };

  return (
    <div className="mx-auto mb-4 max-w-xl animate-fade-up rounded-2xl border border-amber-200 bg-amber-50 p-4 text-ink shadow-soft">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
          <Download size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-extrabold">{s.title(update.versionName)}</p>
          {update.notes?.[language] && <p className="mt-0.5 text-[14px] font-medium text-ink-soft">{update.notes[language]}</p>}
          <p className="mt-1 text-[13px] font-medium text-ink-muted">{s.how}</p>
        </div>
        <button type="button" onClick={later} aria-label={s.later} className="rounded-full p-1 text-ink-muted active:bg-ink/5">
          <X size={18} />
        </button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={later}>{s.later}</Button>
        <Button variant="warning" icon={Download} onClick={download}>{s.download}</Button>
      </div>
    </div>
  );
}
