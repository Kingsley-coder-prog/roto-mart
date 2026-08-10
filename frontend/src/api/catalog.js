// Storefront calls for the products + categories modules.
import { API_BASE } from './base.js';

async function get(path) {
  const res = await fetch(`${API_BASE}/api${path}`);
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Request failed (${res.status})`);
  return res.json();
}

export const fetchProducts = () => get('/products');
export const fetchProduct = (id) => get(`/products/${id}`);
export const fetchCategories = () => get('/categories');
