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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Retries when the connection drops or Razorpay has a temporary problem
// (network errors; 429/5xx for reads). A retried order creation can at worst
// leave an extra unpaid order, which expires harmlessly. Captures are not
// retried (see capturePayment).
async function call(keys, path, { method = "GET", body, fetchImpl = fetch, attempts = 3 } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    let res;
    try {
      res = await fetchImpl(`${API}${path}`, {
        method,
        headers: { Authorization: authHeader(keys), "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined
      });
    } catch (err) {
      lastError = Object.assign(new Error("Could not reach Razorpay. Please try again."), { status: 502, cause: err });
      if (attempt < attempts) await sleep(300 * attempt);
      continue;
    }
    const data = await res.json().catch(() => ({}));
    if (res.ok) return data;
    const message = data?.error?.description || `Razorpay request failed (${res.status})`;
    lastError = Object.assign(new Error(message), { status: 502 });
    const temporary = res.status === 429 || res.status >= 500;
    if (!temporary || method !== "GET" || attempt === attempts) break;
    await sleep(300 * attempt);
  }
  throw lastError;
}

export const createOrder = (keys, order, opts) => call(keys, "/orders", { method: "POST", body: order, ...opts });
export const fetchPayment = (keys, paymentId, opts) => call(keys, `/payments/${encodeURIComponent(paymentId)}`, opts);
export const fetchOrderPayments = (keys, orderId, opts) =>
  call(keys, `/orders/${encodeURIComponent(orderId)}/payments`, opts).then((r) => r.items || []);
export const capturePayment = (keys, paymentId, amount, opts) =>
  call(keys, `/payments/${encodeURIComponent(paymentId)}/capture`, { method: "POST", body: { amount, currency: "INR" }, attempts: 1, ...opts });

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
