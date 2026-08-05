import { Router } from 'express';
import { adminCreate, adminUpdate, adminDelete } from './categories.controller.js';

const router = Router();
router.post('/', adminCreate);
router.put('/:id', adminUpdate);
router.delete('/:id', adminDelete);
export default router;
