import db from '../db';
import { allowCors } from '../utils/cors';

async function handler(req, res) {
  if (req.method === 'POST') {
    const { name, email, mobile_number, type, subject, internship, course, message } = req.body;
    try {
      const result = await db.query(
        `INSERT INTO form_submissions (name, email, mobile_number, type, subject, internship, course, message) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [name, email, mobile_number, type, subject, internship, course, message]
      );
      res.status(201).json({ success: true, id: result.rows[0].id });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Database error' });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}

export default allowCors(handler);
