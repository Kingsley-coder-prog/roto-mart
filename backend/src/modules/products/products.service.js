import crypto from 'node:crypto';
import { getRows, appendRow, updateRow } from '../../infra/sheets.js';

// 30s cache: storefront traffic must not burn the ~60 req/min Sheets quota.
let cache = { data: null, at: 0 };
const TTL = 30_000;

export function invalidateProductCache() {
  cache = { data: null, at: 0 };
}

async function allProducts() {
  if (!cache.data || Date.now() - cache.at > TTL) {
    const rows = await getRows('Products');
    cache = {
      at: Date.now(),
      data: rows.map((r) => ({
        id: r.id,
        name: r.name,
        category: r.category,
        price: Number(r.price),
        stock: Number(r.stock),
        description: r.description,
        imageUrl: r.imageUrl,
        active: r.active === 'TRUE',
        _row: r._row,
      })),
    };
  }
  return cache.data;
}

/** Public list: active products only, without sheet internals. */
export async function listActive() {
  return (await allProducts()).filter((p) => p.active).map(({ _row, active, ...pub }) => pub);
}

export async function getActiveById(id) {
  return (await listActive()).find((p) => p.id === id) || null;
}

// ---- Admin (F9) ------------------------------------------------------------

const bad = (msg) => { const e = new Error(msg); e.status = 400; return e; };

/** Admin list: all products incl. inactive, without sheet internals. */
export async function listAllProducts() {
  return (await allProducts()).map(({ _row, ...p }) => p);
}

function validateProduct({ name, category, price, stock }) {
  if (!name?.trim()) throw bad('Product name is required.');
  if (!category?.trim()) throw bad('Please choose a category.');
  if (!(Number(price) >= 0)) throw bad('Price must be a number (₦0 or more).');
  if (!Number.isInteger(Number(stock)) || Number(stock) < 0) throw bad('Stock must be a whole number (0 or more).');
}

export async function createProduct(data) {
  validateProduct(data);
  const product = {
    id: `prod-${crypto.randomBytes(4).toString('hex')}`,
    name: data.name.trim(),
    category: data.category.trim(),
    price: Number(data.price),
    stock: Number(data.stock),
    description: (data.description || '').trim(),
    imageUrl: (data.imageUrl || '').trim(),
    active: data.active === false ? 'FALSE' : 'TRUE',
    createdAt: new Date().toISOString(),
  };
  await appendRow('Products', product);
  invalidateProductCache();
  return { ...product, active: product.active === 'TRUE' };
}

/** Fetch the raw sheet row (with _row) for a product id, or throw 404. */
async function rawProductRow(id) {
  const row = (await getRows('Products')).find((r) => r.id === id);
  if (!row) { const e = new Error('Product not found'); e.status = 404; throw e; }
  return row;
}

export async function updateProduct(id, data) {
  validateProduct(data);
  const row = await rawProductRow(id);
  Object.assign(row, {
    name: data.name.trim(),
    category: data.category.trim(),
    price: Number(data.price),
    stock: Number(data.stock),
    description: (data.description ?? row.description ?? '').trim(),
    imageUrl: (data.imageUrl ?? row.imageUrl ?? '').trim(),
    active: data.active === false ? 'FALSE' : 'TRUE',
  });
  await updateRow('Products', row);
  invalidateProductCache();
  const { _row, ...saved } = row;
  return { ...saved, price: Number(saved.price), stock: Number(saved.stock), active: saved.active === 'TRUE' };
}

/** Soft-delete / restore (§5): flip active instead of removing, keeping order history intact. */
export async function setProductActive(id, active) {
  const row = await rawProductRow(id);
  row.active = active ? 'TRUE' : 'FALSE';
  await updateRow('Products', row);
  invalidateProductCache();
  return { id, active };
}
