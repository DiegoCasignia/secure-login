import { Router } from 'express';
import authRoutes from './auth.routes';
import adminRoutes from './admin.routes';
import { config } from '../../config/env';

const router = Router();

const API_PREFIX = `/api/${config.apiVersion}`;

router.get(`${API_PREFIX}/health`, (req, res) => {
  console.log(req)
  res.json({
    success: true,
    message: 'Facial Authentication API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

router.use(`${API_PREFIX}/auth`, authRoutes);
router.use(`${API_PREFIX}/admin`, adminRoutes);

export default router;