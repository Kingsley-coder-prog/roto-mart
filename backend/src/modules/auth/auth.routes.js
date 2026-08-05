import { Router } from 'express';
import { loginController } from './auth.controller.js';
import { adminAuth } from '../../middleware/adminAuth.js';

const router = Router();
router.post('/login', loginController);
// Lets the frontend confirm a stored token is still valid on load.
router.get('/me', adminAuth, (req, res) => res.json({ email: req.admin.email }));
export default router;
