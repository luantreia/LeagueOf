import { Router } from 'express';
import { authenticate } from '@/core/middleware/auth';
import { RankingService } from './ranking.service';

const router = Router();
const rankingService = new RankingService();

router.get('/group/:groupId', authenticate, async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const result = await rankingService.getLeaderboard(
      groupId,
      Number(page),
      Number(limit)
    );
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/user/:userId/group/:groupId', authenticate, async (req, res, next) => {
  try {
    const { userId, groupId } = req.params;
    const ranking = await rankingService.getUserRanking(userId, groupId);
    res.json({ ranking });
  } catch (error) {
    next(error);
  }
});

export const rankingRoutes = router;
