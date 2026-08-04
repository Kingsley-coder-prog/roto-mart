// Seeds sample categories + products so the storefront has data before the
// admin adds real stock. Idempotent: skips anything whose id already exists.
// Run from backend/: node scripts/seed-samples.js
import 'dotenv/config';
import { batchGet, appendRow } from '../src/infra/sheets.js';

const categories = [
  { id: 'cat-farm', name: 'Farm Produce', slug: 'farm-produce' },
  { id: 'cat-confec', name: 'Confectioneries', slug: 'confectioneries' },
  { id: 'cat-hygiene', name: 'Hygiene', slug: 'hygiene' },
];

const now = new Date().toISOString();
const products = [
  { id: 'prod-001', name: 'Roll-on Deodorant', category: 'cat-hygiene', price: 2500, stock: 20, description: 'Long-lasting roll-on deodorant.', imageUrl: '', active: 'TRUE', createdAt: now },
  { id: 'prod-002', name: 'Bathing Soap (3-pack)', category: 'cat-hygiene', price: 1800, stock: 35, description: 'Gentle antibacterial soap, pack of 3.', imageUrl: '', active: 'TRUE', createdAt: now },
  { id: 'prod-003', name: 'Basket of Tomatoes', category: 'cat-farm', price: 7000, stock: 10, description: 'Fresh farm tomatoes, medium basket.', imageUrl: '', active: 'TRUE', createdAt: now },
  { id: 'prod-004', name: 'Chin-chin (500g)', category: 'cat-confec', price: 1500, stock: 25, description: 'Crunchy homemade chin-chin.', imageUrl: '', active: 'TRUE', createdAt: now },
  { id: 'prod-005', name: 'Discontinued Item', category: 'cat-confec', price: 999, stock: 0, description: 'Inactive sample — must NOT appear publicly.', imageUrl: '', active: 'FALSE', createdAt: now },
];

const existing = await batchGet(['Categories', 'Products']);
const have = (tab) => new Set(existing[tab].map((r) => r.id));

for (const c of categories) if (!have('Categories').has(c.id)) await appendRow('Categories', c);
for (const p of products) if (!have('Products').has(p.id)) await appendRow('Products', p);
console.log('Seed complete.');
