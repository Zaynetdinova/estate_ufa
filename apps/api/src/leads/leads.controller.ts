import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { LeadsService } from './leads.service';
import { CreateLeadDto, UpdateLeadNotesDto, UpdateLeadStatusDto } from './leads.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OptionalJwtGuard } from '../common/guards/optional-jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  /**
   * POST /leads
   * Создать лид. Авторизация опциональна:
   * - авторизованный → лид привязывается к пользователю + берётся его скор
   * - анонимный      → лид без userId, score = 0, телефон обязателен
   * Не больше 5 заявок в минуту с одного IP: каждая заявка — вызов модели.
   */
  @Throttle({ global: { limit: 5, ttl: 60_000 } })
  @UseGuards(OptionalJwtGuard)
  @Post()
  create(@Body() dto: CreateLeadDto, @Req() req: any) {
    const userId: number | undefined = req.user?.id;
    return this.leadsService.create(dto, userId);
  }

  /**
   * GET /leads
   * Список всех лидов (только manager/admin)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('manager', 'admin')
  @Get()
  findAll() {
    return this.leadsService.findAll();
  }

  /**
   * GET /leads/:id
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('manager', 'admin')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.leadsService.findOne(id);
  }

  /**
   * GET /leads/:id/chat
   * Переписка клиента с AI-консультантом (по сессии чата, из которой оставлена заявка)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('manager', 'admin')
  @Get(':id/chat')
  findChat(@Param('id', ParseIntPipe) id: number) {
    return this.leadsService.findChat(id);
  }

  /**
   * PATCH /leads/:id/notes
   * Заметки менеджера (итог звонка и т.п.)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('manager', 'admin')
  @Patch(':id/notes')
  updateNotes(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLeadNotesDto,
  ) {
    return this.leadsService.updateNotes(id, dto);
  }

  /**
   * PATCH /leads/:id/status
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('manager', 'admin')
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLeadStatusDto,
  ) {
    return this.leadsService.updateStatus(id, dto);
  }
}
