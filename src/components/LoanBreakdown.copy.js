// Text for the loan amount breakdown (used by lender and borrower screens).
// The engine reports issues and notes in English; `issues` and `notes` give
// the display text for each kind of message.
export const loanBreakdownCopy = {
  en: {
    title: "Amount breakdown",
    asOf: (d) => `As of ${d}`,
    principal: "Principal given",
    interest: "Interest so far",
    paid: "Paid so far",
    remainingPrincipal: "Principal left",
    unpaidInterest: "Unpaid interest",
    outstanding: "Total outstanding",
    clarify: "Needs clarification",
    clarifyHelp: "Some loan details are missing, so an exact amount cannot be shown:",
    month: "per month",
    year: "per year",
    simple: "simple interest",
    compound: "compound interest",
    rate: (rate, unit, method) => `${rate}% ${unit}, ${method}`,
    explain: (start, principal, rate, asOf, outstanding) =>
      `${principal} was given on ${start}. The agreed interest is ${rate}. Based on the recorded payments, the amount due on ${asOf} is ${outstanding}.`,
    rules: "Payments go to interest first, then to principal. Monthly interest counts full months, plus extra days as days ÷ 30.",
    rulesYear: "Payments go to interest first, then to principal. Yearly interest counts days ÷ 365.",
    pending: "Payments waiting for approval are not included.",
    issues: {
      missing: "The loan terms are missing.",
      principal: "The loan amount is missing.",
      rate: "The interest rate is missing.",
      unit: "It is not recorded whether the rate is per month or per year.",
      method: "It is not recorded whether interest is simple or compound.",
      compounding: "How often interest is added (weekly, monthly or yearly) is not recorded.",
      start: "The date the money was given is missing.",
      asOf: "The calculation date is not valid.",
      beforeStart: "The calculation date is before the loan date.",
      paymentNoDate: "A payment has no date.",
      paymentBeforeStart: (d) => `A payment dated ${d} is before the loan date.`,
      paymentAmount: "A payment has a wrong amount.",
      other: "Some loan details need to be checked."
    },
    notes: {
      future: (n, d) => `${n} payment(s) dated after ${d} are not included.`,
      interestOnlyExtra: (d) => `The interest-only payment on ${d} was more than the interest due. The extra went to principal.`,
      overpaid: (d, amt) => `The payment on ${d} was ${amt} more than the amount owed.`
    }
  },
  te: {
    title: "లెక్క వివరాలు",
    asOf: (d) => `${d} నాటికి`,
    principal: "ఇచ్చిన అసలు",
    interest: "ఇప్పటివరకు వడ్డీ",
    paid: "ఇప్పటివరకు కట్టినది",
    remainingPrincipal: "మిగిలిన అసలు",
    unpaidInterest: "కట్టని వడ్డీ",
    outstanding: "మొత్తం బాకీ",
    clarify: "వివరాలు సరిచూడాలి",
    clarifyHelp: "రుణ వివరాలు కొన్ని లేవు. అందుకే ఖచ్చితమైన మొత్తం చూపలేము:",
    month: "నెలకు",
    year: "సంవత్సరానికి",
    simple: "సాధారణ వడ్డీ",
    compound: "చక్రవడ్డీ",
    rate: (rate, unit, method) => `${unit} ${rate}%, ${method}`,
    explain: (start, principal, rate, asOf, outstanding) =>
      `${start} న ${principal} ఇచ్చారు. ఒప్పుకున్న వడ్డీ ${rate}. నమోదైన చెల్లింపుల ప్రకారం ${asOf} నాటికి బాకీ ${outstanding}.`,
    rules: "కట్టిన డబ్బు ముందు వడ్డీకి, తర్వాత అసలుకు జమ అవుతుంది. నెల వడ్డీ: పూర్తి నెలలు, మిగిలిన రోజులు ÷ 30.",
    rulesYear: "కట్టిన డబ్బు ముందు వడ్డీకి, తర్వాత అసలుకు జమ అవుతుంది. సంవత్సర వడ్డీ: రోజులు ÷ 365.",
    pending: "ఆమోదం కోసం ఆగి ఉన్న చెల్లింపులు ఈ లెక్కలో లేవు.",
    issues: {
      missing: "రుణ వివరాలు లేవు.",
      principal: "రుణ మొత్తం నమోదు కాలేదు.",
      rate: "వడ్డీ రేటు నమోదు కాలేదు.",
      unit: "వడ్డీ నెలకా, సంవత్సరానికా అనేది నమోదు కాలేదు.",
      method: "సాధారణ వడ్డీయా, చక్రవడ్డీయా అనేది నమోదు కాలేదు.",
      compounding: "వడ్డీ ఎంత కాలానికి ఒకసారి కలుస్తుందో (వారం, నెల, సంవత్సరం) నమోదు కాలేదు.",
      start: "డబ్బు ఇచ్చిన తేదీ నమోదు కాలేదు.",
      asOf: "లెక్క తేదీ సరిగా లేదు.",
      beforeStart: "లెక్క తేదీ రుణం ఇచ్చిన తేదీ కంటే ముందు ఉంది.",
      paymentNoDate: "ఒక చెల్లింపుకు తేదీ లేదు.",
      paymentBeforeStart: (d) => `${d} తేదీ చెల్లింపు రుణం ఇచ్చిన తేదీ కంటే ముందు ఉంది.`,
      paymentAmount: "ఒక చెల్లింపు మొత్తం సరిగా లేదు.",
      other: "కొన్ని రుణ వివరాలు సరిచూడాలి."
    },
    notes: {
      future: (n, d) => `${d} తర్వాత తేదీ ఉన్న ${n} చెల్లింపులు ఈ లెక్కలో లేవు.`,
      interestOnlyExtra: (d) => `${d} న కట్టిన వడ్డీ-మాత్రమే చెల్లింపు వడ్డీ కంటే ఎక్కువ. మిగిలినది అసలుకు జమ అయింది.`,
      overpaid: (d, amt) => `${d} న కట్టినది బాకీ కంటే ${amt} ఎక్కువ.`
    }
  }
};

// Display labels for values stored in Firestore. The stored values never
// change; only what the screen shows is translated.
export const loanLabelsCopy = {
  en: {
    methods: { Cash: "Cash", UPI: "UPI", "Bank transfer": "Bank transfer", "Bank Transfer": "Bank transfer", Bank: "Bank transfer" },
    paymentStatus: { verified: "Confirmed", pending_verification: "Waiting for approval", rejected: "Rejected", legacy: "Recorded" },
    loanStatus: { active: "Active", closed: "Closed", completed: "Completed", settled: "Fully paid" },
    security: { "Trust only": "Trust only", Guarantor: "Guarantor", "Gold/Documents": "Gold / documents" },
    occupations: { Farmer: "Farmer", Employee: "Employee", Shopkeeper: "Shopkeeper", Business: "Business", "Daily wage": "Daily wage", Other: "Other" },
    cycles: { weekly: "Every week", monthly: "Every month", yearly: "Every year" },
    rateUnits: { month: "Per month", year: "Per year" },
    interestMethods: { simple: "Simple interest", compound: "Compound interest" },
    recordedByLender: "Recorded by you",
    recordedByBorrower: "Reported by borrower",
    interestOnly: "Interest only",
    unknownBorrower: "Unknown borrower"
  },
  te: {
    methods: { Cash: "నగదు", UPI: "UPI", "Bank transfer": "బ్యాంక్ బదిలీ", "Bank Transfer": "బ్యాంక్ బదిలీ", Bank: "బ్యాంక్ బదిలీ" },
    paymentStatus: { verified: "నిర్ధారించారు", pending_verification: "ఆమోదం కోసం ఆగి ఉంది", rejected: "తిరస్కరించారు", legacy: "నమోదైంది" },
    loanStatus: { active: "నడుస్తోంది", closed: "ముగిసింది", completed: "పూర్తయింది", settled: "పూర్తిగా కట్టారు" },
    security: { "Trust only": "నమ్మకం మీద మాత్రమే", Guarantor: "హామీదారు", "Gold/Documents": "బంగారం / పత్రాలు" },
    occupations: { Farmer: "రైతు", Employee: "ఉద్యోగి", Shopkeeper: "దుకాణదారు", Business: "వ్యాపారం", "Daily wage": "రోజు కూలీ", Other: "ఇతర" },
    cycles: { weekly: "ప్రతి వారం", monthly: "ప్రతి నెల", yearly: "ప్రతి సంవత్సరం" },
    rateUnits: { month: "నెలకు", year: "సంవత్సరానికి" },
    interestMethods: { simple: "సాధారణ వడ్డీ", compound: "చక్రవడ్డీ" },
    recordedByLender: "మీరు నమోదు చేశారు",
    recordedByBorrower: "అప్పుదారు తెలిపారు",
    interestOnly: "వడ్డీ మాత్రమే",
    unknownBorrower: "తెలియని అప్పుదారు"
  }
};
