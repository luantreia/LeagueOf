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
        let ranking: any = await Ranking.findOne({
          user: player.user,
          group: group._id,
        });

        if (!ranking) {
          ranking = await this.initializeRanking(player.user.toString(), group._id);
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
        let ranking: any = await Ranking.findOne({
          user: player.user,
          group: group._id,
        });

        if (!ranking) {
          ranking = await this.initializeRanking(player.user.toString(), group._id);
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
          const ranking = await Ranking.findOne({
            user: player.user,
            group: groupId,
          });
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
    limit: number = 50
  ): Promise<{ rankings: IRanking[]; total: number }> {
    // Try cache first
    const cacheKey = `leaderboard:${groupId}:${page}:${limit}`;
    const cached = await this.redis.get<{ rankings: IRanking[]; total: number }>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const group = await Group.findById(groupId);
    if (!group) {
      throw new AppError('Group not found', 404);
    }

    const sortField = group.rankingConfig.mode === 'elo' ? 'elo.rating' : 'points.total';

    const rankings = await Ranking.find({ group: groupId, isActive: true })
      .sort({ [sortField]: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('user', 'username displayName avatar')
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
