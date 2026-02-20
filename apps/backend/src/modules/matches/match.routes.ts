import { Router } from 'express';
import { authenticate } from '@/core/middleware/auth';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  res.json({ message: 'Match routes' });
});

router.post('/', authenticate, async (req, res) => {
  res.json({ message: 'Create match' });
});

router.get('/:id', authenticate, async (req, res) => {
  res.json({ message: 'Get match by ID' });
});

router.patch('/:id', authenticate, async (req, res) => {
  res.json({ message: 'Update match' });
});

router.post('/:id/complete', authenticate, async (req, res) => {
  res.json({ message: 'Complete match' });
});

export const matchRoutes = router;
