import { getRows } from '../../infra/sheets.js';

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
