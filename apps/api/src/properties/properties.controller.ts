import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { PropertyFiltersDto } from './properties.dto';
import { OptionalJwtGuard } from '../common/guards/optional-jwt.guard';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  /**
   * GET /properties
   * Каталог с фильтрами и пагинацией.
   */
  @Get()
  findAll(@Query() filters: PropertyFiltersDto) {
    return this.propertiesService.findAll(filters);
  }

  /**
   * GET /properties/slugs
   * Список slug + updatedAt для генерации sitemap.xml.
   */
  @Get('slugs')
  findSlugs() {
    return this.propertiesService.findSlugs();
  }

  /**
   * GET /properties/:slug
   * Страница ЖК. Записывает VIEW_PROPERTY событие.
   */
  @UseGuards(OptionalJwtGuard)
  @Get(':slug')
  findBySlug(@Param('slug') slug: string, @Req() req: any) {
    return this.propertiesService.findBySlug(slug, {
      userId:    req.user?.id,
      sessionId: req.headers['x-session-id'],
    });
  }
}
