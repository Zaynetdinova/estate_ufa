import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';

/**
 * Алгоритм скоринга пользователя.
 *
 * +2   — использовал калькулятор
 * +3   — просмотрел >3 ЖК
 * +5   — написал "хочу купить" / "куплю" / "покупку"
 * +10  — нажал "Получить подборку" (REQUEST_SELECTION)
 * Итого max: 20
 */
@Injectable()
export class ScoringService {
  private readonly BUY_INTENT_PHRASES = ['хочу купить', 'куплю', 'хочу приобрести', 'покупку', 'покупаем'];

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
  ) {}

  async calculateUserScore(userId: number): Promise<number> {
    let score = 0;

    // +2: использовал калькулятор
    const usedCalc = await this.events.usedCalculator(userId);
    if (usedCalc) score += 2;

    // +3: просмотрел >3 ЖК
    const viewedCount = await this.events.countViewedProperties(userId);
    if (viewedCount > 3) score += 3;

    // +5: писал о намерении купить
    const hasBuyIntent = await this.checkBuyIntent(userId);
    if (hasBuyIntent) score += 5;

    // +10: нажимал "Получить подборку"
    const requestedSelection = await this.prisma.userEvent.count({
      where: { userId, eventType: 'REQUEST_SELECTION' },
    });
    if (requestedSelection > 0) score += 10;

    return score;
  }

  private async checkBuyIntent(userId: number): Promise<boolean> {
    // Ищем фразы о намерении покупки в сообщениях чата
    const messages = await this.prisma.chatMessage.findMany({
      where: { userId, role: 'user' },
      select: { content: true },
    });

    return messages.some((msg) =>
      this.BUY_INTENT_PHRASES.some((phrase) =>
        msg.content.toLowerCase().includes(phrase),
      ),
    );
  }
}
