import { Moon, Bell, Cloud, LockKeyhole, Languages, Users } from "lucide-react";
import { useState } from "react";
import { Card } from "../components/Card";
import { useApp } from "../context/AppContext";
import { createBorrowerLink } from "../services/firebaseService";

export function Settings() {
  const { user, appMode, setAppMode, borrowers } = useApp();
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  const items = [
    ["Language", Languages],
    ["Notifications", Bell],
    ["Dark mode", Moon],
    ["PIN lock", LockKeyhole],
    ["Backup settings", Cloud]
  ];

  const handleSyncLinks = async () => {
    setSyncing(true);
    setSyncMessage("");
    try {
      let count = 0;
      for (const b of borrowers) {
        if (b.mobile) {
          await createBorrowerLink(b.mobile, user.uid, b.id);
          count++;
        }
      }
      setSyncMessage(`Successfully synced ${count} borrowers for mobile app access!`);
    } catch (err) {
      console.error(err);
      setSyncMessage("Error syncing borrowers.");
    } finally {
      setSyncing(false);
    }
  };

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

      <Card className="mt-4 border border-leaf-100 bg-leaf-50">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-leaf-200 text-leaf-700">
            <Users size={24} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-black text-leaf-900">Borrower App Access</h2>
            <p className="mt-1 text-sm font-semibold text-slate-700">
              If you added borrowers before the Borrower App feature was released, click here to grant them access so they can log in.
            </p>
            {syncMessage && <p className="mt-2 text-sm font-bold text-leaf-700">{syncMessage}</p>}
            <button 
              onClick={handleSyncLinks}
              disabled={syncing}
              className="mt-4 rounded-[8px] bg-leaf-600 px-4 py-2 font-bold text-white shadow-soft disabled:opacity-50"
            >
              {syncing ? "Syncing..." : "Grant Access to Existing Borrowers"}
            </button>
          </div>
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
