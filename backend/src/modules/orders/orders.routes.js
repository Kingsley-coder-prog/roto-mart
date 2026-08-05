import { Router } from 'express';
import { create, verify, track } from './orders.controller.js';

const router = Router();
router.post('/', create);
router.get('/verify/:reference', verify);
router.get('/track/:id', track);
export default router;
