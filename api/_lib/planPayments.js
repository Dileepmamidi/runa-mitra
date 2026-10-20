// Plan purchase logic, independent of HTTP so it can be tested.
// Firestore layout (server-written only; rules block client writes):
//   users/{uid}/planPayments/{orderId}  { planId, amountPaise, status: created|paid, paymentId, ... }
//   users/{uid}/subscription/current     { planId, status, currentPeriodEnd, lastOrderId, lastPaymentId }
import { Timestamp } from "firebase-admin/firestore";
import { PAID_PLAN_IDS, PLANS, nextPeriodEnd } from "../../src/config/plans.js";
import { capturePayment, createOrder, fetchOrderPayments, fetchPayment, verifyCheckoutSignature } from "./razorpay.js";

const planPaymentRef = (db, uid, orderId) => db.doc(`users/${uid}/planPayments/${orderId}`);
const subscriptionRef = (db, uid) => db.doc(`users/${uid}/subscription/current`);

function fail(status, message) {
  return Object.assign(new Error(message), { status });
}

export async function startPlanOrder({ db, keys, uid, planId, fetchImpl }) {
  if (!PAID_PLAN_IDS.includes(planId)) throw fail(400, "Unknown plan.");
  const amount = PLANS[planId].pricePaise; // price always comes from the server
  const order = await createOrder(
    keys,
    { amount, currency: "INR", receipt: `rm_${uid.slice(0, 10)}_${Date.now()}`, notes: { uid, planId }, payment_capture: 1 },
    { fetchImpl }
  );
  await planPaymentRef(db, uid, order.id).set({
    planId,
    amountPaise: amount,
    status: "created",
    createdAt: Timestamp.now()
  });
  return { orderId: order.id, amount, currency: "INR", keyId: keys.keyId, planId };
}

/** Records a paid order and extends the plan. Safe to call twice for the same order. */
export async function activatePlan({ db, uid, orderId, paymentId, source, now = Date.now() }) {
  return db.runTransaction(async (tx) => {
    const payRef = planPaymentRef(db, uid, orderId);
    const subRef = subscriptionRef(db, uid);
    const [paySnap, subSnap] = await Promise.all([tx.get(payRef), tx.get(subRef)]);
    if (!paySnap.exists) throw fail(404, "Order not found.");
    const pay = paySnap.data();
    if (pay.status === "paid") return { alreadyApplied: true, planId: pay.planId };

    const sub = subSnap.exists ? subSnap.data() : null;
    const samePlanActive = sub && sub.planId === pay.planId && sub.status === "active";
    const end = nextPeriodEnd(samePlanActive ? sub.currentPeriodEnd : null, now);

    tx.set(payRef, { status: "paid", paymentId, paidAt: Timestamp.fromMillis(now), source }, { merge: true });
    tx.set(subRef, {
      planId: pay.planId,
      status: "active",
      currentPeriodEnd: Timestamp.fromMillis(end),
      lastOrderId: orderId,
      lastPaymentId: paymentId,
      updatedAt: Timestamp.fromMillis(now)
    });
    return { alreadyApplied: false, planId: pay.planId, currentPeriodEnd: end };
  });
}

// Captures an authorized payment. If the capture call fails (for example the
// connection dropped after Razorpay captured it), re-reads the payment.
async function ensureCaptured({ keys, payment, amountPaise, fetchImpl }) {
  if (payment.status !== "authorized") return payment;
  try {
    return await capturePayment(keys, payment.id, amountPaise, { fetchImpl });
  } catch {
    return fetchPayment(keys, payment.id, { fetchImpl });
  }
}

/** Called after Razorpay Checkout succeeds in the app. */
export async function confirmPlanPayment({ db, keys, uid, orderId, paymentId, signature, fetchImpl }) {
  if (!orderId || !paymentId || !signature) throw fail(400, "Payment details are missing.");
  if (!verifyCheckoutSignature({ orderId, paymentId, signature }, keys.keySecret)) throw fail(400, "Payment could not be verified.");

  const paySnap = await planPaymentRef(db, uid, orderId).get();
  if (!paySnap.exists) throw fail(404, "Order not found for this account.");
  const expected = paySnap.data();

  let payment = await fetchPayment(keys, paymentId, { fetchImpl });
  if (payment.order_id !== orderId || Number(payment.amount) !== expected.amountPaise || payment.currency !== "INR") {
    throw fail(400, "Payment does not match the order.");
  }
  payment = await ensureCaptured({ keys, payment, amountPaise: expected.amountPaise, fetchImpl });
  if (payment.status !== "captured") throw fail(402, "Payment is not complete.");

  return activatePlan({ db, uid, orderId, paymentId, source: "checkout" });
}

/** Webhook (payment.captured / order.paid) — backup path if the app closed before confirming. */
export async function handleWebhookEvent({ db, event }) {
  const payment = event?.payload?.payment?.entity;
  if (!payment || !["payment.captured", "order.paid"].includes(event.event)) return { ignored: true };
  const uid = payment.notes?.uid || event?.payload?.order?.entity?.notes?.uid;
  if (!uid || !payment.order_id) return { ignored: true };
  const paySnap = await planPaymentRef(db, uid, payment.order_id).get();
  if (!paySnap.exists || Number(payment.amount) !== paySnap.data().amountPaise) return { ignored: true };
  return activatePlan({ db, uid, orderId: payment.order_id, paymentId: payment.id, source: "webhook" });
}

const RECONCILE_WINDOW_MS = 7 * 86400000;

/**
 * Recovery: asks Razorpay about this user's recent unfinished orders and
 * activates the plan for any that were actually paid. Covers payments whose
 * confirmation from the app failed (dropped connection, app closed).
 */
export async function reconcilePlanOrders({ db, keys, uid, fetchImpl, now = Date.now() }) {
  const snap = await db.collection(`users/${uid}/planPayments`).where("status", "==", "created").get();
  const recent = snap.docs.filter((d) => {
    const created = d.data().createdAt?.toMillis?.() || 0;
    return now - created < RECONCILE_WINDOW_MS;
  });
  const activated = [];
  for (const orderDoc of recent) {
    const expected = orderDoc.data();
    const payments = await fetchOrderPayments(keys, orderDoc.id, { fetchImpl });
    for (const candidate of payments) {
      if (Number(candidate.amount) !== expected.amountPaise || candidate.currency !== "INR") continue;
      if (!["captured", "authorized"].includes(candidate.status)) continue;
      const payment = await ensureCaptured({ keys, payment: candidate, amountPaise: expected.amountPaise, fetchImpl });
      if (payment.status !== "captured") continue;
      const result = await activatePlan({ db, uid, orderId: orderDoc.id, paymentId: payment.id, source: "reconcile", now });
      activated.push({ orderId: orderDoc.id, ...result });
      break;
    }
  }
  return { checked: recent.length, activated };
}
