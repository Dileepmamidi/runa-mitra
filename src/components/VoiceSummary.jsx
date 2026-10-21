import { useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { TextToSpeech } from "@capacitor-community/text-to-speech";
import { Square, Volume2 } from "lucide-react";
import { voiceSummaryCopy } from "./VoiceSummary.copy";

// Reads a short summary aloud. Renders nothing unless a voice for the chosen
// language is really available, so there is never a speaker button that does
// nothing.

const norm = (code) => String(code || "").replace("_", "-").toLowerCase();

// Best language tag from a list for "te" or "en" (Indian English preferred).
function pickLang(codes, lang) {
  const list = codes.map((c) => ({ raw: c, n: norm(c) }));
  if (lang === "te") return list.find((c) => c.n === "te-in")?.raw || list.find((c) => c.n === "te" || c.n.startsWith("te-"))?.raw || null;
  return list.find((c) => c.n === "en-in")?.raw || list.find((c) => c.n === "en" || c.n.startsWith("en-"))?.raw || null;
}

function webVoice(lang) {
  const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
  if (!synth || typeof window.SpeechSynthesisUtterance !== "function") return null;
  const voices = synth.getVoices() || [];
  const tag = pickLang(voices.map((v) => v.lang), lang);
  return tag ? voices.find((v) => v.lang === tag) || null : null;
}

export function VoiceSummary({ text, lang = "te" }) {
  const s = voiceSummaryCopy[lang] || voiceSummaryCopy.te;
  const native = Capacitor.isNativePlatform();
  const [engine, setEngine] = useState(null); // { kind: "native", tag } | { kind: "web", voice }
  const [speaking, setSpeaking] = useState(false);
  const runId = useRef(0);

  // Find a voice for this language.
  useEffect(() => {
    let cancelled = false;
    setEngine(null);
    if (native) {
      (async () => {
        try {
          const { languages = [] } = await TextToSpeech.getSupportedLanguages();
          const tag = pickLang(languages, lang);
          if (!tag) return;
          const { supported } = await TextToSpeech.isLanguageSupported({ lang: tag }).catch(() => ({ supported: false }));
          if (!cancelled && supported) setEngine({ kind: "native", tag });
        } catch {
          // No speech engine: show nothing.
        }
      })();
      return () => { cancelled = true; };
    }
    const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
    if (!synth) return undefined;
    const update = () => {
      if (cancelled) return;
      const voice = webVoice(lang);
      setEngine(voice ? { kind: "web", voice } : null);
    };
    update();
    synth.addEventListener?.("voiceschanged", update);
    return () => {
      cancelled = true;
      synth.removeEventListener?.("voiceschanged", update);
    };
  }, [native, lang]);

  const stop = () => {
    runId.current += 1;
    setSpeaking(false);
    if (native) TextToSpeech.stop().catch(() => {});
    else window.speechSynthesis?.cancel();
  };

  // Stop when the text or language changes, or the screen closes.
  useEffect(() => () => {
    runId.current += 1;
    if (native) TextToSpeech.stop().catch(() => {});
    else if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  }, [native, text, lang]);

  if (!engine || !text) return null;

  const speak = async () => {
    const id = ++runId.current;
    setSpeaking(true);
    const done = () => { if (runId.current === id) setSpeaking(false); };
    if (engine.kind === "native") {
      try {
        await TextToSpeech.speak({ text, lang: engine.tag, rate: 0.9 });
      } catch {
        // Speech failed or was stopped.
      }
      done();
      return;
    }
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new window.SpeechSynthesisUtterance(text);
    u.voice = engine.voice;
    u.lang = engine.voice.lang;
    u.rate = 0.9;
    u.onend = done;
    u.onerror = done;
    synth.speak(u);
  };

  return (
    <button
      type="button"
      onClick={speaking ? stop : speak}
      aria-label={speaking ? s.stopLabel : s.listenLabel}
      aria-pressed={speaking}
      className={`inline-flex min-h-14 w-full select-none items-center justify-center gap-3 rounded-xl px-5 text-[18px] font-bold transition active:scale-[0.99] ${
        speaking ? "bg-amber-500 text-ink" : "border border-line bg-surface text-brand-700 shadow-soft"
      }`}
    >
      {speaking ? <Square size={24} /> : <Volume2 size={26} />}
      {speaking ? s.stop : s.listen}
    </button>
  );
}
