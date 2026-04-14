import { Controller, Delete, Get, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  /** GET /favorites — список избранных ЖК */
  @Get()
  getAll(@Req() req: any) {
    return this.favoritesService.getAll(req.user.id);
  }

  /** POST /favorites/:propertyId — добавить/убрать (toggle) */
  @Post(':propertyId')
  toggle(@Req() req: any, @Param('propertyId', ParseIntPipe) propertyId: number) {
    return this.favoritesService.toggle(req.user.id, propertyId);
  }

  /** DELETE /favorites/:propertyId — явное удаление */
  @Delete(':propertyId')
  remove(@Req() req: any, @Param('propertyId', ParseIntPipe) propertyId: number) {
    return this.favoritesService.toggle(req.user.id, propertyId);
  }

  /** GET /favorites/ids — массив id для пакетной проверки на фронте */
  @Get('ids')
  async getIds(@Req() req: any) {
    const ids = await this.favoritesService.getFavoriteIds(req.user.id);
    return { ids: [...ids] };
  }
}
