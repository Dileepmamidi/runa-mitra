import { useApp } from "../../context/AppContext";
import { Card, SectionTitle } from "../../components/Card";
import { FileText, Eye } from "lucide-react";

export function BorrowerDocuments() {
  const { agreements, evidence, borrowers } = useApp();
  const myProfile = borrowers[0] || {};

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="text-3xl font-black text-slate-950 mb-6">పత్రాలు (Documents)</h2>
      
      <Card className="mb-6">
        <SectionTitle title="Aadhaar Verification" />
        {myProfile.aadhaarFileUrl ? (
          <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-leaf-100 text-leaf-700">
                <FileText size={20} />
              </div>
              <div>
                <p className="font-bold text-slate-950">Aadhaar (Masked)</p>
                <p className="text-sm font-semibold text-leaf-600">Verified</p>
              </div>
            </div>
            <a href={myProfile.aadhaarFileUrl} target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300">
              <Eye size={18} />
            </a>
          </div>
        ) : (
          <p className="mt-2 text-sm font-bold text-slate-400">Not verified yet.</p>
        )}
      </Card>

      <Card className="mb-6">
        <SectionTitle title="Agreements (ఒప్పందాలు)" />
        {agreements.length === 0 ? (
          <p className="mt-2 text-sm font-bold text-slate-400">No agreements generated.</p>
        ) : (
          <div className="mt-4 grid gap-3">
            {agreements.map((agr, idx) => (
              <div key={agr.id || idx} className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                    <FileText size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-950">Agreement {agr.language}</p>
                    <p className="text-sm font-semibold text-slate-500">{new Date(agr.generatedAt || Date.now()).toLocaleDateString()}</p>
                  </div>
                </div>
                {agr.borrowerSignUrl && (
                  <a href={agr.borrowerSignUrl} target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300">
                    <Eye size={18} />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
      
      <Card>
        <SectionTitle title="Other Evidence (ఇతర ఆధారాలు)" />
        {evidence.length === 0 ? (
          <p className="mt-2 text-sm font-bold text-slate-400">No other documents uploaded.</p>
        ) : (
          <div className="mt-4 grid gap-3">
            {evidence.map((ev, idx) => (
              <div key={ev.id || idx} className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-200 text-slate-700">
                    <FileText size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-950">{ev.category}</p>
                    <p className="text-sm font-semibold text-slate-500">{ev.fileName}</p>
                  </div>
                </div>
                <a href={ev.fileUrl} target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300">
                  <Eye size={18} />
                </a>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
