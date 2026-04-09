import db from '../paymentsDb.js';
import { allowCors } from '../utils/cors.js';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const result = await db.query(
      `SELECT
        p.id AS payment_row_id,
        ce.id AS enrollment_id,
        ce.full_name,
        ce.mobile,
        ce.email,
        ce.course_name,
        ce.amount,
        ce.currency,
        ce.status AS enrollment_status,
        p.razorpay_order_id,
        p.razorpay_payment_id,
        p.razorpay_signature,
        p.amount_paise,
        p.status AS payment_status,
        p.method,
        p.phone,
        p.notes,
        ce.created_at,
        ce.updated_at
      FROM course_enrollments ce
      LEFT JOIN payments p ON p.enrollment_id = ce.id
      ORDER BY ce.created_at DESC`
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Failed to fetch payment records'
    });
  }
}

export default allowCors(handler);