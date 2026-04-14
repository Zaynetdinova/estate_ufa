import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserProfileDto, UpdateAiProfileDto } from './users.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  /**
   * Обновить профиль вручную (из настроек пользователя).
   */
  async updateProfile(id: number, dto: UpdateUserProfileDto) {
    await this.findById(id);
    return this.prisma.user.update({
      where: { id },
      data: {
        budgetMin:       dto.budgetMin,
        budgetMax:       dto.budgetMax,
        intent:          dto.intent,
        userPreferences: dto.userPreferences as Prisma.InputJsonValue
      },
      select: {
        id: true, email: true, name: true, phone: true,
        budgetMin: true, budgetMax: true, intent: true, userPreferences: true,
      },
    });
  }

  /**
   * Обновить AI-профиль пользователя на основе анализа сообщения.
   * Вызывается из chat-сервиса после каждого ответа AI.
   * Мержит userPreferences, не затирает существующие ключи.
   */
  async updateAiProfile(id: number, dto: UpdateAiProfileDto) {
    const user = await this.findById(id);

    // Мержим preferences поверх существующих
    const existingPrefs = (user.userPreferences as Record<string, unknown>) ?? {};
    const mergedPrefs = dto.userPreferences
      ? { ...existingPrefs, ...dto.userPreferences }
      : existingPrefs;

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.budgetMin !== undefined && { budgetMin: dto.budgetMin }),
        ...(dto.budgetMax !== undefined && { budgetMax: dto.budgetMax }),
        ...(dto.intent    !== undefined && { intent:    dto.intent }),
        userPreferences: mergedPrefs as Prisma.InputJsonValue,
      },
    });
  }

  async getAiProfile(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        budgetMin: true,
        budgetMax: true,
        intent: true,
        userPreferences: true,
      },
    });
  }
}
