import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler.js';
import productsRoutes from './modules/products/products.routes.js';
import categoriesRoutes from './modules/categories/categories.routes.js';
import ordersRoutes from './modules/orders/orders.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import productsAdminRoutes from './modules/products/products.admin.routes.js';
import categoriesAdminRoutes from './modules/categories/categories.admin.routes.js';
import { adminAuth } from './middleware/adminAuth.js';

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Feature module routers are mounted here as they are built (see CLAUDE.md §12)
app.use('/api/products', productsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/admin', authRoutes);
app.use('/api/admin/products', adminAuth, productsAdminRoutes);
app.use('/api/admin/categories', adminAuth, categoriesAdminRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use(errorHandler);

export default app;
