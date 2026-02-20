import { Router } from 'express';
import { authenticate, AuthRequest } from '@/core/middleware/auth';
import { NotificationService } from './notification.service';

const router = Router();
const notificationService = new NotificationService();

router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { page, limit, unreadOnly, type } = req.query;
    const result = await notificationService.getUserNotifications(
      req.user!.id,
      {
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        unreadOnly: unreadOnly === 'true',
        type: type as string,
      }
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/read', authenticate, async (req: AuthRequest, res, next) => {
  try {
    await notificationService.markAsRead(req.params.id, req.user!.id);
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
});

router.post('/mark-all-read', authenticate, async (req: AuthRequest, res, next) => {
  try {
    await notificationService.markAllAsRead(req.user!.id);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    await notificationService.deleteNotification(req.params.id, req.user!.id);
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
});

export const notificationRoutes = router;
