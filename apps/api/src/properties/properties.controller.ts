import { Controller, Get, Param, Query } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { PropertyFiltersDto } from './properties.dto';

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
   * Карточка ЖК. Без побочных эффектов, поэтому ответ можно кешировать на стороне сайта.
   */
  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.propertiesService.findBySlug(slug);
  }
}
