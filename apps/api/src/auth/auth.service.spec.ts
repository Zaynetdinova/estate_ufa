import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

const PASSWORD = 'correct-password';

async function createService(user: { role: string } | null) {
  const passwordHash = await bcrypt.hash(PASSWORD, 4);
  const prisma = {
    user: {
      findUnique: jest.fn().mockResolvedValue(
        user && { id: 7, email: 'staff@example.com', name: 'Анна', passwordHash, ...user },
      ),
    },
  };
  const jwt = new JwtService();
  const n8n = { sendEvent: jest.fn() };
  const service = new AuthService(prisma as any, jwt, new ConfigService({ JWT_SECRET: 'test' }), n8n as any);
  return { service, jwt, n8n };
}

describe('AuthService.staffLogin', () => {
  it.each(['manager', 'admin'])('пускает роль %s и выдаёт токен со scope staff', async (role) => {
    const { service, jwt } = await createService({ role });

    const result = await service.staffLogin({ email: 'staff@example.com', password: PASSWORD });

    expect(result.user).toEqual({ id: 7, email: 'staff@example.com', name: 'Анна', role });
    const payload = jwt.verify(result.accessToken, { secret: 'test' });
    expect(payload).toMatchObject({ sub: 7, scope: 'staff' });
    expect(payload.exp - payload.iat).toBe(12 * 60 * 60);
  });

  it('не пускает обычного пользователя даже с верным паролем', async () => {
    const { service } = await createService({ role: 'user' });
    await expect(service.staffLogin({ email: 'staff@example.com', password: PASSWORD }))
      .rejects.toThrow(UnauthorizedException);
  });

  it('не пускает сотрудника с неверным паролем', async () => {
    const { service } = await createService({ role: 'admin' });
    await expect(service.staffLogin({ email: 'staff@example.com', password: 'wrong' }))
      .rejects.toThrow(UnauthorizedException);
  });

  it('не пускает несуществующий email', async () => {
    const { service } = await createService(null);
    await expect(service.staffLogin({ email: 'nobody@example.com', password: PASSWORD }))
      .rejects.toThrow(UnauthorizedException);
  });
});

describe('AuthService.login', () => {
  it('выдаёт обычный токен сайта со scope user', async () => {
    const { service, jwt } = await createService({ role: 'admin' });

    const result = await service.login({ email: 'staff@example.com', password: PASSWORD });

    expect(jwt.verify(result.accessToken, { secret: 'test' })).toMatchObject({ scope: 'user' });
  });
});
