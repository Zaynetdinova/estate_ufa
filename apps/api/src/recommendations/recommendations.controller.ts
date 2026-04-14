import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { OptionalJwtGuard } from '../common/guards/optional-jwt.guard';
import { EventsService } from '../events/events.service';
import { N8nEventType } from '../n8n/n8n.types';

@Controller('recommendations')
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
    private readonly eventsService: EventsService,
  ) {}

  /**
   * GET /recommendations
   * Авторизованный → персональные рекомендации через n8n/GPT.
   * Анонимный      → топ по is_hot + filters.
   *
   * Query params (для анонимных):
   *   ?budgetMin=3000000&budgetMax=7000000
   */
  @UseGuards(OptionalJwtGuard)
  @Get()
  async getRecommendations(
    @Req() req: any,
    @Query('budgetMin') budgetMin?: string,
    @Query('budgetMax') budgetMax?: string,
  ) {
    const userId: number | undefined = req.user?.id;

    if (userId) {
      // Трекаем событие REQUEST_SELECTION
      await this.eventsService.track(
        {
          eventType: N8nEventType.REQUEST_SELECTION,
          payload: { trigger: 'recommendations_page' },
        },
        { userId },
      );

      return this.recommendationsService.getForUser(userId);
    }

    return this.recommendationsService.getAnonymous(
      budgetMin ? Number(budgetMin) : undefined,
      budgetMax ? Number(budgetMax) : undefined,
    );
  }
}
