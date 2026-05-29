import { useState } from "react";
import { MessageCircle, Phone, CheckCircle, XCircle, CreditCard, ExternalLink, Calendar, Clock, Bell } from "lucide-react";
import { ActionButton } from "../components/ActionButton";
import { Card } from "../components/Card";
import { StatusBadge } from "../components/StatusBadge";
import { useApp } from "../context/AppContext";
import { currency } from "../utils/loanMath";
import { updateUserRecord } from "../services/firebaseService";

export function LenderInbox() {
  const { user, borrowers, loans, payments, reminders, messages, refreshData } = useApp();
  const [activeTab, setActiveTab] = useState("approvals");
  const [processing, setProcessing] = useState(null);

  const pendingPayments = payments.filter(p => p.status === "pending_verification");

  const handleApprovePayment = async (payment) => {
    if (!user) return;
    try {
      setProcessing(payment.id);
      
      // 1. Mark payment as verified
      await updateUserRecord(user.uid, "payments", payment.id, { status: "verified", verifiedAt: new Date() });
      
      // 2. Deduct from loan balance
      const loan = loans.find(l => l.id === payment.loanId);
      if (loan) {
        const newBalance = Math.max(0, loan.balance - payment.amount);
        await updateUserRecord(user.uid, "loans", loan.id, { balance: newBalance });
      }
      
      await refreshData();
    } catch (err) {
      console.error(err);
      alert("Failed to approve payment.");
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectPayment = async (payment) => {
    if (!user) return;
    if (!window.confirm("Are you sure you want to reject this payment? It will not deduct from the borrower's balance.")) return;
    
    try {
      setProcessing(payment.id);
      await updateUserRecord(user.uid, "payments", payment.id, { status: "rejected", rejectedAt: new Date() });
      await refreshData();
    } catch (err) {
      console.error(err);
      alert("Failed to reject payment.");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl md:ml-56">
      <h1 className="text-2xl font-black text-slate-950 mb-4">Inbox & Approvals</h1>
      
      <div className="flex gap-2 border-b border-slate-200 pb-2 mb-4 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setActiveTab("approvals")} 
          className={`whitespace-nowrap px-4 py-2 text-sm font-bold rounded-full transition-colors ${activeTab === 'approvals' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          Pending Payments ({pendingPayments.length})
        </button>
        <button 
          onClick={() => setActiveTab("messages")} 
          className={`whitespace-nowrap px-4 py-2 text-sm font-bold rounded-full transition-colors ${activeTab === 'messages' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          Messages ({messages.length})
        </button>
        <button 
          onClick={() => setActiveTab("reminders")} 
          className={`whitespace-nowrap px-4 py-2 text-sm font-bold rounded-full transition-colors ${activeTab === 'reminders' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          Alarms ({reminders.length})
        </button>
      </div>

      <div className="grid gap-3">
        {activeTab === "approvals" && (
          <>
            {pendingPayments.length === 0 ? (
              <Card><p className="text-center py-6 font-bold text-slate-400">No pending payments.</p></Card>
            ) : (
              pendingPayments.map(payment => {
                const borrower = borrowers.find(b => b.id === payment.borrowerId);
                const isProcessing = processing === payment.id;
                
                return (
                  <Card key={payment.id} className="relative overflow-hidden">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-black text-slate-950">{borrower?.name || "Unknown"}</h3>
                        <p className="text-sm font-bold text-slate-500 flex items-center gap-1">
                          <Calendar size={14}/> {payment.paymentDate || new Date(payment.createdAt?.seconds * 1000).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-leaf-700">{currency(payment.amount)}</p>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{payment.method}</p>
                      </div>
                    </div>
                    
                    {(payment.referenceId || payment.screenshotUrl) && (
                      <div className="mt-4 rounded-[8px] bg-slate-50 p-3 border border-slate-100">
                        <p className="text-xs font-bold text-slate-500 mb-1">Proof of Payment</p>
                        {payment.referenceId && <p className="text-sm font-bold text-slate-900">Ref ID: {payment.referenceId}</p>}
                        {payment.screenshotUrl && (
                          <a href={payment.screenshotUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-leaf-600 hover:underline">
                            <ExternalLink size={14} /> View Screenshot
                          </a>
                        )}
                      </div>
                    )}
                    
                    <div className="mt-4 flex gap-2">
                      <button 
                        onClick={() => handleApprovePayment(payment)}
                        disabled={isProcessing}
                        className="flex-1 flex items-center justify-center gap-2 rounded-[8px] bg-leaf-600 py-3 text-sm font-bold text-white hover:bg-leaf-700 disabled:opacity-50"
                      >
                        <CheckCircle size={18} /> {isProcessing ? "Processing..." : "Approve & Deduct"}
                      </button>
                      <button 
                        onClick={() => handleRejectPayment(payment)}
                        disabled={isProcessing}
                        className="flex items-center justify-center gap-2 rounded-[8px] bg-red-50 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-100 disabled:opacity-50"
                      >
                        <XCircle size={18} /> Reject
                      </button>
                    </div>
                  </Card>
                );
              })
            )}
          </>
        )}

        {activeTab === "messages" && (
          <>
            {messages.length === 0 ? (
              <Card><p className="text-center py-6 font-bold text-slate-400">No messages.</p></Card>
            ) : (
              messages.map(msg => {
                const borrower = borrowers.find(b => b.id === msg.borrowerId);
                return (
                  <Card key={msg.id}>
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                        <Bell size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h3 className="text-sm font-black text-slate-950">{borrower?.name || "Borrower"}</h3>
                          <span className="text-[10px] font-bold text-slate-400">
                            {msg.createdAt ? new Date(msg.createdAt.seconds * 1000).toLocaleDateString() : ""}
                          </span>
                        </div>
                        <p className="mt-1 text-sm font-bold text-slate-700">{msg.type === "extension_request" ? "Requested a Loan Extension" : "Sent a message"}</p>
                        {msg.reason && <p className="mt-2 text-sm text-slate-600 bg-slate-50 p-2 rounded">{msg.reason}</p>}
                        {msg.requestedDate && <p className="mt-1 text-xs font-bold text-leaf-700">Requested new date: {msg.requestedDate}</p>}
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </>
        )}

        {activeTab === "reminders" && (
          <>
            {reminders.length === 0 ? (
              <Card><p className="text-center py-6 font-bold text-slate-400">No alarms set.</p></Card>
            ) : (
              reminders.map((reminder) => (
                <Card key={reminder.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div><h2 className="text-lg font-black">{reminder.borrowerName}</h2><p className="text-sm font-semibold text-slate-500 flex items-center gap-1 mt-1"><Clock size={14}/> {reminder.dueDate} · {currency(reminder.amount)}</p></div>
                    <StatusBadge status={reminder.status} />
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <ActionButton variant="secondary"><Phone size={18} /></ActionButton>
                    <ActionButton variant="secondary"><MessageCircle size={18} /></ActionButton>
                    <ActionButton>Sent</ActionButton>
                  </div>
                </Card>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
