import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';

import { PrismaModule }          from './prisma/prisma.module';
import { CacheModule }           from './cache/cache.module';
import { N8nModule }             from './n8n/n8n.module';
import { AuthModule }            from './auth/auth.module';
import { EventsModule }          from './events/events.module';
import { UsersModule }           from './users/users.module';
import { LeadsModule }           from './leads/leads.module';
import { PropertiesModule }      from './properties/properties.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { ChatModule }            from './chat/chat.module';
import { FavoritesModule }       from './favorites/favorites.module';
import { ParserModule }          from './parser/parser.module';
import { AuthController }        from './auth/auth.controller';
import { ChatController }        from './chat/chat.controller';

// Именованные лимиты в @nestjs/throttler применяются ко всем маршрутам сразу,
// поэтому chat и auth явно ограничиваем своими контроллерами.
const onlyFor = (controller: Function) =>
  (context: ExecutionContext) => context.getClass() !== controller;

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // Rate limiting по IP: 60 запросов / минуту на любой маршрут,
    // дополнительно 30/мин на чат и 10/мин на регистрацию и вход
    ThrottlerModule.forRoot([
      { name: 'global', ttl: 60_000, limit: 60 },
      { name: 'chat',   ttl: 60_000, limit: 30, skipIf: onlyFor(ChatController) },
      { name: 'auth',   ttl: 60_000, limit: 10, skipIf: onlyFor(AuthController) },
    ]),

    PrismaModule,    // @Global
    CacheModule,     // @Global

    N8nModule,
    AuthModule,
    EventsModule,
    UsersModule,
    LeadsModule,
    PropertiesModule,
    RecommendationsModule,
    ChatModule,
    FavoritesModule,
    ParserModule,
  ],
  providers: [
    // Применяем ThrottlerGuard глобально
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
