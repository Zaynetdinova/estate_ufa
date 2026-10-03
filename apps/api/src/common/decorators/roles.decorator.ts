import { SetMetadata } from '@nestjs/common';

export type Role = 'user' | 'manager' | 'admin';

export const ROLES_KEY = 'roles';

/** Ограничивает доступ к маршруту перечисленными ролями. Используется вместе с RolesGuard. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
