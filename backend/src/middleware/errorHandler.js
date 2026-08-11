// Central error handler: modules throw (optionally with err.status); this replies.
// The real reason is always logged; buyers get a clean message. 502 = an upstream
// service (Paystack) failed — a friendly payment message, detail stays in the logs.
export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  let error;
  if (status < 500) error = err.message; // client errors carry a safe, useful reason
  else if (status === 502) error = 'We couldn’t start your payment just now. Please try again in a moment.';
  else error = 'Internal server error';
  res.status(status).json({ error });
}
