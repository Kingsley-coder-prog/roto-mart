// Raw Paystack HTTP client — no business logic (split %s live in modules/payments).
const BASE = 'https://api.paystack.co';

async function call(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.status === false) {
    const err = new Error(json.message || `Paystack ${path} failed (${res.status})`);
    err.status = 502;
    throw err;
  }
  return json.data;
}

/** POST /transaction/initialize → { authorization_url, access_code, reference } */
export const initializeTransaction = (payload) => call('POST', '/transaction/initialize', payload);

/** GET /transaction/verify/:reference → transaction data (status, amount, fees_split, ...) */
export const verifyTransaction = (reference) => call('GET', `/transaction/verify/${encodeURIComponent(reference)}`);
