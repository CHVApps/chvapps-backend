import db from '../paymentsDb.js';
import RazorpayService from '../utils/razorpayService.js';

export const config = {
  api: {
    bodyParser: false
  }
};

async function readRawBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks).toString('utf8');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const signature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const bodyRaw = await readRawBody(req);

    const razorpay = new RazorpayService();

    const isValid = razorpay.verifyWebhookSignature({
      bodyRaw,
      signature,
      secret: webhookSecret
    });

    if (!isValid) {
      return res.status(400).json({ message: 'Invalid webhook signature' });
    }

    const payload = JSON.parse(bodyRaw || '{}');
    const eventId = payload?.payload?.payment?.entity?.id || payload?.id || null;
    const eventType = payload?.event || null;

    if (eventId && eventType) {
      await db.query(
        `INSERT INTO razorpay_webhook_events (event_id, event_type, payload)
         VALUES ($1, $2, $3)
         ON CONFLICT (event_id) DO NOTHING`,
        [eventId, eventType, JSON.stringify(payload)]
      );
    }

    const paymentEntity = payload?.payload?.payment?.entity || null;

    if (paymentEntity?.order_id) {
      const normalizedStatus =
        String(paymentEntity.status || '').toUpperCase() === 'CAPTURED'
          ? 'PAID'
          : String(paymentEntity.status || '').toUpperCase() === 'FAILED'
          ? 'FAILED'
          : null;

      await db.query(
        `UPDATE payments
         SET razorpay_payment_id = COALESCE($2, razorpay_payment_id),
             status = COALESCE($3, status),
             method = COALESCE($4, method),
             email = COALESCE($5, email),
             phone = COALESCE($6, phone),
             updated_at = CURRENT_TIMESTAMP
         WHERE razorpay_order_id = $1`,
        [
          paymentEntity.order_id,
          paymentEntity.id || null,
          normalizedStatus,
          paymentEntity.method || null,
          paymentEntity.email || null,
          paymentEntity.contact || null
        ]
      );

      if (normalizedStatus === 'PAID' || normalizedStatus === 'FAILED') {
        const paymentRow = await db.query(
          `SELECT enrollment_id
           FROM payments
           WHERE razorpay_order_id = $1`,
          [paymentEntity.order_id]
        );

        if (paymentRow.rowCount) {
          await db.query(
            `UPDATE course_enrollments
             SET status = $2,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $1
               AND status <> 'PAID'`,
            [paymentRow.rows[0].enrollment_id, normalizedStatus]
          );
        }
      }
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(200).json({ ok: true });
  }
}