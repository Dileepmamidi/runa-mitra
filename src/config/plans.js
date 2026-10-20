// Lender plans. One place to change prices, limits and features — used by the
// app (to show plans and gate features) and by the payment server (to decide
// the amount to charge), so the price can never come from the client.
//
// Borrower protection is never paywalled: borrowers' access to their loan
// terms, payments, receipts, documents, requests for more time and questions
// is free on every plan.

export const PLAN_PERIOD_DAYS = 30;

export const PLANS = {
  simple: {
    id: "simple",
    pricePaise: 0,
    borrowerLimit: 3,
    features: []
  },
  regular: {
    id: "regular",
    pricePaise: 9900,
    borrowerLimit: 50,
    features: ["guarantors", "analytics", "csvExport", "familyAccess", "reminders"]
  },
  advanced: {
    id: "advanced",
    pricePaise: 24900,
    borrowerLimit: null, // unlimited
    features: ["guarantors", "analytics", "csvExport", "familyAccess", "reminders", "ocr", "advancedAnalytics"]
  }
};

export const PAID_PLAN_IDS = ["regular", "advanced"];

/** Lowest plan that includes a feature (for "available on …" hints). */
export function planForFeature(feature) {
  return ["simple", "regular", "advanced"].find((id) => PLANS[id].features.includes(feature)) || null;
}

const toMillis = (value) => {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  if (typeof value === "string") return Date.parse(value) || 0;
  if (typeof value.seconds === "number") return value.seconds * 1000;
  return 0;
};

/**
 * The plan in force for a subscription document written by the payment
 * server (users/{uid}/subscription/current). Anything missing, expired or
 * unknown means the free Simple plan.
 */
export function effectivePlan(subscription, now = Date.now()) {
  const id = subscription?.planId;
  if (!id || !PLANS[id] || subscription.status !== "active") return PLANS.simple;
  if (toMillis(subscription.currentPeriodEnd) <= now) return PLANS.simple;
  return PLANS[id];
}

export function planHasFeature(plan, feature) {
  return Boolean(plan?.features?.includes(feature));
}

/** Can another active borrower be added under this plan? */
export function canAddBorrower(plan, activeBorrowerCount) {
  return plan.borrowerLimit === null || activeBorrowerCount < plan.borrowerLimit;
}

/** New period end when a payment is applied: extends from the later of now or the current end. */
export function nextPeriodEnd(currentPeriodEnd, now = Date.now()) {
  const start = Math.max(now, toMillis(currentPeriodEnd));
  return start + PLAN_PERIOD_DAYS * 86400000;
}
