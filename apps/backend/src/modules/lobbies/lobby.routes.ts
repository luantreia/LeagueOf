import { Router } from 'express';
import { authenticate } from '@/core/middleware/auth';

const router = Router();

router.get('/', authenticate, async (_req, res) => {
  res.json({ message: 'Lobby routes - managed via Socket.IO' });
});

export const lobbyRoutes = router;
