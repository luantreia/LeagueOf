import { Router } from 'express';
import { authenticate } from '@/core/middleware/auth';
import { UserController } from './user.controller';

const router = Router();
const userController = new UserController();

router.get('/me', authenticate, userController.getMe);
router.patch('/me', authenticate, userController.updateProfile);
router.post('/me/change-password', authenticate, userController.changePassword);
router.post('/me/deactivate', authenticate, userController.deactivateAccount);
router.get('/:id', authenticate, userController.getUserById);

export const userRoutes = router;
