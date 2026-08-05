// Buyer emails (CLAUDE.md §6a). All sends are fire-and-forget: a failed email
// must never fail the order — the tracking page is the fallback source of truth.
import { sendEmail } from '../../infra/brevo.js';

const naira = (n) => `₦${Number(n).toLocaleString('en-NG')}`;
const trackingUrl = (orderId) => `${process.env.FRONTEND_URL}/track/${orderId}`;

const itemRows = (items) => items
  .map((i) => `<tr><td style="padding:4px 12px 4px 0">${i.name} × ${i.qty}</td><td align="right">${naira(i.price * i.qty)}</td></tr>`)
  .join('');

const shell = (body) => `
  <div style="font-family:Arial,Helvetica,sans-serif;color:#1c1917;max-width:520px;margin:0 auto">
    <h2 style="color:#166534">Roto<span style="color:#f59e0b">Mart</span></h2>
    ${body}
    <p style="color:#78716c;font-size:12px;margin-top:24px">RotoMart — thank you for shopping with us.</p>
  </div>`;

function fireAndForget(promise, label) {
  promise.catch((err) => console.error(`[notifications] ${label} email failed:`, err.message));
}

/** After payment is verified. `order` is the public view (orderId, items, total). */
export function sendOrderConfirmation(to, order) {
  fireAndForget(sendEmail({
    to,
    subject: `Order confirmed — ${order.orderId}`,
    html: shell(`
      <p>Your payment was successful. Here's your order:</p>
      <p style="font-size:18px"><strong>${order.orderId}</strong></p>
      <table style="border-collapse:collapse">${itemRows(order.items)}
        <tr><td style="padding:8px 12px 0 0;border-top:1px solid #e7e5e4"><strong>Paid</strong></td>
        <td align="right" style="padding-top:8px;border-top:1px solid #e7e5e4"><strong>${naira(order.total)}</strong></td></tr>
      </table>
      <p><a href="${trackingUrl(order.orderId)}" style="background:#166534;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;display:inline-block">Track your order</a></p>
      <p>Or keep this number and visit the tracking page any time: <strong>${order.orderId}</strong></p>`),
  }), `confirmation ${order.orderId}`);
}

const STATUS_LINES = {
  ready: 'Your order is packed and ready — delivery is being arranged.',
  shipped: 'Your order is on its way!',
};

/** When the admin moves an order to ready/shipped (wired up in F10). */
export function sendStatusUpdate(to, order) {
  const line = STATUS_LINES[order.status];
  if (!line) return; // only ready/shipped notify the buyer (§6a)
  fireAndForget(sendEmail({
    to,
    subject: `Order ${order.orderId} update: ${order.status}`,
    html: shell(`
      <p>${line}</p>
      <p style="font-size:18px"><strong>${order.orderId}</strong></p>
      <p><a href="${trackingUrl(order.orderId)}" style="background:#166534;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;display:inline-block">Track your order</a></p>`),
  }), `status(${order.status}) ${order.orderId}`);
}
