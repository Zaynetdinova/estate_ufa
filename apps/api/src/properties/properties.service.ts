import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';
import { CacheService } from '../cache/cache.service';
import { N8nEventType } from '../n8n/n8n.types';
import { PropertyFiltersDto } from './properties.dto';
import { Prisma } from '@prisma/client';

// TTL констатны
const TTL_LIST   = 120; // 2 мин — каталог
const TTL_DETAIL = 300; // 5 мин — страница ЖК
const TTL_AI     = 600; // 10 мин — контекст для AI

@Injectable()
export class PropertiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
    private readonly cache: CacheService,
  ) {}

  async findAll(filters: PropertyFiltersDto) {
    const {
      district, priceMin, priceMax, status, isHot,
      sort = 'popular', page = 1, limit = 12,
    } = filters;

    // Кэш-ключ по всем параметрам фильтра
    const cacheKey = `properties:list:${JSON.stringify({ district, priceMin, priceMax, status, isHot, sort, page, limit })}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const where: Prisma.PropertyWhereInput = {
      ...(district  ? { district }          : {}),
      ...(status    ? { status }             : {}),
      ...(isHot !== undefined ? { isHot }   : {}),
      ...(priceMin || priceMax
        ? { priceFrom: { gte: priceMin ?? 0, ...(priceMax ? { lte: priceMax } : {}) } }
        : {}),
    };

    const orderBy: Prisma.PropertyOrderByWithRelationInput =
      sort === 'price_asc'  ? { priceFrom: 'asc' } :
      sort === 'price_desc' ? { priceFrom: 'desc' } :
      sort === 'new'        ? { createdAt: 'desc' } :
                              { viewsCount: 'desc' };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.property.findMany({
        where,
        orderBy,
        skip:  (page - 1) * limit,
        take:  limit,
        include: {
          developer: { select: { id: true, name: true, logoUrl: true } },
          images:    { take: 1, orderBy: { sortOrder: 'asc' } },
          layouts:   { where: { isAvailable: true }, take: 10 },
        },
      }),
      this.prisma.property.count({ where }),
    ]);

    const result = {
      items,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };

    await this.cache.set(cacheKey, result, TTL_LIST);
    return result;
  }

  async findBySlug(slug: string, meta?: { userId?: number; sessionId?: string }) {
    const cacheKey = `properties:slug:${slug}`;
    let property   = await this.cache.get<any>(cacheKey);

    if (!property) {
      property = await this.prisma.property.findUnique({
        where: { slug },
        include: {
          developer: true,
          images:    { orderBy: { sortOrder: 'asc' } },
          layouts:   { where: { isAvailable: true } },
        },
      });
      if (property) await this.cache.set(cacheKey, property, TTL_DETAIL);
    }

    if (!property) throw new NotFoundException(`Property "${slug}" not found`);

    // Инкрементируем счётчик просмотров
    await this.prisma.property.update({
      where: { id: property.id },
      data:  { viewsCount: { increment: 1 } },
    });

    // Трекаем событие VIEW_PROPERTY
    await this.events.track(
      {
        eventType:  N8nEventType.VIEW_PROPERTY,
        propertyId: property.id,
        payload: {
          propertyId:   property.id,
          propertyName: property.name,
          propertySlug: property.slug,
          district:     property.district,
          priceFrom:    Number(property.priceFrom),
        },
      },
      meta,
    );

    return property;
  }

  async findById(id: number) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        developer: true,
        images: { orderBy: { sortOrder: 'asc' } },
        layouts: { where: { isAvailable: true } },
      },
    });
    if (!property) throw new NotFoundException(`Property #${id} not found`);
    return property;
  }

  /** Возвращает slug + updatedAt для sitemap.xml */
  async findSlugs() {
    return this.prisma.property.findMany({
      select:  { slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /** Возвращает список для контекста AI-чата (минимальные поля) */
  async findForAiContext() {
    const cacheKey = 'properties:ai-context';
    const cached   = await this.cache.get<any[]>(cacheKey);
    if (cached) return cached;

    const data = await this.prisma.property.findMany({
      select: {
        id:          true,
        slug:        true,
        name:        true,
        district:    true,
        priceFrom:   true,
        priceM2:     true,
        status:      true,
        deadlineQ:   true,
        deadlineYear: true,
        floors:      true,
        areaMin:     true,
        areaMax:     true,
        isHot:       true,
        description: true,
        developer:   { select: { name: true } },
      },
      orderBy: { isHot: 'desc' },
    });

    await this.cache.set(cacheKey, data, TTL_AI);
    return data;
  }
}
