import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';
import { N8nEventType } from '../n8n/n8n.types';

@Injectable()
export class FavoritesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
  ) {}

  async getAll(userId: number) {
    return this.prisma.favorite.findMany({
      where: { userId },
      include: {
        property: {
          include: {
            developer: { select: { id: true, name: true } },
            images:    { take: 1, orderBy: { sortOrder: 'asc' } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async toggle(userId: number, propertyId: number): Promise<{ action: 'added' | 'removed' }> {
    // Проверяем, что ЖК существует
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw new NotFoundException(`Property #${propertyId} not found`);

    const existing = await this.prisma.favorite.findUnique({
      where: { userId_propertyId: { userId, propertyId } },
    });

    if (existing) {
      await this.prisma.favorite.delete({ where: { id: existing.id } });
      return { action: 'removed' };
    }

    await this.prisma.favorite.create({ data: { userId, propertyId } });

    // Трекаем ADD_FAVORITE событие
    await this.events.track(
      {
        eventType:  N8nEventType.ADD_FAVORITE,
        propertyId,
        payload: {
          propertyId,
          propertyName: property.name,
          propertySlug: property.slug,
        },
      },
      { userId },
    );

    return { action: 'added' };
  }

  async isFavorite(userId: number, propertyId: number): Promise<boolean> {
    const fav = await this.prisma.favorite.findUnique({
      where: { userId_propertyId: { userId, propertyId } },
    });
    return !!fav;
  }

  /** Возвращает Set id ЖК в избранном — для пакетной проверки */
  async getFavoriteIds(userId: number): Promise<Set<number>> {
    const favs = await this.prisma.favorite.findMany({
      where:  { userId },
      select: { propertyId: true },
    });
    return new Set(favs.map((f) => f.propertyId));
  }
}
