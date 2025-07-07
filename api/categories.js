import db from '../db';
import { allowCors } from '../utils/cors';

async function handler(req, res) {
  if (req.method === 'POST') {
    const { name, type } = req.body;
    try {
      await db.query(`INSERT INTO categories (name, type) VALUES ($1, $2)`, [name, type]);
      res.status(201).json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Database error' });
    }
  } else if (req.method === 'GET') {
    try {
      const result = await db.query('SELECT * FROM categories');
      res.status(200).json(result.rows);
    } catch (err) {
      res.status(500).json({ success: false, message: 'Database error' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export default allowCors(handler);
