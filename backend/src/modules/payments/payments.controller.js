import { listPayouts } from './payments.service.js';

export async function adminPayouts(req, res, next) {
  try {
    res.json(await listPayouts());
  } catch (err) { next(err); }
}
