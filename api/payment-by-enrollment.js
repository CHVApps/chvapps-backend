import db from '../db.js';
import { allowCors } from '../utils/cors.js';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { enrollment_id } = req.query || {};

    if (!enrollment_id) {
      return res.status(400).json({ message: 'enrollment_id is required' });
    }

    const enrollmentResult = await db.query(
      `SELECT *
       FROM course_enrollments
       WHERE id = $1`,
      [enrollment_id]
    );

    if (!enrollmentResult.rowCount) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    const paymentsResult = await db.query(
      `SELECT *
       FROM payments
       WHERE enrollment_id = $1
       ORDER BY created_at DESC`,
      [enrollment_id]
    );

    return res.status(200).json({
      enrollment: enrollmentResult.rows[0],
      payments: paymentsResult.rows
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Failed to fetch payment details'
    });
  }
}

export default allowCors(handler);