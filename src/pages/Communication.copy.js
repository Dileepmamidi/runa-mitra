export const communicationCopy = {
  en: {
    title: "Messages and reminders",
    intro: "Tap a borrower to open WhatsApp with a polite reminder already typed. Nothing is sent until you press send inside WhatsApp, and this app cannot tell whether it was delivered.",
    whatsAppTitle: "WhatsApp message",
    openWhatsApp: "Open WhatsApp",
    noMobile: "No mobile number",
    outstanding: (amount) => `Outstanding ${amount}`,
    noBorrowers: "No borrowers yet.",
    previewTitle: "Message that will be typed",
    reminder: (name, lender, amount) =>
      `Namaste ${name || ""}. This is a friendly reminder from ${lender || "your lender"}.` +
      (amount ? ` As per my records, ${amount} is outstanding today.` : "") +
      " Please pay when you are able. If your record is different from mine, please tell me and we will check together. Thank you.",

    appTitle: "In-app reminders",
    appIntro: "A reminder is saved in Runa Mitra. The borrower sees it inside their Runa Mitra app, only if they have joined using your invitation. No SMS or phone notification is sent.",
    notAvailableTitle: "Not available",
    notAvailable: "SMS and automatic WhatsApp messages are not available. For WhatsApp, use the button above and press send yourself.",
    upgradeTitle: "In-app reminders are on the Regular plan",
    upgradeText: "WhatsApp messages above are free for everyone.",
    seePlans: "See plans",
    newTitle: "New reminder",
    borrower: "Borrower",
    chooseBorrower: "Choose a borrower",
    notLinked: "This borrower has not joined the app, so they cannot see in-app reminders. Use WhatsApp instead.",
    loan: "Loan (optional)",
    anyLoan: "All loans",
    loanOption: (amount, date) => `${amount} given on ${date}`,
    dueDate: "Remind about the date",
    template: "Message",
    messageLanguage: "Message language",
    templateLabels: { gentle: "Gentle reminder", due: "Due date is near", after: "Date has passed" },
    message: "Message (you can change it)",
    save: "Save reminder",
    saved: "Reminder saved. The borrower will see it the next time they open the app.",
    errBorrower: "Please choose a borrower.",
    errLinked: "This borrower has not joined the app.",
    errMessage: "Please write a message.",
    error: "Could not save. Please try again.",
    listTitle: "Saved reminders",
    none: "No reminders yet.",
    statusScheduled: "Saved",
    statusCancelled: "Cancelled",
    forDate: (d) => `About ${d}`,
    cancel: "Cancel reminder",
    cancelled: "Reminder cancelled.",
    unknown: "Unknown borrower"
  },
  te: {
    title: "సందేశాలు, గుర్తుచేతలు",
    intro: "అప్పుదారు పేరు పక్కన బటన్ నొక్కితే, మర్యాదగా రాసిన గుర్తుచేత సందేశంతో వాట్సాప్ తెరుచుకుంటుంది. వాట్సాప్‌లో మీరు పంపు నొక్కే వరకు ఏదీ వెళ్ళదు. అది చేరిందో లేదో ఈ యాప్‌కు తెలియదు.",
    whatsAppTitle: "వాట్సాప్ సందేశం",
    openWhatsApp: "వాట్సాప్ తెరవండి",
    noMobile: "మొబైల్ నంబర్ లేదు",
    outstanding: (amount) => `బాకీ ${amount}`,
    noBorrowers: "ఇంకా అప్పుదారులు లేరు.",
    previewTitle: "టైప్ అయ్యే సందేశం",
    reminder: (name, lender, amount) =>
      `నమస్తే ${name || ""} గారు. ${lender || "మీ రుణదాత"} నుండి చిన్న గుర్తుచేత.` +
      (amount ? ` నా లెక్క ప్రకారం ఈరోజుకు ${amount} బాకీ ఉంది.` : "") +
      " వీలైనప్పుడు చెల్లించండి. మీ లెక్క వేరుగా ఉంటే చెప్పండి, ఇద్దరం కలిసి చూసుకుందాం. ధన్యవాదాలు.",

    appTitle: "యాప్‌లో గుర్తుచేతలు",
    appIntro: "గుర్తుచేత రుణ మిత్రలో సేవ్ అవుతుంది. మీ ఆహ్వానంతో యాప్‌లో చేరిన అప్పుదారుకు మాత్రమే, వారి రుణ మిత్ర యాప్‌లో అది కనిపిస్తుంది. SMS గానీ ఫోన్ నోటిఫికేషన్ గానీ వెళ్ళదు.",
    notAvailableTitle: "అందుబాటులో లేనివి",
    notAvailable: "SMS, ఆటోమేటిక్ వాట్సాప్ సందేశాలు అందుబాటులో లేవు. వాట్సాప్ కోసం పై బటన్ నొక్కి, మీరే పంపండి.",
    upgradeTitle: "యాప్‌లో గుర్తుచేతలు రెగ్యులర్ ప్లాన్‌లో ఉన్నాయి",
    upgradeText: "పైన ఉన్న వాట్సాప్ సందేశాలు అందరికీ ఉచితం.",
    seePlans: "ప్లాన్‌లు చూడండి",
    newTitle: "కొత్త గుర్తుచేత",
    borrower: "అప్పుదారు",
    chooseBorrower: "అప్పుదారుని ఎంచుకోండి",
    notLinked: "ఈ అప్పుదారు యాప్‌లో చేరలేదు, కాబట్టి వారికి యాప్‌లో గుర్తుచేతలు కనిపించవు. వాట్సాప్ వాడండి.",
    loan: "రుణం (ఇవ్వకపోయినా పరవాలేదు)",
    anyLoan: "అన్ని రుణాలు",
    loanOption: (amount, date) => `${date} న ఇచ్చిన ${amount}`,
    dueDate: "ఏ తేదీ గురించి గుర్తుచేయాలి",
    template: "సందేశం",
    messageLanguage: "సందేశం భాష",
    templateLabels: { gentle: "మర్యాదగా గుర్తుచేత", due: "గడువు దగ్గర పడింది", after: "గడువు దాటింది" },
    message: "సందేశం (మార్చుకోవచ్చు)",
    save: "గుర్తుచేత సేవ్ చేయండి",
    saved: "గుర్తుచేత సేవ్ అయింది. అప్పుదారు తర్వాత యాప్ తెరిచినప్పుడు చూస్తారు.",
    errBorrower: "దయచేసి అప్పుదారుని ఎంచుకోండి.",
    errLinked: "ఈ అప్పుదారు యాప్‌లో చేరలేదు.",
    errMessage: "దయచేసి సందేశం రాయండి.",
    error: "సేవ్ చేయలేకపోయాం. మళ్ళీ ప్రయత్నించండి.",
    listTitle: "సేవ్ చేసిన గుర్తుచేతలు",
    none: "ఇంకా గుర్తుచేతలు లేవు.",
    statusScheduled: "సేవ్ అయింది",
    statusCancelled: "రద్దు చేశారు",
    forDate: (d) => `${d} గురించి`,
    cancel: "రద్దు చేయండి",
    cancelled: "గుర్తుచేత రద్దు చేశాం.",
    unknown: "తెలియని అప్పుదారు"
  }
};

// Reminder wording in each language, chosen separately from the screen
// language. Respectful and never threatening.
export const reminderTemplatesCopy = {
  en: {
    gentle: (name, lender, amount) =>
      `Namaste ${name || ""}. A gentle reminder from ${lender || "your lender"}.` +
      (amount ? ` As per my records, ${amount} is outstanding today.` : "") +
      " Please pay when you are able. If your record is different, please tell me. Thank you.",
    due: (name, lender, amount, date) =>
      `Namaste ${name || ""}. ${lender || "Your lender"} here. The agreed date${date ? ` (${date})` : ""} is coming soon.` +
      (amount ? ` As per my records, ${amount} is outstanding today.` : "") +
      " If you need more time, please talk to me. Thank you.",
    after: (name, lender, amount, date) =>
      `Namaste ${name || ""}. ${lender || "Your lender"} here. The agreed date${date ? ` (${date})` : ""} has passed.` +
      (amount ? ` As per my records, ${amount} is outstanding today.` : "") +
      " Please let me know when you can pay, or if you need more time. Thank you."
  },
  te: {
    gentle: (name, lender, amount) =>
      `నమస్తే ${name || ""} గారు. ${lender || "మీ రుణదాత"} నుండి చిన్న గుర్తుచేత.` +
      (amount ? ` నా లెక్క ప్రకారం ఈరోజుకు ${amount} బాకీ ఉంది.` : "") +
      " వీలైనప్పుడు చెల్లించండి. మీ లెక్క వేరుగా ఉంటే చెప్పండి. ధన్యవాదాలు.",
    due: (name, lender, amount, date) =>
      `నమస్తే ${name || ""} గారు. నేను ${lender || "మీ రుణదాత"}. అనుకున్న తేదీ${date ? ` (${date})` : ""} దగ్గర పడింది.` +
      (amount ? ` నా లెక్క ప్రకారం ఈరోజుకు ${amount} బాకీ ఉంది.` : "") +
      " ఇంకా సమయం కావాలంటే నాతో మాట్లాడండి. ధన్యవాదాలు.",
    after: (name, lender, amount, date) =>
      `నమస్తే ${name || ""} గారు. నేను ${lender || "మీ రుణదాత"}. అనుకున్న తేదీ${date ? ` (${date})` : ""} దాటింది.` +
      (amount ? ` నా లెక్క ప్రకారం ఈరోజుకు ${amount} బాకీ ఉంది.` : "") +
      " ఎప్పుడు చెల్లించగలరో, లేదా ఇంకా సమయం కావాలో చెప్పండి. ధన్యవాదాలు."
  }
};
