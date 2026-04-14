import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { N8nService } from '../n8n/n8n.service';
import { N8nEventType, NewLeadPayload } from '../n8n/n8n.types';
import { ScoringService } from './scoring.service';
import { CreateLeadDto, UpdateLeadStatusDto } from './leads.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly n8n: N8nService,
    private readonly scoring: ScoringService,
  ) {}

  async create(dto: CreateLeadDto, userId?: number) {
    // 1. Считаем скор
    const score = userId ? await this.scoring.calculateUserScore(userId) : 0;

    // 2. Снимаем слепок профиля пользователя
    let snapshot: Record<string, unknown> | null = null;
    let user: { email: string; name: string | null; phone: string | null; budgetMin: number | null; budgetMax: number | null; intent: string | null; userPreferences: unknown } | null = null;

    if (userId) {
      user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          email: true,
          name: true,
          phone: true,
          budgetMin: true,
          budgetMax: true,
          intent: true,
          userPreferences: true,
        },
      });

      const viewedCount = await this.prisma.userEvent.count({
        where: { userId, eventType: 'VIEW_PROPERTY' },
      });

      const viewedIds = await this.prisma.userEvent.findMany({
        where: { userId, eventType: 'VIEW_PROPERTY', propertyId: { not: null } },
        select: { propertyId: true },
        distinct: ['propertyId'],
        take: 20,
      });

      snapshot = {
        budgetMin:          user?.budgetMin,
        budgetMax:          user?.budgetMax,
        intent:             user?.intent,
        preferences:        user?.userPreferences,
        viewedPropertiesCount: viewedCount,
        viewedPropertyIds:  viewedIds.map((e) => e.propertyId),
        score,
      };
    }

    // 3. Создаём лид
    const lead = await this.prisma.lead.create({
      data: {
        userId:  userId ?? null,
        source:  dto.source,
        status:  'new',
        score,
        notes:   dto.notes ?? null,
        snapshot: snapshot
  ? (snapshot as Prisma.InputJsonValue)
  : undefined,
      },
    });

    // 4. Уведомляем n8n → Telegram / email
    const payload: NewLeadPayload = {
      leadId:    lead.id,
      source:    lead.source,
      score:     lead.score,
      userEmail: user?.email,
      userName:  user?.name ?? undefined,
      userPhone: user?.phone ?? undefined,
      budgetMin: user?.budgetMin ?? undefined,
      budgetMax: user?.budgetMax ?? undefined,
      intent:    user?.intent ?? undefined,
      snapshot:  snapshot ?? undefined,
    };

    await this.n8n.sendEvent<NewLeadPayload>(N8nEventType.NEW_LEAD, payload, { userId });

    return lead;
  }

  async findAll() {
    return this.prisma.lead.findMany({
      include: { user: { select: { id: true, email: true, name: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: { user: { select: { id: true, email: true, name: true, phone: true } } },
    });
    if (!lead) throw new NotFoundException(`Lead #${id} not found`);
    return lead;
  }

  async updateStatus(id: number, dto: UpdateLeadStatusDto) {
    await this.findOne(id); // throws if not found
    return this.prisma.lead.update({
      where: { id },
      data: { status: dto.status, notes: dto.notes },
    });
  }
}
