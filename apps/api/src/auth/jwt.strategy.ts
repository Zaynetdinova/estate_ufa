import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { getJwtSecret } from './jwt-secret';

/** user — вход на сайте, staff — вход в панель управления (/admin/login) */
export type TokenScope = 'user' | 'staff';

export interface JwtPayload {
  sub: number;   // userId
  email: string;
  scope?: TokenScope; // у токенов, выданных до появления scope, поля нет — считаем 'user'
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: getJwtSecret(config),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, role: true },
    });
    if (!user) throw new UnauthorizedException();
    const scope: TokenScope = payload.scope === 'staff' ? 'staff' : 'user';
    return { ...user, scope }; // кладётся в req.user
  }
}
