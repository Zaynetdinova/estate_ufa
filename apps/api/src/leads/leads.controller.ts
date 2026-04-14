import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { CreateLeadDto, UpdateLeadStatusDto } from './leads.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OptionalJwtGuard } from '../common/guards/optional-jwt.guard';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  /**
   * POST /leads
   * Создать лид. Авторизация опциональна:
   * - авторизованный → лид привязывается к пользователю + берётся его скор
   * - анонимный      → лид без userId, score = 0
   */
  @UseGuards(OptionalJwtGuard)
  @Post()
  create(@Body() dto: CreateLeadDto, @Req() req: any) {
    const userId: number | undefined = req.user?.id;
    return this.leadsService.create(dto, userId);
  }

  /**
   * GET /leads
   * Список всех лидов (только для менеджеров — в production добавить RolesGuard)
   */
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.leadsService.findAll();
  }

  /**
   * GET /leads/:id
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.leadsService.findOne(id);
  }

  /**
   * PATCH /leads/:id/status
   */
  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLeadStatusDto,
  ) {
    return this.leadsService.updateStatus(id, dto);
  }
}
