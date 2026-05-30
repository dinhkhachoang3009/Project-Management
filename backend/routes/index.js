import e from 'express';
import authRoutes from './auth.js';
import taskRoutes from './tasks.js';

const router = e.Router();

router.use('/auth', authRoutes);
router.use('/tasks', taskRoutes);

export default router;