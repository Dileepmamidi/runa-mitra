export const upgradeCardCopy = {
  en: {
    title: (plan) => `Available on the ${plan} plan`,
    button: "See plans",
    plans: { regular: "Regular", advanced: "Advanced" },
    limitTitle: "Borrower limit reached",
    limitText: (limit) => `Your plan allows ${limit} active borrowers. Existing borrowers and their records are not affected.`
  },
  te: {
    title: (plan) => `${plan} ప్లాన్‌లో అందుబాటులో ఉంది`,
    button: "ప్లాన్‌లు చూడండి",
    plans: { regular: "రెగ్యులర్", advanced: "అడ్వాన్స్‌డ్" },
    limitTitle: "అప్పుదారుల పరిమితి చేరింది",
    limitText: (limit) => `మీ ప్లాన్‌లో ${limit} మంది చురుకైన అప్పుదారులు మాత్రమే. ఇప్పటికే ఉన్నవారి వివరాలకు ఏమీ కాదు.`
  }
};
