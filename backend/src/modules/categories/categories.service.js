import crypto from 'node:crypto';
import { getRows, appendRow, updateRow, deleteRow } from '../../infra/sheets.js';

let cache = { data: null, at: 0 };
const TTL = 30_000;

export function invalidateCategoryCache() {
  cache = { data: null, at: 0 };
}

export async function listCategories() {
  if (!cache.data || Date.now() - cache.at > TTL) {
    const rows = await getRows('Categories');
    cache = { at: Date.now(), data: rows.map(({ _row, ...c }) => c) };
  }
  return cache.data;
}

// ---- Admin (F9) ------------------------------------------------------------

const bad = (msg) => { const e = new Error(msg); e.status = 400; return e; };
const slugify = (name) => name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export async function createCategory({ name }) {
  if (!name?.trim()) throw bad('Category name is required.');
  const category = { id: `cat-${crypto.randomBytes(3).toString('hex')}`, name: name.trim(), slug: slugify(name) };
  await appendRow('Categories', category);
  invalidateCategoryCache();
  return category;
}

async function rawCategoryRow(id) {
  const row = (await getRows('Categories')).find((r) => r.id === id);
  if (!row) { const e = new Error('Category not found'); e.status = 404; throw e; }
  return row;
}

/** Rename keeps the id stable so products referencing it don't break; slug follows the new name. */
export async function updateCategory(id, { name }) {
  if (!name?.trim()) throw bad('Category name is required.');
  const row = await rawCategoryRow(id);
  row.name = name.trim();
  row.slug = slugify(name);
  await updateRow('Categories', row);
  invalidateCategoryCache();
  const { _row, ...saved } = row;
  return saved;
}

/** Hard delete, but blocked while any product still references this category (no FK integrity in Sheets, §3). */
export async function deleteCategory(id) {
  const row = await rawCategoryRow(id);
  const inUse = (await getRows('Products')).some((p) => p.category === id);
  if (inUse) throw bad('This category still has products — move or remove them first.');
  await deleteRow('Categories', row._row);
  invalidateCategoryCache();
  return { id };
}
