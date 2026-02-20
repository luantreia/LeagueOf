import { Socket } from 'socket.io';
import { Notification, INotification } from './notification.model';
import { QueueManager } from '@/core/queue/queue-manager';
import { RedisClient } from '@/core/cache/redis';
import { logger } from '@/core/logging/logger';
import mongoose from 'mongoose';

export class NotificationService {
  private redis = RedisClient.getInstance();
  private queueManager = QueueManager.getInstance();

  constructor() {
    this.queueManager.createQueue('notifications');
    this.setupNotificationWorker();
  }

  /**
   * Create and send a notification
   */
  async createNotification(data: {
    userId: string | mongoose.Types.ObjectId;
    type: string;
    title: string;
    message: string;
    data?: any;
    priority?: string;
    expiresAt?: Date;
  }): Promise<INotification> {
    const notification = await Notification.create(data);

    // Queue for processing (push notifications, email, etc.)
    await this.queueManager.addJob('notifications', {
      notificationId: notification._id,
      type: 'send',
    });

    logger.info(`Notification created: ${notification._id} for user ${data.userId}`);
    
    return notification;
  }

  /**
   * Create bulk notifications
   */
  async createBulkNotifications(
    userIds: string[],
    data: {
      type: string;
      title: string;
      message: string;
      data?: any;
      priority?: string;
    }
  ): Promise<void> {
    const notifications = userIds.map(userId => ({
      user: userId,
      ...data,
    }));

    await Notification.insertMany(notifications);

    // Queue for processing
    await Promise.all(
      notifications.map(notification =>
        this.queueManager.addJob('notifications', {
          userId: notification.user,
          type: 'send_bulk',
          data: notification,
        })
      )
    );

    logger.info(`Bulk notifications created for ${userIds.length} users`);
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      unreadOnly?: boolean;
      type?: string;
    } = {}
  ): Promise<{ notifications: INotification[]; total: number; unread: number }> {
    const { page = 1, limit = 20, unreadOnly = false, type } = options;

    const query: Record<string, unknown> = { user: userId };
    if (unreadOnly) {
      query.isRead = false;
    }
    if (type) {
      query.type = type;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await Notification.countDocuments(query);
    const unread = await Notification.countDocuments({ user: userId, isRead: false });

    return {
      notifications: notifications as unknown as INotification[],
      total,
      unread,
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { isRead: true, readAt: new Date() }
    );
  }

  /**
   * Mark all as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    await Notification.updateMany(
      { user: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    await Notification.findOneAndDelete({ _id: notificationId, user: userId });
  }

  /**
   * Delete old notifications (cleanup)
   */
  async cleanupOldNotifications(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await Notification.deleteMany({
      isRead: true,
      createdAt: { $lt: cutoffDate },
    });

    logger.info(`Cleaned up ${result.deletedCount} old notifications`);
    return result.deletedCount;
  }

  /**
   * Setup notification worker for background processing
   */
  private setupNotificationWorker(): void {
    this.queueManager.createWorker('notifications', async (job) => {
      const { notificationId, type, userId } = job.data;

      try {
        if (type === 'send') {
          const notification = await Notification.findById(notificationId);
          if (notification) {
            await this.processNotification(notification);
          }
        } else if (type === 'send_bulk') {
          // Process bulk notification
          logger.debug(`Processing bulk notification for user ${userId}`);
        }
      } catch (error) {
        logger.error('Error processing notification job:', error);
        throw error;
      }
    });
  }

  /**
   * Process notification (send push, email, etc.)
   */
  private async processNotification(notification: INotification): Promise<void> {
    // Here you would implement actual push notification sending
    // Using services like Firebase Cloud Messaging, OneSignal, etc.
    
    // For now, just publish to Redis for real-time delivery
    await this.redis.publish('notification:new', {
      userId: notification.user.toString(),
      notification: notification.toObject(),
    });

    logger.debug(`Notification processed: ${notification._id}`);
  }
}

/**
 * Socket.IO handler for real-time notifications
 */
export class NotificationSocketHandler {
  private static redis = RedisClient.getInstance();

  static handleConnection(socket: Socket & { userId?: string }): void {
    // Subscribe to user's notification channel
    if (socket.userId) {
      this.redis.subscribe(`notification:user:${socket.userId}`, (notification) => {
        socket.emit('notification:new', notification);
      });
    }

    // Get unread count
    socket.on('notification:get_unread_count', async () => {
      try {
        if (!socket.userId) return;

        const count = await Notification.countDocuments({
          user: socket.userId,
          isRead: false,
        });

        socket.emit('notification:unread_count', { count });
      } catch (error) {
        logger.error('Error getting unread count:', error);
      }
    });

    // Mark as read
    socket.on('notification:mark_read', async (data: { notificationId: string }) => {
      try {
        if (!socket.userId) return;

        await Notification.findOneAndUpdate(
          { _id: data.notificationId, user: socket.userId },
          { isRead: true, readAt: new Date() }
        );

        socket.emit('notification:marked_read', { notificationId: data.notificationId });
      } catch (error) {
        logger.error('Error marking notification as read:', error);
      }
    });

    // Mark all as read
    socket.on('notification:mark_all_read', async () => {
      try {
        if (!socket.userId) return;

        await Notification.updateMany(
          { user: socket.userId, isRead: false },
          { isRead: true, readAt: new Date() }
        );

        socket.emit('notification:all_marked_read');
      } catch (error) {
        logger.error('Error marking all notifications as read:', error);
      }
    });
  }
}
