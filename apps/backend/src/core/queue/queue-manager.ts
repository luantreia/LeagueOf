import { Queue, Worker, QueueEvents } from 'bullmq';
import { config } from '@/config/environment';
import { logger } from '@/core/logging/logger';

export class QueueManager {
  private static instance: QueueManager;
  private queues: Map<string, Queue>;
  private workers: Map<string, Worker>;
  private queueEvents: Map<string, QueueEvents>;

  private constructor() {
    this.queues = new Map();
    this.workers = new Map();
    this.queueEvents = new Map();
  }

  public static getInstance(): QueueManager {
    if (!QueueManager.instance) {
      QueueManager.instance = new QueueManager();
    }
    return QueueManager.instance;
  }

  public async initialize(): Promise<void> {
    logger.info('Initializing queue manager...');
  }

  private getConnection() {
    if (config.redis.url) {
      return config.redis.url;
    }
    return {
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      maxRetriesPerRequest: null,
    };
  }

  public createQueue(name: string): Queue {
    if (this.queues.has(name)) {
      return this.queues.get(name)!;
    }

    const queue = new Queue(name, {
      connection: this.getConnection() as any,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    });

    this.queues.set(name, queue);
    logger.info(`Queue created: ${name}`);

    return queue;
  }

  public createWorker(
    name: string,
    processor: (job: any) => Promise<any>
  ): Worker {
    if (this.workers.has(name)) {
      return this.workers.get(name)!;
    }

    const worker = new Worker(name, processor, {
      connection: this.getConnection() as any,
      concurrency: 5,
    });

    worker.on('completed', (job) => {
      logger.info(`Job completed: ${job.id} in queue ${name}`);
    });

    worker.on('failed', (job, err) => {
      logger.error(`Job failed: ${job?.id} in queue ${name}`, err);
    });

    this.workers.set(name, worker);
    logger.info(`Worker created: ${name}`);

    return worker;
  }

  public getQueue(name: string): Queue | undefined {
    return this.queues.get(name);
  }

  public async addJob(queueName: string, data: any, options?: any): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.add(queueName, data, options);
    logger.debug(`Job added to queue ${queueName}`);
  }

  public async close(): Promise<void> {
    logger.info('Closing all queues and workers...');

    await Promise.all([
      ...Array.from(this.queues.values()).map((queue) => queue.close()),
      ...Array.from(this.workers.values()).map((worker) => worker.close()),
      ...Array.from(this.queueEvents.values()).map((events) => events.close()),
    ]);

    this.queues.clear();
    this.workers.clear();
    this.queueEvents.clear();

    logger.info('All queues and workers closed');
  }
}
