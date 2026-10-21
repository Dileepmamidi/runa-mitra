import { test } from "node:test";
import assert from "node:assert/strict";
import { SignJWT, UnsecuredJWT, createLocalJWKSet, exportJWK, generateKeyPair } from "jose";
import { verifyFirebaseIdToken } from "../../api/_lib/verifyToken.js";

const env = { VITE_FIREBASE_PROJECT_ID: "proj-1" };

async function setup() {
  const { publicKey, privateKey } = await generateKeyPair("RS256");
  const jwk = { ...(await exportJWK(publicKey)), kid: "k1", alg: "RS256" };
  const keys = createLocalJWKSet({ keys: [jwk] });
  const sign = (claims, { iss = "https://securetoken.google.com/proj-1", aud = "proj-1", exp = "1h" } = {}) =>
    new SignJWT(claims).setProtectedHeader({ alg: "RS256", kid: "k1" }).setIssuer(iss).setAudience(aud).setIssuedAt().setExpirationTime(exp).sign(privateKey);
  return { keys, sign };
}

test("accepts a genuine Firebase ID token and returns the uid", async () => {
  const { keys, sign } = await setup();
  const token = await sign({ sub: "user-1", phone_number: "+919999900001" });
  const decoded = await verifyFirebaseIdToken(token, env, { keys });
  assert.equal(decoded.uid, "user-1");
});

test("rejects tokens for another project, wrong issuer, expired, or unsigned", async () => {
  const { keys, sign } = await setup();
  await assert.rejects(verifyFirebaseIdToken(await sign({ sub: "u" }, { aud: "other" }), env, { keys }));
  await assert.rejects(verifyFirebaseIdToken(await sign({ sub: "u" }, { iss: "https://evil.example" }), env, { keys }));
  await assert.rejects(verifyFirebaseIdToken(await sign({ sub: "u" }, { exp: Math.floor(Date.now() / 1000) - 60 }), env, { keys }));
  const unsigned = new UnsecuredJWT({ sub: "u" }).setIssuer("https://securetoken.google.com/proj-1").setAudience("proj-1").encode();
  await assert.rejects(verifyFirebaseIdToken(unsigned, env, { keys }));
  await assert.rejects(verifyFirebaseIdToken(await sign({}), env, { keys }), /no user/);
});

test("unsigned emulator tokens are accepted only when pointed at the emulator", async () => {
  const unsigned = new UnsecuredJWT({ sub: "u-emu" }).setAudience("proj-1").encode();
  const ok = await verifyFirebaseIdToken(unsigned, { ...env, FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099" });
  assert.equal(ok.uid, "u-emu");
});
