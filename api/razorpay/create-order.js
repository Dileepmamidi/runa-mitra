import { adminAuth, adminDb } from "../_lib/firebaseAdmin.js";
import { readJson, requireUser, send, wrap } from "../_lib/http.js";
import { startPlanOrder } from "../_lib/planPayments.js";
import { razorpayKeys } from "../_lib/razorpay.js";

export default wrap(async (req, res) => {
  const uid = await requireUser(req, (t) => adminAuth().verifyIdToken(t));
  const { planId } = await readJson(req);
  const order = await startPlanOrder({ db: adminDb(), keys: razorpayKeys(), uid, planId });
  send(res, 200, order);
});
