import { Module } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { RecommendationsController } from './recommendations.controller';
import { N8nModule } from '../n8n/n8n.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [N8nModule, EventsModule],
  providers: [RecommendationsService],
  controllers: [RecommendationsController],
})
export class RecommendationsModule {}
