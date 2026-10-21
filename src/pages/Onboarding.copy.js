export const splashCopy = {
  en: { name: "Runa Mitra", tagline: "A clear loan notebook for lenders and borrowers" },
  te: { name: "రుణ మిత్ర", tagline: "అప్పు ఇచ్చేవారికీ, తీసుకునేవారికీ స్పష్టమైన లెక్కల పుస్తకం" }
};

export const languageCopy = {
  en: {
    title: "Choose your language",
    subtitle: "The whole app will be shown in this language. You can change it later in More.",
    teluguHint: "Telugu",
    englishHint: "English",
    continue: "Continue"
  },
  te: {
    title: "మీ భాషను ఎంచుకోండి",
    subtitle: "యాప్ మొత్తం ఈ భాషలో కనిపిస్తుంది. తర్వాత \"మరిన్ని\"లో మార్చుకోవచ్చు.",
    teluguHint: "తెలుగు",
    englishHint: "ఇంగ్లీష్",
    continue: "కొనసాగించండి"
  }
};

export const loginCopy = {
  en: {
    title: "Sign in with your phone",
    subtitle: "We will send a 6-digit code by SMS.",
    phone: "Mobile number",
    phonePlaceholder: "98765 43210",
    otp: "6-digit code",
    otpPlaceholder: "Enter code",
    sendOtp: "Send code",
    verify: "Verify and continue",
    wait: "Please wait…",
    changeNumber: "Change number",
    sentTo: (phone) => `Code sent to ${phone}`,
    invalidPhone: "Please enter a valid 10-digit mobile number.",
    captchaNotReady: "Security check is still loading. Please wait a moment and try again.",
    sendFailed: "Could not send the code. Please check the number and try again.",
    sendErrors: {
      "auth/invalid-phone-number": "This mobile number is not valid. Please check it.",
      "auth/too-many-requests": "Too many attempts from this phone. Please wait a while and try again.",
      "auth/quota-exceeded": "Today's SMS limit for this app has been reached. Please try again tomorrow.",
      "auth/billing-not-enabled": "SMS sign-in is not switched on for this app yet (the app owner must enable billing in Firebase).",
      "auth/operation-not-allowed": "SMS to this country is not allowed in the app's Firebase settings (SMS region policy).",
      "auth/captcha-check-failed": "The security check failed. Please refresh and try again.",
      "auth/invalid-app-credential": "The security check failed. Please refresh and try again.",
      "auth/network-request-failed": "No internet connection. Please try again."
    },
    errorCode: (code) => `Error code: ${code}`,
    invalidOtp: "Please enter the 6-digit code.",
    wrongOtp: "The code is wrong or has expired. Please try again.",
    privacy: "Your loan records are visible only to you and the people you choose to share them with."
  },
  te: {
    title: "ఫోన్ నంబర్‌తో లాగిన్ అవ్వండి",
    subtitle: "SMS ద్వారా 6 అంకెల కోడ్ పంపుతాము.",
    phone: "మొబైల్ నంబర్",
    phonePlaceholder: "98765 43210",
    otp: "6 అంకెల కోడ్",
    otpPlaceholder: "కోడ్ ఇవ్వండి",
    sendOtp: "కోడ్ పంపండి",
    verify: "నిర్ధారించి కొనసాగండి",
    wait: "దయచేసి వేచి ఉండండి…",
    changeNumber: "నంబర్ మార్చండి",
    sentTo: (phone) => `${phone} కి కోడ్ పంపాము`,
    invalidPhone: "దయచేసి సరైన 10 అంకెల మొబైల్ నంబర్ ఇవ్వండి.",
    captchaNotReady: "భద్రతా తనిఖీ ఇంకా లోడ్ అవుతోంది. కొంచెం ఆగి మళ్ళీ ప్రయత్నించండి.",
    sendFailed: "కోడ్ పంపలేకపోయాం. నంబర్ సరిచూసి మళ్ళీ ప్రయత్నించండి.",
    sendErrors: {
      "auth/invalid-phone-number": "ఈ మొబైల్ నంబర్ సరైనది కాదు. ఒకసారి చూడండి.",
      "auth/too-many-requests": "ఈ ఫోన్ నుండి చాలా ప్రయత్నాలు జరిగాయి. కొంచెం సేపు ఆగి మళ్ళీ ప్రయత్నించండి.",
      "auth/quota-exceeded": "ఈరోజు SMS పరిమితి అయిపోయింది. రేపు మళ్ళీ ప్రయత్నించండి.",
      "auth/billing-not-enabled": "ఈ యాప్‌కు SMS లాగిన్ ఇంకా ఆన్ కాలేదు (యాప్ యజమాని Firebase‌లో బిల్లింగ్ ఆన్ చేయాలి).",
      "auth/operation-not-allowed": "యాప్ Firebase సెట్టింగ్‌లలో ఈ దేశానికి SMS అనుమతి లేదు (SMS region policy).",
      "auth/captcha-check-failed": "భద్రతా తనిఖీ విఫలమైంది. రిఫ్రెష్ చేసి మళ్ళీ ప్రయత్నించండి.",
      "auth/invalid-app-credential": "భద్రతా తనిఖీ విఫలమైంది. రిఫ్రెష్ చేసి మళ్ళీ ప్రయత్నించండి.",
      "auth/network-request-failed": "ఇంటర్నెట్ లేదు. మళ్ళీ ప్రయత్నించండి."
    },
    errorCode: (code) => `ఎర్రర్ కోడ్: ${code}`,
    invalidOtp: "దయచేసి 6 అంకెల కోడ్ ఇవ్వండి.",
    wrongOtp: "కోడ్ తప్పు లేదా గడువు ముగిసింది. మళ్ళీ ప్రయత్నించండి.",
    privacy: "మీ రుణ వివరాలు మీకు, మీరు పంచుకోవాలనుకునే వారికి మాత్రమే కనిపిస్తాయి."
  }
};
