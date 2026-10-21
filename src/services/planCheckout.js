// Razorpay Checkout for lender plans. The app only opens Checkout; the payment
// server creates the order (with the price from src/config/plans.js) and
// verifies the payment before the plan is activated.
import { auth } from "../config/firebase";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

let scriptPromise = null;
function loadCheckout() {
  if (window.Razorpay) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = CHECKOUT_SRC;
      s.onload = () => resolve();
      s.onerror = () => {
        scriptPromise = null;
        reject(Object.assign(new Error("checkout_unavailable"), { code: "checkout_unavailable" }));
      };
      document.body.appendChild(s);
    });
  }
  return scriptPromise;
}

async function post(path, body) {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw Object.assign(new Error("signed_out"), { code: "signed_out" });
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body)
    });
  } catch {
    throw Object.assign(new Error("network"), { code: "network" });
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || "server"), { code: res.status === 503 ? "not_configured" : "server", status: res.status });
  return data;
}

/**
 * Opens Razorpay Checkout for a plan. Resolves with the server's activation
 * result; rejects with { code: "dismissed" | "failed" | "network" | ... }.
 */
export async function buyPlan({ planId, description, prefillName, prefillContact }) {
  const [order] = await Promise.all([post("/api/razorpay/create-order", { planId }), loadCheckout()]);
  return new Promise((resolve, reject) => {
    const checkout = new window.Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      order_id: order.orderId,
      name: "Runa Mitra",
      description,
      prefill: { name: prefillName || "", contact: prefillContact || "" },
      theme: { color: "#13775e" },
      handler: async (response) => {
        try {
          resolve(await post("/api/razorpay/verify", response));
        } catch (err) {
          // Money may have been taken even though confirming failed (for
          // example a dropped connection). Ask the server to check with
          // Razorpay directly before reporting an error.
          try {
            const recovered = await reconcilePlans();
            const hit = recovered.activated?.find((a) => a.orderId === order.orderId);
            if (hit) return resolve(hit);
          } catch {
            /* fall through to the original error */
          }
          reject(err);
        }
      },
      modal: { ondismiss: () => reject(Object.assign(new Error("dismissed"), { code: "dismissed" })) }
    });
    checkout.on("payment.failed", (resp) =>
      reject(Object.assign(new Error(resp?.error?.description || "failed"), { code: "failed" }))
    );
    checkout.open();
  });
}

/** Server checks recent unfinished orders with Razorpay and activates any that were paid. */
export function reconcilePlans() {
  return post("/api/razorpay/reconcile", {});
}

export const isTestKey = (keyId) => String(keyId || "").startsWith("rzp_test_");
