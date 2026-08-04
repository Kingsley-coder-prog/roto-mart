import { getRows } from '../../infra/sheets.js';

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
