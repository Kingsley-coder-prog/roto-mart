// Google Sheets client — the ONLY file that talks to the Sheets API.
// Rows are exposed as objects keyed by the tab's header row; every returned
// row carries _row (its 1-based sheet row number) for updates/deletes.
// Batch endpoints are used throughout to respect the ~60 req/min quota.
import { google } from 'googleapis';

// Tab names + column order (must match CLAUDE.md §4)
export const TABS = {
  Products: ['id', 'name', 'category', 'price', 'stock', 'description', 'imageUrl', 'active', 'createdAt'],
  Categories: ['id', 'name', 'slug'],
  Orders: ['id', 'buyerName', 'buyerEmail', 'buyerPhone', 'buyerAddress', 'items', 'subtotal', 'total', 'paystackRef', 'status', 'createdAt'],
  Payouts: ['id', 'orderId', 'totalAmount', 'developerShare', 'adminShare', 'paystackSplitRef', 'date'],
};

let api; // lazy singleton so dotenv loads before env vars are read
function sheets() {
  if (!api) {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    api = google.sheets({ version: 'v4', auth });
  }
  return api;
}
const sheetId = () => process.env.GOOGLE_SHEET_ID;

function toObjects(tab, values = []) {
  const headers = TABS[tab];
  // values[0] is the header row; data starts at sheet row 2
  return values.slice(1).map((row, i) => {
    const obj = { _row: i + 2 };
    headers.forEach((h, c) => (obj[h] = row[c] ?? ''));
    return obj;
  });
}

const toRowArray = (tab, obj) => TABS[tab].map((h) => obj[h] ?? '');

/** Read all rows of one tab as objects. */
export async function getRows(tab) {
  const res = await sheets().spreadsheets.values.get({ spreadsheetId: sheetId(), range: tab });
  return toObjects(tab, res.data.values);
}

/** Read several tabs in ONE api call: batchGet(['Products','Categories']) → { Products: [...], ... } */
export async function batchGet(tabs) {
  const res = await sheets().spreadsheets.values.batchGet({ spreadsheetId: sheetId(), ranges: tabs });
  return Object.fromEntries(tabs.map((tab, i) => [tab, toObjects(tab, res.data.valueRanges[i].values)]));
}

/** Append one row (never overwrites — safe under concurrency, see CLAUDE.md §3). */
export async function appendRow(tab, obj) {
  await sheets().spreadsheets.values.append({
    spreadsheetId: sheetId(),
    range: tab,
    valueInputOption: 'RAW',
    requestBody: { values: [toRowArray(tab, obj)] },
  });
}

/** Overwrite the row at obj._row (or explicit rowNumber) with obj's values. */
export async function updateRow(tab, obj, rowNumber = obj._row) {
  await sheets().spreadsheets.values.update({
    spreadsheetId: sheetId(),
    range: `${tab}!A${rowNumber}`,
    valueInputOption: 'RAW',
    requestBody: { values: [toRowArray(tab, obj)] },
  });
}

let gidCache; // tab title → numeric sheetId, needed for structural ops
async function tabGid(tab) {
  if (!gidCache) {
    const res = await sheets().spreadsheets.get({ spreadsheetId: sheetId(), fields: 'sheets.properties' });
    gidCache = Object.fromEntries(res.data.sheets.map((s) => [s.properties.title, s.properties.sheetId]));
  }
  if (gidCache[tab] === undefined) throw new Error(`Tab "${tab}" not found in spreadsheet`);
  return gidCache[tab];
}

/** Physically remove a row (hard delete — only Categories ever uses this). */
export async function deleteRow(tab, rowNumber) {
  await sheets().spreadsheets.batchUpdate({
    spreadsheetId: sheetId(),
    requestBody: {
      requests: [{
        deleteDimension: {
          range: { sheetId: await tabGid(tab), dimension: 'ROWS', startIndex: rowNumber - 1, endIndex: rowNumber },
        },
      }],
    },
  });
}

/** One-time/idempotent: write the header row of every tab (row 1 only). */
export async function ensureHeaders() {
  await sheets().spreadsheets.values.batchUpdate({
    spreadsheetId: sheetId(),
    requestBody: {
      valueInputOption: 'RAW',
      data: Object.entries(TABS).map(([tab, headers]) => ({ range: `${tab}!A1`, values: [headers] })),
    },
  });
}
