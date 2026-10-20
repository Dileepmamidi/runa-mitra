// Razorpay webhook (Dashboard → Webhooks → URL .../api/razorpay/webhook,
// events payment.captured and order.paid, secret = RAZORPAY_WEBHOOK_SECRET).
import { adminDb } from "../_lib/firebaseAdmin.js";
import { readRaw, send } from "../_lib/http.js";
import { handleWebhookEvent } from "../_lib/planPayments.js";
import { verifyWebhookSignature } from "../_lib/razorpay.js";

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "Use POST." });
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return send(res, 503, { error: "Webhook secret not configured." });
  const raw = typeof req.body === "string" ? req.body : await readRaw(req);
  if (!verifyWebhookSignature(raw, req.headers["x-razorpay-signature"], secret)) return send(res, 400, { error: "Bad signature." });
  try {
    const result = await handleWebhookEvent({ db: adminDb(), event: JSON.parse(raw) });
    send(res, 200, { ok: true, ...result });
  } catch (err) {
    console.error(err);
    send(res, 500, { error: "Webhook failed." });
  }
}
