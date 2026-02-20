import './config/load-env';

import 'express-async-errors';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { config } from '@/config/environment';
import { connectDatabase } from '@/core/database/mongoose';
import { RedisClient } from '@/core/cache/redis';
import { logger } from '@/core/logging/logger';
import { setupMiddleware } from '@/core/middleware';
import { setupRoutes } from '@/core/routes';
import { setupSocketIO } from '@/core/sockets';
import { errorHandler } from '@/core/middleware/error-handler';
import { QueueManager } from '@/core/queue/queue-manager';
import { initRateLimiters } from '@/core/middleware/rate-limiter';

class Application {
  public app: express.Application;
  public httpServer: ReturnType<typeof createServer>;
  public io: Server;

  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.io = new Server(this.httpServer, {
      cors: {
        origin: config.cors.origin,
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });
  }

  async initialize(): Promise<void> {
    try {
      // Connect to databases
      await connectDatabase();
      await RedisClient.getInstance().connect();
      
      // Initialize rate limiters (after Redis connection)
      initRateLimiters();

      // Initialize queue system
      await QueueManager.getInstance().initialize();

      // Setup middleware
      setupMiddleware(this.app);

      // Setup routes
      setupRoutes(this.app);

      // Setup Socket.IO
      setupSocketIO(this.io);

      // Error handling middleware (must be last)
      this.app.use(errorHandler);

      logger.info('Application initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize application:', error);
      throw error;
    }
  }

  async start(): Promise<void> {
    const port = config.port;

    this.httpServer.listen(port, () => {
      logger.info(`Server running on port ${port} in ${config.env} mode`);
      logger.info(`Health check: http://localhost:${port}/api/health`);
    });

    // Graceful shutdown
    this.setupGracefulShutdown();
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      this.httpServer.close(async () => {
        try {
          await RedisClient.getInstance().disconnect();
          await QueueManager.getInstance().close();
          logger.info('Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }
}

// Start application
(async () => {
  try {
    const app = new Application();
    await app.initialize();
    await app.start();
  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
})();
