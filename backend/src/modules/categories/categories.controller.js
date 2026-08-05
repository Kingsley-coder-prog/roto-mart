import { createCategory, updateCategory, deleteCategory } from './categories.service.js';

export async function adminCreate(req, res, next) {
  try {
    res.status(201).json(await createCategory(req.body));
  } catch (err) { next(err); }
}

export async function adminUpdate(req, res, next) {
  try {
    res.json(await updateCategory(req.params.id, req.body));
  } catch (err) { next(err); }
}

export async function adminDelete(req, res, next) {
  try {
    res.json(await deleteCategory(req.params.id));
  } catch (err) { next(err); }
}
