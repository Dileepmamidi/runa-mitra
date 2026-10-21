export const settingsCopy = {
  en: {
    title: "Settings",
    language: "Language",
    detail: "How much detail to show",
    detailHint: "This only changes what you see on screen. All features are free, and nothing is removed from your records.",
    modes: { Basic: "Basic", Regular: "Regular", Advanced: "Advanced" },
    modeText: {
      Basic: "Only the main amounts and actions. Easiest to use.",
      Regular: "Adds charts and collection summaries.",
      Advanced: "Shows every detail and calculation."
    },
    saveError: "Changed on this phone, but could not be saved to your account.",
    invitesTitle: "Send app invitations to all borrowers",
    invitesText: "Each borrower with a mobile number gets an invitation. They can see their loans only after they log in with that number and accept it. Borrowers already connected are skipped.",
    invitesButton: "Send invitations",
    invitesSending: "Sending…",
    invitesDone: (n) => (n === 1 ? "1 invitation sent. The borrower must accept it." : `${n} invitations sent. Each borrower must accept theirs.`),
    invitesNone: "No new invitations to send. Everyone is already connected or has no mobile number.",
    invitesError: "Could not send invitations. Check your internet and try again.",
    invitesConfirm: (n) => `Send invitations to ${n} ${n === 1 ? "borrower" : "borrowers"}?`
  },
  te: {
    title: "సెట్టింగ్స్",
    language: "భాష",
    detail: "ఎంత వివరంగా చూపించాలి",
    detailHint: "ఇది తెరపై కనిపించేదాన్ని మాత్రమే మారుస్తుంది. అన్ని సదుపాయాలు ఉచితం. మీ రికార్డుల నుండి ఏదీ తీసివేయబడదు.",
    modes: { Basic: "సాధారణ", Regular: "మధ్యస్థ", Advanced: "పూర్తి" },
    modeText: {
      Basic: "ముఖ్యమైన మొత్తాలు, పనులు మాత్రమే. వాడటానికి చాలా సులభం.",
      Regular: "చార్టులు, వసూళ్ల సారాంశం కూడా చూపిస్తుంది.",
      Advanced: "ప్రతి వివరం, ప్రతి లెక్క చూపిస్తుంది."
    },
    saveError: "ఈ ఫోన్‌లో మారింది, కానీ మీ ఖాతాలో సేవ్ కాలేదు.",
    invitesTitle: "అప్పుదారులందరికీ యాప్ ఆహ్వానం పంపండి",
    invitesText: "మొబైల్ నంబర్ ఉన్న ప్రతి అప్పుదారుకు ఆహ్వానం వెళ్తుంది. వారు ఆ నంబర్‌తో లాగిన్ అయి ఆహ్వానాన్ని ఒప్పుకున్న తర్వాతే వారి రుణాలు కనిపిస్తాయి. ఇప్పటికే కలిసిన వారిని వదిలేస్తాం.",
    invitesButton: "ఆహ్వానాలు పంపండి",
    invitesSending: "పంపుతోంది…",
    invitesDone: (n) => `${n} ఆహ్వానాలు పంపాం. ప్రతి అప్పుదారు తమ ఆహ్వానాన్ని ఒప్పుకోవాలి.`,
    invitesNone: "పంపవలసిన కొత్త ఆహ్వానాలు లేవు. అందరూ ఇప్పటికే కలిశారు లేదా మొబైల్ నంబర్ లేదు.",
    invitesError: "ఆహ్వానాలు పంపలేకపోయాం. ఇంటర్నెట్ చూసి మళ్ళీ ప్రయత్నించండి.",
    invitesConfirm: (n) => `${n} మంది అప్పుదారులకు ఆహ్వానం పంపాలా?`
  }
};
