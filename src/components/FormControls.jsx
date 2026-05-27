export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "min-h-12 w-full rounded-[8px] border border-slate-200 bg-white px-4 text-base font-semibold text-slate-900 outline-none transition focus:border-leaf-600 focus:ring-4 focus:ring-leaf-100";

export function TextInput(props) {
  return <input className={inputClass} {...props} />;
}

export function SelectInput({ children, ...props }) {
  return (
    <select className={inputClass} {...props}>
      {children}
    </select>
  );
}

export function TextArea(props) {
  return <textarea className={`${inputClass} min-h-28 py-3`} {...props} />;
}
