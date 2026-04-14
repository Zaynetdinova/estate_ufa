import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { N8nEvent, N8nEventType } from './n8n.types';

@Injectable()
export class N8nService {
  private readonly logger = new Logger(N8nService.name);
  private readonly http: AxiosInstance;
  private readonly webhookUrl: string;

  constructor(private readonly config: ConfigService) {
    this.webhookUrl = this.config.get<string>(
      'N8N_WEBHOOK_URL',
      'http://localhost:5678/webhook/events',
    );

    this.http = axios.create({
      baseURL: this.webhookUrl,
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Отправить событие в n8n.
   * Метод fire-and-forget: ошибки логируются, но не пробрасываются —
   * сбой n8n не должен ронять основной запрос.
   */
  async sendEvent<T = Record<string, unknown>>(
    eventType: N8nEventType,
    payload: T,
    meta?: { userId?: number; sessionId?: string },
  ): Promise<void> {
    const event: N8nEvent<T> = {
      eventType,
      userId: meta?.userId,
      sessionId: meta?.sessionId,
      timestamp: new Date().toISOString(),
      payload,
    };

    try {
      await this.http.post('', event);
      this.logger.debug(`Event sent: ${eventType} (userId=${meta?.userId ?? 'anon'})`);
    } catch (err: unknown) {
      // Не бросаем ошибку — n8n может быть недоступен
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Failed to send event ${eventType} to n8n: ${message}`);
    }
  }
}
