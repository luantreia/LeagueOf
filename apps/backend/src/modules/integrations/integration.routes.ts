import { Router } from 'express';
import { authenticate, authorize } from '@/core/middleware/auth';
import { IntegrationManager } from './integration.adapters';

const router = Router();
const integrationManager = IntegrationManager.getInstance();

router.get('/health', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const health = await integrationManager.healthCheck();
    res.json({ health });
  } catch (error) {
    next(error);
  }
});

router.get('/riot/summoner/:region/:name', authenticate, async (req, res, next) => {
  try {
    const { region, name } = req.params;
    const riotAdapter = integrationManager.getAdapter('riot');
    
    if (!riotAdapter) {
      return res.status(503).json({ message: 'Riot integration not available' });
    }
    
    const data = await (riotAdapter as any).getSummonerByName(region, name);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.get('/steam/player/:steamId', authenticate, async (req, res, next) => {
  try {
    const { steamId } = req.params;
    const steamAdapter = integrationManager.getAdapter('steam');
    
    if (!steamAdapter) {
      return res.status(503).json({ message: 'Steam integration not available' });
    }
    
    const data = await (steamAdapter as any).getPlayerSummaries([steamId]);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

export const integrationRoutes = router;
