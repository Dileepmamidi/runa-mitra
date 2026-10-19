export const communicationCopy = {
  en: {
    title: "Messages and reminders",
    intro: "Tap a borrower to open WhatsApp with a polite reminder already typed. Nothing is sent until you press send inside WhatsApp.",
    openWhatsApp: "Open WhatsApp",
    noMobile: "No mobile number",
    outstanding: (amount) => `Outstanding ${amount}`,
    noBorrowers: "No borrowers yet.",
    previewTitle: "Message that will be typed",
    reminder: (name, lender, amount) =>
      `Namaste ${name || ""}. This is a friendly reminder from ${lender || "your lender"}.` +
      (amount ? ` As per my records, ${amount} is outstanding today.` : "") +
      " Please pay when you are able. If your record is different from mine, please tell me and we will check together. Thank you.",
    planTitle: "Coming later",
    points: [
      "Automatic reminders before a due date, only if the borrower agrees.",
      "A record of which reminders were sent and when."
    ],
    notAvailable: "Automatic reminders are not available yet."
  },
  te: {
    title: "సందేశాలు, గుర్తుచేతలు",
    intro: "అప్పుదారు పేరు పక్కన బటన్ నొక్కితే, మర్యాదగా రాసిన గుర్తుచేత సందేశంతో వాట్సాప్ తెరుచుకుంటుంది. వాట్సాప్‌లో మీరు పంపు నొక్కే వరకు ఏదీ వెళ్ళదు.",
    openWhatsApp: "వాట్సాప్ తెరవండి",
    noMobile: "మొబైల్ నంబర్ లేదు",
    outstanding: (amount) => `బాకీ ${amount}`,
    noBorrowers: "ఇంకా అప్పుదారులు లేరు.",
    previewTitle: "టైప్ అయ్యే సందేశం",
    reminder: (name, lender, amount) =>
      `నమస్తే ${name || ""} గారు. ${lender || "మీ రుణదాత"} నుండి చిన్న గుర్తుచేత.` +
      (amount ? ` నా లెక్క ప్రకారం ఈరోజుకు ${amount} బాకీ ఉంది.` : "") +
      " వీలైనప్పుడు చెల్లించండి. మీ లెక్క వేరుగా ఉంటే చెప్పండి, ఇద్దరం కలిసి చూసుకుందాం. ధన్యవాదాలు.",
    planTitle: "తర్వాత వస్తుంది",
    points: [
      "అప్పుదారు ఒప్పుకుంటే, గడువుకు ముందు ఆటోమేటిక్ గుర్తుచేతలు.",
      "ఏ గుర్తుచేత ఎప్పుడు పంపారో రికార్డు."
    ],
    notAvailable: "ఆటోమేటిక్ గుర్తుచేతలు ఇంకా అందుబాటులో లేవు."
  }
};
