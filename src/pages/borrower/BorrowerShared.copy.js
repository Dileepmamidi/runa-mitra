// Text used by several borrower screens. Keys must match in en and te.
const formatDate = (locale) => (key) => {
  if (!key) return "";
  const d = new Date(`${String(key).slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return String(key);
  return d.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
};

const enMethods = { Cash: "Cash", UPI: "UPI", "Bank Transfer": "Bank transfer", Bank: "Bank transfer", Cheque: "Cheque" };
const teMethods = { Cash: "నగదు", UPI: "UPI", "Bank Transfer": "బ్యాంక్ ద్వారా", Bank: "బ్యాంక్ ద్వారా", Cheque: "చెక్కు" };

export const borrowerSharedCopy = {
  en: {
    date: formatDate("en-IN"),
    method: (m) => (m ? enMethods[m] || m : "Not recorded"),
    lender: (name) => name || "Your lender",
    loanFrom: (name) => (name ? `Loan from ${name}` : "Loan from your lender"),
    loanOption: (name, amount, date) => `${name || "Your lender"} · ${amount}${date ? ` · ${date}` : ""}`,
    notRecorded: "Not recorded",
    byLender: "Recorded by lender",
    byYou: "Sent by you",
    dueOn: (d) => `Due on ${d}`,
    dueToday: "Due today",
    dueInDays: (n) => (n === 1 ? "Due tomorrow" : `Due in ${n} days`),
    overdueDays: (n) => (n === 1 ? "Due date passed yesterday" : `Due date passed ${n} days ago`),
    noDueDate: "No due date recorded",
    settled: "Fully paid",
    needsClarification: "Needs clarification",
    chooseLoan: "Which loan?",
    chooseLoanPlaceholder: "Choose a loan",
    loading: "Loading…",
    optional: "optional",
    back: "Back",
    sendError: "Could not send. Please check your internet and try again.",
    fileTooBig: "This file is too big. Please choose a file smaller than 15 MB."
  },
  te: {
    date: formatDate("te-IN"),
    method: (m) => (m ? teMethods[m] || m : "నమోదు కాలేదు"),
    lender: (name) => name || "మీ రుణదాత",
    loanFrom: (name) => (name ? `${name} గారి దగ్గర తీసుకున్న అప్పు` : "మీ రుణదాత దగ్గర తీసుకున్న అప్పు"),
    loanOption: (name, amount, date) => `${name || "మీ రుణదాత"} · ${amount}${date ? ` · ${date}` : ""}`,
    notRecorded: "నమోదు కాలేదు",
    byLender: "రుణదాత నమోదు చేశారు",
    byYou: "మీరు పంపారు",
    dueOn: (d) => `గడువు ${d}`,
    dueToday: "ఈరోజే గడువు",
    dueInDays: (n) => (n === 1 ? "రేపు గడువు" : `ఇంకా ${n} రోజుల్లో గడువు`),
    overdueDays: (n) => (n === 1 ? "నిన్నటితో గడువు అయిపోయింది" : `గడువు అయిపోయి ${n} రోజులు అయింది`),
    noDueDate: "గడువు తేదీ నమోదు కాలేదు",
    settled: "పూర్తిగా చెల్లించారు",
    needsClarification: "స్పష్టత కావాలి",
    chooseLoan: "ఏ అప్పు గురించి?",
    chooseLoanPlaceholder: "అప్పును ఎంచుకోండి",
    loading: "వస్తోంది…",
    optional: "ఇష్టమైతే",
    back: "వెనుకకు",
    sendError: "పంపలేకపోయాం. ఇంటర్నెట్ చూసుకుని మళ్ళీ ప్రయత్నించండి.",
    fileTooBig: "ఈ ఫైల్ చాలా పెద్దది. 15 MB కంటే చిన్న ఫైల్ ఎంచుకోండి."
  }
};

