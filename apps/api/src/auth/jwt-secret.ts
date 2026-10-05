import { ConfigService } from '@nestjs/config';

const DEV_FALLBACK_SECRET = 'change-me';

/**
 * JWT_SECRET обязателен в production и на Vercel: с известным запасным значением
 * любой мог бы подписать себе токен. Локально оставляем fallback для удобства.
 */
export function getJwtSecret(config: ConfigService): string {
  const secret = config.get<string>('JWT_SECRET');
  if (secret) return secret;
  // Vercel выставляет VERCEL=1 во всех окружениях, даже если NODE_ENV не задан
  if (config.get<string>('NODE_ENV') === 'production' || config.get<string>('VERCEL')) {
    throw new Error('JWT_SECRET is not set');
  }
  return DEV_FALLBACK_SECRET;
}
