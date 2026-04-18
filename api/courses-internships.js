import db from '../db';
import { allowCors } from '../utils/cors';

async function handler(req, res) {
  if (req.method === 'POST') {
    const { name, type } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: 'Name and type are required'
      });
    }

    try {
      await db.query(
        `INSERT INTO courses_internships (name, type) VALUES ($1, $2)`,
        [name, type]
      );

      return res.status(201).json({
        success: true
      });
    } catch (err) {
      console.error('courses-internships POST error:', err);
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
        'SELECT * FROM courses_internships ORDER BY id DESC'
      );

      return res.status(200).json(result.rows);
    } catch (err) {
      console.error('courses-internships GET error:', err);
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