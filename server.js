const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./db');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: ['https://chvapps.in', 'http://localhost:3000'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('CHV Apps Backend is running');
});

app.post('/api/form-submissions', async (req, res) => {
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
    console.error(err);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

app.get('/api/form-submissions', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM form_submissions ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM categories');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

app.post('/api/categories', async (req, res) => {
  const { name, type } = req.body;
  try {
    await db.query(
      `INSERT INTO categories (name, type) VALUES ($1, $2)`,
      [name, type]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

app.get('/api/courses-internships', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM "courses-internships" ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

app.post('/api/courses-internships', async (req, res) => {
  const { name, type } = req.body;
  if (!name || !type) {
    return res.status(400).json({ success: false, message: 'Name and Type are required' });
  }
  try {
    await db.query(
      `INSERT INTO "courses-internships" (name, type) VALUES ($1, $2)`,
      [name, type]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running`);
});
