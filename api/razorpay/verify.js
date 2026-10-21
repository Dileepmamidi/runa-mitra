import { adminDb } from "../_lib/firebaseAdmin.js";
import { verifyFirebaseIdToken } from "../_lib/verifyToken.js";
import { readJson, requireUser, send, wrap } from "../_lib/http.js";
import { confirmPlanPayment } from "../_lib/planPayments.js";
import { razorpayKeys } from "../_lib/razorpay.js";

export default wrap(async (req, res) => {
  const uid = await requireUser(req, (t) => verifyFirebaseIdToken(t));
  const body = await readJson(req);
  const result = await confirmPlanPayment({
    db: adminDb(),
    keys: razorpayKeys(),
    uid,
    orderId: body.razorpay_order_id,
    paymentId: body.razorpay_payment_id,
    signature: body.razorpay_signature
  });
  send(res, 200, result);
});
