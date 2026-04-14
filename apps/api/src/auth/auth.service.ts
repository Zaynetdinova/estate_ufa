import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { N8nService } from '../n8n/n8n.service';
import { N8nEventType } from '../n8n/n8n.types';
import { RegisterDto, LoginDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly n8n: N8nService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email:        dto.email,
        passwordHash,
        name:         dto.name ?? null,
        phone:        dto.phone ?? null,
      },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    // Событие регистрации → n8n (fire-and-forget)
    await this.n8n.sendEvent(
      N8nEventType.AUTH_LOGIN,
      { action: 'register', email: user.email },
      { userId: user.id },
    );

    return { user, accessToken: this.signToken(user.id, user.email) };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    await this.n8n.sendEvent(
      N8nEventType.AUTH_LOGIN,
      { action: 'login', email: user.email },
      { userId: user.id },
    );

    return {
      user: { id: user.id, email: user.email, name: user.name },
      accessToken: this.signToken(user.id, user.email),
    };
  }

  private signToken(userId: number, email: string): string {
    return this.jwt.sign(
      { sub: userId, email },
      {
        secret:    this.config.get<string>('JWT_SECRET', 'change-me'),
        expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '7d'),
      },
    );
  }
}
