import bcrypt from 'bcrypt';
import { query } from './db'; // Assuming you have the DB utility functions in this directory

export async function getUserByEmail(email) {
  const results = await query('SELECT * FROM "User Table" WHERE email = $1', [email]);
  return results.rows[0] || null;
}

export async function insertUser(email, password) {
  const hashedPassword = await bcrypt.hash(password, 12);
  const results = await query(
    'INSERT INTO "User Table" (email, password) VALUES ($1, $2) RETURNING *',
    [email, hashedPassword]
  );
  return results.rows[0] || null;
}
