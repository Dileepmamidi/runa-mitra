import { Lock } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Card } from "./Card";

const rank = { Simple: 1, Regular: 2, Advanced: 3 };

export function ModeGate({ min = "Regular", children, label }) {
  const { appMode } = useApp();
  if (rank[appMode] >= rank[min]) return children;

  return (
    <Card className="border border-dashed border-leaf-200 bg-leaf-50">
      <div className="flex items-center gap-3 text-leaf-700">
        <Lock size={18} />
        <p className="text-sm font-bold">{label || `${min} mode feature`}</p>
      </div>
    </Card>
  );
}
