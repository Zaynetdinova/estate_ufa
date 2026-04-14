import { IsEnum, IsInt, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { N8nEventType } from '../n8n/n8n.types';

export class TrackEventDto {
  @IsEnum(N8nEventType)
  eventType: N8nEventType;

  @IsOptional()
  @IsInt()
  propertyId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  sessionId?: string;

  @IsObject()
  payload: Record<string, unknown>;
}
