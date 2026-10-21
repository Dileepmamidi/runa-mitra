// Payment receipt shown as a full-screen overlay inside the app (pop-up
// windows do not work in the Android app). All values are escaped. The text is
// entirely in the app's current language.

const text = {
  en: {
    title: "Payment receipt",
    date: "Payment date",
    borrower: "Borrower",
    principal: "Loan amount",
    method: "Method",
    reference: "Reference",
    recordedBy: "Recorded by",
    lender: "Lender",
    borrowerSelf: "Borrower (confirmed by lender)",
    amount: "Amount paid",
    note: "This receipt is generated from the records in Runa Mitra.",
    print: "Print",
    close: "Close",
    cash: "Cash",
    bank: "Bank transfer"
  },
  te: {
    title: "చెల్లింపు రసీదు",
    date: "చెల్లించిన తేదీ",
    borrower: "అప్పుదారు",
    principal: "రుణ మొత్తం",
    method: "విధానం",
    reference: "రిఫరెన్స్",
    recordedBy: "నమోదు చేసినవారు",
    lender: "రుణదాత",
    borrowerSelf: "అప్పుదారు (రుణదాత నిర్ధారించారు)",
    amount: "చెల్లించిన మొత్తం",
    note: "ఈ రసీదు రుణ మిత్రలోని రికార్డుల నుండి తయారైంది.",
    print: "ప్రింట్",
    close: "మూసివేయండి",
    cash: "నగదు",
    bank: "బ్యాంక్ బదిలీ"
  }
};

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function rupees(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);
}

export function generateReceipt({ paymentDate, borrowerName, principal, amountPaid, method, referenceId, recordedBy, language }) {
  const lang = language || (document.documentElement.lang === "en" ? "en" : "te");
  const s = text[lang] || text.te;
  const methodLabel = method === "Cash" ? s.cash : method === "Bank Transfer" || method === "Bank" ? s.bank : method || s.cash;
  const who = recordedBy === "borrower" ? s.borrowerSelf : recordedBy === "lender" ? s.lender : "";

  const rows = [
    [s.date, paymentDate],
    [s.borrower, borrowerName],
    principal !== undefined && principal !== null && principal !== "" ? [s.principal, rupees(principal)] : null,
    [s.method, methodLabel],
    referenceId ? [s.reference, referenceId] : null,
    who ? [s.recordedBy, who] : null
  ].filter(Boolean);

  document.getElementById("runa-receipt")?.remove();
  const overlay = document.createElement("div");
  overlay.id = "runa-receipt";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.innerHTML = `
    <style>
      #runa-receipt { position: fixed; inset: 0; z-index: 1000; background: rgba(16,32,28,.55); display: flex; align-items: center; justify-content: center; padding: 16px; font-family: inherit; }
      #runa-receipt .card { background: #fff; border-radius: 20px; width: 100%; max-width: 380px; padding: 24px; color: #15201c; }
      #runa-receipt h2 { margin: 0 0 4px; font-size: 20px; }
      #runa-receipt .brand { color: #13775e; font-weight: 700; font-size: 14px; margin: 0 0 16px; }
      #runa-receipt .row { display: flex; justify-content: space-between; gap: 12px; padding: 10px 0; border-bottom: 1px solid #e6e8e3; font-size: 15px; }
      #runa-receipt .row span { color: #4b5852; }
      #runa-receipt .row strong { text-align: right; }
      #runa-receipt .total { margin-top: 16px; text-align: center; font-size: 15px; color: #4b5852; }
      #runa-receipt .total strong { display: block; font-size: 32px; color: #13775e; }
      #runa-receipt .note { margin-top: 16px; font-size: 12px; color: #7a8580; text-align: center; }
      #runa-receipt .actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 20px; }
      #runa-receipt button { min-height: 48px; border-radius: 14px; font-weight: 700; font-size: 15px; border: 1px solid #e6e8e3; background: #fff; color: #105f4c; }
      #runa-receipt button.primary { background: #13775e; color: #fff; border: none; }
      @media print {
        body > *:not(#runa-receipt) { display: none !important; }
        #runa-receipt { position: static; background: none; padding: 0; }
        #runa-receipt .actions { display: none; }
      }
    </style>
    <div class="card">
      <h2>${escapeHtml(s.title)}</h2>
      <p class="brand">Runa Mitra</p>
      ${rows.map(([label, value]) => `<div class="row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("")}
      <div class="total">${escapeHtml(s.amount)}<strong>${escapeHtml(rupees(amountPaid))}</strong></div>
      <p class="note">${escapeHtml(s.note)}</p>
      <div class="actions">
        <button type="button" data-action="close">${escapeHtml(s.close)}</button>
        <button type="button" class="primary" data-action="print">${escapeHtml(s.print)}</button>
      </div>
    </div>`;
  overlay.addEventListener("click", (event) => {
    const action = event.target?.dataset?.action;
    if (action === "close" || event.target === overlay) overlay.remove();
    if (action === "print") window.print();
  });
  document.body.appendChild(overlay);
}
