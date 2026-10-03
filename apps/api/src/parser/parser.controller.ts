import { Controller, Post, Query, UseGuards } from '@nestjs/common';
import { ParserService } from './parser.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('parser')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class ParserController {
  constructor(private readonly parserService: ParserService) {}

  /**
   * POST /parser/run?source=ufanovostroyka
   * Запускает парсер вручную.
   * В production — запускать через n8n cron или NestJS scheduler.
   */
  @Post('run')
  async run(@Query('source') source: 'ufanovostroyka' | 'custom' = 'ufanovostroyka') {
    return this.parserService.run(source);
  }
}
