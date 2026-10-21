// Recovery check for paid plan orders that were not confirmed (see
// reconcilePlanOrders). Safe to call any time; it never charges anyone.
import { adminDb } from "../_lib/firebaseAdmin.js";
import { verifyFirebaseIdToken } from "../_lib/verifyToken.js";
import { requireUser, send, wrap } from "../_lib/http.js";
import { reconcilePlanOrders } from "../_lib/planPayments.js";
import { razorpayKeys } from "../_lib/razorpay.js";

export default wrap(async (req, res) => {
  const uid = await requireUser(req, (t) => verifyFirebaseIdToken(t));
  const result = await reconcilePlanOrders({ db: adminDb(), keys: razorpayKeys(), uid });
  send(res, 200, result);
});
