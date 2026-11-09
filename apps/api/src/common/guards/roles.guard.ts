import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, Role, STAFF_ROLES } from '../decorators/roles.decorator';

/**
 * Проверяет роль пользователя из req.user (кладёт JwtStrategy).
 * Ставится после JwtAuthGuard: @UseGuards(JwtAuthGuard, RolesGuard).
 *
 * Маршруты для manager/admin дополнительно требуют токен панели управления
 * (scope 'staff', выдаётся POST /auth/staff-login). Обычный токен сайта
 * к ним не подходит, даже если у пользователя роль admin.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles?.length) return true;

    const user = context.switchToHttp().getRequest().user;
    if (!user || !roles.includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const staffOnly = roles.some((role) => STAFF_ROLES.includes(role));
    if (staffOnly && user.scope !== 'staff') {
      throw new ForbiddenException('Staff login required');
    }
    return true;
  }
}
