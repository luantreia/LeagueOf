import './load-env';

const parseTrustProxy = (value: string | undefined) => {
  if (!value) {
    return process.env.NODE_ENV === 'production' ? 1 : false;
  }

  if (value === 'true') return true;
  if (value === 'false') return false;

  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? value : numericValue;
};

const redisUrlCandidates = [
  ['REDIS_URL', process.env.REDIS_URL],
  ['redis_url', process.env.redis_url],
  ['REDIS_PRIVATE_URL', process.env.REDIS_PRIVATE_URL],
  ['REDIS_EXTERNAL_URL', process.env.REDIS_EXTERNAL_URL],
] as const;

const redisUrlCandidate = redisUrlCandidates.find(([, value]) => Boolean(value));
const redisUrl = redisUrlCandidate?.[1];
const redisUrlSource = redisUrlCandidate?.[0];

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.API_PORT || '4000', 10),
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
  
  // Database
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/leagueof',
    options: {
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
    },
  },

  // Redis
  redis: {
    url: redisUrl,
    urlSource: redisUrlSource,
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: 0,
    keyPrefix: 'leagueof:',
    retryStrategy: (times: number) => Math.min(times * 50, 2000),
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-in-production',
    accessTokenExpiration: process.env.JWT_EXPIRATION || '15m',
    refreshTokenExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },

  app: {
    frontendUrl: process.env.FRONTEND_URL || process.env.CORS_ORIGIN?.split(',')[0] || 'http://localhost:3000',
  },

  email: {
    from: process.env.MAIL_FROM || 'League Of <no-reply@leagueof.local>',
    brevoApiKey: process.env.BREVO_API_KEY,
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  // Feature Flags
  features: {
    thirdPartyIntegrations: process.env.ENABLE_THIRD_PARTY_INTEGRATIONS === 'true',
    pushNotifications: process.env.ENABLE_PUSH_NOTIFICATIONS === 'true',
    emailNotifications: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
  },

  // Third Party APIs
  thirdParty: {
    riotApiKey: process.env.RIOT_API_KEY,
    steamApiKey: process.env.STEAM_API_KEY,
    discordWebhook: process.env.DISCORD_WEBHOOK_URL,
  },

  // Monitoring
  sentry: {
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || 'development',
  },
} as const;
