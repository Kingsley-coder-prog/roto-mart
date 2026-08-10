import crypto from 'node:crypto';
import { getRows, appendRow, updateRow } from '../../infra/sheets.js';
import { listActive, invalidateProductCache } from '../products/products.service.js';
import { initPayment, verifyPayment } from '../payments/payments.service.js';
import { sendOrderConfirmation, sendStatusUpdate } from '../notifications/notifications.service.js';

const bad = (msg) => { const e = new Error(msg); e.status = 400; return e; };

/**
 * Create an order from client-sent { id, qty } items. Prices and totals are
 * recomputed from the Products sheet here — the client's cart carries stale
 * snapshots and is never trusted for amounts (CLAUDE.md §12 F6).
 * Row is appended (pending_payment) BEFORE Paystack init: a failed init leaves
 * a harmless pending row; the reverse could take money for an unrecorded order.
 */
export async function createOrder({ name, email, phone, address, items }) {
  if (!name?.trim() || !email?.trim() || !phone?.trim() || !address?.trim()) {
    throw bad('Name, email, phone and address are required.');
  }
  if (!Array.isArray(items) || items.length === 0) throw bad('Cart is empty.');

  const catalog = await listActive();
  const lines = items.map(({ id, qty }) => {
    const p = catalog.find((c) => c.id === id);
    if (!p) throw bad('An item in your cart is no longer available.');
    const n = Math.floor(Number(qty));
    if (!Number.isFinite(n) || n < 1) throw bad(`Invalid quantity for ${p.name}.`);
    if (n > p.stock) throw bad(`Only ${p.stock} left of ${p.name} — please adjust your cart.`);
    return { id: p.id, name: p.name, price: p.price, qty: n };
  });

  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const total = subtotal; // no delivery fee for now (§11 open decision)
  const orderId = `RM-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`.toUpperCase();

  await appendRow('Orders', {
    id: orderId,
    buyerName: name.trim(),
    buyerEmail: email.trim(),
    buyerPhone: phone.trim(),
    buyerAddress: address.trim(),
    items: JSON.stringify(lines),
    subtotal,
    total,
    paystackRef: orderId, // order id doubles as the Paystack reference
    status: 'pending_payment',
    createdAt: new Date().toISOString(),
    archived: 'FALSE',
  });

  const { authorizationUrl } = await initPayment({ email: email.trim(), totalNaira: total, reference: orderId });
  return { orderId, authorizationUrl };
}

const publicView = (order) => ({
  orderId: order.id,
  status: order.status,
  items: JSON.parse(order.items || '[]'),
  subtotal: Number(order.subtotal),
  total: Number(order.total),
  createdAt: order.createdAt,
});

/**
 * Verify a payment with Paystack, then finalize: mark paid, decrement stock,
 * log the payout split. Idempotent — an already-finalized order returns as-is.
 */
export async function verifyOrder(reference) {
  const orders = await getRows('Orders');
  const order = orders.find((o) => o.paystackRef === reference);
  if (!order) { const e = new Error('Order not found'); e.status = 404; throw e; }

  if (order.status !== 'pending_payment') return { ...publicView(order), paid: order.status !== 'cancelled' };

  const result = await verifyPayment(reference, Number(order.total));
  if (!result.paid) return { ...publicView(order), paid: false, gatewayStatus: result.gatewayStatus };

  order.status = 'paid';
  await updateRow('Orders', order);

  const lines = JSON.parse(order.items || '[]');
  const products = await getRows('Products');
  for (const line of lines) {
    const p = products.find((row) => row.id === line.id);
    if (!p) continue;
    p.stock = String(Math.max(0, Number(p.stock) - line.qty));
    await updateRow('Products', p);
  }
  invalidateProductCache();

  await appendRow('Payouts', {
    id: `PO-${order.id}`,
    orderId: order.id,
    totalAmount: Number(order.total),
    developerShare: result.developerShare,
    adminShare: result.adminShare,
    paystackSplitRef: reference,
    date: new Date().toISOString(),
  });

  const view = { ...publicView(order), status: 'paid', paid: true };
  sendOrderConfirmation(order.buyerEmail, view); // fire-and-forget (§6a)
  return view;
}

/** Public tracking endpoint — non-sensitive fields only (no buyer contact details). */
export async function trackOrder(id) {
  const orders = await getRows('Orders');
  const order = orders.find((o) => o.id === id);
  return order ? publicView(order) : null;
}

// ---- Admin (F10) -----------------------------------------------------------

// Full order incl. buyer contact details (admin needs them to fulfill/deliver).
const adminView = (o) => ({
  id: o.id,
  buyerName: o.buyerName,
  buyerEmail: o.buyerEmail,
  buyerPhone: o.buyerPhone,
  buyerAddress: o.buyerAddress,
  items: JSON.parse(o.items || '[]'),
  total: Number(o.total),
  status: o.status,
  createdAt: o.createdAt,
  archived: o.archived === 'TRUE',
});

/** All orders (incl. archived — UI filters), newest first. */
export async function adminListOrders() {
  const orders = await getRows('Orders');
  return orders.map(adminView).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/** Hide/restore an order in the admin UI without deleting the sheet row (never hard-delete). */
export async function archiveOrder(id, archived) {
  const orders = await getRows('Orders');
  const order = orders.find((o) => o.id === id);
  if (!order) { const e = new Error('Order not found'); e.status = 404; throw e; }
  order.archived = archived ? 'TRUE' : 'FALSE';
  await updateRow('Orders', order);
  return adminView(order);
}

// Statuses the admin may set by hand (pending_payment/paid are system-driven).
const SETTABLE = ['ready', 'shipped', 'delivered', 'cancelled'];

export async function updateOrderStatus(id, status) {
  if (!SETTABLE.includes(status)) throw bad(`Invalid status "${status}".`);
  const orders = await getRows('Orders');
  const order = orders.find((o) => o.id === id);
  if (!order) { const e = new Error('Order not found'); e.status = 404; throw e; }
  if (order.status === 'pending_payment') throw bad('This order has not been paid for yet.');

  order.status = status;
  await updateRow('Orders', order);
  // Buyer email only on ready/shipped (§6a); helper ignores other statuses anyway.
  sendStatusUpdate(order.buyerEmail, { orderId: order.id, status });
  return adminView(order);
}
