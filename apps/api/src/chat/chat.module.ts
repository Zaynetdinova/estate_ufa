import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { EventsModule } from '../events/events.module';
import { UsersModule } from '../users/users.module';
import { PropertiesModule } from '../properties/properties.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';

@Module({
  imports: [EventsModule, UsersModule, PropertiesModule, KnowledgeModule],
  providers: [ChatService],
  controllers: [ChatController],
})
export class ChatModule {}
