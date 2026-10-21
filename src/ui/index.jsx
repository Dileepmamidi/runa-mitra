// Runa Mitra UI kit. Every screen is built from these pieces so the app
// looks and behaves the same everywhere: large text, large touch targets,
// one clear primary action per screen.
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, Info, AlertTriangle, CheckCircle2, XCircle, Construction, Loader2 } from "lucide-react";

const cx = (...parts) => parts.filter(Boolean).join(" ");

// ---------- layout ----------

/** Page wrapper with a large title, optional back button and actions. */
export function Screen({ title, subtitle, back, actions, children, className = "" }) {
  const navigate = useNavigate();
  const goBack = () => (typeof back === "string" ? navigate(back) : navigate(-1));
  return (
    <div className={cx("mx-auto w-full max-w-xl pb-6", className)}>
      {(title || back || actions) && (
        <header className="mb-5 flex items-start gap-3">
          {back && (
            <button
              onClick={goBack}
              aria-label="Back"
              className="-ml-1 mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-ink shadow-soft active:scale-95"
            >
              <ArrowLeft size={22} />
            </button>
          )}
          <div className="min-w-0 flex-1">
            {title && <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-ink">{title}</h1>}
            {subtitle && <p className="mt-1 text-[15px] font-medium text-ink-soft">{subtitle}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className="grid grid-cols-1 gap-4">{children}</div>
    </div>
  );
}

export function Section({ title, action, children, className = "" }) {
  return (
    <section className={className}>
      {(title || action) && (
        <div className="mb-2 flex items-center justify-between gap-3 px-1">
          {title && <h2 className="text-[13px] font-bold uppercase tracking-wide text-ink-muted">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Card({ children, className = "", padded = true, onClick, to }) {
  const classes = cx(
    "block rounded-2xl border border-line bg-white shadow-soft",
    padded && "p-4",
    (onClick || to) && "transition active:scale-[0.99]",
    className
  );
  if (to) return <Link to={to} className={classes}>{children}</Link>;
  if (onClick) return <button type="button" onClick={onClick} className={cx(classes, "w-full text-left")}>{children}</button>;
  return <section className={classes}>{children}</section>;
}

// ---------- actions ----------

const buttonVariants = {
  primary: "bg-brand-600 text-white shadow-soft active:bg-brand-700 disabled:bg-brand-300",
  secondary: "bg-white text-brand-700 border border-line active:bg-brand-50",
  soft: "bg-brand-50 text-brand-700 active:bg-brand-100",
  ghost: "bg-transparent text-ink-soft active:bg-black/5",
  danger: "bg-rose-600 text-white active:bg-rose-700 disabled:bg-rose-200",
  warning: "bg-amber-500 text-ink active:bg-amber-600"
};

const buttonSizes = {
  md: "min-h-12 px-4 text-[15px]",
  lg: "min-h-14 px-5 text-[17px]",
  sm: "min-h-10 px-3 text-sm"
};

export function Button({ children, variant = "primary", size = "md", block, icon: Icon, loading, className = "", to, ...props }) {
  const classes = cx(
    "inline-flex select-none items-center justify-center gap-2 rounded-xl font-bold transition disabled:cursor-not-allowed disabled:opacity-70",
    buttonVariants[variant],
    buttonSizes[size],
    block && "w-full",
    className
  );
  const content = (
    <>
      {loading ? <Loader2 size={18} className="animate-spin" /> : Icon ? <Icon size={size === "lg" ? 22 : 19} /> : null}
      {children}
    </>
  );
  if (to) return <Link to={to} className={classes}>{content}</Link>;
  return (
    <button type="button" className={classes} disabled={loading || props.disabled} {...props}>
      {content}
    </button>
  );
}

export function IconButton({ icon: Icon, label, className = "", badge, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cx("relative flex h-11 w-11 items-center justify-center rounded-full text-ink-soft active:bg-black/5", className)}
      {...props}
    >
      <Icon size={22} />
      {badge ? (
        <span className="absolute right-1 top-1 min-w-[18px] rounded-full bg-rose-500 px-1 text-center text-[11px] font-bold leading-[18px] text-white">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

/** Large square tile used for main actions on home screens. */
export function ActionTile({ icon: Icon, label, to, onClick, tone = "brand" }) {
  const tones = {
    brand: "bg-brand-50 text-brand-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
    ink: "bg-canvas text-ink"
  };
  const inner = (
    <>
      <span className={cx("flex h-12 w-12 items-center justify-center rounded-xl", tones[tone])}>
        <Icon size={24} />
      </span>
      <span className="text-[15px] font-bold leading-snug text-ink">{label}</span>
    </>
  );
  const classes = "flex min-h-[112px] flex-col items-start justify-between gap-3 rounded-2xl border border-line bg-white p-4 text-left shadow-soft transition active:scale-[0.98]";
  if (to) return <Link to={to} className={classes}>{inner}</Link>;
  return <button type="button" onClick={onClick} className={classes}>{inner}</button>;
}

// ---------- data display ----------

/** The single most important number on a screen. */
export function MoneyHero({ label, value, caption, tone = "brand", children }) {
  const tones = {
    brand: "from-brand-700 to-brand-900",
    rose: "from-rose-600 to-rose-800",
    ink: "from-[#24302b] to-[#101814]"
  };
  return (
    <section className={cx("min-w-0 rounded-3xl bg-gradient-to-br p-5 text-white shadow-lift", tones[tone])}>
      <p className="text-[15px] font-semibold text-white/80">{label}</p>
      <p className="tabular mt-1 break-words text-[clamp(28px,10vw,40px)] font-extrabold leading-none tracking-tight">{value}</p>
      {caption && <p className="mt-2 text-sm font-medium text-white/75">{caption}</p>}
      {children && <div className="mt-4">{children}</div>}
    </section>
  );
}

export function Stat({ label, value, icon: Icon, tone = "ink", hint }) {
  const tones = {
    ink: "text-ink",
    brand: "text-brand-700",
    rose: "text-rose-600",
    amber: "text-amber-700"
  };
  return (
    <div className="min-w-0 rounded-2xl border border-line bg-white p-4 shadow-soft">
      <div className="flex items-center gap-2 text-ink-muted">
        {Icon && <Icon size={16} />}
        <p className="text-[13px] font-semibold">{label}</p>
      </div>
      <p className={cx("tabular mt-1.5 break-words text-[clamp(18px,5.5vw,22px)] font-extrabold leading-tight", tones[tone])}>{value}</p>
      {hint && <p className="mt-0.5 text-xs font-medium text-ink-muted">{hint}</p>}
    </div>
  );
}

/** Label / value pair in a list of details. */
export function DetailRow({ label, value, strong }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-3 last:border-0">
      <span className="text-[15px] font-medium text-ink-soft">{label}</span>
      <span className={cx("tabular text-right", strong ? "text-xl font-extrabold text-ink" : "text-[15px] font-bold text-ink")}>{value}</span>
    </div>
  );
}

export function ListRow({ icon: Icon, avatar, title, subtitle, trailing, to, onClick, chevron = true }) {
  const inner = (
    <>
      {avatar ?? (Icon && (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <Icon size={21} />
        </span>
      ))}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[16px] font-bold text-ink">{title}</span>
        {subtitle && <span className="mt-0.5 block truncate text-sm font-medium text-ink-muted">{subtitle}</span>}
      </span>
      {trailing && <span className="shrink-0 text-right">{trailing}</span>}
      {(to || onClick) && chevron && <ChevronRight size={18} className="shrink-0 text-ink-muted" />}
    </>
  );
  const classes = "flex min-h-[68px] w-full items-center gap-3 px-4 py-3 text-left";
  if (to) return <Link to={to} className={cx(classes, "active:bg-canvas")}>{inner}</Link>;
  if (onClick) return <button type="button" onClick={onClick} className={cx(classes, "active:bg-canvas")}>{inner}</button>;
  return <div className={classes}>{inner}</div>;
}

/** White rounded group of ListRows separated by hairlines. */
export function List({ children, className = "" }) {
  return <div className={cx("divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white shadow-soft", className)}>{children}</div>;
}

export function Avatar({ name = "", src, size = 44 }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
  const style = { width: size, height: size };
  if (src) return <img src={src} alt="" style={style} className="shrink-0 rounded-full object-cover" />;
  return (
    <span style={style} className="flex shrink-0 items-center justify-center rounded-full bg-brand-100 text-[15px] font-bold text-brand-800">
      {initials}
    </span>
  );
}

const badgeTones = {
  brand: "bg-brand-50 text-brand-700",
  amber: "bg-amber-50 text-amber-700",
  rose: "bg-rose-50 text-rose-700",
  ink: "bg-canvas text-ink-soft"
};

export function Badge({ children, tone = "ink" }) {
  return <span className={cx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold", badgeTones[tone])}>{children}</span>;
}

// ---------- feedback ----------

const noticeTones = {
  info: { box: "bg-sky-50 text-sky-900 border-sky-100", icon: Info },
  success: { box: "bg-brand-50 text-brand-900 border-brand-100", icon: CheckCircle2 },
  warning: { box: "bg-amber-50 text-amber-800 border-amber-100", icon: AlertTriangle },
  error: { box: "bg-rose-50 text-rose-800 border-rose-100", icon: XCircle }
};

export function Notice({ tone = "info", title, children }) {
  const { box, icon: Icon } = noticeTones[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cx("flex gap-3 rounded-2xl border p-4", box)}>
      <Icon size={20} className="mt-0.5 shrink-0" />
      <div className="min-w-0 text-[15px] font-medium">
        {title && <p className="font-bold">{title}</p>}
        {children}
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon = Info, title, text, action }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line bg-white/60 px-6 py-10 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-canvas text-ink-muted">
        <Icon size={26} />
      </span>
      {title && <p className="mt-4 text-[17px] font-bold text-ink">{title}</p>}
      {text && <p className="mt-1 max-w-xs text-[15px] font-medium text-ink-muted">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Honest placeholder for features that are not built yet. */
export function NotAvailable({ title, text }) {
  return <EmptyState icon={Construction} title={title} text={text} />;
}

export function Spinner({ label }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink-muted">
      <Loader2 size={32} className="animate-spin text-brand-600" />
      {label && <p className="text-[15px] font-semibold">{label}</p>}
    </div>
  );
}

// ---------- forms ----------

export const inputClass =
  "min-h-[52px] w-full rounded-xl border border-line bg-white px-4 text-[16px] font-semibold text-ink outline-none transition placeholder:font-medium placeholder:text-ink-muted/70 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 disabled:bg-canvas disabled:text-ink-muted";

export function Field({ label, hint, error, children }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-[15px] font-bold text-ink">{label}</span>}
      {children}
      {hint && !error && <span className="mt-1.5 block text-[13px] font-medium text-ink-muted">{hint}</span>}
      {error && <span className="mt-1.5 block text-[13px] font-bold text-rose-600">{error}</span>}
    </label>
  );
}

export function Input({ className = "", ...props }) {
  return <input className={cx(inputClass, className)} {...props} />;
}

export function Select({ children, className = "", ...props }) {
  return (
    <select className={cx(inputClass, className, "appearance-none bg-[length:20px] bg-[right_14px_center] bg-no-repeat pr-10")} style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%237a8580' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }} {...props}>
      {children}
    </select>
  );
}

export function TextArea({ className = "", ...props }) {
  return <textarea className={cx(inputClass, "min-h-28 py-3", className)} {...props} />;
}

/** Pill-style choice between a few options. */
export function Segmented({ options, value, onChange }) {
  return (
    <div className="grid gap-1 rounded-xl bg-canvas p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cx(
            "min-h-11 rounded-lg px-2 text-[15px] font-bold transition",
            value === opt.value ? "bg-white text-brand-700 shadow-soft" : "text-ink-soft"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/** Large file picker that shows the chosen file name. */
export function FilePicker({ label, accept, file, onChange, icon: Icon, placeholder }) {
  return (
    <label className="flex min-h-[64px] cursor-pointer items-center gap-3 rounded-xl border border-dashed border-line bg-white px-4 py-3 active:bg-canvas">
      {Icon && <Icon size={22} className="shrink-0 text-brand-600" />}
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-bold text-ink">{label}</span>
        <span className="block truncate text-[13px] font-medium text-ink-muted">{file ? file.name : placeholder}</span>
      </span>
      <input type="file" accept={accept} className="hidden" onChange={(e) => onChange(e.target.files?.[0] || null)} />
    </label>
  );
}

/** Sticky bottom bar for a screen's main action (sits above the tab bar). */
export function BottomAction({ children }) {
  return (
    <div className="sticky bottom-[88px] z-10 -mx-4 mt-2 bg-gradient-to-t from-canvas via-canvas/95 to-transparent px-4 pb-2 pt-4">
      {children}
    </div>
  );
}
