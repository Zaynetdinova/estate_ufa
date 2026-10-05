import { ConfigService } from '@nestjs/config';

const DEV_FALLBACK_SECRET = 'change-me';

/**
 * JWT_SECRET обязателен в production: с известным запасным значением
 * любой мог бы подписать себе токен. Локально оставляем fallback для удобства.
 */
export function getJwtSecret(config: ConfigService): string {
  const secret = config.get<string>('JWT_SECRET');
  if (secret) return secret;
  if (config.get<string>('NODE_ENV') === 'production') {
    throw new Error('JWT_SECRET is not set');
  }
  return DEV_FALLBACK_SECRET;
}
