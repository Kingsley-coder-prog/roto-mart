import { Router } from 'express';
import { adminAnalytics } from './analytics.controller.js';

const router = Router();
router.get('/', adminAnalytics);
export default router;
