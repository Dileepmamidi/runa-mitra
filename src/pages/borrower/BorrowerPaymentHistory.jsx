import { Link } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { currency } from "../../utils/loanMath";
import { Card } from "../../components/Card";
import { ArrowDownRight, Plus, Printer, CheckCircle2, Clock } from "lucide-react";
import { useRef } from "react";

export function BorrowerPaymentHistory() {
  const { payments, borrowers, lender } = useApp();
  const printRef = useRef(null);
  
  const myProfile = borrowers[0] || {};

  const handlePrintReceipt = (payment) => {
    if (!printRef.current) return;
    
    // Construct receipt HTML
    const html = `
      <html>
        <head>
          <title>Payment Receipt</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #111; max-width: 600px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #ddd; padding-bottom: 20px; margin-bottom: 20px; }
            .lender-name { font-size: 24px; font-weight: bold; }
            .receipt-title { font-size: 18px; color: #666; letter-spacing: 2px; text-transform: uppercase; margin-top: 10px; }
            .row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee; }
            .label { font-weight: bold; color: #555; }
            .value { font-weight: bold; font-size: 16px; }
            .amount { font-size: 28px; font-weight: 900; color: #0d9488; text-align: center; margin: 30px 0; }
            .footer { text-align: center; font-size: 12px; color: #888; margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px; }
            .status { display: inline-block; padding: 5px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; background: #dcfce7; color: #166534; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="lender-name">${lender?.name || "Runa Mitra Lender"}</div>
            <div>${lender?.village || ""}</div>
            <div class="receipt-title">Payment Receipt</div>
          </div>
          
          <div class="amount">${currency(payment.amount)}</div>
          
          <div class="row">
            <span class="label">Date:</span>
            <span class="value">${payment.paymentDate || new Date(payment.createdAt?.seconds * 1000).toLocaleDateString()}</span>
          </div>
          <div class="row">
            <span class="label">Received From:</span>
            <span class="value">${myProfile.name}</span>
          </div>
          <div class="row">
            <span class="label">Payment Method:</span>
            <span class="value">${payment.method || "Cash"}</span>
          </div>
          ${payment.referenceId ? `
          <div class="row">
            <span class="label">Reference ID:</span>
            <span class="value">${payment.referenceId}</span>
          </div>` : ''}
          <div class="row">
            <span class="label">Status:</span>
            <span class="value">
               ${payment.status === 'pending_verification' ? 'Pending Approval' : 'Verified'}
            </span>
          </div>
          
          <div class="footer">
            Generated securely via Runa Mitra (Borrower App)
          </div>
          <script>
            window.onload = () => { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;
    
    const printWindow = window.open("", "_blank");
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="mx-auto max-w-2xl pb-10">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-3xl font-black text-slate-950">చెల్లింపులు (History)</h2>
        <Link to="/payments/new" className="flex items-center gap-2 rounded-[10px] bg-leaf-600 px-4 py-2 text-sm font-bold text-white shadow-soft hover:bg-leaf-700">
          <Plus size={18} /> Make Payment
        </Link>
      </div>
      
      {payments.length === 0 ? (
        <Card>
          <p className="text-lg font-bold text-slate-500 text-center py-6">No payments recorded yet.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {payments.map(payment => (
            <Card key={payment.id} className="relative overflow-hidden">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-leaf-100 text-leaf-700">
                  <ArrowDownRight size={24} />
                </div>
                <div className="flex-1">
                  <p className="text-lg font-black text-slate-950">{currency(payment.amount)}</p>
                  <p className="text-sm font-bold text-slate-500">{payment.paymentDate || new Date(payment.createdAt?.seconds * 1000).toLocaleDateString()}</p>
                  
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Via {payment.method || "Cash"}</span>
                    {payment.status === 'pending_verification' ? (
                      <span className="flex items-center gap-1 rounded-full bg-warning-100 px-2 py-0.5 text-[10px] font-bold text-warning-700">
                        <Clock size={10} /> Pending Verification
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full bg-leaf-100 px-2 py-0.5 text-[10px] font-bold text-leaf-700">
                        <CheckCircle2 size={10} /> Verified
                      </span>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => handlePrintReceipt(payment)}
                  className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-slate-100 text-slate-600 hover:bg-slate-200"
                >
                  <Printer size={18} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      <div ref={printRef} className="hidden" />
    </div>
  );
}
