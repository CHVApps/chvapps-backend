import db from '../paymentsDb.js';
import { allowCors } from '../utils/cors.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { enrollment_id } = req.body || {};

    if (!enrollment_id) {
      return res.status(400).json({ message: 'enrollment_id is required' });
    }

    await db.query(
      `UPDATE payments
       SET status = 'FAILED',
           updated_at = CURRENT_TIMESTAMP
       WHERE enrollment_id = $1
         AND status <> 'PAID'`,
      [enrollment_id]
    );

    const enrollmentUpdate = await db.query(
      `UPDATE course_enrollments
       SET status = 'FAILED',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
         AND status <> 'PAID'
       RETURNING id, status`,
      [enrollment_id]
    );

    if (!enrollmentUpdate.rowCount) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    return res.status(200).json({
      id: enrollmentUpdate.rows[0].id,
      status: enrollmentUpdate.rows[0].status
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Failed to mark payment as failed'
    });
  }
}

export default allowCors(handler);