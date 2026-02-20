import { createClient, RedisClientType } from 'redis';
import { config } from '@/config/environment';
import { logger } from '@/core/logging/logger';

export class RedisClient {
  private static instance: RedisClient;
  private client: RedisClientType;
  private subscriber: RedisClientType;
  private publisher: RedisClientType;

  private constructor() {
    const redisConfig = {
      socket: {
        host: config.redis.host,
        port: config.redis.port,
      },
      password: config.redis.password,
      database: config.redis.db,
    };

    this.client = createClient(redisConfig);
    this.subscriber = createClient(redisConfig);
    this.publisher = createClient(redisConfig);

    this.setupEventHandlers(this.client, 'Main');
    this.setupEventHandlers(this.subscriber, 'Subscriber');
    this.setupEventHandlers(this.publisher, 'Publisher');
  }

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  private setupEventHandlers(client: RedisClientType, name: string): void {
    client.on('error', (error) => {
      logger.error(`Redis ${name} error:`, error);
    });

    client.on('connect', () => {
      logger.info(`Redis ${name} connecting...`);
    });

    client.on('ready', () => {
      logger.info(`Redis ${name} ready`);
    });

    client.on('end', () => {
      logger.warn(`Redis ${name} connection closed`);
    });
  }

  public async connect(): Promise<void> {
    try {
      await Promise.all([
        this.client.connect(),
        this.subscriber.connect(),
        this.publisher.connect(),
      ]);
      logger.info('All Redis clients connected successfully');
    } catch (error) {
      logger.error('Failed to connect Redis clients:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    await Promise.all([
      this.client.quit(),
      this.subscriber.quit(),
      this.publisher.quit(),
    ]);
    logger.info('Redis clients disconnected');
  }

  public getClient(): RedisClientType {
    return this.client;
  }

  public getSubscriber(): RedisClientType {
    return this.subscriber;
  }

  public getPublisher(): RedisClientType {
    return this.publisher;
  }

  // Cache utilities
  public async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(config.redis.keyPrefix + key);
    return value ? JSON.parse(value) : null;
  }

  public async set(key: string, value: any, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    const fullKey = config.redis.keyPrefix + key;
    
    if (ttl) {
      await this.client.setEx(fullKey, ttl, serialized);
    } else {
      await this.client.set(fullKey, serialized);
    }
  }

  public async del(key: string): Promise<void> {
    await this.client.del(config.redis.keyPrefix + key);
  }

  public async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(config.redis.keyPrefix + key);
    return result === 1;
  }

  public async increment(key: string, amount: number = 1): Promise<number> {
    return await this.client.incrBy(config.redis.keyPrefix + key, amount);
  }

  public async expire(key: string, seconds: number): Promise<void> {
    await this.client.expire(config.redis.keyPrefix + key, seconds);
  }

  // Pub/Sub utilities
  public async publish(channel: string, message: any): Promise<void> {
    await this.publisher.publish(
      config.redis.keyPrefix + channel,
      JSON.stringify(message)
    );
  }

  public async subscribe(
    channel: string,
    callback: (message: any) => void
  ): Promise<void> {
    await this.subscriber.subscribe(
      config.redis.keyPrefix + channel,
      (message) => {
        try {
          const parsed = JSON.parse(message);
          callback(parsed);
        } catch (error) {
          logger.error('Error parsing Redis message:', error);
        }
      }
    );
  }
}
