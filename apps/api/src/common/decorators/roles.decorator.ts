import { SetMetadata } from '@nestjs/common';

export type Role = 'user' | 'manager' | 'admin';

export const ROLES_KEY = 'roles';

/** Роли, которым разрешён вход в панель управления (/admin/login) */
export const STAFF_ROLES: readonly string[] = ['manager', 'admin'];

/** Ограничивает доступ к маршруту перечисленными ролями. Используется вместе с RolesGuard. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
