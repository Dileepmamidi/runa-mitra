export const repaymentHistoryCopy = {
  en: {
    title: "Repayment history",
    factsOnly: "This screen shows only facts from your records: payments and due dates. It does not score or judge anyone.",
    noBorrowers: "No borrowers yet.",
    verifiedPayments: "Payments counted",
    lastPayment: "Last payment",
    totalPaid: "Total paid",
    none: "None yet",
    waiting: (n) => `${n} ${n === 1 ? "payment is" : "payments are"} waiting for your approval and not counted.`,
    noLoans: "No loans",
    loanLine: (amount, date) => `Loan of ${amount}${date ? ` given on ${date}` : ""}`,
    settled: "Fully paid",
    noDueDate: "No due date recorded",
    dueOn: (d) => `Due on ${d}`,
    pastDue: (days, d) => `${days} ${days === 1 ? "day" : "days"} past the due date (${d})`,
    unclearTerms: "Terms not clear, so balance not worked out",
    viewLoan: "Open"
  },
  te: {
    title: "చెల్లింపుల చరిత్ర",
    factsOnly: "ఈ పేజీ మీ రికార్డుల్లోని వాస్తవాలు మాత్రమే చూపిస్తుంది: చెల్లింపులు, గడువు తేదీలు. ఎవరికీ మార్కులు వేయదు, ఎవరినీ అంచనా వేయదు.",
    noBorrowers: "ఇంకా అప్పుదారులు లేరు.",
    verifiedPayments: "లెక్కలోకి వచ్చిన చెల్లింపులు",
    lastPayment: "చివరి చెల్లింపు",
    totalPaid: "మొత్తం చెల్లించినది",
    none: "ఇంకా లేదు",
    waiting: (n) => `${n} చెల్లింపులు మీ ఆమోదం కోసం వేచి ఉన్నాయి, వాటిని లెక్కించలేదు.`,
    noLoans: "రుణాలు లేవు",
    loanLine: (amount, date) => `${date ? `${date} న ఇచ్చిన ` : ""}${amount} రుణం`,
    settled: "పూర్తిగా చెల్లించారు",
    noDueDate: "గడువు తేదీ నమోదు కాలేదు",
    dueOn: (d) => `గడువు ${d}`,
    pastDue: (days, d) => `గడువు (${d}) దాటి ${days} రోజులు`,
    unclearTerms: "నిబంధనలు స్పష్టంగా లేవు, బాకీ లెక్కించలేదు",
    viewLoan: "తెరవండి"
  }
};
