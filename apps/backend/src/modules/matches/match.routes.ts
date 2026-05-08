import { Router } from 'express';
import { authenticate } from '@/core/middleware/auth';
import { AuthRequest } from '@/core/middleware/auth';
import { MatchService } from './match.service';
import { ApiResponse } from '@/shared/utils/api-response';

const router = Router();
const matchService = new MatchService();

router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const matches = await matchService.getMatches(req.user!.id, req.query);
    ApiResponse.success(res, matches, 'Matches retrieved successfully');
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const match = await matchService.createMatch(req.body, req.user!.id);
    ApiResponse.success(res, match, 'Match created successfully', 201);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const match = await matchService.getMatch(req.params.id, req.user!.id);
    ApiResponse.success(res, match, 'Match retrieved successfully');
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', authenticate, async (_req, res) => {
  res.json({ message: 'Update match' });
});

router.post('/:id/complete', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const match = await matchService.completeMatch(req.params.id, req.body, req.user!.id);
    ApiResponse.success(res, match, 'Match completed successfully');
  } catch (error) {
    next(error);
  }
});

export const matchRoutes = router;
