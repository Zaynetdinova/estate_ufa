import { Module } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { ScoringService } from './scoring.service';
import { N8nModule } from '../n8n/n8n.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [N8nModule, EventsModule],
  providers: [LeadsService, ScoringService],
  controllers: [LeadsController],
  exports: [LeadsService, ScoringService],
})
export class LeadsModule {}
