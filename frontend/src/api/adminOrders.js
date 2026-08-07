// Admin orders + payouts (F10). All calls carry the admin JWT via authHeader().
import { authHeader } from './auth.js';

async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}

export const adminListOrders = () => request('/admin/orders');
export const updateOrderStatus = (id, status) => request(`/admin/orders/${id}/status`, { method: 'PATCH', body: { status } });
export const adminListPayouts = () => request('/admin/payouts');
