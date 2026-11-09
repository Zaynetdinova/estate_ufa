import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { Role } from '../decorators/roles.decorator';

function createContext(user?: { role: string; scope?: string }): ExecutionContext {
  return {
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

function createGuard(roles?: Role[]) {
  const reflector = { getAllAndOverride: jest.fn().mockReturnValue(roles) } as unknown as Reflector;
  return new RolesGuard(reflector);
}

describe('RolesGuard', () => {
  it('пропускает маршрут без @Roles', () => {
    expect(createGuard(undefined).canActivate(createContext({ role: 'user' }))).toBe(true);
  });

  it('пропускает сотрудника с токеном панели управления', () => {
    expect(createGuard(['manager', 'admin']).canActivate(createContext({ role: 'manager', scope: 'staff' }))).toBe(true);
  });

  it('отказывает обычному пользователю', () => {
    expect(() => createGuard(['manager', 'admin']).canActivate(createContext({ role: 'user', scope: 'staff' })))
      .toThrow(ForbiddenException);
  });

  it('отказывает админу с обычным токеном сайта', () => {
    expect(() => createGuard(['admin']).canActivate(createContext({ role: 'admin', scope: 'user' })))
      .toThrow('Staff login required');
  });

  it('отказывает без пользователя', () => {
    expect(() => createGuard(['admin']).canActivate(createContext(undefined))).toThrow(ForbiddenException);
  });
});
