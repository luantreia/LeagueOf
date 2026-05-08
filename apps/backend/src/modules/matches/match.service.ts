import mongoose from 'mongoose';
import { Group } from '@/modules/groups/group.model';
import { Match, IMatch } from './match.model';
import { RankingService } from '@/modules/rankings/ranking.service';
import { AppError } from '@/shared/utils/app-error';

export class MatchService {
  private rankingService = new RankingService();

  async getMatches(userId: string, params: any = {}): Promise<IMatch[]> {
    const query: any = {};

    if (params.groupId) {
      query.group = params.groupId;
      await this.assertGroupMember(params.groupId, userId);
    } else {
      const groups = await Group.find({ isActive: true, 'members.user': userId }).select('_id');
      query.group = { $in: groups.map((group) => group._id) };
    }

    if (params.status) {
      query.status = params.status;
    }

    return await Match.find(query)
      .populate('group', 'name handle rankingConfig')
      .populate('createdBy', 'username displayName avatar')
      .populate('teams.players.user', 'username displayName avatar')
      .sort({ createdAt: -1 })
      .limit(Number(params.limit) || 50);
  }

  async getMatch(id: string, userId: string): Promise<IMatch> {
    const match = await Match.findById(id)
      .populate('group', 'name handle rankingConfig')
      .populate('createdBy', 'username displayName avatar')
      .populate('teams.players.user', 'username displayName avatar');

    if (!match) {
      throw new AppError('Partida no encontrada', 404);
    }

    const groupId = ((match.group as any)._id || match.group).toString();
    await this.assertGroupMember(groupId, userId);
    return match;
  }

  async createMatch(data: any, userId: string): Promise<IMatch> {
    const group = await this.assertGroupMember(data.groupId, userId);

    if (!group.settings.allowMatchCreation) {
      throw new AppError('Este grupo no permite crear partidas', 403);
    }

    if (!Array.isArray(data.teams) || data.teams.length < 2) {
      throw new AppError('La partida necesita al menos dos equipos', 400);
    }

    const allowedPlayers = new Set(group.members.map((member) => member.user.toString()));
    const normalizedTeams = data.teams.map((team: any, teamIndex: number) => {
      if (!Array.isArray(team.players) || team.players.length === 0) {
        throw new AppError(`El equipo ${teamIndex + 1} no tiene jugadores`, 400);
      }

      return {
        name: team.name || `Equipo ${teamIndex + 1}`,
        score: Number(team.score) || 0,
        players: team.players.map((player: any) => {
          const userIdValue = typeof player === 'string' ? player : player.user;
          if (!allowedPlayers.has(userIdValue)) {
            throw new AppError('Todos los jugadores deben pertenecer al grupo', 400);
          }

          return {
            user: new mongoose.Types.ObjectId(userIdValue),
            stats: typeof player === 'object' ? player.stats || {} : {},
          };
        }),
      };
    });

    const match = await Match.create({
      group: group._id,
      name: data.name || `${group.name} Match`,
      gameType: data.gameType || 'custom',
      status: data.status || 'in_progress',
      startedAt: new Date(),
      teams: normalizedTeams,
      createdBy: new mongoose.Types.ObjectId(userId),
      metadata: {
        map: data.map,
        mode: data.mode,
        source: 'group-lobby',
      },
      isRanked: data.isRanked !== false,
    });

    return await this.getMatch(match._id.toString(), userId);
  }

  async completeMatch(id: string, data: any, userId: string): Promise<IMatch> {
    const match = await Match.findById(id);
    if (!match) {
      throw new AppError('Partida no encontrada', 404);
    }

    const group = await this.assertGroupMember(match.group.toString(), userId);
    const canComplete = match.createdBy.toString() === userId || group.owner.toString() === userId;
    if (!canComplete) {
      throw new AppError('Solo el creador u owner del grupo puede completar la partida', 403);
    }

    if (match.status === 'completed') {
      throw new AppError('La partida ya fue completada', 400);
    }

    const winner = data.winner === null || data.winner === undefined || data.winner === 'draw'
      ? undefined
      : Number(data.winner);

    if (winner !== undefined && (Number.isNaN(winner) || winner < 0 || winner >= match.teams.length)) {
      throw new AppError('Ganador invalido', 400);
    }

    if (Array.isArray(data.scores)) {
      data.scores.forEach((score: any, index: number) => {
        if (match.teams[index]) {
          match.teams[index].score = Number(score) || 0;
        }
      });
    }

    match.teams.forEach((team: any, index: number) => {
      team.result = winner === undefined ? 'draw' : winner === index ? 'win' : 'loss';
    });

    match.winner = winner;
    match.status = 'completed';
    match.completedAt = new Date();

    await match.save();

    group.stats.totalMatches = (group.stats.totalMatches || 0) + 1;
    await group.save();

    if (match.isRanked) {
      await this.rankingService.updateRankingsAfterMatch(match._id.toString());
    }

    return await this.getMatch(match._id.toString(), userId);
  }

  private async assertGroupMember(groupId: string, userId: string) {
    const group = await Group.findOne({ _id: groupId, isActive: true });
    if (!group) {
      throw new AppError('Grupo no encontrado', 404);
    }

    const isMember = group.members.some((member) => member.user.toString() === userId);
    if (!isMember) {
      throw new AppError('Debes pertenecer al grupo para operar partidas', 403);
    }

    return group;
  }
}
