// Minimal Razorpay REST client (server only). The key secret never reaches the app.
import crypto from "node:crypto";

const API = "https://api.razorpay.com/v1";

export function razorpayKeys(env = process.env) {
  const keyId = env.RAZORPAY_KEY_ID;
  const keySecret = env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw Object.assign(new Error("Razorpay keys are not configured."), { status: 503 });
  return { keyId, keySecret };
}

function authHeader({ keyId, keySecret }) {
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
}

async function call(keys, path, { method = "GET", body, fetchImpl = fetch } = {}) {
  const res = await fetchImpl(`${API}${path}`, {
    method,
    headers: { Authorization: authHeader(keys), "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.error?.description || `Razorpay request failed (${res.status})`;
    throw Object.assign(new Error(message), { status: 502 });
  }
  return data;
}

export const createOrder = (keys, order, opts) => call(keys, "/orders", { method: "POST", body: order, ...opts });
export const fetchPayment = (keys, paymentId, opts) => call(keys, `/payments/${encodeURIComponent(paymentId)}`, opts);
export const capturePayment = (keys, paymentId, amount, opts) =>
  call(keys, `/payments/${encodeURIComponent(paymentId)}/capture`, { method: "POST", body: { amount, currency: "INR" }, ...opts });

function safeEqualHex(a, b) {
  const x = Buffer.from(String(a || ""), "utf8");
  const y = Buffer.from(String(b || ""), "utf8");
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

/** Checkout signature: HMAC_SHA256(order_id + "|" + payment_id, key_secret). */
export function verifyCheckoutSignature({ orderId, paymentId, signature }, keySecret) {
  const expected = crypto.createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqualHex(expected, signature);
}

/** Webhook signature: HMAC_SHA256(raw body, webhook secret). */
export function verifyWebhookSignature(rawBody, signature, webhookSecret) {
  const expected = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}
