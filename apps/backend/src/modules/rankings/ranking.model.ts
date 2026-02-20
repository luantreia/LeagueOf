import mongoose, { Schema, Document } from 'mongoose';

export interface IRanking extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  group: mongoose.Types.ObjectId;
  rankingType: 'elo' | 'points';
  
  // ELO System
  elo?: {
    rating: number;
    peak: number;
    history: Array<{
      match: mongoose.Types.ObjectId;
      before: number;
      after: number;
      change: number;
      date: Date;
    }>;
  };
  
  // Points System
  points?: {
    total: number;
    wins: number;
    losses: number;
    draws: number;
    history: Array<{
      match: mongoose.Types.ObjectId;
      points: number;
      reason: string;
      date: Date;
    }>;
  };
  
  // Common stats
  stats: {
    matchesPlayed: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
    currentStreak: number;
    bestStreak: number;
    lastMatchDate?: Date;
  };
  
  rank?: number;
  tier?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const rankingSchema = new Schema<IRanking>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    group: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
      index: true,
    },
    rankingType: {
      type: String,
      enum: ['elo', 'points'],
      required: true,
    },
    
    // ELO fields
    elo: {
      rating: {
        type: Number,
        default: 1200,
      },
      peak: {
        type: Number,
        default: 1200,
      },
      history: [
        {
          match: {
            type: Schema.Types.ObjectId,
            ref: 'Match',
          },
          before: Number,
          after: Number,
          change: Number,
          date: {
            type: Date,
            default: Date.now,
          },
        },
      ],
    },
    
    // Points fields
    points: {
      total: {
        type: Number,
        default: 0,
      },
      wins: {
        type: Number,
        default: 0,
      },
      losses: {
        type: Number,
        default: 0,
      },
      draws: {
        type: Number,
        default: 0,
      },
      history: [
        {
          match: {
            type: Schema.Types.ObjectId,
            ref: 'Match',
          },
          points: Number,
          reason: String,
          date: {
            type: Date,
            default: Date.now,
          },
        },
      ],
    },
    
    stats: {
      matchesPlayed: {
        type: Number,
        default: 0,
      },
      wins: {
        type: Number,
        default: 0,
      },
      losses: {
        type: Number,
        default: 0,
      },
      draws: {
        type: Number,
        default: 0,
      },
      winRate: {
        type: Number,
        default: 0,
      },
      currentStreak: {
        type: Number,
        default: 0,
      },
      bestStreak: {
        type: Number,
        default: 0,
      },
      lastMatchDate: {
        type: Date,
      },
    },
    
    rank: {
      type: Number,
    },
    tier: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
rankingSchema.index({ user: 1, group: 1 }, { unique: true });
rankingSchema.index({ group: 1, 'elo.rating': -1 });
rankingSchema.index({ group: 1, 'points.total': -1 });
rankingSchema.index({ group: 1, 'stats.winRate': -1 });
rankingSchema.index({ isActive: 1 });

// Calculate win rate before saving
rankingSchema.pre('save', function (next) {
  const totalGames = this.stats.wins + this.stats.losses + this.stats.draws;
  if (totalGames > 0) {
    this.stats.winRate = (this.stats.wins / totalGames) * 100;
  }
  next();
});

export const Ranking = mongoose.model<IRanking>('Ranking', rankingSchema);
