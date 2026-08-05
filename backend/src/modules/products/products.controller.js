import {
  listActive, getActiveById,
  listAllProducts, createProduct, updateProduct, setProductActive,
} from './products.service.js';
import { uploadImage } from '../../infra/cloudinary.js';

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

// ---- Admin (F9) ----

export async function adminList(req, res, next) {
  try {
    res.json(await listAllProducts());
  } catch (err) { next(err); }
}

export async function adminCreate(req, res, next) {
  try {
    res.status(201).json(await createProduct(req.body));
  } catch (err) { next(err); }
}

export async function adminUpdate(req, res, next) {
  try {
    res.json(await updateProduct(req.params.id, req.body));
  } catch (err) { next(err); }
}

export async function adminSetActive(req, res, next) {
  try {
    res.json(await setProductActive(req.params.id, req.body.active === true));
  } catch (err) { next(err); }
}

export async function adminSoftDelete(req, res, next) {
  try {
    res.json(await setProductActive(req.params.id, false));
  } catch (err) { next(err); }
}

export async function adminUploadImage(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file received.' });
    res.json({ url: await uploadImage(req.file.buffer) });
  } catch (err) { next(err); }
}
