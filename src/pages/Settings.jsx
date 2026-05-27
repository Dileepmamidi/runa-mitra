import { Moon, Bell, Cloud, LockKeyhole, Languages } from "lucide-react";
import { Card } from "../components/Card";
import { useApp } from "../context/AppContext";

export function Settings() {
  const { appMode, setAppMode } = useApp();
  const items = [
    ["Language", Languages],
    ["Notifications", Bell],
    ["Dark mode", Moon],
    ["PIN lock", LockKeyhole],
    ["Backup settings", Cloud]
  ];
  return (
    <div className="mx-auto max-w-2xl md:ml-56">
      <h1 className="text-2xl font-black text-slate-950">Settings</h1>
      <Card className="mt-4">
        <p className="mb-3 text-sm font-bold text-slate-500">App mode</p>
        <div className="grid grid-cols-3 gap-2">
          {["Simple", "Regular", "Advanced"].map((mode) => (
            <button key={mode} onClick={() => setAppMode(mode)} className={`min-h-11 rounded-[8px] text-sm font-black ${appMode === mode ? "bg-leaf-600 text-white" : "bg-slate-50 text-slate-700"}`}>{mode}</button>
          ))}
        </div>
      </Card>
      <div className="mt-4 grid gap-3">
        {items.map(([label, Icon]) => (
          <Card key={label}><div className="flex items-center justify-between"><div className="flex items-center gap-3"><Icon size={19} className="text-leaf-700" /><b>{label}</b></div><input type="checkbox" className="h-5 w-5 accent-leaf-600" /></div></Card>
        ))}
      </div>
    </div>
  );
}
