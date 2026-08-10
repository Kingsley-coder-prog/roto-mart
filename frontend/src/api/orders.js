// Storefront calls for the orders module.
import { API_BASE } from './base.js';

async function request(path, options) {
  const res = await fetch(`${API_BASE}/api${path}`, options);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}

export const createOrder = (payload) =>
  request('/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
export const verifyOrder = (reference) => request(`/orders/verify/${encodeURIComponent(reference)}`);
export const trackOrder = (id) => request(`/orders/track/${encodeURIComponent(id)}`);
