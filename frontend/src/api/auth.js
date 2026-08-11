// Admin auth calls. authHeader() is reused by other admin API modules (F9/F10).
import { useAdminStore } from '../stores/admin.js';
import { API_BASE } from './base.js';

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Login failed (${res.status})`);
  return json; // { token }
}

export async function fetchMe(token) {
  const res = await fetch(`${API_BASE}/api/admin/me`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Not authenticated');
  return res.json();
}

/** Authorization header for guarded admin requests; empty object if logged out. */
export function authHeader() {
  const token = useAdminStore().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function changePassword(currentPassword, newPassword) {
  const res = await fetch(`${API_BASE}/api/admin/password`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}
