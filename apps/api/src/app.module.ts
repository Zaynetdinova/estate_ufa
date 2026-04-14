import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // Rate limiting: 60 запросов / минуту глобально
    // Чат: переопределяется на 30/мин в ChatController через @Throttle()
    ThrottlerModule.forRoot([
      { name: 'global', ttl: 60_000, limit: 60 },
      { name: 'chat',   ttl: 60_000, limit: 30 },
      { name: 'auth',   ttl: 60_000, limit: 10 },
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
