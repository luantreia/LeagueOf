import { Request, Response, NextFunction } from 'express';
import { GroupService } from './group.service';
import { AuthRequest } from '@/core/middleware/auth';
import { ApiResponse } from '@/shared/utils/api-response';
import { AppError } from '@/shared/utils/app-error';

export class GroupController {
  private groupService = new GroupService();

  create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ownerId = req.user!.id;
      console.log('--- CREATING GROUP ---');
      console.log('Owner ID:', ownerId);
      console.log('Body:', req.body);
      
      const group = await this.groupService.createGroup(req.body, ownerId);

      ApiResponse.success(res, { group }, 'Group created successfully', 201);
    } catch (error: any) {
      console.error('--- CREATE GROUP ERROR ---');
      console.error(error);
      next(error);
    }
  };

  getAll = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const filter = req.query.filter as string || 'all';
      const groups = await this.groupService.getAllGroups(userId, filter);
      ApiResponse.success(res, groups, 'Groups retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const group = await this.groupService.getGroupById(req.params.id);
      ApiResponse.success(res, group, 'Group retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  join = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const groupId = req.params.id;
      const userId = req.user!.id;
      const group = await this.groupService.joinGroup(groupId, userId);
      ApiResponse.success(res, group, 'Joined group successfully');
    } catch (error) {
      next(error);
    }
  };

  joinByHandle = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { handle } = req.body;
      const userId = req.user!.id;
      if (!handle) throw new AppError('El @handle es requerido', 400);

      const group = await this.groupService.joinGroupByHandle(handle, userId);
      ApiResponse.success(res, group, 'Te has unido a la escuadra correctamente');
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const groupId = req.params.id;
      const userId = req.user!.id;
      const group = await this.groupService.updateGroup(groupId, req.body, userId);
      ApiResponse.success(res, group, 'Group updated successfully');
    } catch (error) {
      next(error);
    }
  };
}
