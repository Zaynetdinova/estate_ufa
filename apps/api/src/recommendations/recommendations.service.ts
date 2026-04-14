import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { N8nService } from '../n8n/n8n.service';
import { N8nEventType } from '../n8n/n8n.types';

export interface RecommendationResult {
  properties: RecommendedProperty[];
  summary: string;
  source: 'ai' | 'fallback';
}

export interface RecommendedProperty {
  id: number;
  name: string;
  slug: string;
  district: string;
  priceFrom: bigint | number;
  priceM2: number | null;
  status: string;
  reason: string; // почему рекомендуем
}

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly n8n: N8nService,
    private readonly config: ConfigService,
  ) {}

  async getForUser(userId: number): Promise<RecommendationResult> {
    // 1. Достаём профиль пользователя
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        budgetMin:       true,
        budgetMax:       true,
        intent:          true,
        userPreferences: true,
      },
    });

    // 2. Строим SQL-фильтр на основе профиля
    const preferences = (user?.userPreferences ?? {}) as Record<string, unknown>;
    const budgetMin = user?.budgetMin ?? 0;
    const budgetMax = user?.budgetMax ?? 999_999_999;

    const candidates = await this.prisma.property.findMany({
      where: {
        priceFrom: { gte: budgetMin, lte: budgetMax },
        ...(Array.isArray(preferences['districts']) && preferences['districts'].length > 0
          ? { district: { in: preferences['districts'] as string[] } }
          : {}),
      },
      include: {
        images: { take: 1, orderBy: { sortOrder: 'asc' } },
      },
      orderBy: [{ isHot: 'desc' }, { viewsCount: 'desc' }],
      take: 20, // отдаём в GPT не больше 20 для экономии токенов
    });

    // 3. Отправляем в n8n → GPT для ранжирования и объяснений
    const n8nResult = await this.requestN8nRecommendations(userId, user, candidates);

    if (n8nResult) return n8nResult;

    // 4. Fallback: топ-5 по популярности если n8n недоступен
    return this.buildFallbackResult(candidates.slice(0, 5));
  }

  /**
   * Отправляем запрос в n8n.
   * n8n → GPT → POST /recommendations/callback → мы возвращаем результат.
   *
   * Т.к. n8n может быть медленным, используем синхронный запрос
   * к отдельному webhook с таймаутом 15с.
   */
  private async requestN8nRecommendations(
    userId: number,
    userProfile: any,
    candidates: any[],
  ): Promise<RecommendationResult | null> {
    const webhookUrl = this.config.get<string>(
      'N8N_RECOMMENDATIONS_WEBHOOK',
      'http://localhost:5678/webhook/recommendations',
    );

    try {
      const response = await axios.post(
        webhookUrl,
        {
          userId,
          userProfile,
          candidates: candidates.map((p) => ({
            id:       p.id,
            name:     p.name,
            slug:     p.slug,
            district: p.district,
            priceFrom: Number(p.priceFrom),
            priceM2:  p.priceM2,
            status:   p.status,
            floors:   p.floors,
            areaMin:  p.areaMin,
            areaMax:  p.areaMax,
            isHot:    p.isHot,
          })),
        },
        { timeout: 15_000 },
      );

      if (response.data?.properties?.length) {
        return {
          properties: response.data.properties,
          summary:    response.data.summary ?? '',
          source:     'ai',
        };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`n8n recommendations unavailable: ${msg}`);
    }

    return null;
  }

  private buildFallbackResult(properties: any[]): RecommendationResult {
    return {
      source: 'fallback',
      summary: 'Популярные ЖК по вашему бюджету',
      properties: properties.map((p) => ({
        id:        p.id,
        name:      p.name,
        slug:      p.slug,
        district:  p.district,
        priceFrom: Number(p.priceFrom),
        priceM2:   p.priceM2,
        status:    p.status,
        reason:    p.isHot ? 'Горячее предложение' : 'Популярный ЖК',
      })),
    };
  }

  /** Анонимные рекомендации: просто топ по is_hot + views */
  async getAnonymous(
    budgetMin?: number,
    budgetMax?: number,
  ): Promise<RecommendationResult> {
    const properties = await this.prisma.property.findMany({
      where: {
        ...(budgetMin ? { priceFrom: { gte: budgetMin } } : {}),
        ...(budgetMax ? { priceFrom: { lte: budgetMax } } : {}),
      },
      orderBy: [{ isHot: 'desc' }, { viewsCount: 'desc' }],
      take: 5,
    });

    return this.buildFallbackResult(properties);
  }
}
