import { Group, IGroup } from './group.model';
import { Ranking } from '@/modules/rankings/ranking.model';
import { User } from '@/modules/users/user.model';
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

  async addSupportedGame(groupId: string, game: string, userId: string): Promise<IGroup> {
    const group = await Group.findById(groupId);
    if (!group) {
      throw new AppError('Grupo no encontrado', 404);
    }

    if (group.owner.toString() !== userId) {
      throw new AppError('No tienes permiso para agregar juegos', 403);
    }

    if (!game || game.trim() === '') {
      throw new AppError('El nombre del juego es requerido', 400);
    }

    const normalizedGame = game.trim();
    if (group.supportedGames.includes(normalizedGame)) {
      throw new AppError('Este juego ya está en la lista', 400);
    }

    group.supportedGames.push(normalizedGame);
    return await group.save();
  }

  async removeSupportedGame(groupId: string, game: string, userId: string): Promise<IGroup> {
    const group = await Group.findById(groupId);
    if (!group) {
      throw new AppError('Grupo no encontrado', 404);
    }

    if (group.owner.toString() !== userId) {
      throw new AppError('No tienes permiso para eliminar juegos', 403);
    }

    const normalizedGame = game.trim();
    const index = group.supportedGames.indexOf(normalizedGame);
    if (index === -1) {
      throw new AppError('Este juego no está en la lista', 404);
    }

    group.supportedGames.splice(index, 1);
    return await group.save();
  }

  async inviteUser(groupId: string, email: string, userId: string): Promise<IGroup> {
    const group = await Group.findById(groupId);
    if (!group) {
      throw new AppError('Grupo no encontrado', 404);
    }

    if (group.owner.toString() !== userId) {
      throw new AppError('Solo el owner puede enviar invitaciones', 403);
    }

    // Validar que no haya una invitación pendiente para el mismo email
    const existingInvitation = group.invitations.find((inv) => 
      inv.email === email && 
      inv.status === 'pending' && 
      inv.expiresAt > new Date()
    );
    if (existingInvitation) {
      throw new AppError('Ya existe una invitación pendiente para este email', 400);
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new AppError('Email inválido', 400);
    }

    // Crear invitación con expiración de 7 días
    const invitation = {
      email: email.toLowerCase(),
      invitedBy: new mongoose.Types.ObjectId(userId),
      status: 'pending',
      sentAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
    };

    group.invitations.push(invitation as any);
    return await group.save();
  }

  async acceptInvitation(groupId: string, invitationId: string, userId: string): Promise<IGroup> {
    const group = await Group.findById(groupId);
    if (!group) {
      throw new AppError('Grupo no encontrado', 404);
    }

    const invitation = group.invitations.find((inv) => inv._id.toString() === invitationId);
    if (!invitation) {
      throw new AppError('Invitación no encontrada', 404);
    }

    if (invitation.status !== 'pending') {
      throw new AppError('Esta invitación ya no es válida', 400);
    }

    if (invitation.expiresAt < new Date()) {
      throw new AppError('La invitación ha expirado', 400);
    }

    // Validar que el email del usuario coincida con la invitación
    const user = await User.findById(userId);
    if (!user || user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new AppError('Esta invitación no es para tu cuenta', 403);
    }

    // Actualizar estado de la invitación
    invitation.status = 'accepted';
    invitation.respondedAt = new Date();

    // Agregar usuario como miembro
    const existingMember = group.members.find((m) => m.user.toString() === userId);
    if (existingMember) {
      throw new AppError('Ya eres miembro de este grupo', 400);
    }

    group.members.push({
      user: new mongoose.Types.ObjectId(userId),
      role: 'member',
      joinedAt: new Date(),
    });

    await this.ensureRanking(userId, group);
    return await group.save();
  }

  async rejectInvitation(groupId: string, invitationId: string, userId: string): Promise<IGroup> {
    const group = await Group.findById(groupId);
    if (!group) {
      throw new AppError('Grupo no encontrado', 404);
    }

    const invitation = group.invitations.find((inv) => inv._id.toString() === invitationId);
    if (!invitation) {
      throw new AppError('Invitación no encontrada', 404);
    }

    if (invitation.status !== 'pending') {
      throw new AppError('Esta invitación ya no es válida', 400);
    }

    // Validar que el email del usuario coincida con la invitación
    const user = await User.findById(userId);
    if (!user || user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new AppError('Esta invitación no es para tu cuenta', 403);
    }

    invitation.status = 'rejected';
    invitation.respondedAt = new Date();

    return await group.save();
  }

  async cancelInvitation(groupId: string, invitationId: string, userId: string): Promise<IGroup> {
    const group = await Group.findById(groupId);
    if (!group) {
      throw new AppError('Grupo no encontrado', 404);
    }

    if (group.owner.toString() !== userId) {
      throw new AppError('Solo el owner puede cancelar invitaciones', 403);
    }

    const invitation = group.invitations.find((inv) => inv._id.toString() === invitationId);
    if (!invitation) {
      throw new AppError('Invitación no encontrada', 404);
    }

    if (invitation.status !== 'pending') {
      throw new AppError('Solo se pueden cancelar invitaciones pendientes', 400);
    }

    invitation.status = 'cancelled';
    invitation.respondedAt = new Date();

    return await group.save();
  }

  async searchGroups(query: string, gameType?: string, page: number = 1, limit: number = 20): Promise<{ groups: IGroup[]; total: number }> {
    const searchQuery: any = {
      isActive: true,
      'settings.isPublic': true,
    };

    // Búsqueda por texto en nombre, descripción y tags
    if (query && query.trim()) {
      searchQuery.$text = { $search: query.trim() };
    }

    // Filtrar por juego soportado
    if (gameType && gameType.trim()) {
      searchQuery.supportedGames = gameType.trim();
    }

    const groups = await Group.find(searchQuery)
      .populate('owner', 'username displayName avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await Group.countDocuments(searchQuery);

    return { groups: groups as unknown as IGroup[], total };
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
