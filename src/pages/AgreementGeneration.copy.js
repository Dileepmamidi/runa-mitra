// Screen text (follows the app language).
export const agreementCopy = {
  en: {
    title: "Loan agreement",
    subtitle: "Make a written record of a loan and print or save it.",
    legalTitle: "Please note",
    legalText: "This paper is a record of what you both agreed. It does not by itself guarantee that a court will enforce it. Signature pictures are uploaded photos, not verified e-signatures.",
    borrower: "Borrower",
    chooseBorrower: "Choose a borrower",
    loan: "Loan",
    chooseLoan: "Choose a loan",
    loanOption: (amount, date) => `${amount}${date ? ` · ${date}` : ""}`,
    docLanguage: "Language of the agreement paper",
    witness: "Witness name",
    signatures: "Signature photos (optional)",
    signaturesHint: "Take a photo of each person's signature on paper. You can also leave these empty and sign the printed paper by hand.",
    borrowerSign: "Borrower's signature",
    lenderSign: "Your signature",
    witnessSign: "Witness's signature",
    pickPhoto: "Tap to take or choose a photo",
    whatHappens: "When you press the button, the signature photos are uploaded, the agreement is saved to your records, and the print screen opens so you can print or save it as PDF.",
    generate: "Save and print",
    saving: "Saving…",
    saved: "Agreement saved to your records.",
    needSelection: "Choose a borrower and a loan first.",
    error: "Could not save the agreement. Check your internet and try again.",
    saved_list: "Saved agreements",
    savedOn: (d) => `Saved on ${d}`,
    noSaved: "No agreements saved yet.",
    unknown: "Unknown borrower",
    version: (n) => `Version ${n}`,
    newVersion: (n) => `This loan already has an agreement. Saving makes version ${n}; the older one stays in your records, marked as replaced.`,
    replaced: "Replaced by a newer version",
    ackDone: (d) => (d ? `Borrower acknowledged in the app on ${d}` : "Borrower acknowledged in the app"),
    ackPending: "Borrower has not acknowledged yet",
    ackNote: "A borrower's acknowledgement is a note in the app, not a verified electronic signature.",
    securityIncluded: (g, c) => `The paper will also list ${g} guarantor record(s) and ${c} security item record(s) for this loan.`
  },
  te: {
    title: "రుణ ఒప్పందం",
    subtitle: "రుణానికి రాతపూర్వక రికార్డు తయారు చేసి, ప్రింట్ లేదా సేవ్ చేయండి.",
    legalTitle: "గమనించండి",
    legalText: "ఈ కాగితం మీరిద్దరూ ఒప్పుకున్న దానికి రికార్డు మాత్రమే. దీనిని కోర్టు తప్పకుండా అమలు చేస్తుందని ఇది హామీ ఇవ్వదు. సంతకం ఫోటోలు అప్‌లోడ్ చేసిన చిత్రాలు మాత్రమే, ధృవీకరించిన ఈ-సంతకాలు కావు.",
    borrower: "అప్పుదారు",
    chooseBorrower: "అప్పుదారుని ఎంచుకోండి",
    loan: "రుణం",
    chooseLoan: "రుణాన్ని ఎంచుకోండి",
    loanOption: (amount, date) => `${amount}${date ? ` · ${date}` : ""}`,
    docLanguage: "ఒప్పంద కాగితం భాష",
    witness: "సాక్షి పేరు",
    signatures: "సంతకం ఫోటోలు (ఐచ్ఛికం)",
    signaturesHint: "కాగితంపై ప్రతి ఒక్కరి సంతకాన్ని ఫోటో తీయండి. ఖాళీగా వదిలి, ప్రింట్ చేసిన కాగితంపై చేతితో కూడా సంతకం చేయవచ్చు.",
    borrowerSign: "అప్పుదారు సంతకం",
    lenderSign: "మీ సంతకం",
    witnessSign: "సాక్షి సంతకం",
    pickPhoto: "ఫోటో తీయడానికి లేదా ఎంచుకోవడానికి నొక్కండి",
    whatHappens: "బటన్ నొక్కితే, సంతకం ఫోటోలు అప్‌లోడ్ అవుతాయి, ఒప్పందం మీ రికార్డుల్లో సేవ్ అవుతుంది, ప్రింట్ పేజీ తెరుచుకుంటుంది. అక్కడ ప్రింట్ చేయవచ్చు లేదా PDFగా సేవ్ చేయవచ్చు.",
    generate: "సేవ్ చేసి ప్రింట్ చేయండి",
    saving: "సేవ్ అవుతోంది…",
    saved: "ఒప్పందం మీ రికార్డుల్లో సేవ్ అయింది.",
    needSelection: "ముందు అప్పుదారుని, రుణాన్ని ఎంచుకోండి.",
    error: "ఒప్పందం సేవ్ కాలేదు. ఇంటర్నెట్ చూసి మళ్ళీ ప్రయత్నించండి.",
    saved_list: "సేవ్ అయిన ఒప్పందాలు",
    savedOn: (d) => `${d} న సేవ్ అయింది`,
    noSaved: "ఇంకా ఒప్పందాలు సేవ్ కాలేదు.",
    unknown: "తెలియని అప్పుదారు",
    version: (n) => `${n}వ ప్రతి`,
    newVersion: (n) => `ఈ రుణానికి ఇప్పటికే ఒప్పందం ఉంది. సేవ్ చేస్తే ${n}వ ప్రతి తయారవుతుంది; పాతది మీ రికార్డుల్లో "మార్చబడింది" అని ఉంటుంది.`,
    replaced: "కొత్త ప్రతితో మార్చబడింది",
    ackDone: (d) => (d ? `అప్పుదారు ${d} న యాప్‌లో ఒప్పుకున్నారు` : "అప్పుదారు యాప్‌లో ఒప్పుకున్నారు"),
    ackPending: "అప్పుదారు ఇంకా ఒప్పుకోలేదు",
    ackNote: "అప్పుదారు ఒప్పుకోలు యాప్‌లో ఒక గుర్తు మాత్రమే, ధృవీకరించిన ఎలక్ట్రానిక్ సంతకం కాదు.",
    securityIncluded: (g, c) => `ఈ కాగితంలో ఈ రుణానికి సంబంధించిన ${g} హామీదారు వివరాలు, ${c} తాకట్టు వివరాలు కూడా ఉంటాయి.`
  }
};

// Text of the printed paper. It uses the language chosen for the paper, which
// can differ from the app language; each paper is entirely in one language.
export const agreementPaperCopy = {
  en: {
    languageName: "English",
    heading: "Loan agreement",
    dateFormat: "en-IN",
    body: ({ date, borrower, village, father, lender, amount, rate, method, start }) =>
      `On ${date}, ${borrower}${village ? ` of ${village}` : ""}${father ? ` (father's / husband's name: ${father})` : ""} confirms receiving a loan of ${amount}` +
      `${lender ? ` from ${lender}` : ""}${start ? ` on ${start}` : ""}, at ${rate} (${method}).`,
    repay: ({ due, witness }) =>
      `The borrower agrees to repay this loan${due ? ` by ${due}` : ""}.` + (witness ? ` This was agreed in front of the witness ${witness}.` : ""),
    rate: (r, unit) => `${r}% ${unit === "year" ? "per year" : "per month"}`,
    methods: { simple: "simple interest", compound: "compound interest" },
    methodUnknown: "interest type not recorded",
    borrowerSign: "Borrower's signature",
    lenderSign: "Lender's signature",
    witnessSign: "Witness's signature",
    version: (n) => `Version ${n}`,
    supersedes: (d) => (d ? `This version replaces the agreement dated ${d}.` : "This version replaces an earlier agreement for the same loan."),
    guarantorsTitle: "Guarantor(s)",
    guarantorLine: ({ name, relationship, amount, scope }) =>
      `${name || "Name not recorded"}${relationship ? ` (${relationship})` : ""}${amount ? `, guarantee amount ${amount}` : ""}${scope ? `, covers: ${scope}` : ""}.`,
    guarantorNote: "Guarantor details are written by the lender and are not verified by the app.",
    collateralTitle: "Security item(s)",
    collateralLine: ({ description, type, value, returned }) =>
      `${description || "Description not recorded"}${type ? ` (${type})` : ""}${value ? `, value written as ${value}` : ""}. ${returned ? `Returned${returned === true ? "" : ` on ${returned}`}.` : "Held by the lender."}`,
    collateralTypes: { gold: "gold", land: "land papers", vehicle: "vehicle", document: "document", cheque: "cheque", other: "other" },
    fullLoan: "the full loan",
    note: "This is a record of the agreement made in the Runa Mitra app. It does not by itself guarantee legal enforceability. Signature images are uploaded pictures, not verified e-signatures."
  },
  te: {
    languageName: "తెలుగు",
    heading: "రుణ ఒప్పంద పత్రం",
    dateFormat: "te-IN",
    body: ({ date, borrower, village, father, lender, amount, rate, method, start }) =>
      `ఈ రోజు ${date} న, ${village ? `${village} గ్రామానికి చెందిన ` : ""}${borrower}${father ? ` (తండ్రి / భర్త పేరు: ${father})` : ""}, ` +
      `${lender ? `${lender} గారి వద్ద నుండి ` : ""}${start ? `${start} న ` : ""}${amount} రుణం (${rate}, ${method}) తీసుకున్నట్లు అంగీకరిస్తున్నారు.`,
    repay: ({ due, witness }) =>
      `ఈ రుణాన్ని ${due ? `${due} లోగా ` : ""}తిరిగి చెల్లించడానికి అప్పుదారు ఒప్పుకుంటున్నారు.` + (witness ? ` సాక్షి ${witness} సమక్షంలో ఈ ఒప్పందం జరిగింది.` : ""),
    rate: (r, unit) => `${unit === "year" ? "సంవత్సరానికి" : "నెలకు"} ${r}% వడ్డీ`,
    methods: { simple: "సాధారణ వడ్డీ", compound: "చక్రవడ్డీ" },
    methodUnknown: "వడ్డీ రకం నమోదు కాలేదు",
    borrowerSign: "అప్పుదారు సంతకం",
    lenderSign: "రుణదాత సంతకం",
    witnessSign: "సాక్షి సంతకం",
    version: (n) => `${n}వ ప్రతి`,
    supersedes: (d) => (d ? `ఈ ప్రతి ${d} నాటి ఒప్పందం స్థానంలో వస్తుంది.` : "ఈ ప్రతి ఇదే రుణానికి చెందిన పాత ఒప్పందం స్థానంలో వస్తుంది."),
    guarantorsTitle: "హామీదారు(లు)",
    guarantorLine: ({ name, relationship, amount, scope }) =>
      `${name || "పేరు నమోదు కాలేదు"}${relationship ? ` (${relationship})` : ""}${amount ? `, హామీ మొత్తం ${amount}` : ""}${scope ? `, హామీ: ${scope}` : ""}.`,
    guarantorNote: "హామీదారు వివరాలు రుణదాత రాసినవి, యాప్ వీటిని ధృవీకరించలేదు.",
    collateralTitle: "తాకట్టు వస్తువు(లు)",
    collateralLine: ({ description, type, value, returned }) =>
      `${description || "వివరణ నమోదు కాలేదు"}${type ? ` (${type})` : ""}${value ? `, రాసిన విలువ ${value}` : ""}. ${returned ? (returned === true ? "తిరిగి ఇచ్చారు." : `${returned} న తిరిగి ఇచ్చారు.`) : "రుణదాత దగ్గర ఉంది."}`,
    collateralTypes: { gold: "బంగారం", land: "భూమి పత్రాలు", vehicle: "వాహనం", document: "పత్రం", cheque: "చెక్కు", other: "ఇతరం" },
    fullLoan: "మొత్తం రుణానికి",
    note: "ఇది రుణ మిత్ర యాప్‌లో చేసిన ఒప్పందానికి రికార్డు. ఇది ఒక్కటే చట్టపరంగా అమలవుతుందని హామీ ఇవ్వదు. సంతకం చిత్రాలు అప్‌లోడ్ చేసిన ఫోటోలు, ధృవీకరించిన ఈ-సంతకాలు కావు."
  }
};
