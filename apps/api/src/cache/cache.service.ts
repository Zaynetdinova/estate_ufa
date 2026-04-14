import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private client: RedisClientType | null = null;
  private isConnected = false;

  constructor(private readonly config: ConfigService) {
    this.connect();
  }

  private async connect() {
    const url = this.config.get<string>('REDIS_URL', 'redis://localhost:6379');
    try {
      this.client = createClient({ url }) as RedisClientType;
      this.client.on('error', (err) => {
        this.logger.warn(`Redis error: ${err.message}`);
        this.isConnected = false;
      });
      await this.client.connect();
      this.isConnected = true;
      this.logger.log('Redis connected');
    } catch (err: unknown) {
      this.logger.warn(`Redis unavailable — running without cache: ${err instanceof Error ? err.message : err}`);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected || !this.client) return null;
    try {
      const raw = await this.client.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
    if (!this.isConnected || !this.client) return;
    try {
      await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
    } catch {
      // silent — cache is not critical
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isConnected || !this.client) return;
    try {
      await this.client.del(key);
    } catch { /* silent */ }
  }

  /** Инвалидировать все ключи по паттерну */
  async delByPattern(pattern: string): Promise<void> {
    if (!this.isConnected || !this.client) return;
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length) await this.client.del(keys);
    } catch { /* silent */ }
  }

  async onModuleDestroy() {
    await this.client?.quit().catch(() => null);
  }
}
