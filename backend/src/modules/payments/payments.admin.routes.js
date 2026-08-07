import { Router } from 'express';
import { adminPayouts } from './payments.controller.js';

const router = Router();
router.get('/', adminPayouts);
export default router;
