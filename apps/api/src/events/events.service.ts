import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { N8nService } from '../n8n/n8n.service';
import { N8nEventType } from '../n8n/n8n.types';
import { TrackEventDto } from './events.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly n8n: N8nService,
  ) {}

  /**
   * Записать событие в БД и отправить в n8n.
   * Используется из любого модуля (chat, properties, leads и т.д.)
   */
  async track(
    dto: TrackEventDto,
    meta?: { userId?: number; sessionId?: string },
  ) {
    const userId = meta?.userId;
    const sessionId = dto.sessionId ?? meta?.sessionId;

    // 1. Сохраняем в БД
    const event = await this.prisma.userEvent.create({
      data: {
        userId:     userId ?? null,
        sessionId:  sessionId ?? null,
        eventType:  dto.eventType,
        payload: dto.payload as Prisma.InputJsonValue,
        propertyId: dto.propertyId ?? null,
      },
    });

    // Счётчик просмотров ЖК (сортировка «популярные») растёт по событию со страницы ЖК
    if (dto.eventType === N8nEventType.VIEW_PROPERTY && dto.propertyId) {
      await this.prisma.property.updateMany({
        where: { id: dto.propertyId },
        data:  { viewsCount: { increment: 1 } },
      });
    }

    // 2. Fire-and-forget в n8n
    await this.n8n.sendEvent(
      dto.eventType as N8nEventType,
      dto.payload,
      { userId, sessionId },
    );

    return event;
  }

  async findByUser(userId: number, limit = 50) {
    return this.prisma.userEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /** Количество просмотренных ЖК пользователем */
  /** Количество разных ЖК, которые смотрел пользователь (повторные просмотры не считаются). */
  async countViewedProperties(userId: number): Promise<number> {
    const viewed = await this.prisma.userEvent.findMany({
      where: {
        userId,
        eventType: N8nEventType.VIEW_PROPERTY,
        propertyId: { not: null },
      },
      distinct: ['propertyId'],
      select: { propertyId: true },
    });
    return viewed.length;
  }

  /** Использовал ли пользователь калькулятор */
  async usedCalculator(userId: number): Promise<boolean> {
    const count = await this.prisma.userEvent.count({
      where: { userId, eventType: N8nEventType.CALCULATOR_USED },
    });
    return count > 0;
  }
}
