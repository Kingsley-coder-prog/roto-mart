import { listActive, getActiveById } from './products.service.js';

export async function list(req, res, next) {
  try {
    res.json(await listActive());
  } catch (err) { next(err); }
}

export async function getOne(req, res, next) {
  try {
    const product = await getActiveById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) { next(err); }
}
