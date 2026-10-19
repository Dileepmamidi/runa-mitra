export const analyticsCopy = {
  en: {
    title: "Collections summary",
    subtitle: "Worked out from the payments and loans you recorded.",
    monthly: "Payments received, last 6 months",
    monthlyHint: "Only payments you recorded or approved are counted.",
    split: "What the collected money paid for",
    principal: "Principal returned",
    interest: "Interest received",
    unclear: (n) => `${n} ${n === 1 ? "loan is" : "loans are"} left out because the terms are not clear.`,
    byOccupation: "Outstanding by borrower's work",
    byOccupationHint: "Plain totals only. This does not say anything about any person.",
    loansCount: (n) => `${n} ${n === 1 ? "active loan" : "active loans"}`,
    fewLoans: "There are only a few loans, so these totals may not show a real pattern.",
    noLoans: "No loans recorded yet.",
    occupations: { Farmer: "Farmer", Employee: "Employee", Shopkeeper: "Shopkeeper", Business: "Business", "Daily wage": "Daily wage", Other: "Other" },
    notRecorded: "Not recorded"
  },
  te: {
    title: "వసూళ్ల సారాంశం",
    subtitle: "మీరు నమోదు చేసిన చెల్లింపులు, రుణాల నుండి లెక్కించినది.",
    monthly: "గత 6 నెలల్లో వచ్చిన చెల్లింపులు",
    monthlyHint: "మీరు నమోదు చేసిన లేదా ఆమోదించిన చెల్లింపులు మాత్రమే లెక్కించాం.",
    split: "వచ్చిన డబ్బు దేనికి జమ అయింది",
    principal: "తిరిగి వచ్చిన అసలు",
    interest: "వచ్చిన వడ్డీ",
    unclear: (n) => `${n} రుణాల నిబంధనలు స్పష్టంగా లేనందున వాటిని లెక్కలో చేర్చలేదు.`,
    byOccupation: "అప్పుదారుల పని ప్రకారం బాకీ",
    byOccupationHint: "కేవలం మొత్తాలు మాత్రమే. ఇది ఏ వ్యక్తి గురించీ ఏమీ చెప్పదు.",
    loansCount: (n) => `${n} చురుకైన రుణాలు`,
    fewLoans: "రుణాలు కొన్ని మాత్రమే ఉన్నాయి, కాబట్టి ఈ మొత్తాల నుండి ఏ నిర్ణయానికీ రాలేం.",
    noLoans: "ఇంకా రుణాలు నమోదు కాలేదు.",
    occupations: { Farmer: "రైతు", Employee: "ఉద్యోగి", Shopkeeper: "దుకాణదారు", Business: "వ్యాపారం", "Daily wage": "రోజు కూలీ", Other: "ఇతర" },
    notRecorded: "నమోదు కాలేదు"
  }
};
