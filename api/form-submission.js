import db from '../db';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { name, email, mobile_number, type, subject, internship, course, message } = req.body;

    try {
      const result = await db.query(
        `INSERT INTO form_submissions 
        (name, email, mobile_number, type, subject, internship, course, message) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [name, email, mobile_number, type, subject, internship, course, message]
      );
      res.status(201).json({ success: true, id: result.rows[0].id });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Database error' });
    }
  } else if (req.method === 'GET') {
    try {
      const result = await db.query('SELECT * FROM form_submissions ORDER BY id DESC');
      res.status(200).json(result.rows);
    } catch (err) {
      res.status(500).json({ success: false, message: 'Database error' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
