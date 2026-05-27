import { CloudDownload, CloudUpload, RefreshCcw } from "lucide-react";
import { ActionButton } from "../components/ActionButton";
import { Card } from "../components/Card";

export function BackupRestore() {
  return (
    <div className="mx-auto max-w-2xl md:ml-56">
      <h1 className="text-2xl font-black text-slate-950">Backup & Restore</h1>
      <div className="mt-4 grid gap-3">
        <Card><h2 className="font-black">Cloud backup</h2><p className="mt-1 text-sm text-slate-500">Firestore sync keeps user-specific records backed up.</p><ActionButton className="mt-4"><CloudUpload size={18} /> Backup now</ActionButton></Card>
        <Card><h2 className="font-black">Restore</h2><p className="mt-1 text-sm text-slate-500">Bring records back after phone change.</p><ActionButton className="mt-4" variant="secondary"><CloudDownload size={18} /> Restore</ActionButton></Card>
        <Card><h2 className="font-black">Device sync</h2><p className="mt-1 text-sm text-slate-500">Offline records sync when internet returns.</p><ActionButton className="mt-4" variant="secondary"><RefreshCcw size={18} /> Sync</ActionButton></Card>
      </div>
    </div>
  );
}
