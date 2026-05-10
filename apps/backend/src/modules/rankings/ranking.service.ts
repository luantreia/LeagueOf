import { Ranking, IRanking } from './ranking.model';
import { Group } from '@/modules/groups/group.model';
import { Match } from '@/modules/matches/match.model';
import { RedisClient } from '@/core/cache/redis';
import { AppError } from '@/shared/utils/app-error';
import { logger } from '@/core/logging/logger';

export class RankingService {
  private redis = RedisClient.getInstance();

  /**
   * Initialize ranking for a user in a group
   */
  async initializeRanking(userId: string, groupId: string): Promise<IRanking> {
    const group = await Group.findById(groupId);
    if (!group) {
      throw new AppError('Group not found', 404);
    }

    const existingRanking = await Ranking.findOne({ user: userId, group: groupId });
    if (existingRanking) {
      return existingRanking;
    }

    const rankingData: Record<string, unknown> = {
      user: userId,
      group: groupId,
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
      rankingData.elo = {
        rating: group.rankingConfig.eloSettings?.initialRating || 1200,
        peak: group.rankingConfig.eloSettings?.initialRating || 1200,
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

    const ranking = await Ranking.create(rankingData);
    logger.info(`Ranking initialized for user ${userId} in group ${groupId}`);

    return ranking;
  }

  /**
   * Initialize ranking for a guest in a group
   */
  async initializeGuestRanking(guestId: string, groupId: string): Promise<IRanking> {
    const group = await Group.findById(groupId);
    if (!group) {
      throw new AppError('Group not found', 404);
    }

    const existingRanking = await Ranking.findOne({ guest: guestId, group: groupId });
    if (existingRanking) {
      return existingRanking;
    }

    const rankingData: Record<string, unknown> = {
      guest: guestId,
      group: groupId,
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
      rankingData.elo = {
        rating: group.rankingConfig.eloSettings?.initialRating || 1200,
        peak: group.rankingConfig.eloSettings?.initialRating || 1200,
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

    const ranking = await Ranking.create(rankingData);
    logger.info(`Ranking initialized for guest ${guestId} in group ${groupId}`);

    return ranking;
  }

  /**
   * Update rankings after a match completes
   */
  async updateRankingsAfterMatch(matchId: string): Promise<void> {
    const match = await Match.findById(matchId).populate('group');
    if (!match || match.status !== 'completed' || !match.isRanked) {
      throw new AppError('Invalid match for ranking update', 400);
    }

    const group = match.group as any;
    
    if (group.rankingConfig.mode === 'elo') {
      await this.updateEloRankings(match, group);
    } else {
      await this.updatePointsRankings(match, group);
    }

    // Invalidate cache
    await this.invalidateRankingCache(group._id);

    logger.info(`Rankings updated for match ${matchId}`);
  }

  /**
   * ELO ranking update algorithm
   */
  private async updateEloRankings(match: any, group: any): Promise<void> {
    const kFactor = group.rankingConfig.eloSettings?.kFactor || 32;

    // Process each team
    for (let teamIndex = 0; teamIndex < match.teams.length; teamIndex++) {
      const team = match.teams[teamIndex];
      const isWinner = match.winner === teamIndex;
      const isDraw = match.winner === undefined || match.winner === null;

      for (const player of team.players) {
        let ranking: any;

        if (player.user) {
          // User ranking
          ranking = await Ranking.findOne({
            user: player.user,
            group: group._id,
          });

          if (!ranking) {
            ranking = await this.initializeRanking(player.user.toString(), group._id);
          }
        } else if (player.guest) {
          // Guest ranking
          ranking = await Ranking.findOne({
            guest: player.guest,
            group: group._id,
          });

          if (!ranking) {
            ranking = await this.initializeGuestRanking(player.guest.toString(), group._id);
          }
        } else {
          continue; // Skip if neither user nor guest
        }

        const currentRating = ranking.elo!.rating;

        // Calculate expected score
        const opponentRatings = await this.getOpponentRatings(match, teamIndex, group._id);
        const avgOpponentRating = opponentRatings.reduce((a, b) => a + b, 0) / opponentRatings.length;
        
        const expectedScore = 1 / (1 + Math.pow(10, (avgOpponentRating - currentRating) / 400));

        // Actual score: 1 for win, 0.5 for draw, 0 for loss
        const actualScore = isWinner ? 1 : isDraw ? 0.5 : 0;

        // Calculate rating change
        const ratingChange = Math.round(kFactor * (actualScore - expectedScore));
        const newRating = Math.max(
          group.rankingConfig.eloSettings?.minRating || 0,
          Math.min(
            group.rankingConfig.eloSettings?.maxRating || 3000,
            currentRating + ratingChange
          )
        );

        // Update ranking
        ranking.elo!.rating = newRating;
        ranking.elo!.peak = Math.max(ranking.elo!.peak, newRating);
        ranking.elo!.history.push({
          match: match._id,
          before: currentRating,
          after: newRating,
          change: ratingChange,
          date: new Date(),
        });

        // Update stats
        this.updateRankingStats(ranking, isWinner ? 'win' : isDraw ? 'draw' : 'loss');

        await ranking.save();
      }
    }
  }

  /**
   * Points-based ranking update
   */
  private async updatePointsRankings(match: any, group: any): Promise<void> {
    const pointsConfig = group.rankingConfig.pointsSettings;

    for (let teamIndex = 0; teamIndex < match.teams.length; teamIndex++) {
      const team = match.teams[teamIndex];
      const isWinner = match.winner === teamIndex;
      const isDraw = match.winner === undefined || match.winner === null;

      for (const player of team.players) {
        let ranking: any;

        if (player.user) {
          // User ranking
          ranking = await Ranking.findOne({
            user: player.user,
            group: group._id,
          });

          if (!ranking) {
            ranking = await this.initializeRanking(player.user.toString(), group._id);
          }
        } else if (player.guest) {
          // Guest ranking
          ranking = await Ranking.findOne({
            guest: player.guest,
            group: group._id,
          });

          if (!ranking) {
            ranking = await this.initializeGuestRanking(player.guest.toString(), group._id);
          }
        } else {
          continue; // Skip if neither user nor guest
        }

        let pointsEarned = 0;
        let reason = '';

        if (isWinner) {
          pointsEarned += pointsConfig?.winPoints || 3;
          reason = 'Win';
        } else if (isDraw) {
          pointsEarned += pointsConfig?.drawPoints || 1;
          reason = 'Draw';
        } else {
          pointsEarned += pointsConfig?.lossPoints || -1;
          reason = 'Loss';
        }

        // Add bonus points from player stats
        if (player.stats) {
          if (player.stats.kills && pointsConfig?.killPoints) {
            pointsEarned += player.stats.kills * pointsConfig.killPoints;
          }
          if (player.stats.deaths && pointsConfig?.deathPoints) {
            pointsEarned += player.stats.deaths * pointsConfig.deathPoints;
          }
          if (player.stats.assists && pointsConfig?.assistPoints) {
            pointsEarned += player.stats.assists * pointsConfig.assistPoints;
          }
        }

        // Update ranking
        ranking.points!.total += pointsEarned;
        ranking.points!.history.push({
          match: match._id,
          points: pointsEarned,
          reason,
          date: new Date(),
        });

        if (isWinner) {
          ranking.points!.wins += 1;
        } else if (isDraw) {
          ranking.points!.draws += 1;
        } else {
          ranking.points!.losses += 1;
        }

        // Update stats
        this.updateRankingStats(ranking, isWinner ? 'win' : isDraw ? 'draw' : 'loss');

        await ranking.save();
      }
    }
  }

  /**
   * Get opponent ratings for ELO calculation
   */
  private async getOpponentRatings(
    match: any,
    teamIndex: number,
    groupId: string
  ): Promise<number[]> {
    const ratings: number[] = [];

    for (let i = 0; i < match.teams.length; i++) {
      if (i !== teamIndex) {
        for (const player of match.teams[i].players) {
          let ranking: any;

          if (player.user) {
            ranking = await Ranking.findOne({
              user: player.user,
              group: groupId,
            });
          } else if (player.guest) {
            ranking = await Ranking.findOne({
              guest: player.guest,
              group: groupId,
            });
          } else {
            continue; // Skip if neither user nor guest
          }

          ratings.push(ranking?.elo?.rating || 1200);
        }
      }
    }

    return ratings;
  }

  /**
   * Update ranking statistics
   */
  private updateRankingStats(ranking: IRanking, result: 'win' | 'loss' | 'draw'): void {
    ranking.stats.matchesPlayed += 1;
    ranking.stats.lastMatchDate = new Date();

    if (result === 'win') {
      ranking.stats.wins += 1;
      ranking.stats.currentStreak = ranking.stats.currentStreak >= 0 
        ? ranking.stats.currentStreak + 1 
        : 1;
    } else if (result === 'loss') {
      ranking.stats.losses += 1;
      ranking.stats.currentStreak = ranking.stats.currentStreak <= 0 
        ? ranking.stats.currentStreak - 1 
        : -1;
    } else {
      ranking.stats.draws += 1;
      ranking.stats.currentStreak = 0;
    }

    ranking.stats.bestStreak = Math.max(
      ranking.stats.bestStreak,
      Math.abs(ranking.stats.currentStreak)
    );
  }

  /**
   * Get leaderboard for a group
   */
  async getLeaderboard(
    groupId: string,
    page: number = 1,
    limit: number = 50,
    gameType?: string
  ): Promise<{ rankings: IRanking[]; total: number }> {
    const group = await Group.findById(groupId);
    if (!group) {
      throw new AppError('Group not found', 404);
    }

    const normalizedGameType = gameType?.trim();
    if (normalizedGameType) {
      return this.getGameLeaderboard(group, page, limit, normalizedGameType);
    }

    await this.ensureGroupRankingsForMembers(group);

    const cacheKey = `leaderboard:${groupId}:${page}:${limit}`;

    const sortField = group.rankingConfig.mode === 'elo' ? 'elo.rating' : 'points.total';

    const rankings = await Ranking.find({ group: groupId, isActive: true })
      .sort({ [sortField]: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('user', 'username displayName avatar')
      .populate('guest', 'name email')
      .lean();

    const total = await Ranking.countDocuments({ group: groupId, isActive: true });

    // Update ranks
    rankings.forEach((ranking, index) => {
      (ranking as any).rank = (page - 1) * limit + index + 1;
    });

    const result = { rankings: rankings as unknown as IRanking[], total };

    // Cache for 5 minutes
    await this.redis.set(cacheKey, result, 300);

    return result;
  }

  private async getGameLeaderboard(
    group: any,
    page: number,
    limit: number,
    gameType: string
  ): Promise<{ rankings: IRanking[]; total: number }> {
    const initialRating = group.rankingConfig.eloSettings?.initialRating || 1200;
    const rankingType = group.rankingConfig.mode;
    const gameTypeRegex = new RegExp(`^${this.escapeRegExp(gameType)}$`, 'i');
    const matches = await Match.find({
      group: group._id,
      status: 'completed',
      isRanked: true,
      gameType: gameTypeRegex,
    })
      .sort({ completedAt: 1, createdAt: 1 })
      .populate('teams.players.user', 'username displayName avatar')
      .populate('teams.players.guest', 'name email')
      .lean();

    const rankingMap = new Map<string, any>();

    for (const match of matches as any[]) {
      const ratingSnapshot = new Map(
        Array.from(rankingMap.entries()).map(([key, ranking]) => [
          key,
          ranking.elo?.rating ?? initialRating,
        ])
      );

      for (let teamIndex = 0; teamIndex < match.teams.length; teamIndex++) {
        const team = match.teams[teamIndex];
        const isWinner = match.winner === teamIndex;
        const isDraw = match.winner === undefined || match.winner === null;

        for (const player of team.players || []) {
          const ranking = this.getOrCreateGameRanking(rankingMap, player, group, match);
          if (!ranking) continue;

          if (rankingType === 'elo') {
            const currentRating = ratingSnapshot.get(ranking._id) ?? initialRating;
            const opponentRatings = this.getGameOpponentRatings(
              match,
              teamIndex,
              ratingSnapshot,
              rankingMap,
              group,
              initialRating
            );
            const avgOpponentRating = opponentRatings.length
              ? opponentRatings.reduce((sum, rating) => sum + rating, 0) / opponentRatings.length
              : initialRating;
            const expectedScore = 1 / (1 + Math.pow(10, (avgOpponentRating - currentRating) / 400));
            const actualScore = isWinner ? 1 : isDraw ? 0.5 : 0;
            const ratingChange = Math.round((group.rankingConfig.eloSettings?.kFactor || 32) * (actualScore - expectedScore));
            const newRating = Math.max(
              group.rankingConfig.eloSettings?.minRating || 0,
              Math.min(group.rankingConfig.eloSettings?.maxRating || 3000, currentRating + ratingChange)
            );

            ranking.elo.rating = newRating;
            ranking.elo.peak = Math.max(ranking.elo.peak, newRating);
          } else {
            const pointsConfig = group.rankingConfig.pointsSettings;
            let pointsEarned = isWinner
              ? pointsConfig?.winPoints || 3
              : isDraw
                ? pointsConfig?.drawPoints || 1
                : pointsConfig?.lossPoints || -1;

            if (player.stats) {
              if (player.stats.kills && pointsConfig?.killPoints) {
                pointsEarned += player.stats.kills * pointsConfig.killPoints;
              }
              if (player.stats.deaths && pointsConfig?.deathPoints) {
                pointsEarned += player.stats.deaths * pointsConfig.deathPoints;
              }
              if (player.stats.assists && pointsConfig?.assistPoints) {
                pointsEarned += player.stats.assists * pointsConfig.assistPoints;
              }
            }

            ranking.points.total += pointsEarned;
            if (isWinner) ranking.points.wins += 1;
            else if (isDraw) ranking.points.draws += 1;
            else ranking.points.losses += 1;
          }

          this.updateRankingStatsData(ranking.stats, isWinner ? 'win' : isDraw ? 'draw' : 'loss');
          ranking.stats.lastMatchDate = match.completedAt || match.updatedAt || match.createdAt;
        }
      }
    }

    const sortField = rankingType === 'elo' ? 'elo' : 'points';
    const rankings = Array.from(rankingMap.values())
      .sort((a, b) => {
        const scoreA = sortField === 'elo' ? a.elo.rating : a.points.total;
        const scoreB = sortField === 'elo' ? b.elo.rating : b.points.total;
        return scoreB - scoreA;
      })
      .map((ranking, index) => ({ ...ranking, rank: index + 1 }));

    const total = rankings.length;
    const paginatedRankings = rankings.slice((page - 1) * limit, page * limit);

    return {
      rankings: paginatedRankings as unknown as IRanking[],
      total,
    };
  }

  private getOrCreateGameRanking(rankingMap: Map<string, any>, player: any, group: any, match: any): any | null {
    const user = player.user;
    const guest = player.guest;
    const userId = user?._id?.toString() || user?.toString();
    const guestId = guest?._id?.toString() || guest?.toString();
    const key = userId ? `user:${userId}` : guestId ? `guest:${guestId}` : null;
    if (!key) return null;

    const existingRanking = rankingMap.get(key);
    if (existingRanking) return existingRanking;

    const initialRating = group.rankingConfig.eloSettings?.initialRating || 1200;
    const ranking = {
      _id: key,
      user: userId ? user : undefined,
      guest: guestId ? guest : undefined,
      group: group._id,
      rankingType: group.rankingConfig.mode,
      createdAt: match.completedAt || match.createdAt,
      updatedAt: match.completedAt || match.updatedAt || match.createdAt,
      isActive: true,
      stats: {
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        winRate: 0,
        currentStreak: 0,
        bestStreak: 0,
      },
      elo: {
        rating: initialRating,
        peak: initialRating,
        history: [],
      },
      points: {
        total: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        history: [],
      },
    };

    rankingMap.set(key, ranking);
    return ranking;
  }

  private getGameOpponentRatings(
    match: any,
    teamIndex: number,
    ratingSnapshot: Map<string, number>,
    rankingMap: Map<string, any>,
    group: any,
    initialRating: number
  ): number[] {
    const ratings: number[] = [];

    for (let index = 0; index < match.teams.length; index++) {
      if (index === teamIndex) continue;

      for (const player of match.teams[index].players || []) {
        const ranking = this.getOrCreateGameRanking(rankingMap, player, group, match);
        if (!ranking) continue;
        ratings.push(ratingSnapshot.get(ranking._id) ?? initialRating);
      }
    }

    return ratings;
  }

  private updateRankingStatsData(stats: any, result: 'win' | 'loss' | 'draw'): void {
    stats.matchesPlayed += 1;

    if (result === 'win') {
      stats.wins += 1;
      stats.currentStreak = stats.currentStreak >= 0 ? stats.currentStreak + 1 : 1;
    } else if (result === 'loss') {
      stats.losses += 1;
      stats.currentStreak = stats.currentStreak <= 0 ? stats.currentStreak - 1 : -1;
    } else {
      stats.draws += 1;
      stats.currentStreak = 0;
    }

    stats.bestStreak = Math.max(stats.bestStreak, Math.abs(stats.currentStreak));
    stats.winRate = stats.matchesPlayed > 0 ? (stats.wins / stats.matchesPlayed) * 100 : 0;
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private async ensureGroupRankingsForMembers(group: any): Promise<void> {
    for (const member of group.members || []) {
      const userId = member.user?.toString();
      if (!userId) continue;

      const existingRanking = await Ranking.findOne({ user: userId, group: group._id });
      if (existingRanking) continue;

      const rankingData: any = {
        user: member.user,
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

  /**
   * Get user ranking in a group
   */
  async getUserRanking(userId: string, groupId: string): Promise<IRanking | null> {
    const ranking = await Ranking.findOne({ user: userId, group: groupId })
      .populate('user', 'username displayName avatar')
      .lean();

    if (!ranking) {
      return null;
    }

    // Calculate rank
    const group = await Group.findById(groupId);
    if (group) {
      const sortField = group.rankingConfig.mode === 'elo' ? 'elo.rating' : 'points.total';
      const value = group.rankingConfig.mode === 'elo' 
        ? (ranking as any).elo.rating 
        : (ranking as any).points.total;

      const rank = await Ranking.countDocuments({
        group: groupId,
        isActive: true,
        [sortField]: { $gt: value },
      }) + 1;

      (ranking as any).rank = rank;
    }

    return ranking as unknown as IRanking;
  }

  /**
   * Invalidate ranking cache
   */
  private async invalidateRankingCache(groupId: string): Promise<void> {
    const pattern = `leaderboard:${groupId}:*`;
    // Note: In production, you'd want to implement a proper cache invalidation strategy
    logger.debug(`Invalidating cache for pattern: ${pattern}`);
  }
}
