import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { AuthRequest } from '@/core/middleware/auth';
import { ApiResponse } from '@/shared/utils/api-response';
import { User } from '@/modules/users/user.model';
import { AppError } from '@/shared/utils/app-error';

export class AuthController {
  private authService = new AuthService();

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.register(req.body);

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      ApiResponse.success(
        res,
        {
          user: result.user,
          accessToken: result.accessToken,
        },
        'User registered successfully',
        201
      );
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      ApiResponse.success(res, {
        user: result.user,
        accessToken: result.accessToken,
      }, 'Login successful');
    } catch (error) {
      next(error);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;
      await this.authService.requestPasswordReset(email);

      ApiResponse.success(
        res,
        null,
        'Si existe una cuenta con ese email, enviaremos un enlace para restablecer la contrasena'
      );
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token, password } = req.body;
      await this.authService.resetPassword(token, password);

      res.clearCookie('refreshToken');
      ApiResponse.success(res, null, 'Contrasena actualizada correctamente');
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.body.refreshToken || req.cookies.refreshToken;

      if (!refreshToken) {
        throw new AppError('Refresh token required', 400);
      }

      const tokens = await this.authService.refreshAccessToken(refreshToken);

      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      ApiResponse.success(res, {
        accessToken: tokens.accessToken,
      }, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.body.refreshToken || req.cookies.refreshToken;

      if (refreshToken && req.user) {
        await this.authService.logout(req.user.id, refreshToken);
      }

      res.clearCookie('refreshToken');

      ApiResponse.success(res, null, 'Logout successful');
    } catch (error) {
      next(error);
    }
  };

  logoutAll = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      await this.authService.logoutAll(req.user.id);

      res.clearCookie('refreshToken');

      ApiResponse.success(res, null, 'All sessions terminated');
    } catch (error) {
      next(error);
    }
  };

  getCurrentUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const user = await User.findById(req.user.id);

      if (!user) {
        throw new AppError('User not found', 404);
      }

      ApiResponse.success(res, { user }, 'User retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  checkForGuests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, phone } = req.query;
      const result = await this.authService.checkForGuests(
        email as string,
        phone as string
      );

      ApiResponse.success(res, result, 'Guest check completed');
    } catch (error) {
      next(error);
    }
  };

  sendGuestVerificationCode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, phone } = req.body;
      const result = await this.authService.sendGuestVerificationCode(email, phone);

      ApiResponse.success(res, result, 'Verification code sent');
    } catch (error) {
      next(error);
    }
  };

  verifyAndClaimGuests = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const { code, email, phone } = req.body;
      const result = await this.authService.verifyAndClaimGuests(
        req.user.id,
        code,
        email,
        phone
      );

      ApiResponse.success(res, result, 'Guests claimed successfully');
    } catch (error) {
      next(error);
    }
  };
}
