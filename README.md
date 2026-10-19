# Runa Mitra

A Telugu-first digital loan notebook for small lenders and their borrowers.
React 19 + Vite + Tailwind, Firebase (Auth with phone OTP, Firestore, Storage),
packaged as an Android app with Capacitor.

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in your Firebase web config
npm run dev
```

### Without touching your real Firebase project (emulators)

Needs Java 21+.

```bash
npm run emulators          # terminal 1
npm run seed:emulator      # terminal 2: demo lender, borrower and invitation
npm run dev:emulator       # terminal 2
```

Demo phones: lender `9999900001`, borrower `9999900002`, invited new user
`9999900003`. The SMS code appears in the emulator terminal.

## Tests

```bash
npm test             # interest engine + English/Telugu text completeness
npm run test:rules   # Firestore/Storage security rules in the emulator (Java 21+)
```

## Deploy security rules (required)

The app relies on `firestore.rules` and `storage.rules`. Deploy them to your
project before using the borrower features:

```bash
npx firebase login
npx firebase use --add          # pick your project
npx firebase deploy --only firestore:rules,storage
```

In Firebase console → Authentication → Sign-in method, keep **Phone** enabled,
and under Settings → Authorized domains make sure your Vercel domain and
`localhost` are listed.

## Android app

```bash
npm run android:sync    # build the web app and copy it into android/
npm run android:open    # open in Android Studio, then Run ▶ or Build → APK
```

Android Studio (or the Android SDK + JDK 21) is required to build the APK.
The app id is `com.runamitra.app` (in `capacitor.config.json`); choose your
final id before the first Play Store upload — it cannot be changed afterwards.

## How amounts are calculated

`src/utils/interestEngine.js` is the only place money is calculated (integer
paise, documented rules, unit-tested). Loans store their agreed `terms`;
older loans are read from their original fields (rate was "% per month").

## How borrowers get access

1. The lender adds a borrower with their mobile number (or taps *Invite to the app*).
2. The borrower signs in with that number and taps **Yes, this is me**.
3. The lender's app then shares that borrower's loan records. Borrowers can only
   read records shared with them; the lender's private notes are never shared.
