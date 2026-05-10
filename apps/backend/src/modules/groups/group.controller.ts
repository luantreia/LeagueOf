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

  delete = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const groupId = req.params.id;
      const userId = req.user!.id;
      await this.groupService.deleteGroup(groupId, userId);
      ApiResponse.success(res, { id: groupId }, 'Group deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  updateMemberRole = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const groupId = req.params.id;
      const memberId = req.params.memberId;
      const userId = req.user!.id;
      const { role } = req.body;
      
      const group = await this.groupService.updateMemberRole(groupId, memberId, role, userId);
      ApiResponse.success(res, group, 'Member role updated successfully');
    } catch (error) {
      next(error);
    }
  };

  removeMember = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const groupId = req.params.id;
      const memberId = req.params.memberId;
      const userId = req.user!.id;
      
      const group = await this.groupService.removeMember(groupId, memberId, userId);
      ApiResponse.success(res, group, 'Member removed successfully');
    } catch (error) {
      next(error);
    }
  };

  updateRankingConfig = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const groupId = req.params.id;
      const userId = req.user!.id;
      const config = req.body;
      
      const group = await this.groupService.updateRankingConfig(groupId, config, userId);
      ApiResponse.success(res, group, 'Ranking config updated successfully');
    } catch (error) {
      next(error);
    }
  };

  resetRankings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const groupId = req.params.id;
      const userId = req.user!.id;
      
      await this.groupService.resetRankings(groupId, userId);
      ApiResponse.success(res, null, 'Rankings reset successfully');
    } catch (error) {
      next(error);
    }
  };

  addSupportedGame = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const groupId = req.params.id;
      const userId = req.user!.id;
      const { game } = req.body;
      
      const group = await this.groupService.addSupportedGame(groupId, game, userId);
      ApiResponse.success(res, group, 'Game added successfully');
    } catch (error) {
      next(error);
    }
  };

  removeSupportedGame = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const groupId = req.params.id;
      const userId = req.user!.id;
      const { game } = req.params;
      
      const group = await this.groupService.removeSupportedGame(groupId, game, userId);
      ApiResponse.success(res, group, 'Game removed successfully');
    } catch (error) {
      next(error);
    }
  };

  inviteUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const groupId = req.params.id;
      const userId = req.user!.id;
      const { email } = req.body;
      
      const group = await this.groupService.inviteUser(groupId, email, userId);
      ApiResponse.success(res, group, 'Invitation sent successfully');
    } catch (error) {
      next(error);
    }
  };

  acceptInvitation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const groupId = req.params.id;
      const invitationId = req.params.invitationId;
      const userId = req.user!.id;
      
      const group = await this.groupService.acceptInvitation(groupId, invitationId, userId);
      ApiResponse.success(res, group, 'Invitation accepted successfully');
    } catch (error) {
      next(error);
    }
  };

  rejectInvitation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const groupId = req.params.id;
      const invitationId = req.params.invitationId;
      const userId = req.user!.id;
      
      const group = await this.groupService.rejectInvitation(groupId, invitationId, userId);
      ApiResponse.success(res, group, 'Invitation rejected successfully');
    } catch (error) {
      next(error);
    }
  };

  cancelInvitation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const groupId = req.params.id;
      const invitationId = req.params.invitationId;
      const userId = req.user!.id;
      
      const group = await this.groupService.cancelInvitation(groupId, invitationId, userId);
      ApiResponse.success(res, group, 'Invitation cancelled successfully');
    } catch (error) {
      next(error);
    }
  };

  searchGroups = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { query, gameType, page = 1, limit = 20 } = req.query;
      
      const result = await this.groupService.searchGroups(
        query as string,
        gameType as string,
        Number(page),
        Number(limit)
      );
      ApiResponse.success(res, result, 'Groups retrieved successfully');
    } catch (error) {
      next(error);
    }
  };
}
