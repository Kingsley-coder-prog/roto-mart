import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler.js';
import productsRoutes from './modules/products/products.routes.js';
import categoriesRoutes from './modules/categories/categories.routes.js';

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Feature module routers are mounted here as they are built (see CLAUDE.md §12)
app.use('/api/products', productsRoutes);
app.use('/api/categories', categoriesRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use(errorHandler);

export default app;
