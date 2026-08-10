import { getAnalytics } from './analytics.service.js';

export async function adminAnalytics(req, res, next) {
  try {
    res.json(await getAnalytics());
  } catch (err) { next(err); }
}
