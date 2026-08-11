// Single admin login (CLAUDE.md §2). The password is only ever compared against a
// bcrypt hash. The active hash comes from the Settings sheet if the admin has
// changed it (self-service, §5 handover); otherwise the env ADMIN_PASSWORD_HASH is
// the initial fallback. (Storing the hash — never plaintext — in a private Settings
// tab is the documented deviation that makes password change self-service.)
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getRows, appendRow, updateRow, ensureTab } from '../../infra/sheets.js';

const TOKEN_TTL = '12h';
const HASH_KEY = 'adminPasswordHash';

let hashCache = { value: null, at: 0 };
const HASH_TTL = 60_000;

async function activePasswordHash() {
  if (hashCache.value && Date.now() - hashCache.at < HASH_TTL) return hashCache.value;
  let stored = null;
  try {
    const rows = await getRows('Settings');
    stored = rows.find((r) => r.key === HASH_KEY)?.value || null;
  } catch { /* Settings tab may not exist yet — fall back to env */ }
  hashCache = { value: stored || process.env.ADMIN_PASSWORD_HASH || '', at: Date.now() };
  return hashCache.value;
}

export async function login(email, password) {
  const ok =
    typeof email === 'string' &&
    typeof password === 'string' &&
    email.trim().toLowerCase() === (process.env.ADMIN_EMAIL || '').toLowerCase() &&
    (await bcrypt.compare(password, await activePasswordHash()));
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

/** Self-service admin password change — verifies the current password, stores a new hash. */
export async function changePassword(currentPassword, newPassword) {
  const ok = await bcrypt.compare(currentPassword || '', await activePasswordHash());
  if (!ok) { const e = new Error('Current password is incorrect.'); e.status = 401; throw e; }
  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    const e = new Error('New password must be at least 8 characters.'); e.status = 400; throw e;
  }
  const newHash = bcrypt.hashSync(newPassword, 10);
  await ensureTab('Settings');
  const rows = await getRows('Settings');
  const existing = rows.find((r) => r.key === HASH_KEY);
  if (existing) { existing.value = newHash; await updateRow('Settings', existing); }
  else { await appendRow('Settings', { key: HASH_KEY, value: newHash }); }
  hashCache = { value: newHash, at: Date.now() };
}
