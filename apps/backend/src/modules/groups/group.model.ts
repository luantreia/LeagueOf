import mongoose, { Schema, Document } from 'mongoose';

export interface IGroup extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  handle: string;
  description?: string;
  owner: mongoose.Types.ObjectId;
  members: Array<{
    user: mongoose.Types.ObjectId;
    role: 'owner' | 'admin' | 'member';
    joinedAt: Date;
  }>;
  settings: {
    isPublic: boolean;
    maxMembers: number;
    requireApproval: boolean;
    allowMatchCreation: boolean;
  };
  rankingConfig: {
    mode: 'elo' | 'points';
    eloSettings?: {
      kFactor: number;
      initialRating: number;
      minRating: number;
      maxRating: number;
    };
    pointsSettings?: {
      winPoints: number;
      lossPoints: number;
      drawPoints: number;
      killPoints?: number;
      deathPoints?: number;
      assistPoints?: number;
    };
  };
  supportedGames: string[];
  tags: string[];
  stats: {
    totalMatches: number;
    totalMembers: number;
    activeMembers: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const groupSchema = new Schema<IGroup>(
  {
    name: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
      minlength: [3, 'El nombre debe tener al menos 3 caracteres'],
      maxlength: [100, 'El nombre es demasiado largo'],
      index: true,
    },
    handle: {
      type: String,
      required: [true, 'El identificador único es obligatorio'],
      unique: true,
      lowercase: true,
      trim: true,
      minlength: [3, 'El identificador debe tener al menos 3 caracteres'],
      index: true,
    },
    description: {
      type: String,
      maxlength: [500, 'La descripción es demasiado larga'],
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
          enum: ['owner', 'admin', 'member'],
          default: 'member',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    settings: {
      isPublic: {
        type: Boolean,
        default: true,
      },
      maxMembers: {
        type: Number,
        default: 100,
        min: 2,
        max: 10000,
      },
      requireApproval: {
        type: Boolean,
        default: false,
      },
      allowMatchCreation: {
        type: Boolean,
        default: true,
      },
    },
    rankingConfig: {
      mode: {
        type: String,
        enum: ['elo', 'points'],
        required: true,
        default: 'elo',
      },
      eloSettings: {
        kFactor: {
          type: Number,
          default: 32,
          min: 10,
          max: 64,
        },
        initialRating: {
          type: Number,
          default: 1200,
          min: 0,
        },
        minRating: {
          type: Number,
          default: 0,
        },
        maxRating: {
          type: Number,
          default: 3000,
        },
      },
      pointsSettings: {
        winPoints: {
          type: Number,
          default: 3,
        },
        lossPoints: {
          type: Number,
          default: -1,
        },
        drawPoints: {
          type: Number,
          default: 1,
        },
        killPoints: {
          type: Number,
          default: 0,
        },
        deathPoints: {
          type: Number,
          default: 0,
        },
        assistPoints: {
          type: Number,
          default: 0,
        },
      },
    },
    supportedGames: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
    stats: {
      totalMatches: {
        type: Number,
        default: 0,
      },
      totalMembers: {
        type: Number,
        default: 0,
      },
      activeMembers: {
        type: Number,
        default: 0,
      },
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

// Indexes
groupSchema.index({ name: 'text', description: 'text', tags: 'text' });
groupSchema.index({ owner: 1 });
groupSchema.index({ 'members.user': 1 });
groupSchema.index({ isActive: 1, 'settings.isPublic': 1 });
groupSchema.index({ supportedGames: 1 });
groupSchema.index({ createdAt: -1 });

export const Group = mongoose.model<IGroup>('Group', groupSchema);
