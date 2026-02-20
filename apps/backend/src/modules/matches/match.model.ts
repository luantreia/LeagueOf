import mongoose, { Schema, Document } from 'mongoose';

export interface IMatch extends Document {
  _id: mongoose.Types.ObjectId;
  group: mongoose.Types.ObjectId;
  name: string;
  gameType: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  teams: Array<{
    name: string;
    players: Array<{
      user: mongoose.Types.ObjectId;
      stats?: {
        kills?: number;
        deaths?: number;
        assists?: number;
        score?: number;
        [key: string]: any;
      };
    }>;
    score?: number;
    result?: 'win' | 'loss' | 'draw';
  }>;
  winner?: number; // Team index
  createdBy: mongoose.Types.ObjectId;
  metadata: {
    duration?: number; // in seconds
    map?: string;
    mode?: string;
    [key: string]: any;
  };
  isRanked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const matchSchema = new Schema<IMatch>(
  {
    group: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    gameType: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    scheduledAt: {
      type: Date,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    teams: [
      {
        name: {
          type: String,
          required: true,
        },
        players: [
          {
            user: {
              type: Schema.Types.ObjectId,
              ref: 'User',
              required: true,
            },
            stats: {
              type: Schema.Types.Mixed,
              default: {},
            },
          },
        ],
        score: {
          type: Number,
          default: 0,
        },
        result: {
          type: String,
          enum: ['win', 'loss', 'draw'],
        },
      },
    ],
    winner: {
      type: Number,
      min: 0,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    isRanked: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
matchSchema.index({ group: 1, status: 1 });
matchSchema.index({ 'teams.players.user': 1 });
matchSchema.index({ completedAt: -1 });
matchSchema.index({ createdAt: -1 });
matchSchema.index({ isRanked: 1, status: 1 });

export const Match = mongoose.model<IMatch>('Match', matchSchema);
