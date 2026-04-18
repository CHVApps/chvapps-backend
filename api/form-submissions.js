import db from '../db';
import { allowCors } from '../utils/cors';

async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const body =
        typeof req.body === 'string'
          ? JSON.parse(req.body)
          : (req.body || {});

      const {
        name,
        email,
        mobile_number,
        type,
        subject,
        internship,
        course,
        message
      } = body;

      if (!name || !email || !mobile_number || !type || !subject || !message) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      const result = await db.query(
        `INSERT INTO form_submissions
        (name, email, mobile_number, type, subject, internship, course, message)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id`,
        [name, email, mobile_number, type, subject, internship, course, message]
      );

      return res.status(201).json({
        success: true,
        id: result.rows[0].id
      });
    } catch (err) {
      console.error('form-submissions POST error:', err);
      return res.status(500).json({
        success: false,
        message: 'Database error',
        error: err.message
      });
    }
  }

  if (req.method === 'GET') {
    try {
      const result = await db.query(
        'SELECT * FROM form_submissions ORDER BY id DESC'
      );

      return res.status(200).json(result.rows);
    } catch (err) {
      console.error('form-submissions GET error:', err);
      return res.status(500).json({
        success: false,
        message: 'Database error',
        error: err.message
      });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'OPTIONS']);
  return res.status(405).json({
    success: false,
    message: `Method ${req.method} Not Allowed`
  });
}

export default allowCors(handler);