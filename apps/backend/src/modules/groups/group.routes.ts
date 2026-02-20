import { Router } from 'express';
import { authenticate } from '@/core/middleware/auth';
import { GroupController } from './group.controller';

const router = Router();
const controller = new GroupController();

router.get('/', authenticate, controller.getAll);
router.post('/', authenticate, controller.create);
router.post('/join-handle', authenticate, controller.joinByHandle);
router.get('/:id', authenticate, controller.getById);
router.patch('/:id', authenticate, controller.update);
router.post('/:id/join', authenticate, controller.join);

export const groupRoutes = router;
