// Admin product + category CRUD (F9). All calls carry the admin JWT via authHeader().
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

// Products
export const adminListProducts = () => request('/admin/products');
export const adminCreateProduct = (data) => request('/admin/products', { method: 'POST', body: data });
export const adminUpdateProduct = (id, data) => request(`/admin/products/${id}`, { method: 'PUT', body: data });
export const adminSetProductActive = (id, active) => request(`/admin/products/${id}/active`, { method: 'PATCH', body: { active } });

export async function adminUploadImage(file) {
  const form = new FormData();
  form.append('image', file);
  const res = await fetch('/api/admin/products/image', { method: 'POST', headers: { ...authHeader() }, body: form });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Upload failed (${res.status})`);
  return json.url;
}

// Categories
export const adminCreateCategory = (name) => request('/admin/categories', { method: 'POST', body: { name } });
export const adminUpdateCategory = (id, name) => request(`/admin/categories/${id}`, { method: 'PUT', body: { name } });
export const adminDeleteCategory = (id) => request(`/admin/categories/${id}`, { method: 'DELETE' });
