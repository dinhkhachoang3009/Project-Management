import express from 'express';

const router = express.Router();

// GET /api/tasks
router.get('/', (req, res) => {
    res.status(200).json({ message: 'Tasks route is working' });
});

export default router;
