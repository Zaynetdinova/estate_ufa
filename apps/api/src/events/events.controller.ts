import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { EventsService } from './events.service';
import { TrackEventDto } from './events.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OptionalJwtGuard } from '../common/guards/optional-jwt.guard';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  /**
   * POST /events/track
   * Принимает события от frontend.
   * Авторизация опциональна — анонимные события тоже пишем.
   */
  @UseGuards(OptionalJwtGuard)
  @Post('track')
  async track(@Body() dto: TrackEventDto, @Req() req: any) {
    const userId: number | undefined = req.user?.id;
    return this.eventsService.track(dto, { userId });
  }

  /**
   * GET /events/my
   * История событий текущего пользователя.
   */
  @UseGuards(JwtAuthGuard)
  @Get('my')
  async myEvents(@Req() req: any) {
    return this.eventsService.findByUser(req.user.id);
  }
}
