// One-time setup: writes header rows to all tabs and prints current row counts.
// Run from backend/: node scripts/setup-sheets.js
import 'dotenv/config';
import { ensureHeaders, batchGet, TABS } from '../src/infra/sheets.js';

await ensureHeaders();
const data = await batchGet(Object.keys(TABS));
for (const [tab, rows] of Object.entries(data)) console.log(`${tab}: headers OK, ${rows.length} data rows`);
