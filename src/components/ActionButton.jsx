export function ActionButton({ children, variant = "primary", className = "", ...props }) {
  const styles = {
    primary: "bg-leaf-600 text-white shadow-soft active:bg-leaf-700",
    secondary: "bg-white text-leaf-700 ring-1 ring-leaf-100",
    warning: "bg-marigold-500 text-slate-950",
    danger: "bg-danger-500 text-white"
  };

  return (
    <button
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-[8px] px-4 text-sm font-bold transition ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
