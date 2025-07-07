export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*'); // or set to https://chvapps.in for stricter security
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

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
