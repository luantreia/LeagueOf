import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '@/config/environment';
import { logger } from '@/core/logging/logger';
import { LobbySocketHandler } from '@/modules/lobbies/lobby.socket';
import { NotificationSocketHandler } from '@/modules/notifications/notification.socket';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const setupSocketIO = (io: Server): void => {
  // Authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, config.jwt.secret) as {
        id: string;
        email: string;
        role: string;
      };

      socket.userId = decoded.id;
      socket.user = decoded;
      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`Client connected: ${socket.id}, User: ${socket.userId}`);

    // Join user's personal room for notifications
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    // Setup handlers
    LobbySocketHandler.handleConnection(io, socket);
    NotificationSocketHandler.handleConnection(io, socket);

    // Disconnection handler
    socket.on('disconnect', (reason) => {
      logger.info(`Client disconnected: ${socket.id}, Reason: ${reason}`);
      LobbySocketHandler.handleDisconnection(io, socket);
    });

    // Error handler
    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}:`, error);
    });
  });

  logger.info('Socket.IO initialized');
};
