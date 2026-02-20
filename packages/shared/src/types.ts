export interface User {
  _id: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  role: 'user' | 'admin' | 'moderator';
  isVerified: boolean;
  isActive: boolean;
  stats: {
    totalMatches: number;
    totalWins: number;
    totalLosses: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  _id: string;
  name: string;
  description?: string;
  owner: string;
  settings: {
    isPublic: boolean;
    maxMembers: number;
    requireApproval: boolean;
  };
  rankingConfig: {
    type: 'elo' | 'points';
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
    };
  };
  gameType: string;
  tags: string[];
  stats: {
    totalMatches: number;
    totalMembers: number;
    activeMembers: number;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Match {
  _id: string;
  group: string;
  name: string;
  gameType: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  teams: Array<{
    name: string;
    players: Array<{
      user: string;
      stats?: Record<string, any>;
    }>;
    score?: number;
    result?: 'win' | 'loss' | 'draw';
  }>;
  winner?: number;
  createdBy: string;
  metadata: Record<string, any>;
  isRanked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Ranking {
  _id: string;
  user: string;
  group: string;
  rankingType: 'elo' | 'points';
  elo?: {
    rating: number;
    peak: number;
  };
  points?: {
    total: number;
    wins: number;
    losses: number;
    draws: number;
  };
  stats: {
    matchesPlayed: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
    currentStreak: number;
    bestStreak: number;
  };
  rank?: number;
  tier?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  _id: string;
  user: string;
  type: 'match' | 'lobby' | 'group' | 'ranking' | 'system' | 'custom';
  title: string;
  message: string;
  data?: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  readAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Lobby {
  id: string;
  groupId: string;
  name: string;
  hostId: string;
  players: Array<{
    userId: string;
    username: string;
    socketId: string;
    isReady: boolean;
    joinedAt: Date;
  }>;
  maxPlayers: number;
  gameMode: string;
  status: 'waiting' | 'ready' | 'starting' | 'in_progress';
  settings: {
    autoShuffle: boolean;
    teamSize: number;
    numberOfTeams: number;
  };
  createdAt: Date;
}
