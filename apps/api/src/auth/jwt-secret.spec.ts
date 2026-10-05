import { ConfigService } from '@nestjs/config';
import { getJwtSecret } from './jwt-secret';

const secretFor = (env: Record<string, string>) => getJwtSecret(new ConfigService(env));

describe('getJwtSecret', () => {
  // ConfigService сначала смотрит в process.env, а Jest выставляет NODE_ENV=test
  const saved = { NODE_ENV: process.env.NODE_ENV, VERCEL: process.env.VERCEL, JWT_SECRET: process.env.JWT_SECRET };
  beforeEach(() => {
    delete process.env.NODE_ENV;
    delete process.env.VERCEL;
    delete process.env.JWT_SECRET;
  });
  afterAll(() => {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it('возвращает заданный секрет', () => {
    expect(secretFor({ JWT_SECRET: 's3cret', NODE_ENV: 'production' })).toBe('s3cret');
  });

  it('падает без секрета в production', () => {
    expect(() => secretFor({ NODE_ENV: 'production' })).toThrow('JWT_SECRET is not set');
  });

  it('падает без секрета на Vercel, даже если NODE_ENV не задан', () => {
    expect(() => secretFor({ VERCEL: '1' })).toThrow('JWT_SECRET is not set');
  });

  it('локально использует запасной секрет', () => {
    expect(secretFor({})).toBe('change-me');
  });
});
