import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { Role } from '../decorators/roles.decorator';

function createContext(user?: { role: string }): ExecutionContext {
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

  it('пропускает пользователя с нужной ролью', () => {
    expect(createGuard(['manager', 'admin']).canActivate(createContext({ role: 'manager' }))).toBe(true);
  });

  it('отказывает обычному пользователю', () => {
    expect(() => createGuard(['manager', 'admin']).canActivate(createContext({ role: 'user' })))
      .toThrow(ForbiddenException);
  });

  it('отказывает без пользователя', () => {
    expect(() => createGuard(['admin']).canActivate(createContext(undefined))).toThrow(ForbiddenException);
  });
});
