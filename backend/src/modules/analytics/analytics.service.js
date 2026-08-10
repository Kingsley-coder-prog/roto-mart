// Admin analytics (F11) — aggregates the Orders + Payouts sheets into decision
// data. Read-only; money figures come from Payouts (actual recorded splits),
// product/order figures from Orders. A "sale" = a paid-or-beyond order.
import { getRows } from '../../infra/sheets.js';

const SOLD = new Set(['paid', 'ready', 'shipped', 'delivered']); // excludes pending_payment + cancelled
const monthKey = (iso) => new Date(iso).toLocaleDateString('en-NG', { month: 'short', year: 'numeric' });

export async function getAnalytics() {
  const [orders, payouts] = await Promise.all([getRows('Orders'), getRows('Payouts')]);

  // Orders by status (all orders, so the admin sees the funnel).
  const ordersByStatus = {};
  for (const o of orders) ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;

  const sales = orders.filter((o) => SOLD.has(o.status));
  const grossRevenue = sales.reduce((s, o) => s + Number(o.total), 0);
  const paidOrders = sales.length;
  const avgOrderValue = paidOrders ? Math.round(grossRevenue / paidOrders) : 0;

  // Best/worst sellers — aggregate line items across sold orders.
  const byProduct = new Map();
  for (const o of sales) {
    for (const i of JSON.parse(o.items || '[]')) {
      const cur = byProduct.get(i.id) || { id: i.id, name: i.name, qty: 0, revenue: 0 };
      cur.qty += i.qty;
      cur.revenue += i.price * i.qty;
      byProduct.set(i.id, cur);
    }
  }
  const products = [...byProduct.values()].sort((a, b) => b.revenue - a.revenue);

  // Money from Payouts (ground-truth splits), grouped by month.
  const yourEarnings = payouts.reduce((s, p) => s + Number(p.adminShare), 0);
  const developerShare = payouts.reduce((s, p) => s + Number(p.developerShare), 0);

  const monthMap = new Map();
  for (const p of payouts) {
    const k = monthKey(p.date);
    const m = monthMap.get(k) || { month: k, earnings: 0, orders: 0, _t: new Date(p.date).getTime() };
    m.earnings += Number(p.adminShare);
    m.orders += 1;
    monthMap.set(k, m);
  }
  const monthly = [...monthMap.values()].sort((a, b) => a._t - b._t).map(({ _t, ...m }) => m);

  return {
    grossRevenue, yourEarnings, developerShare, paidOrders, avgOrderValue,
    ordersByStatus,
    topProducts: products.slice(0, 8),
    leastProducts: products.length > 8 ? products.slice(-3).reverse() : [],
    monthly,
  };
}
