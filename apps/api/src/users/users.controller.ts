import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserProfileDto } from './users.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** GET /users/me — профиль текущего пользователя */
  @Get('me')
  getMe(@Req() req: any) {
    return this.usersService.findById(req.user.id);
  }

  /** PATCH /users/me/profile — обновить бюджет, намерение, предпочтения */
  @Patch('me/profile')
  updateProfile(@Req() req: any, @Body() dto: UpdateUserProfileDto) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  /** GET /users/me/ai-profile — AI-данные: бюджет, intent, preferences */
  @Get('me/ai-profile')
  getAiProfile(@Req() req: any) {
    return this.usersService.getAiProfile(req.user.id);
  }
}
