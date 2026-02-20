import { RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { RedisClient } from '@/core/cache/redis';
import { config } from '@/config/environment';

let rateLimiterInstance: RequestHandler;
let strictRateLimiterInstance: RequestHandler;

const createRedisStore = (prefix: string) => {
  return new RedisStore({
    sendCommand: (...args: string[]) => RedisClient.getInstance().getClient().sendCommand(args) as Promise<any>,
    prefix,
  });
};

export const initRateLimiters = () => {
  rateLimiterInstance = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    store: createRedisStore('rate_limit:'),
    message: { error: 'Too many requests, please try again later.' },
    skip: (req) => req.path === '/api/health',
  });

  strictRateLimiterInstance = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    store: createRedisStore('strict_rate_limit:'),
    message: { error: 'Too many requests, please try again later.' },
  });
};

export const rateLimiter: RequestHandler = (req, res, next) => {
  if (!rateLimiterInstance) {
    return next();
  }
  return rateLimiterInstance(req, res, next);
};

export const strictRateLimiter: RequestHandler = (req, res, next) => {
  if (!strictRateLimiterInstance) {
    return next();
  }
  return strictRateLimiterInstance(req, res, next);
};
