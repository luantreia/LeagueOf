import { Application, Router } from 'express';
import { authRoutes } from '@/modules/auth/auth.routes';
import { userRoutes } from '@/modules/users/user.routes';
import { groupRoutes } from '@/modules/groups/group.routes';
import { matchRoutes } from '@/modules/matches/match.routes';
import { rankingRoutes } from '@/modules/rankings/ranking.routes';
import { notificationRoutes } from '@/modules/notifications/notification.routes';
import { lobbyRoutes } from '@/modules/lobbies/lobby.routes';
import { integrationRoutes } from '@/modules/integrations/integration.routes';

export const setupRoutes = (app: Application): void => {
  const router = Router();

  // API routes
  router.use('/auth', authRoutes);
  router.use('/users', userRoutes);
  router.use('/groups', groupRoutes);
  router.use('/matches', matchRoutes);
  router.use('/rankings', rankingRoutes);
  router.use('/notifications', notificationRoutes);
  router.use('/lobbies', lobbyRoutes);
  router.use('/integrations', integrationRoutes);

  // Mount all routes under /api
  app.use('/api', router);

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      status: 'error',
      message: 'Route not found',
    });
  });
};
