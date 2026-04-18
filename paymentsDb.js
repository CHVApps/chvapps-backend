import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const paymentDb = new Pool({
  connectionString: process.env.DATABASE_URL_PAYMENTS,
  ssl: {
    rejectUnauthorized: false
  }
});

export default paymentDb;