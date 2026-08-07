import { Router } from 'express';
import { adminList, adminUpdateStatus } from './orders.controller.js';

const router = Router();
router.get('/', adminList);
router.patch('/:id/status', adminUpdateStatus);
export default router;
