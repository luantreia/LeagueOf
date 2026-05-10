import { Request, Response, NextFunction } from 'express';
import { UserService } from './user.service';
import { AuthRequest } from '@/core/middleware/auth';
import { ApiResponse } from '@/shared/utils/api-response';

export class UserController {
  private userService = new UserService();

  getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userService.getUserById(req.user!.id);
      ApiResponse.success(res, user, 'User retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const updates = req.body;
      const user = await this.userService.updateProfile(userId, updates);
      ApiResponse.success(res, user, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { currentPassword, newPassword } = req.body;
      await this.userService.changePassword(userId, currentPassword, newPassword);
      ApiResponse.success(res, null, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  };

  deactivateAccount = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      await this.userService.deactivateAccount(userId);
      ApiResponse.success(res, null, 'Account deactivated successfully');
    } catch (error) {
      next(error);
    }
  };

  getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const user = await this.userService.getUserById(id);
      ApiResponse.success(res, user, 'User retrieved successfully');
    } catch (error) {
      next(error);
    }
  };
}
