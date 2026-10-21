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

## Plans and Razorpay payments

Lenders can upgrade from the free Simple plan (3 active borrowers) to Regular
(₹99/30 days, 50 borrowers) or Advanced (₹249/30 days, unlimited). Prices,
limits and features live in `src/config/plans.js`. Borrower access to their
own loan records is free on every plan.

How a payment works:

1. The app asks the server (`api/razorpay/create-order`) for an order. The
   server sets the price from `plans.js` — the app cannot choose the amount.
2. Razorpay Checkout opens; the person pays.
3. The app sends the result to `api/razorpay/verify`. The server checks the
   signature with the secret key, fetches the payment from Razorpay, checks the
   amount and order, then writes `users/{uid}/subscription/current`.
   Firestore rules stop the app itself from writing that document.
4. Optional backup: `api/razorpay/webhook` activates the plan if the app was
   closed before step 3. The same payment is never counted twice.

### Setup (test mode — no real money)

1. Razorpay Dashboard → switch to **Test Mode** → Account & Settings → API Keys →
   generate a key pair.
2. Firebase console → Project settings → Service accounts → Generate new private key.
3. Vercel → Project → Settings → Environment Variables:
   `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `FIREBASE_SERVICE_ACCOUNT`
   (the whole JSON on one line), optionally `RAZORPAY_WEBHOOK_SECRET`.
   Redeploy.
4. Android app: set `VITE_API_BASE_URL=https://<your-vercel-domain>` in
   `.env.local`, then `npm run android:sync`.

For local testing put `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` in `.env.local`
(never commit it); `npm run dev:emulator` serves `/api` from the dev server.
Test card: 4111 1111 1111 1111, any future expiry, any CVV; test UPI: `success@razorpay`.

```bash
npm run test:payments   # payment server tests (emulator + fake Razorpay)
```

## Releasing an Android update (without a store)

Installed apps check `public/version.json` on the website at start-up and show
"New version available" when a newer build exists.

1. In `android/app/build.gradle` raise `versionCode` by 1 and set `versionName`.
2. Build: `npm run android:sync`, then build the APK (Android Studio, or
   `cd android && ./gradlew assembleRelease` once signing is set up).
3. GitHub → Releases → Draft a new release → attach the APK named exactly
   `runa-mitra.apk` → Publish. The link
   `https://github.com/Dileepmamidi/runa-mitra/releases/latest/download/runa-mitra.apk`
   always points to the newest one.
4. Update `public/version.json` with the same `versionCode`/`versionName`
   and short notes, then push and merge so Vercel publishes it.

## How amounts are calculated

`src/utils/interestEngine.js` is the only place money is calculated (integer
paise, documented rules, unit-tested). Loans store their agreed `terms`;
older loans are read from their original fields (rate was "% per month").

## How borrowers get access

1. The lender adds a borrower with their mobile number (or taps *Invite to the app*).
2. The borrower signs in with that number and taps **Yes, this is me**.
3. The lender's app then shares that borrower's loan records. Borrowers can only
   read records shared with them; the lender's private notes are never shared.
