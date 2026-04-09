import db from '../paymentsDb.js';
import { allowCors } from '../utils/cors.js';
import RazorpayService from '../utils/razorpayService.js';

const COURSE_NAME = 'Internship Program';
const COURSE_FEE = 7000;

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    if (!process.env.DATABASE_URL_PAYMENTS) {
      return res.status(500).json({ message: 'Payments database is not configured' });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ message: 'Razorpay credentials are not configured' });
    }

    const { full_name, mobile, email } = req.body || {};

    const name = String(full_name || '').trim();
    const phone = String(mobile || '').trim();
    const mail = String(email || '').trim().toLowerCase();
    const course = COURSE_NAME;

    if (!name || !phone || !mail) {
      return res.status(400).json({ message: 'full_name, mobile, email are required' });
    }

    if (!/^[A-Za-z ]{2,150}$/.test(name)) {
      return res.status(400).json({ message: 'Invalid full name' });
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ message: 'Invalid mobile number' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
      return res.status(400).json({ message: 'Invalid email address' });
    }

    const amount = Number(COURSE_FEE);

    const enrollmentResult = await db.query(
      `INSERT INTO course_enrollments (full_name, mobile, email, course_name, amount, currency, status)
       VALUES ($1, $2, $3, $4, $5, 'INR', 'PENDING')
       RETURNING id, full_name, mobile, email, course_name, amount, currency, status, created_at`,
      [name, phone, mail, course, amount]
    );

    const enrollment = enrollmentResult.rows[0];

    const razorpay = new RazorpayService();

    const order = await razorpay.createOrder({
      amountPaise: Math.round(amount * 100),
      currency: 'INR',
      receipt: String(enrollment.id),
      notes: {
        enrollment_id: String(enrollment.id),
        course_name: course,
        full_name: name,
        email: mail,
        mobile: phone
      }
    });

    await db.query(
      `INSERT INTO payments (
        enrollment_id,
        razorpay_order_id,
        amount_paise,
        currency,
        status,
        email,
        phone,
        notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        enrollment.id,
        order.id,
        order.amount,
        order.currency,
        String(order.status || 'created').toUpperCase(),
        mail,
        phone,
        JSON.stringify(order.notes || {})
      ]
    );

    return res.status(200).json({
      key_id: process.env.RAZORPAY_KEY_ID,
      enrollment_id: enrollment.id,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      course_name: enrollment.course_name,
      full_name: enrollment.full_name,
      email: enrollment.email,
      mobile: enrollment.mobile
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Failed to create payment order'
    });
  }
}

export default allowCors(handler);