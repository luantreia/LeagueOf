export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
} as const;

export const MATCH_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const RANKING_TYPES = {
  ELO: 'elo',
  POINTS: 'points',
} as const;

export const NOTIFICATION_TYPES = {
  MATCH: 'match',
  LOBBY: 'lobby',
  GROUP: 'group',
  RANKING: 'ranking',
  SYSTEM: 'system',
  CUSTOM: 'custom',
} as const;

export const NOTIFICATION_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export const LOBBY_STATUS = {
  WAITING: 'waiting',
  READY: 'ready',
  STARTING: 'starting',
  IN_PROGRESS: 'in_progress',
} as const;

export const SOCKET_EVENTS = {
  // Lobby events
  LOBBY_CREATE: 'lobby:create',
  LOBBY_CREATED: 'lobby:created',
  LOBBY_JOIN: 'lobby:join',
  LOBBY_JOINED: 'lobby:joined',
  LOBBY_LEAVE: 'lobby:leave',
  LOBBY_LEFT: 'lobby:left',
  LOBBY_PLAYER_JOINED: 'lobby:player_joined',
  LOBBY_PLAYER_LEFT: 'lobby:player_left',
  LOBBY_TOGGLE_READY: 'lobby:toggle_ready',
  LOBBY_UPDATED: 'lobby:updated',
  LOBBY_ALL_READY: 'lobby:all_ready',
  LOBBY_START_MATCH: 'lobby:start_match',
  LOBBY_MATCH_STARTING: 'lobby:match_starting',
  LOBBY_MATCH_STARTED: 'lobby:match_started',
  LOBBY_TEAMS_SHUFFLED: 'lobby:teams_shuffled',
  LOBBY_LIST: 'lobby:list',
  LOBBY_ERROR: 'lobby:error',
  
  // Notification events
  NOTIFICATION_NEW: 'notification:new',
  NOTIFICATION_GET_UNREAD_COUNT: 'notification:get_unread_count',
  NOTIFICATION_UNREAD_COUNT: 'notification:unread_count',
  NOTIFICATION_MARK_READ: 'notification:mark_read',
  NOTIFICATION_MARKED_READ: 'notification:marked_read',
  NOTIFICATION_MARK_ALL_READ: 'notification:mark_all_read',
  NOTIFICATION_ALL_MARKED_READ: 'notification:all_marked_read',
} as const;
