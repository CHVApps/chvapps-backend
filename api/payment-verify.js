import db from '../paymentsDb.js';
import { allowCors } from '../utils/cors.js';
import RazorpayService from '../utils/razorpayService.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        message: 'razorpay_order_id, razorpay_payment_id, razorpay_signature are required'
      });
    }

    const razorpay = new RazorpayService();

    const isValid = razorpay.verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature
    });

    const paymentStatus = isValid ? 'PAID' : 'FAILED';

    const paymentUpdate = await db.query(
      `UPDATE payments
       SET razorpay_payment_id = $2,
           razorpay_signature = $3,
           status = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE razorpay_order_id = $1
       RETURNING enrollment_id`,
      [razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentStatus]
    );

    if (!paymentUpdate.rowCount) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    const enrollmentId = paymentUpdate.rows[0].enrollment_id;

    await db.query(
      `UPDATE course_enrollments
       SET status = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [enrollmentId, paymentStatus]
    );

    return res.status(200).json({
      ok: isValid,
      status: paymentStatus,
      enrollment_id: enrollmentId
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Failed to verify payment'
    });
  }
}

export default allowCors(handler);