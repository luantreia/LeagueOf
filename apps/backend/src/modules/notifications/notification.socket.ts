import { Server, Socket } from 'socket.io';
import { logger } from '@/core/logging/logger';

export class NotificationSocketHandler {
  static handleConnection(io: Server, socket: Socket & { userId?: string }): void {
    logger.debug(`Notification socket handler connected for user: ${socket.userId}`);
    
    // Join user's notification room
    if (socket.userId) {
      socket.join(`notifications:${socket.userId}`);
    }
  }
}

// Export helper function to emit notifications
export const emitNotification = (
  io: Server,
  userId: string,
  notification: any
): void => {
  io.to(`notifications:${userId}`).emit('notification:new', notification);
};
