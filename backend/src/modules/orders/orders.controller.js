import { createOrder, verifyOrder, trackOrder } from './orders.service.js';

export async function create(req, res, next) {
  try {
    res.status(201).json(await createOrder(req.body));
  } catch (err) { next(err); }
}

export async function verify(req, res, next) {
  try {
    res.json(await verifyOrder(req.params.reference));
  } catch (err) { next(err); }
}

export async function track(req, res, next) {
  try {
    const order = await trackOrder(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) { next(err); }
}
