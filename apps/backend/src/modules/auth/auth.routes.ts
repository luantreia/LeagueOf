import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '@/core/middleware/validator';
import { authenticate } from '@/core/middleware/auth';
import { strictRateLimiter } from '@/core/middleware/rate-limiter';
import { 
  registerSchema, 
  loginSchema, 
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema 
} from './auth.validation';

const router = Router();
const authController = new AuthController();

// Public routes with strict rate limiting
router.post(
  '/register',
  strictRateLimiter,
  validate(registerSchema),
  authController.register
);

router.post(
  '/login',
  strictRateLimiter,
  validate(loginSchema),
  authController.login
);

router.post(
  '/forgot-password',
  strictRateLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword
);

router.post(
  '/reset-password',
  strictRateLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword
);

router.post(
  '/refresh',
  validate(refreshTokenSchema),
  authController.refreshToken
);

// Protected routes
router.post('/logout', authenticate, authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);
router.get('/me', authenticate, authController.getCurrentUser);

// Guest verification routes
router.get(
  '/guests/check',
  strictRateLimiter,
  authController.checkForGuests
);

router.post(
  '/guests/send-verification',
  strictRateLimiter,
  authController.sendGuestVerificationCode
);

router.post(
  '/guests/verify',
  authenticate,
  authController.verifyAndClaimGuests
);

export const authRoutes = router;
