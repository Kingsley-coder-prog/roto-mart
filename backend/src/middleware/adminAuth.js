// Guards admin routes: requires a valid Bearer JWT (issued by modules/auth).
import { verifyToken } from '../modules/auth/auth.service.js';

export function adminAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentication required.' });
  try {
    req.admin = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Session expired — please log in again.' });
  }
}
