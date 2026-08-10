import { Router } from 'express';
import { adminList, adminUpdateStatus, adminArchive } from './orders.controller.js';

const router = Router();
router.get('/', adminList);
router.patch('/:id/status', adminUpdateStatus);
router.patch('/:id/archive', adminArchive);
export default router;
