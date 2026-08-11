// Central error handler: modules throw (optionally with err.status); this replies.
// 502 = an upstream service (Paystack) rejected us — surface its reason (useful to
// the buyer and for debugging); other 5xx stay generic to avoid leaking internals.
export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  const expose = status < 500 || status === 502;
  res.status(status).json({ error: expose ? err.message : 'Internal server error' });
}
