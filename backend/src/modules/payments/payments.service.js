// Owns the 93/7 split policy (CLAUDE.md §6). Amounts are naira in, kobo out.
import { initializeTransaction, verifyTransaction } from '../../infra/paystack.js';

export const DEV_SHARE = 0.07; // developer keeps 7%, admin subaccount gets the rest

/**
 * Start a Paystack payment for an order. transaction_charge (the developer's
 * cut, in kobo) is passed explicitly on every init — see §6 for why we don't
 * rely on the subaccount's percentage_charge default.
 */
export async function initPayment({ email, totalNaira, reference }) {
  const amountKobo = Math.round(totalNaira * 100);
  const payload = {
    email,
    amount: amountKobo,
    reference,
    currency: 'NGN',
    callback_url: `${process.env.FRONTEND_URL}/payment/callback`,
  };
  const subaccount = process.env.PAYSTACK_ADMIN_SUBACCOUNT_CODE;
  if (subaccount) {
    payload.subaccount = subaccount;
    payload.bearer = 'account'; // developer side absorbs Paystack's own fee
    payload.transaction_charge = Math.round(amountKobo * DEV_SHARE);
  }
  const data = await initializeTransaction(payload);
  return { authorizationUrl: data.authorization_url, reference: data.reference };
}

/**
 * Server-side verify (never trust the frontend). Returns a normalized result;
 * shares come from Paystack's fees_split when present (ground truth), else
 * computed from DEV_SHARE.
 */
export async function verifyPayment(reference, expectedTotalNaira) {
  const data = await verifyTransaction(reference);
  const paid =
    data.status === 'success' &&
    data.currency === 'NGN' &&
    data.amount === Math.round(expectedTotalNaira * 100);
  const split = data.fees_split || {};
  const developerShare = split.integration != null ? split.integration / 100 : expectedTotalNaira * DEV_SHARE;
  const adminShare = split.subaccount != null ? split.subaccount / 100 : expectedTotalNaira - developerShare;
  return { paid, gatewayStatus: data.status, developerShare, adminShare };
}
