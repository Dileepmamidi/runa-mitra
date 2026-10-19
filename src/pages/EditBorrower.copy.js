export const editBorrowerCopy = {
  en: {
    title: "Edit borrower",
    notFound: "This borrower was not found.",
    save: "Save changes",
    saving: "Saving…",
    cancel: "Cancel",
    saveError: "Could not save the changes. Please check the internet and try again.",
    deleteTitle: "Delete this borrower",
    deleteHelp: "Only possible when all their loans are fully paid.",
    delete: "Delete borrower",
    deleteBlocked: (amount) => `This borrower still owes ${amount}. Close their loans before deleting.`,
    deleteBlockedUnclear: "Some of this borrower's loans have incomplete details, so we cannot confirm they are fully paid. Please fix the loan details first.",
    confirmTitle: "Delete for good?",
    confirmText: (name) => `${name} and their details will be removed from your notebook. This cannot be undone.`,
    confirmYes: "Yes, delete",
    confirmNo: "No, keep",
    deleteError: "Could not delete the borrower. Please try again."
  },
  te: {
    title: "అప్పుదారు వివరాలు మార్చండి",
    notFound: "ఈ అప్పుదారు కనబడలేదు.",
    save: "మార్పులు సేవ్ చేయండి",
    saving: "సేవ్ అవుతోంది…",
    cancel: "రద్దు",
    saveError: "మార్పులు సేవ్ చేయలేకపోయాం. ఇంటర్నెట్ చూసి మళ్ళీ ప్రయత్నించండి.",
    deleteTitle: "ఈ అప్పుదారుని తొలగించడం",
    deleteHelp: "వారి రుణాలన్నీ పూర్తిగా తీరిన తర్వాతే తొలగించవచ్చు.",
    delete: "అప్పుదారుని తొలగించండి",
    deleteBlocked: (amount) => `ఈ అప్పుదారు ఇంకా ${amount} బాకీ ఉన్నారు. ముందు రుణాలు తీర్చాలి.`,
    deleteBlockedUnclear: "ఈ అప్పుదారు రుణాలలో కొన్ని వివరాలు లేవు. అవి పూర్తిగా తీరాయో చెప్పలేము. ముందు రుణ వివరాలు సరిచేయండి.",
    confirmTitle: "పూర్తిగా తొలగించాలా?",
    confirmText: (name) => `${name}, వారి వివరాలు మీ పుస్తకం నుండి తీసివేయబడతాయి. తిరిగి తేలేము.`,
    confirmYes: "అవును, తొలగించండి",
    confirmNo: "వద్దు, ఉంచండి",
    deleteError: "అప్పుదారుని తొలగించలేకపోయాం. మళ్ళీ ప్రయత్నించండి."
  }
};
