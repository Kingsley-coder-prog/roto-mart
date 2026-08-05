// Single admin login (CLAUDE.md §2). Credentials live in env, never in Sheets;
// the password is only ever compared against its bcrypt hash.
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const TOKEN_TTL = '12h';

export async function login(email, password) {
  const ok =
    typeof email === 'string' &&
    typeof password === 'string' &&
    email.trim().toLowerCase() === (process.env.ADMIN_EMAIL || '').toLowerCase() &&
    (await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH || ''));
  if (!ok) {
    const err = new Error('Invalid email or password.');
    err.status = 401;
    throw err;
  }
  const token = jwt.sign({ role: 'admin', email: process.env.ADMIN_EMAIL }, process.env.JWT_SECRET, { expiresIn: TOKEN_TTL });
  return { token };
}

export function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET); // throws if invalid/expired
}
