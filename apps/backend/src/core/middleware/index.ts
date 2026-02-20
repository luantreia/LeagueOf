import { Application } from 'express';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { config } from '@/config/environment';
import { logStream } from '@/core/logging/logger';
import { rateLimiter } from './rate-limiter';

export const setupMiddleware = (app: Application): void => {
  // Security middleware
  app.use(helmet());
  app.use(cors(config.cors));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // Compression
  app.use(compression());

  // Logging
  if (config.env === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined', { stream: logStream }));
  }

  // Rate limiting
  app.use('/api/', rateLimiter);

  // Health check (bypass rate limiting)
  app.get('/api/health', (_req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });
};
