import { Group, IGroup } from './group.model';
import { Ranking } from '@/modules/rankings/ranking.model';
import { AppError } from '@/shared/utils/app-error';
import mongoose from 'mongoose';

export class GroupService {
  async createGroup(data: any, ownerId: string): Promise<IGroup> {
    // Generamos un handle si no fue proporcionado
    let handle = data.handle?.trim();
    if (!handle) {
      // Slug simple: "Nombre del Grupo" -> "nombre-del-grupo"
      const slug = data.name
        .toLowerCase()
        .normalize('NFD') // Quitar acentos
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-') // Casi todo por giones
        .replace(/-+/g, '-') // Evitar giones seguidos
        .replace(/^-|-$/g, ''); // Quitar giones al principio y final
      
      const randomPart = Math.random().toString(36).substring(2, 6); // ej: "a1b2"
      handle = `${slug}-${randomPart}`;
    }

    const group = new Group({
      name: data.name,
      handle: handle.toLowerCase(),
      description: data.description,
      owner: new mongoose.Types.ObjectId(ownerId),
      members: [
        {
          user: new mongoose.Types.ObjectId(ownerId),
          role: 'owner',
          joinedAt: new Date(),
        },
      ],
      settings: {
        isPublic: data.isPublic !== undefined ? data.isPublic : true,
        maxMembers: 100,
        requireApproval: false,
        allowMatchCreation: true,
      },
      rankingConfig: {
        mode: data.rankingMode || 'elo',
      },
      stats: {
        totalMatches: 0,
        totalMembers: 1,
        activeMembers: 1,
      },
    });

    const savedGroup = await group.save();
    await this.ensureRanking(ownerId, savedGroup);
    return savedGroup;
  }

  async updateGroup(id: string, updateData: any, userId: string): Promise<IGroup> {
    const group = await Group.findById(id);
    if (!group) {
      throw new AppError('Grupo no encontrado', 404);
    }

    if (group.owner.toString() !== userId) {
      throw new AppError('No tienes permiso para editar este grupo', 403);
    }

    // Si intenta cambiar el handle, validamos que no exista
    if (updateData.handle && updateData.handle !== group.handle) {
      const existing = await Group.findOne({ handle: updateData.handle.toLowerCase() });
      if (existing) {
        throw new AppError('Este @handle ya está en uso', 400);
      }
      group.handle = updateData.handle.toLowerCase();
    }

    if (updateData.name) group.name = updateData.name;
    if (updateData.description !== undefined) group.description = updateData.description;
    if (updateData.isPublic !== undefined) group.settings.isPublic = updateData.isPublic;

    return await group.save();
  }

  async getAllGroups(userId?: string, filter: string = 'all'): Promise<IGroup[]> {
    const query: any = { isActive: true };

    if (filter === 'joined' && userId) {
      query['members.user'] = userId;
    } else if (filter === 'explore') {
      query['settings.isPublic'] = true;
      if (userId) {
        query['members.user'] = { $ne: userId };
      }
    } else {
      query['$or'] = [
        { 'settings.isPublic': true },
      ];
      if (userId) {
        query['$or'].push({ 'members.user': userId });
      }
    }

    return await Group.find(query)
      .populate('owner', 'username displayName avatar')
      .sort({ createdAt: -1 });
  }

  async getGroupById(id: string): Promise<IGroup> {
    const group = await Group.findById(id)
      .populate('owner', 'username displayName avatar')
      .populate('members.user', 'username displayName avatar');

    if (!group) {
      throw new AppError('Group not found', 404);
    }

    return group;
  }

  async joinGroup(groupId: string, userId: string): Promise<IGroup> {
    const group = await Group.findById(groupId);
    if (!group) {
      throw new AppError('Group not found', 404);
    }

    const isMember = group.members.some((m) => m.user.toString() === userId);
    if (isMember) {
      throw new AppError('User is already a member', 400);
    }

    group.members.push({
      user: new mongoose.Types.ObjectId(userId) as any,
      role: 'member',
      joinedAt: new Date(),
    });

    group.stats.totalMembers = group.members.length;

    const savedGroup = await group.save();
    await this.ensureRanking(userId, savedGroup);
    return savedGroup;
  }

  async joinGroupByHandle(handle: string, userId: string): Promise<IGroup> {
    const handleLower = handle.startsWith('@') ? handle.slice(1).toLowerCase() : handle.toLowerCase();
    const group = await Group.findOne({ handle: handleLower, isActive: true });
    
    if (!group) {
      throw new AppError('No se encontró ninguna escuadra con ese @handle', 404);
    }

    const isMember = group.members.some((m) => m.user.toString() === userId);
    if (isMember) {
      throw new AppError('Ya eres miembro de esta escuadra', 400);
    }

    group.members.push({
      user: new mongoose.Types.ObjectId(userId) as any,
      role: 'member',
      joinedAt: new Date(),
    });

    group.stats.totalMembers = group.members.length;

    const savedGroup = await group.save();
    await this.ensureRanking(userId, savedGroup);
    return savedGroup;
  }

  async deleteGroup(id: string, userId: string): Promise<void> {
    const group = await Group.findById(id);
    if (!group) {
      throw new AppError('Grupo no encontrado', 404);
    }

    if (group.owner.toString() !== userId) {
      throw new AppError('No tienes permiso para eliminar este grupo', 403);
    }

    group.isActive = false;
    await group.save();
    await Ranking.updateMany({ group: id }, { isActive: false });
  }

  async updateMemberRole(groupId: string, memberId: string, role: string, userId: string): Promise<IGroup> {
    const group = await Group.findById(groupId);
    if (!group) {
      throw new AppError('Grupo no encontrado', 404);
    }

    if (group.owner.toString() !== userId) {
      throw new AppError('No tienes permiso para gestionar miembros', 403);
    }

    const member = group.members.find((m) => m.user.toString() === memberId);
    if (!member) {
      throw new AppError('Miembro no encontrado', 404);
    }

    if (member.user.toString() === group.owner.toString()) {
      throw new AppError('No puedes cambiar el rol del owner', 400);
    }

    member.role = role as 'admin' | 'member';
    return await group.save();
  }

  async removeMember(groupId: string, memberId: string, userId: string): Promise<IGroup> {
    const group = await Group.findById(groupId);
    if (!group) {
      throw new AppError('Grupo no encontrado', 404);
    }

    if (group.owner.toString() !== userId) {
      throw new AppError('No tienes permiso para gestionar miembros', 403);
    }

    const memberIndex = group.members.findIndex((m) => m.user.toString() === memberId);
    if (memberIndex === -1) {
      throw new AppError('Miembro no encontrado', 404);
    }

    if (group.members[memberIndex].user.toString() === group.owner.toString()) {
      throw new AppError('No puedes expulsar al owner', 400);
    }

    group.members.splice(memberIndex, 1);
    group.stats.totalMembers = group.members.length;

    return await group.save();
  }

  async updateRankingConfig(groupId: string, config: any, userId: string): Promise<IGroup> {
    const group = await Group.findById(groupId);
    if (!group) {
      throw new AppError('Grupo no encontrado', 404);
    }

    if (group.owner.toString() !== userId) {
      throw new AppError('No tienes permiso para actualizar la configuración de ranking', 403);
    }

    if (config.mode) {
      group.rankingConfig.mode = config.mode;
    }

    if (config.eloSettings) {
      group.rankingConfig.eloSettings = {
        ...group.rankingConfig.eloSettings,
        ...config.eloSettings,
      };
    }

    if (config.pointsSettings) {
      group.rankingConfig.pointsSettings = {
        ...group.rankingConfig.pointsSettings,
        ...config.pointsSettings,
      };
    }

    return await group.save();
  }

  async resetRankings(groupId: string, userId: string): Promise<void> {
    const group = await Group.findById(groupId);
    if (!group) {
      throw new AppError('Grupo no encontrado', 404);
    }

    if (group.owner.toString() !== userId) {
      throw new AppError('No tienes permiso para resetear rankings', 403);
    }

    await Ranking.deleteMany({ group: groupId });

    // Recreate rankings for all members
    for (const member of group.members) {
      await this.ensureRanking(member.user.toString(), group);
    }
  }

  private async ensureRanking(userId: string, group: IGroup): Promise<void> {
    const existingRanking = await Ranking.findOne({ user: userId, group: group._id });
    if (existingRanking) return;

    const rankingData: any = {
      user: new mongoose.Types.ObjectId(userId),
      group: group._id,
      rankingType: group.rankingConfig.mode,
      stats: {
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        winRate: 0,
        currentStreak: 0,
        bestStreak: 0,
      },
    };

    if (group.rankingConfig.mode === 'elo') {
      const initialRating = group.rankingConfig.eloSettings?.initialRating || 1200;
      rankingData.elo = {
        rating: initialRating,
        peak: initialRating,
        history: [],
      };
    } else {
      rankingData.points = {
        total: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        history: [],
      };
    }

    await Ranking.create(rankingData);
  }
}
