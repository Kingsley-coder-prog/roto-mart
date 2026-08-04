import { Router } from 'express';
import { listCategories } from './categories.service.js';

const router = Router();
router.get('/', async (req, res, next) => {
  try {
    res.json(await listCategories());
  } catch (err) { next(err); }
});
export default router;
