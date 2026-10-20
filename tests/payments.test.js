// Payment server tests: Firestore emulator + a fake Razorpay API.
// Run with: npm run test:payments   (starts the Firestore emulator; Java 21+)
import { before, beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { activatePlan, confirmPlanPayment, handleWebhookEvent, reconcilePlanOrders, startPlanOrder } from "../api/_lib/planPayments.js";
import { verifyCheckoutSignature, verifyWebhookSignature } from "../api/_lib/razorpay.js";
import { effectivePlan, PLANS } from "../src/config/plans.js";

const keys = { keyId: "rzp_test_dummy", keySecret: "test_secret" };
const UID = "lenderA";
let db;

// Fake Razorpay: remembers orders and payments created during a test.
function fakeRazorpay() {
  const orders = new Map();
  const payments = new Map();
  let n = 0;
  const fetchImpl = async (url, init = {}) => {
    const body = init.body ? JSON.parse(init.body) : null;
    const path = new URL(url).pathname.replace("/v1", "");
    const reply = (status, data) => ({ ok: status < 400, status, json: async () => data });
    if (path === "/orders" && init.method === "POST") {
      const order = { id: `order_${++n}`, ...body, status: "created" };
      orders.set(order.id, order);
      return reply(200, order);
    }
    const capture = path.match(/^\/payments\/([^/]+)\/capture$/);
    if (capture) {
      const p = payments.get(capture[1]);
      p.status = "captured";
      return reply(200, p);
    }
    const orderPays = path.match(/^\/orders\/([^/]+)\/payments$/);
    if (orderPays) return reply(200, { items: [...payments.values()].filter((p) => p.order_id === orderPays[1]) });
    const get = path.match(/^\/payments\/([^/]+)$/);
    if (get) return payments.has(get[1]) ? reply(200, payments.get(get[1])) : reply(404, { error: { description: "not found" } });
    return reply(404, {});
  };
  const pay = (orderId, { amount, status = "captured", currency = "INR" } = {}) => {
    const order = orders.get(orderId);
    const p = { id: `pay_${++n}`, order_id: orderId, amount: amount ?? order.amount, currency, status, notes: order.notes };
    payments.set(p.id, p);
    const signature = crypto.createHmac("sha256", keys.keySecret).update(`${orderId}|${p.id}`).digest("hex");
    return { paymentId: p.id, signature, payment: p };
  };
  return { fetchImpl, pay, orders };
}

before(() => {
  if (!getApps().length) initializeApp({ projectId: "demo-runa-mitra" });
  db = getFirestore();
});

beforeEach(async () => {
  await fetch(`http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/demo-runa-mitra/databases/(default)/documents`, { method: "DELETE" });
});

describe("signatures", () => {
  test("checkout signature is checked with the key secret", () => {
    const sig = crypto.createHmac("sha256", "s").update("order_1|pay_1").digest("hex");
    assert.equal(verifyCheckoutSignature({ orderId: "order_1", paymentId: "pay_1", signature: sig }, "s"), true);
    assert.equal(verifyCheckoutSignature({ orderId: "order_1", paymentId: "pay_2", signature: sig }, "s"), false);
    assert.equal(verifyCheckoutSignature({ orderId: "order_1", paymentId: "pay_1", signature: "x" }, "s"), false);
  });
  test("webhook signature is checked over the raw body", () => {
    const sig = crypto.createHmac("sha256", "w").update('{"a":1}').digest("hex");
    assert.equal(verifyWebhookSignature('{"a":1}', sig, "w"), true);
    assert.equal(verifyWebhookSignature('{"a":2}', sig, "w"), false);
  });
});

describe("plan purchase", () => {
  test("price comes from the server; unknown or free plans are refused", async () => {
    const rzp = fakeRazorpay();
    const order = await startPlanOrder({ db, keys, uid: UID, planId: "regular", fetchImpl: rzp.fetchImpl });
    assert.equal(order.amount, PLANS.regular.pricePaise);
    assert.equal(rzp.orders.get(order.orderId).notes.uid, UID);
    await assert.rejects(startPlanOrder({ db, keys, uid: UID, planId: "simple", fetchImpl: rzp.fetchImpl }), /Unknown plan/);
    await assert.rejects(startPlanOrder({ db, keys, uid: UID, planId: "gold", fetchImpl: rzp.fetchImpl }), /Unknown plan/);
  });

  test("a verified payment activates the plan for 30 days", async () => {
    const rzp = fakeRazorpay();
    const { orderId } = await startPlanOrder({ db, keys, uid: UID, planId: "advanced", fetchImpl: rzp.fetchImpl });
    const { paymentId, signature } = rzp.pay(orderId);
    const result = await confirmPlanPayment({ db, keys, uid: UID, orderId, paymentId, signature, fetchImpl: rzp.fetchImpl });
    assert.equal(result.planId, "advanced");
    const sub = (await db.doc(`users/${UID}/subscription/current`).get()).data();
    assert.equal(effectivePlan(sub).id, "advanced");
    const days = (sub.currentPeriodEnd.toMillis() - Date.now()) / 86400000;
    assert.ok(days > 29.9 && days <= 30);
  });

  test("forged signature is rejected and nothing is activated", async () => {
    const rzp = fakeRazorpay();
    const { orderId } = await startPlanOrder({ db, keys, uid: UID, planId: "regular", fetchImpl: rzp.fetchImpl });
    const { paymentId } = rzp.pay(orderId);
    await assert.rejects(
      confirmPlanPayment({ db, keys, uid: UID, orderId, paymentId, signature: "0".repeat(64), fetchImpl: rzp.fetchImpl }),
      /could not be verified/
    );
    assert.equal((await db.doc(`users/${UID}/subscription/current`).get()).exists, false);
  });

  test("payment for a different amount is rejected", async () => {
    const rzp = fakeRazorpay();
    const { orderId } = await startPlanOrder({ db, keys, uid: UID, planId: "advanced", fetchImpl: rzp.fetchImpl });
    const { paymentId, signature } = rzp.pay(orderId, { amount: 100 });
    await assert.rejects(confirmPlanPayment({ db, keys, uid: UID, orderId, paymentId, signature, fetchImpl: rzp.fetchImpl }), /does not match/);
  });

  test("another account cannot claim someone else's order", async () => {
    const rzp = fakeRazorpay();
    const { orderId } = await startPlanOrder({ db, keys, uid: UID, planId: "regular", fetchImpl: rzp.fetchImpl });
    const { paymentId, signature } = rzp.pay(orderId);
    await assert.rejects(
      confirmPlanPayment({ db, keys, uid: "intruder", orderId, paymentId, signature, fetchImpl: rzp.fetchImpl }),
      /Order not found/
    );
  });

  test("authorized-only payments are captured before activation; failed ones are not activated", async () => {
    const rzp = fakeRazorpay();
    const a = await startPlanOrder({ db, keys, uid: UID, planId: "regular", fetchImpl: rzp.fetchImpl });
    const pa = rzp.pay(a.orderId, { status: "authorized" });
    const ok = await confirmPlanPayment({ db, keys, uid: UID, orderId: a.orderId, paymentId: pa.paymentId, signature: pa.signature, fetchImpl: rzp.fetchImpl });
    assert.equal(ok.planId, "regular");
    const b = await startPlanOrder({ db, keys, uid: "lenderB", planId: "regular", fetchImpl: rzp.fetchImpl });
    const pb = rzp.pay(b.orderId, { status: "failed" });
    await assert.rejects(
      confirmPlanPayment({ db, keys, uid: "lenderB", orderId: b.orderId, paymentId: pb.paymentId, signature: pb.signature, fetchImpl: rzp.fetchImpl }),
      /not complete/
    );
  });

  test("the same payment is never applied twice (checkout + webhook)", async () => {
    const rzp = fakeRazorpay();
    const { orderId } = await startPlanOrder({ db, keys, uid: UID, planId: "regular", fetchImpl: rzp.fetchImpl });
    const { paymentId, signature, payment } = rzp.pay(orderId);
    await confirmPlanPayment({ db, keys, uid: UID, orderId, paymentId, signature, fetchImpl: rzp.fetchImpl });
    const end1 = (await db.doc(`users/${UID}/subscription/current`).get()).data().currentPeriodEnd.toMillis();
    const again = await handleWebhookEvent({ db, event: { event: "payment.captured", payload: { payment: { entity: payment } } } });
    assert.equal(again.alreadyApplied, true);
    const end2 = (await db.doc(`users/${UID}/subscription/current`).get()).data().currentPeriodEnd.toMillis();
    assert.equal(end1, end2);
  });

  test("renewing the same plan extends from the current end date", async () => {
    const rzp = fakeRazorpay();
    for (let i = 0; i < 2; i += 1) {
      const { orderId } = await startPlanOrder({ db, keys, uid: UID, planId: "regular", fetchImpl: rzp.fetchImpl });
      const { paymentId } = rzp.pay(orderId);
      await activatePlan({ db, uid: UID, orderId, paymentId, source: "test" });
    }
    const sub = (await db.doc(`users/${UID}/subscription/current`).get()).data();
    const days = (sub.currentPeriodEnd.toMillis() - Date.now()) / 86400000;
    assert.ok(days > 59.9 && days <= 60);
  });

  test("webhook alone activates a paid order (app closed before confirming)", async () => {
    const rzp = fakeRazorpay();
    const { orderId } = await startPlanOrder({ db, keys, uid: UID, planId: "advanced", fetchImpl: rzp.fetchImpl });
    const { payment } = rzp.pay(orderId);
    const r = await handleWebhookEvent({ db, event: { event: "payment.captured", payload: { payment: { entity: payment } } } });
    assert.equal(r.planId, "advanced");
    const ignored = await handleWebhookEvent({ db, event: { event: "payment.failed", payload: { payment: { entity: payment } } } });
    assert.equal(ignored.ignored, true);
  });

  test("a dropped connection to Razorpay is retried", async () => {
    const rzp = fakeRazorpay();
    const { orderId } = await startPlanOrder({ db, keys, uid: UID, planId: "regular", fetchImpl: rzp.fetchImpl });
    const { paymentId, signature } = rzp.pay(orderId);
    let drops = 2;
    const flaky = async (url, init) => {
      if (drops > 0) {
        drops -= 1;
        throw new TypeError("fetch failed");
      }
      return rzp.fetchImpl(url, init);
    };
    const result = await confirmPlanPayment({ db, keys, uid: UID, orderId, paymentId, signature, fetchImpl: flaky });
    assert.equal(result.planId, "regular");
    assert.equal(drops, 0);
  });

  test("recovery activates a paid order whose confirmation never arrived", async () => {
    const rzp = fakeRazorpay();
    const { orderId } = await startPlanOrder({ db, keys, uid: UID, planId: "regular", fetchImpl: rzp.fetchImpl });
    rzp.pay(orderId); // paid at Razorpay, but the app never confirmed
    const unpaid = await startPlanOrder({ db, keys, uid: UID, planId: "advanced", fetchImpl: rzp.fetchImpl });
    const r = await reconcilePlanOrders({ db, keys, uid: UID, fetchImpl: rzp.fetchImpl });
    assert.equal(r.checked, 2);
    assert.equal(r.activated.length, 1);
    assert.equal(r.activated[0].orderId, orderId);
    const sub = (await db.doc(`users/${UID}/subscription/current`).get()).data();
    assert.equal(sub.planId, "regular");
    assert.equal((await db.doc(`users/${UID}/planPayments/${unpaid.orderId}`).get()).data().status, "created");
    const again = await reconcilePlanOrders({ db, keys, uid: UID, fetchImpl: rzp.fetchImpl });
    assert.equal(again.activated.length, 0); // already paid orders are not re-checked
  });

  test("recovery ignores failed or wrong-amount payments", async () => {
    const rzp = fakeRazorpay();
    const a = await startPlanOrder({ db, keys, uid: UID, planId: "regular", fetchImpl: rzp.fetchImpl });
    rzp.pay(a.orderId, { status: "failed" });
    rzp.pay(a.orderId, { amount: 100 });
    const r = await reconcilePlanOrders({ db, keys, uid: UID, fetchImpl: rzp.fetchImpl });
    assert.equal(r.activated.length, 0);
    assert.equal((await db.doc(`users/${UID}/subscription/current`).get()).exists, false);
  });

  test("expired or missing subscriptions fall back to the free plan", () => {
    assert.equal(effectivePlan(null).id, "simple");
    assert.equal(effectivePlan({ planId: "advanced", status: "active", currentPeriodEnd: Date.now() - 1000 }).id, "simple");
    assert.equal(effectivePlan({ planId: "advanced", status: "cancelled", currentPeriodEnd: Date.now() + 1e9 }).id, "simple");
    assert.equal(effectivePlan({ planId: "advanced", status: "active", currentPeriodEnd: Date.now() + 1e9 }).id, "advanced");
  });
});
