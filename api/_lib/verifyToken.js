// Verifies a Firebase Auth ID token without firebase-admin/auth.
// (firebase-admin/auth pulls in jwks-rsa, which require()s the ESM-only
// `jose` and crashes on Node versions without require(esm) support.)
//
// Same checks Firebase documents for ID tokens: RS256 signature from Google's
// securetoken keys, issuer https://securetoken.google.com/<projectId>,
// audience <projectId>, not expired, has a subject (the uid).
import { createRemoteJWKSet, decodeJwt, jwtVerify } from "jose";

const GOOGLE_KEYS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);

export function firebaseProjectId(env = process.env) {
  if (env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      return JSON.parse(env.FIREBASE_SERVICE_ACCOUNT).project_id;
    } catch {
      /* fall through */
    }
  }
  return env.GCLOUD_PROJECT || env.FIREBASE_PROJECT_ID || env.VITE_FIREBASE_PROJECT_ID;
}

export async function verifyFirebaseIdToken(token, env = process.env, { keys = GOOGLE_KEYS } = {}) {
  const projectId = firebaseProjectId(env);
  if (!projectId) throw new Error("Firebase project is not configured.");

  // The Auth emulator issues unsigned tokens; accept them only when the
  // server itself is pointed at the emulator (never in production).
  if (env.FIREBASE_AUTH_EMULATOR_HOST) {
    const claims = decodeJwt(token);
    if (claims.aud !== projectId || !claims.sub) throw new Error("Invalid emulator token.");
    return { uid: claims.sub, ...claims };
  }

  const { payload } = await jwtVerify(token, keys, {
    algorithms: ["RS256"],
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId
  });
  if (!payload.sub) throw new Error("Token has no user.");
  return { uid: payload.sub, ...payload };
}
