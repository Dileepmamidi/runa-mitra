import { Component } from "react";
import { errorBoundaryCopy } from "./ErrorBoundary.copy";

// Shows a friendly screen instead of a blank page if a screen crashes.
// Reads the language from localStorage because it may render outside the
// app context.
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, path: null };
  }

  static getDerivedStateFromError(error) {
    return { error, path: window.location.pathname };
  }

  componentDidCatch(error, info) {
    console.error("Screen crashed", error, info?.componentStack);
  }

  componentDidUpdate() {
    // Leaving the broken screen clears the error.
    if (this.state.error && window.location.pathname !== this.state.path) this.setState({ error: null, path: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    let lang = "te";
    try {
      lang = localStorage.getItem("runa-language") === "en" ? "en" : "te";
    } catch {
      /* storage unavailable */
    }
    const s = errorBoundaryCopy[lang];
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas px-6 text-center">
        <img src="/logo.svg" alt="" className="h-14 w-14 rounded-2xl" />
        <h1 className="text-2xl font-extrabold text-ink">{s.title}</h1>
        <p className="max-w-sm text-[16px] font-medium text-ink-soft">{s.text}</p>
        <div className="grid w-full max-w-xs gap-2">
          <a href="/home" className="flex min-h-12 items-center justify-center rounded-xl bg-brand-600 font-bold text-white">{s.home}</a>
          <button type="button" onClick={() => window.location.reload()} className="min-h-12 rounded-xl border border-line bg-surface font-bold text-brand-700">
            {s.reload}
          </button>
        </div>
      </div>
    );
  }
}
